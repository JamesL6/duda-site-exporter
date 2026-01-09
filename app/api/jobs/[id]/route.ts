import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Job } from '@/types/database'

// GET /api/jobs/[id] - Get job status
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

    // Get job (RLS will ensure user can only see their own)
    const { data, error } = await supabase
      .from('jobs')
      .select('id, user_id, target_url, status, progress, storage_path, error_message, created_at, updated_at')
      .eq('id', jobId)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    const job = data as unknown as Job

    // Generate download URL if completed
    let downloadUrl: string | null = null
    if (job.status === 'completed' && job.storage_path) {
      const { data: signedUrlData } = await supabase.storage
        .from('exports')
        .createSignedUrl(job.storage_path, 3600) // 1 hour expiry

      downloadUrl = signedUrlData?.signedUrl || null
    }

    return NextResponse.json({
      success: true,
      data: {
        id: job.id,
        targetUrl: job.target_url,
        status: job.status,
        progress: job.progress,
        errorMessage: job.error_message,
        downloadUrl,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
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
