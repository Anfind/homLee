"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, Download, Upload, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface MigrationModalProps {
  isOpen: boolean
  onClose: () => void
  onMigrationComplete: () => void
}

export function MigrationModal({ isOpen, onClose, onMigrationComplete }: MigrationModalProps) {
  const [migrationState, setMigrationState] = useState<'idle' | 'preparing' | 'migrating' | 'completed' | 'error'>('idle')
  const [migrationResults, setMigrationResults] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [progress, setProgress] = useState(0)

  const collectLocalStorageData = () => {
    const data: any = {}
    
    // Collect all localStorage data
    const keys = [
      'employees',
      'users', 
      'departments',
      'attendanceRecords',
      'bonusPoints',
      'customDailyValues',
      'checkInSettings'
    ]
    
    keys.forEach(key => {
      const item = localStorage.getItem(key)
      if (item) {
        try {
          data[key] = JSON.parse(item)
        } catch (e) {
          console.warn(`Failed to parse localStorage item: ${key}`, e)
        }
      }
    })
    
    return data
  }

  const startMigration = async () => {
    try {
      setMigrationState('preparing')
      setProgress(10)
      setError('')
      
      // Collect localStorage data
      const localStorageData = collectLocalStorageData()
      console.log('🔍 Collected localStorage data:', localStorageData)
      
      setProgress(20)
      setMigrationState('migrating')
      
      // Send to migration API
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ localStorageData })
      })
      
      setProgress(80)
      
      const result = await response.json()
      
      if (result.success) {
        setProgress(100)
        setMigrationState('completed')
        setMigrationResults(result.data)
        
        // Clear localStorage after successful migration
        Object.keys(localStorageData).forEach(key => {
          localStorage.removeItem(key)
        })
        
        setTimeout(() => {
          onMigrationComplete()
          onClose()
        }, 3000)
      } else {
        throw new Error(result.error || 'Migration failed')
      }
    } catch (error) {
      console.error('Migration error:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      setMigrationState('error')
      setProgress(0)
    }
  }

  const seedDefaultData = async () => {
    try {
      setMigrationState('preparing')
      setError('')
      
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seedDefaultData: true })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMigrationState('completed')
        setTimeout(() => {
          onMigrationComplete()
          onClose()
        }, 2000)
      } else {
        throw new Error(result.error || 'Seeding failed')
      }
    } catch (error) {
      console.error('Seeding error:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      setMigrationState('error')
    }
  }

  const resetMigration = () => {
    setMigrationState('idle')
    setProgress(0)
    setError('')
    setMigrationResults(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Migration to MongoDB
          </DialogTitle>
          <DialogDescription>
            Migrate your data from localStorage to MongoDB for better performance and reliability.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Migration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {migrationState === 'idle' && <Upload className="w-5 h-5" />}
                {migrationState === 'preparing' && <Download className="w-5 h-5 animate-bounce" />}
                {migrationState === 'migrating' && <Database className="w-5 h-5 animate-pulse" />}
                {migrationState === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                {migrationState === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                
                Migration Status
              </CardTitle>
              <CardDescription>
                {migrationState === 'idle' && 'Ready to start migration'}
                {migrationState === 'preparing' && 'Preparing data for migration...'}
                {migrationState === 'migrating' && 'Migrating data to MongoDB...'}
                {migrationState === 'completed' && 'Migration completed successfully!'}
                {migrationState === 'error' && 'Migration encountered an error'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {migrationState === 'migrating' && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-gray-600">{progress}% completed</p>
                </div>
              )}

              {migrationState === 'completed' && migrationResults && (
                <div className="space-y-3">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Migration completed! Your data has been successfully transferred to MongoDB.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(migrationResults).map(([key, count]) => (
                      <Badge key={key} variant="secondary" className="justify-between">
                        <span>{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                        <span>{count as number}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Migration Actions */}
          <div className="flex gap-3">
            {migrationState === 'idle' && (
              <>
                <Button onClick={startMigration} className="flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  Start Migration
                </Button>
                <Button onClick={seedDefaultData} variant="outline">
                  <Database className="w-4 h-4 mr-2" />
                  Seed Default Data Only
                </Button>
              </>
            )}

            {migrationState === 'error' && (
              <>
                <Button onClick={resetMigration} variant="outline">
                  Try Again
                </Button>
                <Button onClick={onClose} variant="secondary">
                  Close
                </Button>
              </>
            )}

            {(migrationState === 'preparing' || migrationState === 'migrating') && (
              <Button disabled className="flex-1">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {migrationState === 'preparing' ? 'Preparing...' : 'Migrating...'}
              </Button>
            )}

            {migrationState === 'completed' && (
              <Button onClick={onClose} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete
              </Button>
            )}
          </div>

          {/* Information */}
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>What will be migrated:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>All employee records</li>
              <li>User accounts and permissions</li>
              <li>Department information</li>
              <li>Attendance records</li>
              <li>Bonus points and custom values</li>
              <li>Check-in settings</li>
            </ul>
            
            <p className="mt-3">
              <strong>Note:</strong> Your localStorage data will be cleared after successful migration.
              Make sure MongoDB is running and accessible.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
