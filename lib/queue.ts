import { Queue } from 'bullmq'

// Job data interface
export interface ScrapeJobData {
  jobId: string
  targetUrl: string
  userId: string
}

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
    // Fallback for simple redis://localhost:6379 format
    return {
      host: 'localhost',
      port: 6379,
    }
  }
}

// Lazy initialize queue to avoid issues during build
let scrapeQueueInstance: Queue<ScrapeJobData> | null = null

function getScrapeQueue(): Queue<ScrapeJobData> {
  if (!scrapeQueueInstance) {
    const redisConfig = parseRedisUrl(process.env.REDIS_URL || 'redis://localhost:6379')
    
    scrapeQueueInstance = new Queue<ScrapeJobData>('scrape-jobs', {
      connection: {
        ...redisConfig,
        maxRetriesPerRequest: null,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          age: 24 * 60 * 60, // Keep completed jobs for 24 hours
          count: 100,        // Keep last 100 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 60 * 60, // Keep failed jobs for 7 days
        },
      },
    })
  }
  return scrapeQueueInstance
}

// Export getter for the queue
export const scrapeQueue = {
  get instance() {
    return getScrapeQueue()
  }
}

// Add a job to the queue
export async function addScrapeJob(data: ScrapeJobData) {
  const queue = getScrapeQueue()
  const job = await queue.add('scrape', data, {
    jobId: data.jobId, // Use database job ID as queue job ID
  })
  return job
}
