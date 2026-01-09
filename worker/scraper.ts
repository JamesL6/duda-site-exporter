import { chromium, type Browser, type Page } from 'playwright'
import TurndownService from 'turndown'
import { createAdminClient } from '@/lib/supabase/admin'
import type { LogInsert, JobUpdate } from '@/types/database'

export interface ScrapedPage {
  url: string
  slug: string
  title: string
  markdown: string
  images: Array<{
    originalUrl: string
    filename: string
    data: Buffer
  }>
}

export interface ScrapeResult {
  baseUrl: string
  pages: ScrapedPage[]
  totalImages: number
}

// Initialize Turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
})

// Custom rules for better markdown output
turndownService.addRule('removeScripts', {
  filter: ['script', 'style', 'noscript', 'iframe'],
  replacement: () => '',
})

turndownService.addRule('images', {
  filter: 'img',
  replacement: (content, node) => {
    const img = node as HTMLImageElement
    const alt = img.getAttribute('alt') || ''
    const src = img.getAttribute('src') || img.getAttribute('data-src') || ''
    if (!src) return ''
    return `![${alt}](${src})`
  },
})

export class DudaScraper {
  private browser: Browser | null = null
  private supabase = createAdminClient()
  private jobId: string

  constructor(jobId: string) {
    this.jobId = jobId
  }

  async log(level: 'info' | 'warn' | 'error', message: string) {
    console.log(`[${level.toUpperCase()}] ${message}`)
    const logData: LogInsert = {
      job_id: this.jobId,
      level,
      message,
    }
    await this.supabase.from('logs').insert(logData as never)
  }

  async updateProgress(progress: number, status?: 'processing' | 'completed' | 'failed') {
    const update: JobUpdate = { progress }
    if (status) update.status = status
    await this.supabase.from('jobs').update(update as never).eq('id', this.jobId)
  }

