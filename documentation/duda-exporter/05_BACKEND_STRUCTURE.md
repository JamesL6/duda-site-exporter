# Backend Structure

## Directory Tree
```
/
├── app/                  # Next.js App Router
│   ├── api/              # API Routes
│   └── (dashboard)/      # UI Pages
├── lib/
│   ├── queue.ts          # BullMQ Setup (Shared)
│   ├── redis.ts          # Redis Connection (Shared)
│   └── supabase.ts       # Supabase Client
├── worker/               # Independent Worker Service
│   ├── index.ts          # Entry Point
│   ├── scraper.ts        # Playwright Logic
│   └── processor.ts      # Queue Processor
└── package.json
```

## Code Patterns

### Redis Connection Pattern
```typescript
import { Redis } from 'ioredis';

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null // Required for BullMQ
});

export default connection;
```

### Playwright Scraper Pattern
```typescript
import { chromium } from 'playwright';

export async function scrapePage(url: string) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto(url, { waitUntil: 'networkidle' }); // Wait for JS
  
  // Extract Content
  const content = await page.evaluate(() => {
    // DOM Traversal Logic
  });

  await browser.close();
  return content;
}
```
