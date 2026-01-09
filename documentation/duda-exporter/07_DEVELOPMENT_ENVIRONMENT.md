# Development Environment

## Prerequisites
| Tool | Version |
|------|---------|
| Node.js | v20+ |
| Docker | (Optional, for local Redis) |

## Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Public Key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin Key (Backend Only) | Yes |
| `REDIS_URL` | Redis Connection String | Yes |

## Initial Setup
```bash
# 1. Install Dependencies
npm install

# 2. Run Local Redis (if using Docker)
docker run -p 6379:6379 redis

# 3. Start Dev Server (Web + Worker)
npm run dev
```

## Deployment (Railway)
1. **Redis:** Create a Redis service.
2. **Web:** Deploy Next.js repo (set `REDIS_URL`).
3. **Worker:** Deploy same repo, but Start Command = `npm run start:worker`.
