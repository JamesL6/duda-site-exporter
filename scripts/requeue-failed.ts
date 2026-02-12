import 'dotenv/config'
import { addScrapeJob } from '../lib/queue'

// 14 failed jobs that need requeuing
const failedJobs = [
  { id: 'e2de864d-5e73-4421-b88d-a692d5658217', url: 'https://nwfl.gotruenorth.com', userId: 'user-id' },
  { id: '3ba020b0-b5f0-4a11-99e5-58024004a8c3', url: 'https://kansascity.gotruenorth.com', userId: 'user-id' },
  { id: 'bec20e09-af76-439c-9ab4-a0d58d3dfa78', url: 'https://omaha-elkhorn.gotruenorth.com', userId: 'user-id' },
  { id: '6834913c-0fed-4132-8c8c-45eb4f109245', url: 'https://cedarvalley.gotruenorth.com', userId: 'user-id' },
  { id: 'ff3e5ce0-eeb0-4542-8ebe-5b5fa499dee1', url: 'https://cos.gotruenorth.com', userId: 'user-id' },
  { id: '837146e6-cf16-4692-934c-492f6fd40134', url: 'https://stlouiswest.gotruenorth.com', userId: 'user-id' },
  { id: '17c2d5ef-e81f-425d-a677-6c8801fcafde', url: 'https://swmo.gotruenorth.com', userId: 'user-id' },
  { id: 'b8b784ef-2fd7-4616-8894-84adfb0ccd7c', url: 'https://swfl.gotruenorth.com', userId: 'user-id' },
  { id: '05e29e75-3974-45d9-92ca-a79733b7032d', url: 'https://hawaii.gotruenorth.com', userId: 'user-id' },
  { id: '2e8d4a2b-aa4c-4e11-9d90-d5584023c590', url: 'https://oregon.gotruenorth.com', userId: 'user-id' },
  { id: '8ae149d7-bcf9-46c0-8ac9-5ef2f02cff50', url: 'https://sepa.gotruenorth.com', userId: 'user-id' },
  { id: 'e9859eb9-dc2b-4fea-bb09-f5f598c14935', url: 'https://mckinneytx.gotruenorth.com', userId: 'user-id' },
  { id: '6e5608e6-0d58-4c35-8f8e-86313766924e', url: 'https://www.gotruenorth.com', userId: 'user-id' },
  { id: '5cbda29f-2d90-406e-b7dc-94944fd9038d', url: 'https://nwatlanta.gotruenorth.com', userId: 'user-id' },
]

async function requeueAll() {
  console.log('Adding 14 failed jobs back to Redis queue...\n')
  
  for (const job of failedJobs) {
    try {
      await addScrapeJob({
        jobId: job.id,
        targetUrl: job.url,
        userId: job.userId,
      })
      console.log(`✓ ${job.url}`)
    } catch (e) {
      console.error(`✗ ${job.url}:`, e)
    }
  }

  console.log('\n✅ All jobs added to queue!')
  process.exit(0)
}

requeueAll()
