"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Search,
  Copy,
  Check,
  ChevronRight,
  RefreshCw,
  Shield,
  X,
} from "lucide-react"
import Navigation from "@/components/Navigation"

interface ValidationExample {
  url?: string
  __url?: string
  product_id: string
  job_id?: number
}

interface SizeValue {
  size: string
  sample_url: string
  job_id: number
}

interface UniqueSizesCategory {
  total: number
  values: SizeValue[]
}

interface ValidationCategory {
  total: number
  examples: ValidationExample[]
}

interface ValidationResult {
  missing_variants: ValidationCategory
  duplicate_product_ids: ValidationCategory
  variant_consistency: ValidationCategory
  color_with_empty_variants: ValidationCategory
  color_not_matching_variant: ValidationCategory
  missing_color: ValidationCategory
  missing_description: ValidationCategory
  missing_gender: ValidationCategory
  has_num_ratings_no_rating: ValidationCategory
  has_ratings_no_num_rating: ValidationCategory
  missing_price: ValidationCategory
  unique_sizes?: UniqueSizesCategory
}

interface ApiResponse {
  status: string
  result: ValidationResult
}

interface CachedJob {
  id: string
  data: ApiResponse
  timestamp: string
  domain: string
}

interface JobEntry {
  id: string
  site: string
}

const categoryLabels: Record<keyof ValidationResult, { title: string; icon: string }> = {
  missing_variants: { title: "Missing Variants", icon: "🔗" },
  duplicate_product_ids: { title: "Duplicate Product IDs", icon: "🔄" },
  variant_consistency: { title: "Variant Consistency", icon: "⚖️" },
  color_with_empty_variants: { title: "Empty Color Variants", icon: "🎨" },
  color_not_matching_variant: { title: "Color Mismatch", icon: "🎯" },
  missing_color: { title: "Missing Colors", icon: "🌈" },
  missing_description: { title: "Missing Descriptions", icon: "📝" },
  missing_gender: { title: "Missing Gender Info", icon: "👤" },
  has_num_ratings_no_rating: { title: "Rating Count Without Rating", icon: "⭐" },
  has_ratings_no_num_rating: { title: "Rating Without Count", icon: "📊" },
  missing_price: { title: "Missing Prices", icon: "💰" },
  unique_sizes: { title: "Unique Sizes", icon: "📏" },
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

const addToCache = (jobId: string, data: ApiResponse, domain: string) => {
  const cachedJobs = getCachedJobs()
  const newJob: CachedJob = {
    id: jobId,
    data,
    timestamp: new Date().toISOString(),
    domain
  }
  
  // Remove existing entry if it exists
  const filteredJobs = cachedJobs.filter(job => job.id !== jobId)
  
  // Add new job to the beginning and limit to MAX_CACHE_SIZE
  const updatedJobs = [newJob, ...filteredJobs].slice(0, MAX_CACHE_SIZE)
  
  setCachedJobs(updatedJobs)
}

const getFromCache = (jobId: string): CachedJob | null => {
  const cachedJobs = getCachedJobs()
  return cachedJobs.find(job => job.id === jobId) || null
}

const clearCache = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CACHE_KEY)
}

const removeFromCache = (jobId: string) => {
  const cachedJobs = getCachedJobs()
  const updatedJobs = cachedJobs.filter(job => job.id !== jobId)
  setCachedJobs(updatedJobs)
}