  async init() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    await this.log('info', 'Browser initialized')
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  async fetchSitemap(baseUrl: string): Promise<string[]> {
    await this.log('info', `Fetching sitemap from ${baseUrl}`)
    
    const sitemapUrls = [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`,
    ]

    const pageUrls: string[] = []

    for (const sitemapUrl of sitemapUrls) {
      try {
        const response = await fetch(sitemapUrl)
        if (!response.ok) continue

        const xml = await response.text()
        
        // Extract URLs from sitemap
        const urlRegex = /<loc>([^<]+)<\/loc>/g
        let match
        while ((match = urlRegex.exec(xml)) !== null) {
          const url = match[1].trim()
          // Filter out non-page URLs (images, etc.)
          if (!url.match(/\.(jpg|jpeg|png|gif|pdf|xml)$/i)) {
            pageUrls.push(url)
          }
        }

        if (pageUrls.length > 0) {
          await this.log('info', `Found ${pageUrls.length} pages in sitemap`)
          return pageUrls
        }
      } catch (error) {
        await this.log('warn', `Failed to fetch ${sitemapUrl}: ${error}`)
      }
    }

    // Fallback: just return the base URL
    await this.log('warn', 'No sitemap found, will scrape base URL only')
    return [baseUrl]
  }

  async scrapePage(url: string): Promise<ScrapedPage | null> {
    if (!this.browser) throw new Error('Browser not initialized')

    const page = await this.browser.newPage()
    
    try {
      await this.log('info', `Scraping: ${url}`)

      // Navigate with extended timeout for dynamic content
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 60000,
      })

      // Scroll to load lazy content
      await this.autoScroll(page)

      // Wait for any remaining dynamic content
      await page.waitForTimeout(2000)

      // Extract page content
      const pageData = await page.evaluate(() => {
        // Get title
        const title = document.title || 
                     document.querySelector('h1')?.textContent || 
                     'Untitled'

        // Get main content area (Duda sites often use specific containers)
        const contentSelectors = [
          'main',
          '[role="main"]',
          '.dmBody',
          '.content-wrapper',
          '#content',
          'article',
          'body',
        ]

        let contentElement: Element | null = null
        for (const selector of contentSelectors) {
          contentElement = document.querySelector(selector)
          if (contentElement) break
        }

        // Get HTML content
        const html = contentElement?.innerHTML || document.body.innerHTML

        // Collect image URLs
        const images: string[] = []
        const imgElements = document.querySelectorAll('img')
        imgElements.forEach((img) => {
          const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src')
          if (src && src.startsWith('http')) {
            images.push(src)
          }
        })

        // Also get background images
        const allElements = document.querySelectorAll('*')
        allElements.forEach((el) => {
          const style = window.getComputedStyle(el)
          const bgImage = style.backgroundImage
          if (bgImage && bgImage !== 'none') {
            const urlMatch = bgImage.match(/url\(["']?(.*?)["']?\)/)
            if (urlMatch && urlMatch[1] && urlMatch[1].startsWith('http')) {
              images.push(urlMatch[1])
            }
          }
        })

        return { title, html, images: [...new Set(images)] }
      })

      // Convert HTML to Markdown
      const markdown = turndownService.turndown(pageData.html)

      // Download images
      const downloadedImages = await this.downloadImages(pageData.images)

      // Generate slug from URL
      const urlObj = new URL(url)
      let slug = urlObj.pathname.replace(/^\/|\/$/g, '') || 'home'
      slug = slug.replace(/\//g, '-')

      return {
        url,
        slug,
        title: pageData.title.trim(),
        markdown,
        images: downloadedImages,
      }
    } catch (error) {
      await this.log('error', `Failed to scrape ${url}: ${error}`)
      return null
    } finally {
      await page.close()
    }
  }

  private async autoScroll(page: Page) {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0
        const distance = 300
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight
          window.scrollBy(0, distance)
          totalHeight += distance

          if (totalHeight >= scrollHeight) {
            clearInterval(timer)
            window.scrollTo(0, 0) // Scroll back to top
            resolve()
          }
        }, 100)

        // Safety timeout
        setTimeout(() => {
          clearInterval(timer)
          resolve()
        }, 10000)
      })
    })
  }

  private async downloadImages(imageUrls: string[]): Promise<ScrapedPage['images']> {
    const images: ScrapedPage['images'] = []

    for (const url of imageUrls) {
      try {
        const response = await fetch(url)
        if (!response.ok) continue

        const buffer = Buffer.from(await response.arrayBuffer())
        
        // Generate filename from URL
        const urlObj = new URL(url)
        let filename = urlObj.pathname.split('/').pop() || 'image'
        
        // Ensure proper extension
        if (!filename.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
          const contentType = response.headers.get('content-type') || ''
          if (contentType.includes('png')) filename += '.png'
          else if (contentType.includes('gif')) filename += '.gif'
          else if (contentType.includes('webp')) filename += '.webp'
          else if (contentType.includes('svg')) filename += '.svg'
          else filename += '.jpg'
        }

        // Make filename safe
        filename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')

        images.push({
          originalUrl: url,
          filename,
          data: buffer,
        })
      } catch (error) {
        // Silently skip failed images
        console.warn(`Failed to download image: ${url}`)
      }
    }

    return images
  }

  async scrape(targetUrl: string): Promise<ScrapeResult> {
    await this.init()

    try {
      // Normalize URL
      const baseUrl = new URL(targetUrl).origin

      // Fetch sitemap to get all pages
      const pageUrls = await this.fetchSitemap(baseUrl)
      
      const pages: ScrapedPage[] = []
      let totalImages = 0

      // Scrape each page
      for (let i = 0; i < pageUrls.length; i++) {
        const url = pageUrls[i]
        await this.updateProgress(Math.round((i / pageUrls.length) * 80))

        const page = await this.scrapePage(url)
        if (page) {
          pages.push(page)
          totalImages += page.images.length
        }

        // Small delay between pages to be respectful
        await new Promise((r) => setTimeout(r, 500))
      }

      await this.log('info', `Scraping complete: ${pages.length} pages, ${totalImages} images`)

      return {
        baseUrl,
        pages,
        totalImages,
      }
    } finally {
      await this.close()
    }
  }
}
