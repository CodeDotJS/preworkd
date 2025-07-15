"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Activity, ExternalLink, Clock, Copy, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface JobEntry {
  id: string
  timestamp: string
  domain: string
}

export default function BrowsePage() {
  const [jobHistory, setJobHistory] = useState<JobEntry[]>([])
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedJobIds = JSON.parse(localStorage.getItem('validatedJobIds') || '[]')
      setJobHistory(storedJobIds)
    }
  }, [])

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedItems((prev) => new Set(prev).add(id))
    setTimeout(() => {
      setCopiedItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }, 1500)
  }

  const clearHistory = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('validatedJobIds')
      setJobHistory([])
    }
  }

  const removeJob = (jobId: string) => {
    if (typeof window !== 'undefined') {
      const updatedHistory = jobHistory.filter(job => job.id !== jobId)
      localStorage.setItem('validatedJobIds', JSON.stringify(updatedHistory))
      setJobHistory(updatedHistory)
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <a href="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-violet-500/25">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                preworkd
              </h1>
              <p className="text-gray-600 text-sm font-medium">
                Fixing your data mistakes—gently mocking them along the way.
              </p>
            </div>
          </a>
          
          <nav className="flex items-center gap-6">
            <a href="/" className="text-gray-600 hover:text-violet-600 font-medium transition-colors">
              Validate
            </a>
            <a href="/browse" className="text-violet-600 font-semibold border-b-2 border-violet-600 pb-1">
              Browse
            </a>
            <a href="/settings" className="text-gray-600 hover:text-violet-600 font-medium transition-colors">
              Settings
            </a>
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Validation History</h2>
              <p className="text-gray-600 text-sm mt-1">Recently validated Job IDs</p>
            </div>
            {jobHistory.length > 0 && (
              <Button
                onClick={clearHistory}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear History
              </Button>
            )}
          </div>

          {jobHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No History Yet</h3>
              <p className="text-gray-600 mb-4">
                Start validating Job IDs to see them appear here.
              </p>
              <Button asChild>
                <a href="/">Start Validating</a>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {jobHistory.map((job, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-inconsolata font-semibold">
                          {job.id}
                        </code>
                        <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">
                          {job.domain}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(job.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(job.id, job.id)}
                    >
                      {copiedItems.has(job.id) ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const reworkdBaseUrl = typeof window !== 'undefined' 
                          ? localStorage.getItem('reworkdBaseUrl') || 'https://app.reworkd.ai/groups/949a6e3b-e9e9-4293-b42f-4b19a4f130a0/root/'
                          : 'https://app.reworkd.ai/groups/949a6e3b-e9e9-4293-b42f-4b19a4f130a0/root/'
                        const reworkdUrl = `${reworkdBaseUrl}${job.id}`
                        window.open(reworkdUrl, '_blank')
                      }}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeJob(job.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      asChild
                      size="sm"
                    >
                      <a href={`/?id=${job.id}`}>Validate</a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 