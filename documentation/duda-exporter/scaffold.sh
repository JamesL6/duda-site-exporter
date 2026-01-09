#!/bin/bash
# Duda Exporter Scaffold

echo "🚀 Scaffolding Duda Exporter..."

# 1. Create Directories
mkdir -p app/\(dashboard\) app/\(auth\) app/api
mkdir -p lib worker components

# 2. Create Placeholder Files
touch app/page.tsx .env.example

# 3. Install Deps
npm install next react react-dom @supabase/supabase-js bullmq ioredis playwright

echo "✅ Done! Run 'npm run dev' to start."
