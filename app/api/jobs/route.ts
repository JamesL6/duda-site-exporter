import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addScrapeJob } from '@/lib/queue'
import { z } from 'zod'
import type { Job, JobInsert } from '@/types/database'

// Validation schema
const createJobSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
})

// POST /api/jobs - Create a new scrape job
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = createJobSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { url } = validation.data

    // Normalize URL
    let targetUrl = url.trim()
    if (!targetUrl.startsWith('http')) {
      targetUrl = `https://${targetUrl}`
    }

    // Create job record in database
    const insertData: JobInsert = {
      user_id: user.id,
      target_url: targetUrl,
      status: 'pending',
      progress: 0,
    }
    
    const { data: jobData, error: insertError } = await supabase
      .from('jobs')
      .insert(insertData as never)
      .select()
      .single()

    const job = jobData as unknown as Job | null

    if (insertError || !job) {
      console.error('Failed to create job:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to create job' },
        { status: 500 }
      )
    }

    // Add job to processing queue
    await addScrapeJob({
      jobId: job.id,
      targetUrl: targetUrl,
      userId: user.id,
    })

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/jobs - Get user's jobs
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: jobsData, error } = await supabase
      .from('jobs')
      .select('id, user_id, target_url, status, progress, storage_path, error_message, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch jobs' },
        { status: 500 }
      )
    }

    const jobs = jobsData as unknown as Job[]

    return NextResponse.json({
      success: true,
      data: jobs,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