export default function ValidationDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [groupInput, setGroupInput] = useState("")
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ApiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentJobId, setCurrentJobId] = useState<string>("")
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)
  const [cacheTimestamp, setCacheTimestamp] = useState<string>('')
  const [jobEntries, setJobEntries] = useState<JobEntry[]>([])
  const [searchResults, setSearchResults] = useState<JobEntry[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const allowedGroups = process.env.NEXT_PUBLIC_ALLOWED_GROUPS?.split(',').map(g => g.trim().toLowerCase()) || []

  const router = useRouter()
  const searchParams = useSearchParams()



  // Load job entries on component mount
  useEffect(() => {
    const loadJobEntries = async () => {
      try {
        const response = await fetch('/reworkd_ids.json')
        const data: JobEntry[] = await response.json()
        setJobEntries(data)
      } catch (error) {
        console.error('Failed to load job entries:', error)
      }
    }
    loadJobEntries()
  }, [])

  // Auto-validate when jobId is in URL
  useEffect(() => {
    const jobIdFromUrl = searchParams.get("id")
    if (jobIdFromUrl && !loading && !result) {
      setInput(jobIdFromUrl)
      validateJob(jobIdFromUrl)
    }
  }, [searchParams])

  // Handle clicking outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.search-container')) {
        setShowSearchResults(false)
      }
    }

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSearchResults])

  const authenticate = () => {
    const inputGroup = groupInput.trim().toLowerCase()
    if (allowedGroups.includes(inputGroup)) {
      setIsAuthenticated(true)
      if (typeof window !== 'undefined') {
        localStorage.setItem('validationAuthenticated', 'true')
      }
      setMessage({ type: 'success', text: `Welcome, ${groupInput.trim()}! You can now validate jobs.` })
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: 'Invalid group. Please try again.' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    setGroupInput("")
    setInput("")
    setResult(null)
    setSelectedCategory(null)
    setIsFromCache(false)
    setCacheTimestamp('')
    if (typeof window !== 'undefined') {
      localStorage.removeItem('validationAuthenticated')
    }
  }

  const validateJob = async (inputValue: string, forceRefresh: boolean = false) => {
    if (!inputValue.trim()) return

    // Check authentication
    if (!isAuthenticated) {
      setMessage({ type: 'error', text: 'Please authenticate to validate jobs.' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setSelectedCategory(null)
    setIsFromCache(false)
    setCacheTimestamp('')

    try {
      const jobId = extractJobId(inputValue)
      setCurrentJobId(jobId)
      
      // Update URL with job ID
      if (typeof window !== 'undefined') {
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set("id", jobId)
        router.push(newUrl.pathname + newUrl.search, { scroll: false })
      }
      
      // Check cache first (only if not forcing refresh)
      if (!forceRefresh) {
        const cachedJob = getFromCache(jobId)
        if (cachedJob) {
          setResult(cachedJob.data)
          setIsFromCache(true)
          setCacheTimestamp(cachedJob.timestamp)
          
          // Auto-select first category with issues for cached results
          if (cachedJob.data.result) {
            const categoriesWithIssues = Object.entries(cachedJob.data.result).filter(([key, category]) => {
              if (key === 'unique_sizes') {
                return category && (category as any).total > 0
              }
              return category && category.total > 0
            })
            
            if (categoriesWithIssues.length > 0) {
              setSelectedCategory(categoriesWithIssues[0][0])
            }
          }
          
          setLoading(false)
          return
        }
      }
      
      // Get API endpoint from localStorage or use environment variable
      const apiEndpoint = typeof window !== 'undefined' 
        ? localStorage.getItem('apiEndpoint') || process.env.NEXT_PUBLIC_DEFAULT_API_ENDPOINT
        : process.env.NEXT_PUBLIC_DEFAULT_API_ENDPOINT
      
      if (!apiEndpoint) {
        throw new Error('API endpoint not configured. Please set NEXT_PUBLIC_DEFAULT_API_ENDPOINT environment variable.')
      }
      
      const response = await fetch(`/api/validate/${jobId}?endpoint=${encodeURIComponent(apiEndpoint)}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      setResult(data)
      
      // Auto-select first category with issues
      if (data.result) {
        const categoriesWithIssues = Object.entries(data.result).filter(([key, category]) => {
          if (key === 'unique_sizes') {
            return category && (category as any).total > 0
          }
          return category && category.total > 0
        })
        
        if (categoriesWithIssues.length > 0) {
          setSelectedCategory(categoriesWithIssues[0][0])
        }
      }
      
      // Add to cache
      const domain = data.result ? getRepresentativeDomain(data.result) : 'UNKNOWN'
      addToCache(jobId, data, domain)
      
      // Store JobID in localStorage for browse page
      if (typeof window !== 'undefined') {
        const storedJobIds = JSON.parse(localStorage.getItem('validatedJobIds') || '[]')
        const jobEntry = {
          id: jobId,
          timestamp: new Date().toISOString(),
          domain: domain
        }
        const updatedJobIds = [jobEntry, ...storedJobIds.filter((item: any) => item.id !== jobId)].slice(0, 20) // Keep last 20
        localStorage.setItem('validatedJobIds', JSON.stringify(updatedJobIds))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const refreshJob = async () => {
    if (currentJobId) {
      await validateJob(currentJobId, true)
    }
  }

  const extractJobId = (input: string): string => {
    const trimmedInput = input.trim()
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (uuidRegex.test(trimmedInput)) {
      return trimmedInput
    }

    const parts = trimmedInput.split("/")
    const lastPart = parts[parts.length - 1]

    if (uuidRegex.test(lastPart)) {
      return lastPart
    }

    throw new Error("Invalid job ID or URL format")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    validateJob(input)
  }

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

  const extractDomainForSearch = (url: string): string => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  const handleInputChange = (value: string) => {
    setInput(value)
    setShowSearchResults(false)
    
    if (value.startsWith('@')) {
      const searchTerm = value.slice(1).toLowerCase()
      if (searchTerm.length > 0) {
        const results = jobEntries.filter(entry => 
          extractDomainForSearch(entry.site).toLowerCase().includes(searchTerm)
        ).slice(0, 10) // Limit to 10 results
        setSearchResults(results)
        setShowSearchResults(true)
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    } else {
      setSearchResults([])
      setShowSearchResults(false)
    }
  }

  const handleSearchResultClick = (jobEntry: JobEntry) => {
    setInput(jobEntry.id)
    setShowSearchResults(false)
    validateJob(jobEntry.id)
  }

  const handleClickOutside = () => {
    setShowSearchResults(false)
  }

  const getTotalIssues = (result: ValidationResult): number => {
    return Object.values(result).reduce((sum, category) => sum + category.total, 0)
  }

  // Helper function to get the URL from either url or __url property
  const getExampleUrl = (example: ValidationExample): string | null => {
    return example.url || example.__url || null
  }

  // Helper function to extract domain from URL
  const extractDomain = (url: string): string => {
    try {
      const domain = new URL(url).hostname
      // Remove www. and extract main domain name
      const domainParts = domain.replace('www.', '').split('.')
      return domainParts[0].toUpperCase()
    } catch {
      return 'UNKNOWN'
    }
  }

  // Helper function to get representative domain from validation results
  const getRepresentativeDomain = (result: ValidationResult): string => {
    for (const [key, category] of Object.entries(result)) {
      if (key === 'unique_sizes') {
        // Handle unique_sizes category
        const uniqueSizesCategory = category as UniqueSizesCategory
        if (uniqueSizesCategory.values && uniqueSizesCategory.values.length > 0) {
          for (const value of uniqueSizesCategory.values) {
            if (value.sample_url) {
              return extractDomain(value.sample_url)
            }
          }
        }
      } else {
        // Handle regular validation categories
        const validationCategory = category as ValidationCategory
        if (validationCategory.examples && validationCategory.examples.length > 0) {
          for (const example of validationCategory.examples) {
            const url = getExampleUrl(example)
            if (url) {
              return extractDomain(url)
            }
          }
        }
      }
    }
    return 'UNKNOWN'
  }

  const handleCategoryClick = (categoryKey: string) => {
    const category = result?.result?.[categoryKey as keyof ValidationResult]
    if (category && 'total' in category && category.total > 0) {
      setSelectedCategory(categoryKey)
    }
  }

  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date()
    const cachedTime = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - cachedTime.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
    }

    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`
    }

    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`
    }

    const diffInYears = Math.floor(diffInDays / 365)
    return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`
  }

  // Helper function to get category data for display
  const getCategoryData = (categoryKey: string) => {
    const category = result?.result?.[categoryKey as keyof ValidationResult] || null
    if (!category) return null

    if (categoryKey === 'unique_sizes') {
      const uniqueSizesCategory = category as UniqueSizesCategory
      return {
        total: uniqueSizesCategory.total,
        items: uniqueSizesCategory.values.map((value, index) => ({
          id: `size-${index}`,
          type: 'size' as const,
          size: value.size,
          url: value.sample_url,
          jobId: value.job_id
        }))
      }
    } else {
      const validationCategory = category as ValidationCategory
      return {
        total: validationCategory.total,
        items: validationCategory.examples.map((example, index) => ({
          id: `example-${index}`,
          type: 'example' as const,
          productId: example.product_id,
          url: getExampleUrl(example),
          jobId: example.job_id
        }))
      }
    }
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <Navigation currentPage="validate" />

        {/* Authentication Check */}
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto">
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
                <p className="text-gray-600">Please authenticate to validate jobs</p>
              </div>

              {message && (
                <Alert className={`mb-6 ${
                  message.type === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${
                    message.type === 'success' ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <AlertDescription className={`${
                    message.type === 'success' ? 'text-green-800' : 'text-red-800'
                  } font-medium`}>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="group" className="block text-sm font-semibold text-gray-700 mb-2">
                    Which group are you part of?
                  </label>
                  <Input
                    id="group"
                    type="text"
                    value={groupInput}
                    onChange={(e) => setGroupInput(e.target.value)}
                    placeholder="Enter your group name"
                    className="w-full"
                    onKeyPress={(e) => e.key === 'Enter' && authenticate()}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter any group name to continue
                  </p>
                </div>

                <Button
                  onClick={authenticate}
                  className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Authenticate
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Logout Button */}
            <div className="flex justify-end mb-4">
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>

            {message && (
              <Alert className={`mb-4 ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  message.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`} />
                <AlertDescription className={`${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                } font-medium`}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            {/* Input Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1 search-container">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <Input
                  type="text"
                  placeholder="Enter job ID, paste URL, or type @ to search domains..."
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="pl-10 h-10 text-sm bg-gray-50 border-gray-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg font-medium"
                  disabled={loading}
                />
                
                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {searchResults.map((entry, index) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => handleSearchResultClick(entry)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {extractDomainForSearch(entry.site)}
                            </p>
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                            {entry.id.slice(0, 8)}...
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="h-10 px-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md shadow-violet-500/25 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-1 w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Validate"
                )}
              </Button>
              {isFromCache && result && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={refreshJob}
                  disabled={loading}
                  className="h-10 px-3 border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors"
                  title="Refresh cached data"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Refresh
                    </>
                  )}
                </Button>
              )}
              {input.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    try {
                      const jobId = extractJobId(input)
                      copyToClipboard(jobId, "input-jobid")
                    } catch (err) {
                      // Invalid format, copy as is
                      copyToClipboard(input.trim(), "input-jobid")
                    }
                  }}
                  className="h-10 px-3 border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {copiedItems.has("input-jobid") ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </Button>
              )}
              {input.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const reworkdBaseUrl = typeof window !== 'undefined' 
                      ? localStorage.getItem('reworkdBaseUrl') || process.env.NEXT_PUBLIC_DEFAULT_REWORKD_BASE_URL
                      : process.env.NEXT_PUBLIC_DEFAULT_REWORKD_BASE_URL
                    
                    if (!reworkdBaseUrl) {
                      console.error('Reworkd base URL not configured. Please set NEXT_PUBLIC_DEFAULT_REWORKD_BASE_URL environment variable.')
                      return
                    }
                    
                    try {
                      const jobId = extractJobId(input)
                      const reworkdUrl = `${reworkdBaseUrl}${jobId}`
                      window.open(reworkdUrl, '_blank')
                    } catch (err) {
                      // Invalid format, still try to open
                      const reworkdUrl = `${reworkdBaseUrl}${input.trim()}`
                      window.open(reworkdUrl, '_blank')
                    }
                  }}
                  className="h-10 px-3 border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                </Button>
              )}
            </div>
          </form>
        </div>
{/* Error Display - Fun Bruh Moment */}
        {error && (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-sm text-center mb-6">
            <div className="max-w-md mx-auto">
              <img 
                src="/bruh.png" 
                alt="Bruh moment" 
                className="w-48 h-48 mx-auto mb-6 rounded-xl"
              />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Bruh... Really?
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                {error}
              </p>
              <p className="text-gray-500 text-xs italic">
                "I've seen better error handling in a toaster." - Validation Goat
              </p>
            </div>
          </div>
        )}

        {/* Loading Section - Show during validation */}
        {loading && (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-sm text-center">
            <div className="max-w-md mx-auto">
              <video 
                autoPlay 
                loop 
                muted 
                className="w-64 h-64 mx-auto mb-6 rounded-xl"
              >
                <source src="/r8x.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Analyzing Your Data...
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Our validation engine is hard at work finding those sneaky data issues. 
                This might take a moment.
              </p>
              <div className="flex items-center justify-center mt-4">
                <Loader2 className="w-5 h-5 animate-spin text-violet-600 mr-2" />
                <span className="text-violet-600 font-medium">Processing...</span>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Section - Show when no results */}
        {!result && !loading && !error && (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-sm text-center">
            <div className="max-w-md mx-auto">
              <img 
                src="/goat.svg" 
                alt="Goat mascot" 
                className="w-32 h-32 mx-auto mb-6"
              />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Ready to Debug Some Data?
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Our validation goat is standing by to help you find those sneaky data issues. 
                Just drop in a Job ID or URL
              </p>
              <p className="text-gray-500 text-sm mt-4 italic">
                "I've seen worse data than yours... probably." - Validation Goat
              </p>
            </div>
          </div>
        )}

        {/* Results - Two Pane Layout */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Pane - Overview */}
            <div className="lg:col-span-1 space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md shadow-purple-500/25">
                      <ExternalLink className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Domain</p>
                      <p className="text-lg font-bold text-gray-900">{getRepresentativeDomain(result.result)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md ${
                        result.status === "success"
                          ? "bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-500/25"
                          : "bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/25"
                      }`}
                    >
                      {result.status === "success" ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</p>
                      <p className="text-lg font-bold capitalize text-gray-900">{result.status}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/25">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Issues</p>
                      <p className="text-lg font-bold text-gray-900">
                        {getTotalIssues(result.result)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cache Information */}
                {isFromCache && (
                  <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md shadow-amber-500/25">
                        <RefreshCw className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cache Status</p>
                        <p className="text-sm font-medium text-amber-800">
                          {formatRelativeTime(cacheTimestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Categories */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Issue Categories</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {Object.entries(result?.result || {})
                    .filter(([, category]) => category?.total > 0)
                    .map(([key, category]) => {
                      const categoryInfo = categoryLabels[key as keyof ValidationResult]
                      if (!categoryInfo) return null

                      return (
                        <button
                          key={key}
                          onClick={() => handleCategoryClick(key)}
                          className={`w-full p-3 text-left hover:bg-gray-50 transition-colors duration-150 ${
                            selectedCategory === key ? "bg-red-50 border-r-2 border-red-500" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-sm">{categoryInfo?.icon}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-gray-900 text-sm truncate">{categoryInfo?.title}</h4>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100 px-2 py-0.5 text-xs font-semibold">
                                {category.total}
                              </Badge>
                              <ChevronRight className="w-3 h-3 text-gray-400" />
                            </div>
                          </div>
                        </button>
                      )
                    })}
                </div>
              </div>


            </div>

            {/* Right Pane - Details */}
            <div className="lg:col-span-3 lg:sticky lg:top-8 lg:h-fit">
              {selectedCategory && result?.result?.[selectedCategory as keyof ValidationResult] ? (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <span className="text-xl">
                          {categoryLabels[selectedCategory as keyof ValidationResult]?.icon}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {categoryLabels[selectedCategory as keyof ValidationResult]?.title}
                        </h3>
                        <p className="text-red-600 font-semibold mt-1">
                          {result?.result?.[selectedCategory as keyof ValidationResult]?.total} issues found
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead className="font-bold text-gray-700 py-4">
                            {selectedCategory === 'unique_sizes' ? 'Size' : 'Product ID'}
                          </TableHead>
                          <TableHead className="font-bold text-gray-700 py-4">URL</TableHead>
                          <TableHead className="font-bold text-gray-700 py-4 w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const categoryData = getCategoryData(selectedCategory)
                          if (!categoryData) return null

                          return categoryData.items.slice(0, 50).map((item, index) => (
                            <TableRow key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                              <TableCell className="py-4">
                                {item.type === 'size' ? (
                                  <code 
                                    onClick={() => copyToClipboard(item.size, `size-${selectedCategory}-${index}`)}
                                    className={`px-3 py-2 rounded-xl text-sm font-semibold border cursor-pointer transition-colors whitespace-nowrap ${
                                      copiedItems.has(`size-${selectedCategory}-${index}`) 
                                        ? "bg-teal-100 text-teal-800 border-teal-200" 
                                        : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                                    }`}
                                    title={item.size}
                                  >
                                    {item.size}
                                  </code>
                                ) : (
                                  <code 
                                    onClick={() => copyToClipboard(item.productId, `id-${selectedCategory}-${index}`)}
                                    className={`px-3 py-2 rounded-xl text-sm font-inconsolata font-semibold border cursor-pointer transition-colors whitespace-nowrap ${
                                      copiedItems.has(`id-${selectedCategory}-${index}`) 
                                        ? "bg-teal-100 text-teal-800 border-teal-200" 
                                        : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                                    }`}
                                    title={item.productId}
                                  >
                                    {item.productId.length > 25 ? `${item.productId.substring(0, 25)}...` : item.productId}
                                  </code>
                                )}
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-700 break-all leading-relaxed font-medium">
                                      {item.url || "No URL available"}
                                    </p>
                                  </div>
                                  {item.url && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => item.url && copyToClipboard(item.url, `url-${selectedCategory}-${index}`)}
                                      className="h-8 w-8 p-0 flex-shrink-0 hover:bg-gray-200 rounded-xl transition-colors"
                                    >
                                      {copiedItems.has(`url-${selectedCategory}-${index}`) ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <Copy className="w-4 h-4 text-gray-500" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                {item.url && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                    className="h-8 w-8 p-0 hover:bg-violet-100 rounded-xl transition-colors"
                                  >
                                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="w-4 h-4 text-violet-600" />
                                    </a>
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        })()}
                      </TableBody>
                    </Table>
                  </div>

                  {(() => {
                    const categoryData = getCategoryData(selectedCategory)
                    return categoryData && categoryData.items.length > 50 ? (
                      <div className="p-4 bg-gray-50 text-center border-t border-gray-200">
                        <span className="text-sm font-semibold text-gray-600">
                          Showing 50 of {categoryData.total} {selectedCategory === 'unique_sizes' ? 'sizes' : 'issues'}
                        </span>
                      </div>
                    ) : null
                  })()}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-sm text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Category</h3>
                  <p className="text-gray-600">
                    Click on any issue category from the left panel to view detailed information and examples.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  )
}
