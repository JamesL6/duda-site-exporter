# Implementation Plan

## Phase 1: MVP Implementation
**Goal:** A working internal tool that can scrape a Duda site and produce a ZIP.
**Duration:** 1-2 Weeks

### Tasks
- [x] **1.1: Project Setup**
  - Files: `package.json`, `.env.example`
  - Docs: `07_DEVELOPMENT_ENVIRONMENT.md`
  
- [x] **1.2: Supabase Config**
  - Files: `supabase/migrations/`
  - Docs: `03_DATA_MODELS.md`
  - Task: Create `jobs` table and Storage bucket.

- [x] **1.3: Redis/Queue Setup**
  - Files: `lib/queue.ts`, `lib/redis.ts`
  - Task: Configure BullMQ connection.

- [x] **1.4: Scraper Worker (Core)**
  - Files: `worker/scraper.ts`
  - Task: Implement Playwright logic (Visit -> Scroll -> Extract).

- [x] **1.5: ZIP Generation**
  - Files: `worker/archiver.ts`
  - Task: Implement folder structure and compression.

- [x] **1.6: Frontend UI**
  - Files: `app/(dashboard)/page.tsx`
  - Task: Build Input and Progress components.

- [x] **1.7: Deployment**
  - Task: Deploy to Railway (Web, Worker, Redis).

### Phase 1 Completion Checklist
- [x] Can login via Supabase.
- [x] Can submit a URL and see it process.
- [x] ZIP file downloads correctly.
- [x] Content inside ZIP is accurate.

## Phase 2: Performance & Visuals
**Goal:** Increase scraping speed through parallelism and add visual archiving.
**Duration:** 1-2 Weeks

### Tasks
- [ ] **2.1: Distributed Scraping (Multi-Worker)**
  - **Concept:** Split a single website's sitemap across multiple workers to scrape in parallel.
  - **Logic:**
    1. `Master Job` fetches sitemap and calculates total pages.
    2. `Master Job` creates `N` sub-jobs (chunks of the sitemap) based on available workers.
    3. `Sub-jobs` scrape their assigned pages independently.
    4. `Master Job` waits for all sub-jobs to finish, then merges results into one ZIP.
  - **Tech:** BullMQ Flow (Parent/Child jobs), Shared Redis state for progress tracking.

- [ ] **2.2: Visual Archiving (Screenshots)**
  - **Concept:** Capture full-page screenshots of every scraped page.
  - **Implementation:**
    - Use Playwright `page.screenshot({ fullPage: true })`.
    - Save as `screenshots/{slug}.png` in the ZIP.
    - Add toggle in UI: "Include Screenshots" (increases processing time/size).

---
⚠️ **AI INSTRUCTION:** When completing a task, CHECK THE BOX and update `PROJECT_STATE.json`.
