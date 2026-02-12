import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addScrapeJob } from '@/lib/queue'

// POST /api/jobs/requeue - Re-add pending/failed jobs to the queue
// Query params: ?status=pending|failed|all (default: pending)
export async function POST(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'pending'

    let query = supabase
      .from('jobs')
      .select('id, target_url, status')
      .eq('user_id', user.id)

    if (statusFilter === 'pending') {
      query = query.eq('status', 'pending').eq('progress', 0)
    } else if (statusFilter === 'failed') {
      query = query.eq('status', 'failed')
    } else if (statusFilter === 'all') {
      query = query.in('status', ['pending', 'failed'])
    }

    const { data: jobsData, error } = await query

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch jobs' },
        { status: 500 }
      )
    }

    const jobs = (jobsData ?? []) as { id: string; target_url: string; status: string }[]
    let requeued = 0
    
    for (const job of jobs) {
      try {
        // Reset job to pending status
        await supabase
          .from('jobs')
          .update({ status: 'pending', progress: 0, error_message: null } as never)
          .eq('id', job.id)

        // Re-add to queue
        await addScrapeJob({
          jobId: job.id,
          targetUrl: job.target_url,
          userId: user.id,
        })
        requeued++
      } catch (e) {
        console.error(`Failed to requeue job ${job.id}:`, e)
      }
    }

    return NextResponse.json({
      success: true,
      data: { requeued, total: jobs.length, statusFilter },
    })
  } catch (error) {
    console.error('Requeue error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
