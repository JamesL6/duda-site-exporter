import { Job } from 'bullmq'
import type { ScrapeJobData } from '@/lib/queue'
import { createAdminClient } from '@/lib/supabase/admin'
import { DudaScraper } from './scraper'
import { createArchive } from './archiver'
import type { LogInsert, JobUpdate } from '@/types/database'
import * as tus from 'tus-js-client'

const supabase = createAdminClient()

// Use resumable upload for large files (>50MB)
async function uploadLargeFile(
  bucket: string,
  path: string,
  file: Buffer,
  contentType: string
): Promise<{ error: Error | null }> {
  return new Promise((resolve) => {
    const upload = new tus.Upload(new Blob([file]), {
      endpoint: `https://ezieikaiwauwzrwcxpjt.storage.supabase.co/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'x-upsert': 'true',
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucket,
        objectName: path,
        contentType,
        cacheControl: '3600',
      },
      chunkSize: 6 * 1024 * 1024, // 6MB chunks (required by Supabase)
      onError: (error) => {
        resolve({ error: error as Error })
      },
      onSuccess: () => {
        resolve({ error: null })
      },
    })

    upload.start()
  })
}

async function log(jobId: string, level: 'info' | 'warn' | 'error', message: string) {
  console.log(`[${jobId}] [${level.toUpperCase()}] ${message}`)
  const logData: LogInsert = {
    job_id: jobId,
    level,
    message,
  }
  await supabase.from('logs').insert(logData as never)
}

async function updateJob(jobId: string, updates: JobUpdate) {
  await supabase.from('jobs').update(updates as never).eq('id', jobId)
}

export async function processScrapeJob(job: Job<ScrapeJobData>) {
  const { jobId, targetUrl } = job.data

  console.log(`\n${'='.repeat(50)}`)
  console.log(`Processing job: ${jobId}`)
  console.log(`Target URL: ${targetUrl}`)
  console.log(`${'='.repeat(50)}\n`)

  try {
    // Update status to processing
    await updateJob(jobId, { status: 'processing', progress: 0 })
    await log(jobId, 'info', `Starting scrape of ${targetUrl}`)

    // Initialize scraper and run
    const scraper = new DudaScraper(jobId)
    const result = await scraper.scrape(targetUrl)

    // Update progress - scraping complete
    await updateJob(jobId, { progress: 85 })
    await log(jobId, 'info', `Scraping complete. Creating ZIP archive...`)

    // Create ZIP archive
    const archive = await createArchive(result)
    await updateJob(jobId, { progress: 90 })

    // Upload to Supabase Storage
    const storagePath = `${jobId}/${archive.filename}`
    const sizeMB = archive.totalSize / 1024 / 1024
    await log(jobId, 'info', `Uploading ZIP (${sizeMB.toFixed(2)} MB) to storage...`)

    // Use resumable upload for files >50MB (Pro tier supports up to 50GB)
    if (archive.totalSize > 50 * 1024 * 1024) {
      await log(jobId, 'info', 'Using resumable upload for large file...')
      const { error: uploadError } = await uploadLargeFile(
        'exports',
        storagePath,
        archive.buffer,
        'application/zip'
      )
      if (uploadError) {
        throw new Error(`Failed to upload: ${uploadError.message}`)
      }
    } else {
      // Standard upload for files <50MB
      const { error: uploadError } = await supabase.storage
        .from('exports')
        .upload(storagePath, archive.buffer, {
          contentType: 'application/zip',
          upsert: true,
        })

      if (uploadError) {
        throw new Error(`Failed to upload: ${uploadError.message}`)
      }
    }

    // Update job as completed
    await updateJob(jobId, {
      status: 'completed',
      progress: 100,
      storage_path: storagePath,
    })

    await log(jobId, 'info', `Job completed successfully!`)
    
    return {
      success: true,
      pagesScraped: result.pages.length,
      totalImages: result.totalImages,
      archiveSize: archive.totalSize,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    await log(jobId, 'error', `Job failed: ${errorMessage}`)
    await updateJob(jobId, {
      status: 'failed',
      error_message: errorMessage,
    })

    throw error
  }
}
