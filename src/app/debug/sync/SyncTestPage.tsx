'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Users, Database, CheckCircle, XCircle } from 'lucide-react'

export default function SyncTestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [syncResults, setSyncResults] = useState<any>(null)

  const handleSync = async () => {
    setIsLoading(true)
    setSyncResults(null)
    
    try {
      toast.loading('Syncing users from Clerk to database...')
      
      const response = await fetch('/api/debug/sync-all-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSyncResults(result)
        toast.success(`✅ Successfully synced ${result.totalClerkUsers} users!`)
        console.log('Detailed sync results:', result)
      } else {
        toast.error(`❌ Sync failed: ${result.error}`)
        console.error('Sync error:', result)
      }
    } catch (error) {
      toast.error('❌ Network error during sync')
      console.error('Request error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setSyncResults(null)
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">User Synchronization Tool</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sync users from Clerk authentication to your local database
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sync Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={handleSync} 
              size="lg"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing Users...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Sync All Users from Clerk
                </>
              )}
            </Button>
            
            {syncResults && (
              <Button 
                variant="outline" 
                onClick={clearResults}
                disabled={isLoading}
              >
                Clear Results
              </Button>
            )}
          </div>
          
          <p className="text-sm text-gray-500">
            This will fetch all users from Clerk and create/update corresponding records in your local database.
          </p>
        </CardContent>
      </Card>

      {syncResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Sync Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{syncResults.totalClerkUsers}</div>
                <div className="text-sm text-blue-600">Clerk Users</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{syncResults.summary.created}</div>
                <div className="text-sm text-green-600">Created</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{syncResults.summary.updated}</div>
                <div className="text-sm text-yellow-600">Updated</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{syncResults.summary.errors}</div>
                <div className="text-sm text-red-600">Errors</div>
              </div>
            </div>

            {/* Detailed Results */}
            {syncResults.syncResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Detailed Results:</h4>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {syncResults.syncResults.map((result: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="flex items-center gap-2">
                        {result.action === 'created' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {result.action === 'updated' && <CheckCircle className="h-4 w-4 text-yellow-600" />}
                        {result.action === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                        <span className="font-medium">{result.name}</span>
                        <span className="text-sm text-gray-500">{result.email}</span>
                      </div>
                      <Badge variant={
                        result.action === 'created' ? 'default' :
                        result.action === 'updated' ? 'secondary' : 'destructive'
                      }>
                        {result.action}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">After successful synchronization:</p>
          <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>Open Prisma Studio to verify users appear in the database</li>
            <li>Go to the Contacts tab in your WhatsApp clone</li>
            <li>Search for other users by name or email</li>
            <li>Start conversations and test real-time messaging</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
