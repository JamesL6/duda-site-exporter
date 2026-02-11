# Redis Setup (Upstash)

Railway's built-in Redis has connection issues. Use **Upstash Redis** instead — free tier available, reliable with BullMQ.

## 1. Create Upstash Redis

1. Go to [console.upstash.com](https://console.upstash.com)
2. Sign up or log in
3. Click **Create Database**
4. Name it (e.g. `duda-exporter`)
5. Region: choose closest to your Railway region (e.g. `us-east-1`)
6. Click **Create**

## 2. Get Your Redis URL

In the database details, go to **REST API** → **.env** and copy the values. You need the **Redis URL** in this format:

```
rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
```

Or use **Redis Connect** tab → copy the connection string (it should start with `rediss://`).

## 3. Set in Railway

1. Open your Railway project → **Variables**
2. For **web** and **worker** services, set:
   - `REDIS_URL` = your Upstash Redis URL (starts with `rediss://`)

3. **Remove** any Railway Redis service reference if it overrides `REDIS_URL`

4. Redeploy both **web** and **worker** services

## 4. Requeue Stuck Jobs (Optional)

If you had pending jobs from before the fix:

1. Log into the app at https://web-production-bbfb9.up.railway.app
2. Open DevTools → Console
3. Run:
   ```js
   fetch('/api/jobs/requeue', { method: 'POST', credentials: 'include' }).then(r => r.json()).then(console.log)
   ```

This re-adds pending jobs to the queue.
