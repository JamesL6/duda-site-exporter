'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { JobInput } from '@/components/job-input'
import { JobList } from '@/components/job-list'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileArchive, Globe, Download } from 'lucide-react'

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
            Convert any Duda site into clean Markdown and organized images
          </p>
        </div>

        {/* How it works */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <Globe className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-lg">1. Enter URL</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Paste any Duda website URL to begin the export process
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-2">
              <FileArchive className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-lg">2. We Scrape</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Our system crawls all pages and extracts text + images
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-2">
              <Download className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-lg">3. Download ZIP</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get organized Markdown files and images in a clean folder structure
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Input Section */}
        <Card className="mb-8 bg-white">
          <CardHeader>
            <CardTitle>Start New Export</CardTitle>
            <CardDescription>
              Enter the URL of the Duda website you want to export
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JobInput onJobCreated={handleJobCreated} />
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
