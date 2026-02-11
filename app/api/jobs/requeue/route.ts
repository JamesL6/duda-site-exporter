import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addScrapeJob } from '@/lib/queue'

// POST /api/jobs/requeue - Re-add pending jobs to the queue (for stuck jobs)
export async function POST() {
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

    const { data: pendingJobs, error } = await supabase
      .from('jobs')
      .select('id, target_url')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .eq('progress', 0)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pending jobs' },
        { status: 500 }
      )
    }

    const jobs = (pendingJobs ?? []) as { id: string; target_url: string }[]
    let requeued = 0
    for (const job of jobs) {
      try {
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
      data: { requeued, total: jobs.length },
    })
  } catch (error) {
    console.error('Requeue error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
