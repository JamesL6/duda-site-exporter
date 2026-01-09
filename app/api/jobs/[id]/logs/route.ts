import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Log } from '@/types/database'

// GET /api/jobs/[id]/logs - Get job logs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
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

    // Verify user owns this job first
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .single()

    if (jobError || !jobData) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    // Get logs
    const { data: logsData, error } = await supabase
      .from('logs')
      .select('id, job_id, level, message, created_at')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch logs' },
        { status: 500 }
      )
    }

    const logs = logsData as unknown as Log[]

    return NextResponse.json({
      success: true,
      data: logs,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
