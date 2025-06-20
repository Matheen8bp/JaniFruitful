"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiUrl } from "@/lib/config";
import { useState } from "react";

export default function TestBackendPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testBackendConnection = async () => {
    setIsLoading(true);
    try {
      // Test 1: Health check
      const healthResponse = await fetch(getApiUrl('health'));
      const healthData = await healthResponse.json();

      // Test 2: Root endpoint
      const rootResponse = await fetch(getApiUrl(''));
      const rootData = await rootResponse.json();

      setTestResults({
        health: {
          status: healthResponse.status,
          data: healthData,
          url: getApiUrl('health')
        },
        root: {
          status: rootResponse.status,
          data: rootData,
          url: getApiUrl('')
        }
      });
    } catch (error) {
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        url: getApiUrl('health')
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Backend Connection Test</CardTitle>
          <CardDescription>
            Test the connection between your frontend and backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testBackendConnection} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Testing..." : "Test Backend Connection"}
          </Button>

          {testResults && (
            <div className="space-y-4">
              {testResults.error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-semibold text-red-800">❌ Connection Failed</h3>
                  <p className="text-red-600 mt-2">Error: {testResults.error}</p>
                  <p className="text-sm text-red-500 mt-1">URL: {testResults.url}</p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-800">✅ Connection Successful</h3>
                  </div>
                  
                  <div className="grid gap-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-800">Health Check</h4>
                      <p className="text-sm text-blue-600 mt-1">Status: {testResults.health.status}</p>
                      <p className="text-sm text-blue-600">URL: {testResults.health.url}</p>
                      <pre className="text-xs mt-2 bg-white p-2 rounded border">
                        {JSON.stringify(testResults.health.data, null, 2)}
                      </pre>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-800">Root Endpoint</h4>
                      <p className="text-sm text-blue-600 mt-1">Status: {testResults.root.status}</p>
                      <p className="text-sm text-blue-600">URL: {testResults.root.url}</p>
                      <pre className="text-xs mt-2 bg-white p-2 rounded border">
                        {JSON.stringify(testResults.root.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 