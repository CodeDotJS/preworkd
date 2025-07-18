"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Save, RotateCcw, AlertTriangle } from "lucide-react"
import Navigation from "@/components/Navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SettingsPage() {
  const [apiEndpoint, setApiEndpoint] = useState("")
  const [reworkdBaseUrl, setReworkdBaseUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const defaultEndpoint = "https://yaysay-validator.onrender.com/validate/"
  const defaultReworkdUrl = "https://app.reworkd.ai/groups/949a6e3b-e9e9-4293-b42f-4b19a4f130a0/root/"

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEndpoint = localStorage.getItem('apiEndpoint') || defaultEndpoint
      const storedReworkdUrl = localStorage.getItem('reworkdBaseUrl') || defaultReworkdUrl
      setApiEndpoint(storedEndpoint)
      setReworkdBaseUrl(storedReworkdUrl)
    }
  }, [])

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
    setApiEndpoint(defaultEndpoint)
    setReworkdBaseUrl(defaultReworkdUrl)
    setMessage({ type: 'success', text: 'Reset to default settings' })
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <Navigation currentPage="settings" />

        {/* Content */}
        <div className="max-w-2xl">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">API Configuration</h2>
              <p className="text-gray-600 text-sm mt-1">Configure the validation API endpoint</p>
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
                  placeholder="https://yaysay-validator-1.onrender.com/validate/"
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
                  placeholder="https://app.reworkd.ai/groups/949a6e3b-e9e9-4293-b42f-4b19a4f130a0/root/"
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
                  onClick={resetToDefault}
                  variant="outline"
                  disabled={isLoading}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Default
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
            <h3 className="font-semibold text-blue-900 mb-2">About Configuration</h3>
            <p className="text-sm text-blue-800">
              All settings are stored locally in your browser
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 
