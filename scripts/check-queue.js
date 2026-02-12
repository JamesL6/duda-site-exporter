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

async function check() {
  const waiting = await queue.getWaiting();
  const active = await queue.getActive();
  const completed = await queue.getCompleted();
  const failed = await queue.getFailed();
  
  console.log('Queue status:');
  console.log(`  Waiting: ${waiting.length}`);
  console.log(`  Active: ${active.length}`);
  console.log(`  Completed: ${completed.length}`);
  console.log(`  Failed: ${failed.length}`);
  
  if (waiting.length > 0) {
    console.log('\nWaiting jobs:');
    waiting.forEach(j => console.log(`  - ${j.id}: ${j.data.targetUrl}`));
  }
  
  await queue.close();
  process.exit(0);
}

check();
