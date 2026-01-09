# Duda Site Exporter

Internal tool for crawling Duda websites and exporting content (text as Markdown, images) into a structured ZIP file.

## Features

- 🔐 **Authentication** - Secure login with Supabase Auth
- 🌐 **Site Crawling** - Automatically discovers all pages via sitemap
- 📝 **Markdown Export** - Converts HTML content to clean Markdown
- 🖼️ **Image Download** - Downloads all images including lazy-loaded ones
- 📦 **ZIP Generation** - Organized folder structure with manifest
- ⚡ **Background Processing** - Queue-based scraping with BullMQ

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Node.js Worker
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Queue**: BullMQ (Redis)
- **Scraping**: Playwright
- **Hosting**: Railway

## Getting Started

### Prerequisites

- Node.js 20+
- Redis (local or Docker)
- Supabase project

### Environment Setup

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Fill in your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
REDIS_URL=redis://localhost:6379
```

### Database Setup

Run the migration in your Supabase SQL Editor:

```bash
# Copy contents of supabase/migrations/001_initial_schema.sql
```

### Local Development

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Start Redis (with Docker)
docker run -p 6379:6379 redis

# Start the web app (Terminal 1)
npm run dev

# Start the worker (Terminal 2)
npm run dev:worker
```

### Deployment (Railway)

1. **Create Services**:
   - Redis service
   - Web service (from this repo)
   - Worker service (from same repo)

2. **Configure Web Service**:
   - Start command: `npm run start`
   - Add environment variables

3. **Configure Worker Service**:
   - Start command: `npm run start:worker`
   - Add same environment variables

4. **Set Environment Variables** on both services:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `REDIS_URL` (from Railway Redis service)

## Project Structure

```
├── app/
│   ├── api/              # API Routes
│   ├── (auth)/           # Login pages
│   └── (dashboard)/      # Main UI
├── components/           # React components
├── lib/
│   ├── supabase/         # Database clients
│   ├── queue.ts          # BullMQ setup
│   └── redis.ts          # Redis connection
├── worker/
│   ├── index.ts          # Worker entry
│   ├── scraper.ts        # Playwright logic
│   ├── processor.ts      # Job processor
│   └── archiver.ts       # ZIP generation
└── supabase/
    └── migrations/       # SQL migrations
```

## ZIP Output Structure

```
export-{domain}/
├── pages/
│   ├── home.md
│   ├── about.md
│   └── ...
├── images/
│   ├── home/
│   │   ├── image1.jpg
│   │   └── ...
│   └── about/
│       └── ...
└── manifest.json
```

## License

Internal use only.
