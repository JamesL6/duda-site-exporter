# Security Guidelines

## Authentication
- **Method:** Supabase Auth (Email/Password).
- **Session:** Managed via cookies.
- **Access:** Only authenticated users can access the dashboard.

## Authorization
- **Row Level Security (RLS):** Enabled on `jobs` table. Users can only see their own jobs.
- **Storage:** Private bucket. Files are accessed via signed URLs valid for 1 hour.

## Secrets
- **NEVER** commit `.env` files.
- **NEVER** expose `REDIS_URL` or `SERVICE_ROLE_KEY` to the client.

## Worker Security
- The worker runs in a secure container.
- Playwright runs in a sandbox.
- Rate limiting is applied to prevent abuse of the target website (politeness policy).
