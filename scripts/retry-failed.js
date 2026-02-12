const { Queue } = require('bullmq');

const queue = new Queue('scrape-jobs', {
  connection: {
    host: 'maglev.proxy.rlwy.net',
    port: 46083,
    password: 'FDUNuRqSBQvPLrUjfNwCKveQtNrnctbY',
    username: 'default',
    maxRetriesPerRequest: null,
  },
});

async function retryAll() {
  const failed = await queue.getFailed();
  console.log(`Found ${failed.length} failed jobs. Retrying...\n`);
  
  for (const job of failed) {
    try {
      await job.retry();
      console.log(`✓ Retried: ${job.data.targetUrl}`);
    } catch (e) {
      console.error(`✗ Failed to retry ${job.data.targetUrl}:`, e.message);
    }
  }
  
  await queue.close();
  console.log('\n✅ All failed jobs retried!');
  process.exit(0);
}

retryAll();
