"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ExternalLink, Clock, Copy, Check, Trash2, RefreshCw, Database } from "lucide-react"
import Navigation from "@/components/Navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface JobEntry {
  id: string
  timestamp: string
  domain: string
}

interface CachedJob {
  id: string
  data: any
  timestamp: string
  domain: string
}

// Cache management functions
const CACHE_KEY = 'validationCache'
const MAX_CACHE_SIZE = 5

const getCachedJobs = (): CachedJob[] => {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]')
  } catch {
    return []
  }
}

const setCachedJobs = (jobs: CachedJob[]) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(jobs))
  } catch (error) {
    console.error('Failed to save cache:', error)
  }
}

const removeFromCache = (jobId: string) => {
  const cachedJobs = getCachedJobs()
  const updatedJobs = cachedJobs.filter(job => job.id !== jobId)
  setCachedJobs(updatedJobs)
}

const clearCache = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CACHE_KEY)
}

const getTotalIssues = (result: any): number => {
  if (!result || !result.result) return 0
  return Object.values(result.result).reduce((sum: number, category: any) => sum + (category.total || 0), 0)
}

export default function BrowsePage() {
  const [jobHistory, setJobHistory] = useState<JobEntry[]>([])
  const [cachedJobs, setCachedJobs] = useState<CachedJob[]>([])
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedJobIds = JSON.parse(localStorage.getItem('validatedJobIds') || '[]')
      setJobHistory(storedJobIds)
      setCachedJobs(getCachedJobs())
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
      // Remove from job history
      const updatedHistory = jobHistory.filter(job => job.id !== jobId)
      localStorage.setItem('validatedJobIds', JSON.stringify(updatedHistory))
      setJobHistory(updatedHistory)
      
      // Also remove from validation cache
      removeFromCache(jobId)
      setCachedJobs(getCachedJobs())
    }
  }

  const clearAllCache = () => {
    clearCache()
    setCachedJobs([])
  }

  const removeCachedJob = (jobId: string) => {
    removeFromCache(jobId)
    // Force refresh the cached jobs list
    setTimeout(() => {
      setCachedJobs(getCachedJobs())
    }, 100)
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

  // Create a unified list of all jobs
  const allJobs = jobHistory.map(job => ({
    ...job,
    isCached: cachedJobs.some(cached => cached.id === job.id),
    cachedData: cachedJobs.find(cached => cached.id === job.id)
  }))

  return (
    <div className="min-h-screen bg-white font-inter">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <Navigation currentPage="browse" />

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Validation History</h2>
              <p className="text-gray-600 text-sm mt-1">
                Recently validated Job IDs with cache status
              </p>
            </div>
            <div className="flex gap-2">
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
              {cachedJobs.length > 0 && (
                <Button
                  onClick={clearAllCache}
                  variant="outline"
                  size="sm"
                  className="text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Clear Cache
                </Button>
              )}
            </div>
          </div>

          {allJobs.length === 0 ? (
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
              {allJobs.map((job, index) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      job.isCached ? 'bg-amber-100' : 'bg-purple-100'
                    }`}>
                      {job.isCached ? (
                        <Database className="w-5 h-5 text-amber-600" />
                      ) : (
                        <ExternalLink className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-inconsolata font-semibold">
                          {job.id}
                        </code>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${
                          job.isCached 
                            ? 'text-amber-600 bg-amber-100' 
                            : 'text-purple-600 bg-purple-100'
                        }`}>
                          {job.domain}
                        </span>
                        {job.isCached && job.cachedData && (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 px-2 py-0.5 text-xs font-semibold">
                            {getTotalIssues(job.cachedData.data)} issues
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(job.timestamp)}
                        {job.isCached && (
                          <span className="ml-2 text-amber-600 font-medium">• Cached</span>
                        )}
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
                          ? localStorage.getItem('reworkdBaseUrl') || process.env.NEXT_PUBLIC_DEFAULT_REWORKD_BASE_URL
                          : process.env.NEXT_PUBLIC_DEFAULT_REWORKD_BASE_URL
                        
                        if (!reworkdBaseUrl) {
                          console.error('Reworkd base URL not configured. Please set NEXT_PUBLIC_DEFAULT_REWORKD_BASE_URL environment variable.')
                          return
                        }
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
                    {job.isCached && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCachedJob(job.id)}
                        className="text-amber-600 hover:bg-amber-50"
                        title="Remove from cache only"
                      >
                        <Database className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex gap-1">
                      <Button
                        asChild
                        size="sm"
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                      >
                        <a href={`/?id=${job.id}`}>
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Validate
                        </a>
                      </Button>
                      {job.isCached && (
                        <Button
                          asChild
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          <a href={`/?id=${job.id}`}>
                            <Database className="w-4 h-4 mr-1" />
                            View Cache
                          </a>
                        </Button>
                      )}
                    </div>
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