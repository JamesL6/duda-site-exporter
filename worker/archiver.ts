import archiver from 'archiver'
import { Writable } from 'stream'
import type { ScrapeResult } from './scraper'

export interface ArchiveResult {
  buffer: Buffer
  filename: string
  totalSize: number
}

/**
 * Creates a ZIP archive from scraped content
 * 
 * Structure:
 * export-{domain}/
 * ├── pages/
 * │   ├── home.md
 * │   ├── about.md
 * │   └── ...
 * ├── images/
 * │   ├── home/
 * │   │   ├── image1.jpg
 * │   │   └── ...
 * │   └── about/
 * │       └── ...
 * └── manifest.json
 */
export async function createArchive(result: ScrapeResult): Promise<ArchiveResult> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    
    // Create a writable stream to collect chunks
    const writableStream = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk)
        callback()
      },
    })

    // Create archive
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    })

    // Handle errors
    archive.on('error', (err) => {
      reject(err)
    })

    // When archive is finalized
    writableStream.on('finish', () => {
      const buffer = Buffer.concat(chunks)
      const domain = new URL(result.baseUrl).hostname.replace(/\./g, '-')
      
      resolve({
        buffer,
        filename: `export-${domain}-${Date.now()}.zip`,
        totalSize: buffer.length,
      })
    })

    // Pipe archive to writable stream
    archive.pipe(writableStream)

    // Create manifest
    const manifest = {
      exportedAt: new Date().toISOString(),
      sourceUrl: result.baseUrl,
      totalPages: result.pages.length,
      totalImages: result.totalImages,
      pages: result.pages.map((p) => ({
        url: p.url,
        slug: p.slug,
        title: p.title,
        imageCount: p.images.length,
      })),
    }

    // Add manifest.json
    archive.append(JSON.stringify(manifest, null, 2), {
      name: 'manifest.json',
    })

    // Add pages and images
    for (const page of result.pages) {
      // Add markdown file
      const markdownContent = `# ${page.title}\n\n> Source: ${page.url}\n\n---\n\n${page.markdown}`
      archive.append(markdownContent, {
        name: `pages/${page.slug}.md`,
      })

      // Add images for this page
      for (const image of page.images) {
        archive.append(image.data, {
          name: `images/${page.slug}/${image.filename}`,
        })
      }
    }

    // Finalize the archive
    archive.finalize()
  })
}
