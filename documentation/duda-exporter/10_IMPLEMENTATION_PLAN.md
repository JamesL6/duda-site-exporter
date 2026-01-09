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

- [ ] **1.7: Deployment**
  - Task: Deploy to Railway (Web, Worker, Redis).

### Phase 1 Completion Checklist
- [ ] Can login via Supabase.
- [ ] Can submit a URL and see it process.
- [ ] ZIP file downloads correctly.
- [ ] Content inside ZIP is accurate.

---
⚠️ **AI INSTRUCTION:** When completing a task, CHECK THE BOX and update `PROJECT_STATE.json`.
