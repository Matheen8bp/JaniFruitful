"use client"

import { getApiUrl } from "@/lib/config"
import { useState } from "react"

export default function TestBackendPage() {
  const [testResult, setTestResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const testBackend = async () => {
    setIsLoading(true)
    setTestResult("Testing...")

    try {
      // Test the health endpoint
      const healthUrl = getApiUrl('health')
      console.log('Testing health endpoint:', healthUrl)
      
      const response = await fetch(healthUrl)
      const data = await response.json()
      
      setTestResult(`✅ Backend is accessible!\nStatus: ${response.status}\nData: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      console.error('Backend test error:', error)
      setTestResult(`❌ Backend connection failed!\nError: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold text-center">Backend Connection Test</h1>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-4">
            Current API Base URL: <code className="bg-gray-100 px-2 py-1 rounded">{getApiUrl('')}</code>
          </p>
          
          <button 
            onClick={testBackend}
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "Testing..." : "Test Backend Connection"}
          </button>
          
          {testResult && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 