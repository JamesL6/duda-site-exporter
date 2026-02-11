'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { JobInput } from '@/components/job-input'
import { JobList } from '@/components/job-list'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileArchive, Globe, Download, Layers } from 'lucide-react'

export default function DashboardPage() {
  const [jobIds, setJobIds] = useState<string[]>([])
  const [email, setEmail] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    // Get user email
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setEmail(user.email)
      }
    })

    // Load existing jobs
    fetch('/api/jobs')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setJobIds(data.data.map((job: { id: string }) => job.id))
        }
      })
  }, [supabase.auth])

  const handleJobCreated = (jobId: string) => {
    setJobIds((prev) => [jobId, ...prev])
  }

  const handleJobsCreated = (newJobIds: string[]) => {
    setJobIds((prev) => [...newJobIds, ...prev])
  }

  const handleRemoveJob = (jobId: string) => {
    setJobIds((prev) => prev.filter((id) => id !== jobId))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header email={email} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Export Duda Websites
          </h2>
          <p className="mt-2 text-gray-600">
            Convert any Duda site into clean Markdown and organized images — one at a time or in bulk
          </p>
        </div>

        {/* How it works */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <Globe className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-lg">1. Enter URLs</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Paste a single URL or bulk upload a list of sites
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-2">
              <Layers className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-lg">2. Parallel Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                All sites are queued and processed in parallel by multiple workers
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-2">
              <FileArchive className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-lg">3. We Scrape</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Each site is crawled: pages, text, and images are extracted
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-2">
              <Download className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-lg">4. Download ZIPs</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get organized Markdown files and images in clean ZIP archives
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Input Section */}
        <Card className="mb-8 bg-white">
          <CardHeader>
            <CardTitle>Start New Export</CardTitle>
            <CardDescription>
              Enter a single URL or paste a list of URLs to export in bulk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JobInput
              onJobCreated={handleJobCreated}
              onJobsCreated={handleJobsCreated}
            />
          </CardContent>
        </Card>

        {/* Jobs List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Exports</h3>
          <JobList jobIds={jobIds} onRemoveJob={handleRemoveJob} />
        </div>
      </main>
    </div>
  )
}
