'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'

interface JobData {
  id: string
  targetUrl: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  errorMessage: string | null
  downloadUrl: string | null
  createdAt: string
}

interface JobCardProps {
  jobId: string
  onRemove?: () => void
}

export function JobCard({ jobId, onRemove }: JobCardProps) {
  const [job, setJob] = useState<JobData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`)
        const data = await response.json()

        if (data.success) {
          setJob(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch job:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchJob()

    // Poll for updates if job is in progress
    const interval = setInterval(() => {
      if (job?.status === 'pending' || job?.status === 'processing') {
        fetchJob()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [jobId, job?.status])

  if (loading || !job) {
    return (
      <Card className="animate-pulse">
        <CardContent className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = () => {
    switch (job.status) {
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" /> Queued
          </Badge>
        )
      case 'processing':
        return (
          <Badge variant="default">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Processing
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="success">
            <CheckCircle className="mr-1 h-3 w-3" /> Completed
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" /> Failed
          </Badge>
        )
    }
  }

  const domain = new URL(job.targetUrl).hostname

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{domain}</CardTitle>
            <a
              href={job.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              {job.targetUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(job.status === 'pending' || job.status === 'processing') && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{job.progress}%</span>
            </div>
            <Progress value={job.progress} />
          </div>
        )}

        {job.status === 'failed' && job.errorMessage && (
          <div className="rounded-md bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{job.errorMessage}</p>
          </div>
        )}

        {job.status === 'completed' && job.downloadUrl && (
          <a
            href={job.downloadUrl}
            download
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Download className="mr-2 h-4 w-4" />
            Download ZIP
          </a>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Started: {new Date(job.createdAt).toLocaleString()}
          </span>
          {onRemove && job.status !== 'processing' && (
            <button
              onClick={onRemove}
              className="text-muted-foreground hover:text-destructive"
            >
              Remove
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
