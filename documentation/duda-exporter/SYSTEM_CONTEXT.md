# System Context: Duda Site Exporter

## Architecture Overview
```mermaid
flowchart TD
    User[Team Member] -->|HTTPS| UI[Next.js Frontend (Railway)]
    UI -->|Auth & Data| Supabase[Supabase (Auth, DB, Storage)]
    UI -->|Submit Job| Queue[Redis / BullMQ (Railway)]
    Queue -->|Process Job| Worker[Node.js Worker (Railway)]
    Worker -->|Crawl| Target[Duda Website]
    Worker -->|Upload ZIP| Supabase
    Worker -->|Update Status| Supabase
```

## System Components
| Component | Technology | Responsibility | Communicates With |
|-----------|------------|----------------|-------------------|
| **Frontend UI** | Next.js 14 | User Interface, Auth, Job Submission | Supabase, API Routes |
| **API Routes** | Next.js API | Validate requests, enqueue jobs | Redis, Supabase |
| **Job Queue** | BullMQ / Redis | Manage async scraping tasks | API Routes, Worker |
| **Scraper Worker** | Node.js + Playwright | Headless browsing, downloading, zipping | Redis, Target Site, Supabase |
| **Storage** | Supabase Storage | Store final ZIP exports | Worker, Frontend |

## Data Flow Summary
1. **Submission:** User inputs URL -> API adds job to Redis Queue -> Returns Job ID.
2. **Processing:** Worker picks up job -> Spawns Playwright -> Crawls Sitemap -> Downloads Assets.
3. **Completion:** Worker Zips files -> Uploads to Supabase -> Updates DB Status -> User downloads.

## External Dependencies
| Service | Purpose | Failure Impact |
|---------|---------|----------------|
| **Supabase** | Auth, DB, Storage | Critical - App Offline |
| **Railway** | Hosting (Web, Worker, Redis) | Critical - App Offline |
| **Duda Sites** | Target for scraping | Partial - Specific scrape fails |

## Key Architectural Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| **Playwright vs Cheerio** | Duda sites are dynamic; we need full JS rendering for accuracy. | [Current Date] |
| **Async Queue (Redis)** | Scraping takes minutes; preventing timeouts requires decoupling UI from processing. | [Current Date] |
| **Supabase Auth** | Simplest way to secure the tool for internal team usage. | [Current Date] |
