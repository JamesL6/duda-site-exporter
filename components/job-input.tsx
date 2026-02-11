'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Globe, Loader2, Upload, List, Link } from 'lucide-react'

interface JobInputProps {
  onJobCreated: (jobId: string) => void
  onJobsCreated?: (jobIds: string[]) => void
}

type InputMode = 'single' | 'bulk'

export function JobInput({ onJobCreated, onJobsCreated }: JobInputProps) {
  const [mode, setMode] = useState<InputMode>('single')
  const [url, setUrl] = useState('')
  const [bulkUrls, setBulkUrls] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bulkResult, setBulkResult] = useState<{ total: number; succeeded: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseBulkUrls = (text: string): string[] => {
    return text
      .split(/[\n,]+/) // Split by newlines or commas
      .map((u) => u.trim())
      .filter((u) => u.length > 0)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setBulkUrls((prev) => {
        const existing = prev.trim()
        if (existing) return existing + '\n' + content
        return content
      })
    }
    reader.readAsText(file)

    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to create job')
        return
      }

      setUrl('')
      onJobCreated(data.data.jobId)
    } catch (err) {
      setError('Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBulkResult(null)

    const urls = parseBulkUrls(bulkUrls)

    if (urls.length === 0) {
      setError('Please enter at least one URL')
      return
    }

    if (urls.length > 50) {
      setError('Maximum 50 URLs per batch. Please split into smaller groups.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to create jobs')
        return
      }

      const { jobIds, failed } = data.data
      setBulkResult({ total: urls.length, succeeded: jobIds.length })

      if (failed && failed.length > 0) {
        const failedSummary = failed
          .slice(0, 3)
          .map((f: { url: string; error: string }) => `${f.url}: ${f.error}`)
          .join('\n')
        const moreText = failed.length > 3 ? `\n...and ${failed.length - 3} more` : ''
        setError(`Some URLs failed:\n${failedSummary}${moreText}`)
      }

      if (jobIds.length > 0) {
        setBulkUrls('')
        if (onJobsCreated) {
          onJobsCreated(jobIds)
        } else {
          // Fallback: add them one by one
          jobIds.forEach((id: string) => onJobCreated(id))
        }
      }
    } catch (err) {
      setError('Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const urlCount = parseBulkUrls(bulkUrls).length

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => { setMode('single'); setError(null); setBulkResult(null) }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === 'single'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Link className="h-4 w-4" />
          Single URL
        </button>
        <button
          type="button"
          onClick={() => { setMode('bulk'); setError(null); setBulkResult(null) }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === 'bulk'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <List className="h-4 w-4" />
          Bulk Upload
        </button>
      </div>

      {/* Single URL Mode */}
      {mode === 'single' && (
        <form onSubmit={handleSingleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="https://example.duda.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                'Export Site'
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Bulk URL Mode */}
      {mode === 'bulk' && (
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Paste URLs (one per line or comma-separated)
              </label>
              <span className="text-xs text-muted-foreground">
                {urlCount} URL{urlCount !== 1 ? 's' : ''} detected
              </span>
            </div>
            <textarea
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              placeholder={`https://site1.duda.co\nhttps://site2.duda.co\nhttps://site3.duda.co`}
              rows={6}
              disabled={loading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
            />

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import from File
              </Button>
              <span className="text-xs text-muted-foreground">
                Supports .txt and .csv files
              </span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || urlCount === 0}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating {urlCount} export{urlCount !== 1 ? 's' : ''}...
              </>
            ) : (
              <>
                Export {urlCount} Site{urlCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </form>
      )}

      {/* Success message for bulk */}
      {bulkResult && (
        <div className="rounded-md bg-green-50 p-3">
          <p className="text-sm text-green-700">
            Successfully queued {bulkResult.succeeded} of {bulkResult.total} sites.
            They will be processed in parallel.
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3">
          <p className="whitespace-pre-line text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  )
}
