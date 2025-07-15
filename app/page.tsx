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
  Activity,
  ChevronRight,
} from "lucide-react"

interface ValidationExample {
  url?: string
  __url?: string
  product_id: string
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
}

interface ApiResponse {
  status: string
  result: ValidationResult
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
}

export default function ValidationDashboard() {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ApiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentJobId, setCurrentJobId] = useState<string>("")
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()

  // Auto-validate when jobId is in URL
  useEffect(() => {
    const jobIdFromUrl = searchParams.get("id")
    if (jobIdFromUrl && !loading && !result) {
      setInput(jobIdFromUrl)
      validateJob(jobIdFromUrl)
    }
  }, [searchParams])

  const validateJob = async (inputValue: string) => {
    if (!inputValue.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)
    setSelectedCategory(null)

    try {
      const jobId = extractJobId(inputValue)
      setCurrentJobId(jobId)
      
      // Update URL with job ID
      if (typeof window !== 'undefined') {
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set("id", jobId)
        router.push(newUrl.pathname + newUrl.search, { scroll: false })
      }
      
      // Get API endpoint from localStorage or use default
      const apiEndpoint = typeof window !== 'undefined' 
        ? localStorage.getItem('apiEndpoint') || 'https://yaysay-validator-1.onrender.com/validate/'
        : 'https://yaysay-validator-1.onrender.com/validate/'
      
      const response = await fetch(`/api/validate/${jobId}?endpoint=${encodeURIComponent(apiEndpoint)}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      setResult(data)
      
      // Store JobID in localStorage for browse page
      if (typeof window !== 'undefined') {
        const storedJobIds = JSON.parse(localStorage.getItem('validatedJobIds') || '[]')
        const jobEntry = {
          id: jobId,
          timestamp: new Date().toISOString(),
          domain: data.result ? getRepresentativeDomain(data.result) : 'UNKNOWN'
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
    for (const category of Object.values(result)) {
      if (category.examples && category.examples.length > 0) {
        for (const example of category.examples) {
          const url = getExampleUrl(example)
          if (url) {
            return extractDomain(url)
          }
        }
      }
    }
    return 'UNKNOWN'
  }

  const handleCategoryClick = (categoryKey: string) => {
    if (result?.result[categoryKey as keyof ValidationResult]?.total > 0) {
      setSelectedCategory(categoryKey)
    }
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
            <a href="/" className="text-violet-600 font-semibold border-b-2 border-violet-600 pb-1">
              Validate
            </a>
            <a href="/browse" className="text-gray-600 hover:text-violet-600 font-medium transition-colors">
              Browse
            </a>
            <a href="/settings" className="text-gray-600 hover:text-violet-600 font-medium transition-colors">
              Settings
            </a>
          </nav>
        </div>

        {/* Input Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Enter job ID or paste URL..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="pl-10 h-10 text-sm bg-gray-50 border-gray-200 focus:border-violet-500 focus:ring-violet-500/20 rounded-lg font-medium"
                  disabled={loading}
                />
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
                      ? localStorage.getItem('reworkdBaseUrl') || 'https://app.reworkd.ai/groups/949a6e3b-e9e9-4293-b42f-4b19a4f130a0/root/'
                      : 'https://app.reworkd.ai/groups/949a6e3b-e9e9-4293-b42f-4b19a4f130a0/root/'
                    
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

        {/* Error Display */}
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200 rounded-2xl">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
          </Alert>
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
              </div>

              {/* Categories */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Issue Categories</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {Object.entries(result.result)
                    .filter(([, category]) => category.total > 0)
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
              {selectedCategory && result.result[selectedCategory as keyof ValidationResult] ? (
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
                          {result.result[selectedCategory as keyof ValidationResult].total} issues found
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead className="font-bold text-gray-700 py-4">Product ID</TableHead>
                          <TableHead className="font-bold text-gray-700 py-4">URL</TableHead>
                          <TableHead className="font-bold text-gray-700 py-4 w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.result[selectedCategory as keyof ValidationResult].examples
                          .slice(0, 50)
                          .map((example: ValidationExample, index: number) => {
                            const exampleUrl = getExampleUrl(example)

                            return (
                              <TableRow key={index} className="hover:bg-gray-50 transition-colors duration-150">
                                <TableCell className="py-4">
                                  <code 
                                    onClick={() => copyToClipboard(example.product_id, `id-${selectedCategory}-${index}`)}
                                    className={`px-3 py-2 rounded-xl text-sm font-inconsolata font-semibold border cursor-pointer transition-colors whitespace-nowrap ${
                                      copiedItems.has(`id-${selectedCategory}-${index}`) 
                                        ? "bg-teal-100 text-teal-800 border-teal-200" 
                                        : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                                    }`}
                                    title={example.product_id}
                                  >
                                    {example.product_id.length > 25 ? `${example.product_id.substring(0, 25)}...` : example.product_id}
                                  </code>
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-gray-700 break-all leading-relaxed font-medium">
                                        {exampleUrl || "No URL available"}
                                      </p>
                                    </div>
                                    {exampleUrl && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(exampleUrl, `url-${selectedCategory}-${index}`)}
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
                                  {exampleUrl && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      asChild
                                      className="h-8 w-8 p-0 hover:bg-violet-100 rounded-xl transition-colors"
                                    >
                                      <a href={exampleUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-4 h-4 text-violet-600" />
                                      </a>
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                      </TableBody>
                    </Table>
                  </div>

                  {result.result[selectedCategory as keyof ValidationResult].examples.length > 50 && (
                    <div className="p-4 bg-gray-50 text-center border-t border-gray-200">
                      <span className="text-sm font-semibold text-gray-600">
                        Showing 50 of {result.result[selectedCategory as keyof ValidationResult].total} issues
                      </span>
                    </div>
                  )}
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
      </div>
    </div>
  )
}
