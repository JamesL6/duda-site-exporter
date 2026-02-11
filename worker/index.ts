import 'dotenv/config'
import { Worker } from 'bullmq'
import type { ScrapeJobData } from '@/lib/queue'
import { processScrapeJob } from './processor'

// Parse Redis URL for BullMQ connection
function parseRedisUrl(url: string) {
  try {
    const parsed = new URL(url)
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port) || 6379,
      password: parsed.password || undefined,
      username: parsed.username || undefined,
    }
  } catch {
    return {
      host: 'localhost',
      port: 6379,
    }
  }
}

const redisConfig = parseRedisUrl(process.env.REDIS_URL || 'redis://localhost:6379')

console.log('🚀 Starting Duda Scraper Worker...')
console.log(`📡 Connecting to Redis: ${redisConfig.host}:${redisConfig.port}`)

// Create the worker
const worker = new Worker<ScrapeJobData>(
  'scrape-jobs',
  async (job) => {
    return processScrapeJob(job)
  },
  {
    connection: {
      ...redisConfig,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
        family: 0, // Let OS choose IPv4/IPv6 for Railway private networking
      retryStrategy: (times) => Math.min(times * 500, 5000),
    },
    concurrency: 5, // Process up to 5 jobs in parallel for bulk support
    limiter: {
      max: 15,
      duration: 60000, // Max 15 jobs per minute to support bulk uploads
    },
  }
)

// Worker event handlers
worker.on('ready', () => {
  console.log('✅ Worker is ready and listening for jobs')
})

worker.on('active', (job) => {
  console.log(`📋 Job ${job.id} has started processing`)
})

worker.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed:`, result)
})

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message)
})

worker.on('error', (err) => {
  console.error('Worker error:', err)
})

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down worker...')
  await worker.close()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

console.log('👂 Worker is now listening for scrape jobs...')
