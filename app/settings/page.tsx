"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Save, RotateCcw, AlertTriangle, Shield, Download, X } from "lucide-react"
import Navigation from "@/components/Navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [groupInput, setGroupInput] = useState("")
  const [apiEndpoint, setApiEndpoint] = useState("")
  const [reworkdBaseUrl, setReworkdBaseUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingDefaults, setIsFetchingDefaults] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const allowedGroups = process.env.NEXT_PUBLIC_ALLOWED_GROUPS?.split(',').map(g => g.trim().toLowerCase()) || []

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuth = localStorage.getItem('settingsAuthenticated') === 'true'
      setIsAuthenticated(isAuth)
      
      if (isAuth) {
        const storedEndpoint = localStorage.getItem('apiEndpoint') || ""
        const storedReworkdUrl = localStorage.getItem('reworkdBaseUrl') || ""
        setApiEndpoint(storedEndpoint)
        setReworkdBaseUrl(storedReworkdUrl)
      }
    }
  }, [])

  const authenticate = () => {
    const inputGroup = groupInput.trim().toLowerCase()
    if (allowedGroups.includes(inputGroup)) {
      setIsAuthenticated(true)
      if (typeof window !== 'undefined') {
        localStorage.setItem('settingsAuthenticated', 'true')
      }
      setMessage({ type: 'success', text: `Welcome, ${groupInput.trim()}!` })
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: 'Invalid group. Please try again.' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    setGroupInput("")
    setApiEndpoint("")
    setReworkdBaseUrl("")
    if (typeof window !== 'undefined') {
      localStorage.removeItem('settingsAuthenticated')
    }
  }

  const fetchDefaults = async () => {
    setIsFetchingDefaults(true)
    try {
      const defaultEndpoint = process.env.NEXT_PUBLIC_DEFAULT_API_ENDPOINT || ""
      const defaultReworkdUrl = process.env.NEXT_PUBLIC_DEFAULT_REWORKD_BASE_URL || ""
      
      setApiEndpoint(defaultEndpoint)
      setReworkdBaseUrl(defaultReworkdUrl)
      
      setMessage({ type: 'success', text: 'Default URLs fetched successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch default URLs' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setIsFetchingDefaults(false)
    }
  }

  const saveSettings = async () => {
    setIsLoading(true)
    try {
      // Validate endpoint format
      if (!apiEndpoint.trim()) {
        throw new Error("API endpoint cannot be empty")
      }
      
      if (!apiEndpoint.startsWith('http')) {
        throw new Error("API endpoint must start with http:// or https://")
      }

      if (!reworkdBaseUrl.trim()) {
        throw new Error("Reworkd base URL cannot be empty")
      }
      
      if (!reworkdBaseUrl.startsWith('http')) {
        throw new Error("Reworkd base URL must start with http:// or https://")
      }

      // Test the endpoint
      try {
        const testUrl = new URL(apiEndpoint)
        if (!testUrl.pathname.endsWith('/')) {
          setApiEndpoint(apiEndpoint + '/')
        }
      } catch {
        throw new Error("Invalid API endpoint URL format")
      }

      try {
        const testReworkdUrl = new URL(reworkdBaseUrl)
        if (!testReworkdUrl.pathname.endsWith('/')) {
          setReworkdBaseUrl(reworkdBaseUrl + '/')
        }
      } catch {
        throw new Error("Invalid Reworkd base URL format")
      }

      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('apiEndpoint', apiEndpoint)
        localStorage.setItem('reworkdBaseUrl', reworkdBaseUrl)
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save settings' 
      })
    } finally {
      setIsLoading(false)
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const resetToDefault = () => {
    setApiEndpoint("")
    setReworkdBaseUrl("")
    setMessage({ type: 'success', text: 'Reset to empty settings' })
    setTimeout(() => setMessage(null), 3000)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white font-inter">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <Navigation currentPage="settings" />

          {/* Authentication */}
          <div className="max-w-md mx-auto">
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings Access</h2>
                <p className="text-gray-600">Please authenticate to access settings</p>
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
                  Access Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <Navigation currentPage="settings" />

        {/* Content */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">API Configuration</h2>
                <p className="text-gray-600 text-sm mt-1">Configure the validation API endpoint</p>
              </div>
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

            <div className="space-y-6">
              <div>
                <label htmlFor="endpoint" className="block text-sm font-semibold text-gray-700 mb-2">
                  API Endpoint URL
                </label>
                <Input
                  id="endpoint"
                  type="url"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="Enter API endpoint URL"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The base URL for the validation API. Should end with /validate/
                </p>
              </div>

              <div>
                <label htmlFor="reworkdUrl" className="block text-sm font-semibold text-gray-700 mb-2">
                  Reworkd Base URL
                </label>
                <Input
                  id="reworkdUrl"
                  type="url"
                  value={reworkdBaseUrl}
                  onChange={(e) => setReworkdBaseUrl(e.target.value)}
                  placeholder="Enter Reworkd base URL"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Base URL for navigating to jobs in Reworkd. Job IDs will be appended to this URL.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={saveSettings}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={fetchDefaults}
                  disabled={isFetchingDefaults}
                  variant="outline"
                >
                  {isFetchingDefaults ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Fetch Defaults
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={resetToDefault}
                  variant="outline"
                  disabled={isLoading}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
            <h3 className="font-semibold text-blue-900 mb-2">About Configuration</h3>
            <p className="text-sm text-blue-800">
              All settings are stored locally in your browser. Use "Fetch Defaults" to load the default URLs.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 
