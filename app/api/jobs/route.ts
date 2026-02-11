import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addScrapeJob } from '@/lib/queue'
import { z } from 'zod'
import type { Job, JobInsert } from '@/types/database'

// Validation schema - accepts either a single URL or an array of URLs
const createSingleJobSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  urls: z.undefined(),
})

const createBulkJobSchema = z.object({
  urls: z.array(z.string()).min(1, 'At least one URL is required').max(50, 'Maximum 50 URLs per batch'),
  url: z.undefined(),
})

const createJobSchema = z.union([createSingleJobSchema, createBulkJobSchema])

// Normalize a URL: trim whitespace, add https if missing
function normalizeUrl(raw: string): string {
  let url = raw.trim()
  if (!url.startsWith('http')) {
    url = `https://${url}`
  }
  return url
}

// Validate a URL string
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// POST /api/jobs - Create one or more scrape jobs
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()

    // --- SINGLE URL MODE ---
    if (body.url && !body.urls) {
      const validation = createSingleJobSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: validation.error.errors[0].message },
          { status: 400 }
        )
      }

      const targetUrl = normalizeUrl(validation.data.url)

      const insertData: JobInsert = {
        user_id: user.id,
        target_url: targetUrl,
        status: 'pending',
        progress: 0,
      }

      const { data: jobData, error: insertError } = await supabase
        .from('jobs')
        .insert(insertData as never)
        .select()
        .single()

      const job = jobData as unknown as Job | null

      if (insertError || !job) {
        console.error('Failed to create job:', insertError)
        return NextResponse.json(
          { success: false, error: 'Failed to create job' },
          { status: 500 }
        )
      }

      await addScrapeJob({
        jobId: job.id,
        targetUrl: targetUrl,
        userId: user.id,
      })

      return NextResponse.json({
        success: true,
        data: { jobId: job.id },
      })
    }

    // --- BULK URL MODE ---
    if (body.urls) {
      const validation = createBulkJobSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: validation.error.errors[0].message },
          { status: 400 }
        )
      }

      const rawUrls = validation.data.urls
      const jobIds: string[] = []
      const failed: { url: string; error: string }[] = []

      // Process each URL - normalize, validate, create job, enqueue
      const results = await Promise.allSettled(
        rawUrls.map(async (rawUrl) => {
          const targetUrl = normalizeUrl(rawUrl)

          if (!isValidUrl(targetUrl)) {
            throw { url: rawUrl, error: 'Invalid URL format' }
          }

          const insertData: JobInsert = {
            user_id: user.id,
            target_url: targetUrl,
            status: 'pending',
            progress: 0,
          }

          const { data: jobData, error: insertError } = await supabase
            .from('jobs')
            .insert(insertData as never)
            .select()
            .single()

          const job = jobData as unknown as Job | null

          if (insertError || !job) {
            throw { url: rawUrl, error: 'Failed to create job record' }
          }

          await addScrapeJob({
            jobId: job.id,
            targetUrl: targetUrl,
            userId: user.id,
          })

          return job.id
        })
      )

      // Gather results
      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        if (result.status === 'fulfilled') {
          jobIds.push(result.value)
        } else {
          const reason = result.reason
          if (reason?.url) {
            failed.push({ url: reason.url, error: reason.error || 'Unknown error' })
          } else {
            failed.push({ url: rawUrls[i], error: 'Unknown error' })
          }
        }
      }

      if (jobIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'All URLs failed to process', data: { failed } },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          jobIds,
          failed,
          total: rawUrls.length,
          succeeded: jobIds.length,
        },
      })
    }

    // Neither url nor urls provided
    return NextResponse.json(
      { success: false, error: 'Please provide a url or urls array' },
      { status: 400 }
    )
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/jobs - Get user's jobs
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: jobsData, error } = await supabase
      .from('jobs')
      .select('id, user_id, target_url, status, progress, storage_path, error_message, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100) // Increased from 20 to support bulk uploads

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch jobs' },
        { status: 500 }
      )
    }

    const jobs = jobsData as unknown as Job[]

    return NextResponse.json({
      success: true,
      data: jobs,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
