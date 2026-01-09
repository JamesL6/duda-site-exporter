# Tech Stack

## Quick Reference
```
Frontend:  Next.js 14 (App Router) + Shadcn UI
Backend:   Node.js (Railway Worker)
Database:  Supabase (PostgreSQL)
Auth:      Supabase Auth
Hosting:   Railway (Web, Worker, Redis)
Scraping:  Playwright
Queue:     BullMQ (Redis)
```

## Stack Decisions
| Category | Choice | Why | Rejected Alternatives |
|----------|--------|-----|----------------------|
| **Scraping** | Playwright | "Most accurate" rendering of dynamic Duda sites. | Cheerio (misses dynamic content), Puppeteer (older API). |
| **Queue** | BullMQ | Robust, handles retries, widely used with Node. | In-memory queue (fails on server restart). |
| **Hosting** | Railway | Easy multi-service (Web+Worker+Redis) setup. | Vercel (Timeouts on long scrapes). |

## External Services
| Service | Purpose | Auth Method | Rate Limits | Docs Location |
|---------|---------|-------------|-------------|---------------|
| **Supabase** | DB, Auth, Storage | API Key | Generous | https://supabase.com/docs |
| **Railway** | Infrastructure | CLI / Dashboard | Resource-based | https://docs.railway.app |

## Package Versions
```json
{
  "dependencies": {
    "next": "14.x",
    "playwright": "latest",
    "bullmq": "latest",
    "@supabase/supabase-js": "latest"
  }
}
```
