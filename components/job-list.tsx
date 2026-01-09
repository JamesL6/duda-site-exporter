'use client'

import { JobCard } from './job-card'

interface JobListProps {
  jobIds: string[]
  onRemoveJob: (jobId: string) => void
}

export function JobList({ jobIds, onRemoveJob }: JobListProps) {
  if (jobIds.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          No exports yet. Enter a Duda website URL above to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {jobIds.map((jobId) => (
        <JobCard
          key={jobId}
          jobId={jobId}
          onRemove={() => onRemoveJob(jobId)}
        />
      ))}
    </div>
  )
}
