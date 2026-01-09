# API Specification

## Base Configuration
- **Base URL:** `/api` (Next.js Internal API)
- **Auth Method:** Supabase Session Cookie
- **Content-Type:** application/json

## Endpoints

### Jobs

#### POST /api/jobs
**Purpose:** Submit a new URL for scraping.
**Auth Required:** Yes

**Request Body:**
```json
{
  "url": "https://www.truenorth.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid-string"
  }
}
```

#### GET /api/jobs/[id]
**Purpose:** Check status of a specific job.
**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "status": "processing",
    "progress": 45,
    "downloadUrl": null
  }
}
```

---
⚠️ **AI INSTRUCTION:** When you add/modify an endpoint, UPDATE THIS FILE IMMEDIATELY.
