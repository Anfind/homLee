import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Users, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SyncResult {
  success: boolean
  message: string
  data?: {
    created: number
    updated: number
    processed?: number
    errors: any[]
  }
}

export default function DataSyncManager() {
  const [isEmployeeSync, setIsEmployeeSync] = useState(false)
  const [isAttendanceSync, setIsAttendanceSync] = useState(false)
  const [employeeResult, setEmployeeResult] = useState<SyncResult | null>(null)
  const [attendanceResult, setAttendanceResult] = useState<SyncResult | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const syncEmployees = async () => {
    console.log('🔄 Starting employee sync - setting isEmployeeSync to true')
    setIsEmployeeSync(true)
    setEmployeeResult(null)

    try {
      const response = await fetch('/api/sync-employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Employee sync completed:', result)
      setEmployeeResult(result)
    } catch (error) {
      console.error('Employee sync error:', error)
      setEmployeeResult({
        success: false,
        message: `Lỗi kết nối API: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      console.log('🏁 Employee sync finished - setting isEmployeeSync to false')
      setIsEmployeeSync(false)
    }
  }

  const syncAttendance = async () => {
    setIsAttendanceSync(true)
    setAttendanceResult(null)

    try {
      const response = await fetch('/api/sync-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: startDate || undefined,
          endDate: endDate || undefined
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setAttendanceResult(result)
    } catch (error) {
      console.error('Attendance sync error:', error)
      setAttendanceResult({
        success: false,
        message: `Lỗi kết nối API: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsAttendanceSync(false)
    }
  }

  const ResultAlert = ({ result, title }: { result: SyncResult, title: string }) => (
    <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
      <div className="flex items-center gap-2">
        {result.success ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-600" />
        )}
        <div>
          <h4 className="font-medium">{title}</h4>
          <AlertDescription>
            {result.message}
            {result.data && (
              <div className="mt-2 text-sm">
                <div>Tạo mới: {result.data.created}</div>
                <div>Cập nhật: {result.data.updated}</div>
                {result.data.processed && <div>Xử lý: {result.data.processed}</div>}
                {result.data.errors.length > 0 && (
                  <div className="text-red-600">Lỗi: {result.data.errors.length}</div>
                )}
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  )

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Đồng Bộ Nhân Viên
          </CardTitle>
          <CardDescription>
            Đồng bộ danh sách nhân viên từ máy chấm công ZKTeco vào MongoDB
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => {
              console.log('🖱️ Employee sync button clicked, current state:', { isEmployeeSync })
              syncEmployees()
            }} 
            disabled={isEmployeeSync}
            className="w-full"
          >
            {isEmployeeSync ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang đồng bộ...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Đồng Bộ Nhân Viên
              </>
            )}
          </Button>

          {employeeResult && (
            <ResultAlert result={employeeResult} title="Kết Quả Đồng Bộ Nhân Viên" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Đồng Bộ Chấm Công
          </CardTitle>
          <CardDescription>
            Đồng bộ dữ liệu chấm công từ máy ZKTeco vào MongoDB với convert thời gian
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Từ ngày (tùy chọn)</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Đến ngày (tùy chọn)</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={syncAttendance} 
            disabled={isAttendanceSync}
            className="w-full"
          >
            {isAttendanceSync ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang đồng bộ...
              </>
            ) : (
              <>
                <Clock className="mr-2 h-4 w-4" />
                Đồng Bộ Chấm Công
              </>
            )}
          </Button>

          {attendanceResult && (
            <ResultAlert result={attendanceResult} title="Kết Quả Đồng Bộ Chấm Công" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
