"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  Calendar, 
  Users, 
  Clock, 
  Wifi, 
  WifiOff,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { attendanceCalculator } from '@/lib/attendance/calculator'
import { zkAPI } from '@/lib/zkapi'
import type { AttendanceRecord, Employee, CheckInSettings } from '@/app/page'

interface ZKDataImporterProps {
  onImport: (records: AttendanceRecord[], employees: Employee[]) => void
  checkInSettings: CheckInSettings
}

interface ImportStats {
  totalUsers: number
  totalRecords: number
  processedEmployees: number
  dateRange: string
}

export function ZKDataImporter({ onImport, checkInSettings }: ZKDataImporterProps) {
  // Date state - default to current month
  const [startDate, setStartDate] = useState(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    return firstDay.toISOString().split('T')[0]
  })
  
  const [endDate, setEndDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  // Import state
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  
  // Connection state
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [lastImportStats, setLastImportStats] = useState<ImportStats | null>(null)

  /**
   * Test connection to ZK device
   */
  const testConnection = async () => {
    setStatus('Đang kiểm tra kết nối...')
    try {
      const connected = await zkAPI.testConnection()
      setIsConnected(connected)
      
      if (connected) {
        setStatus('Kết nối thành công!')
        setError('')
      } else {
        setError('Không thể kết nối máy chấm công. Vui lòng kiểm tra backend server.')
      }
    } catch (error) {
      setIsConnected(false)
      setError(`Lỗi kết nối: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    setTimeout(() => setStatus(''), 3000)
  }

  /**
   * Validate input before processing
   */
  const validateInput = (): string | null => {
    if (!startDate || !endDate) {
      return 'Vui lòng chọn ngày bắt đầu và kết thúc'
    }

    const validation = attendanceCalculator.validateDateRange(startDate, endDate)
    if (!validation.valid) {
      return validation.error || 'Invalid date range'
    }

    return null
  }

  /**
   * Main import function
   */
  const handleImport = async () => {
    // Validate input
    const validationError = validateInput()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError('')
    setProgress(0)
    setLastImportStats(null)

    try {
      // Step 1: Test connection
      setStatus('Đang kiểm tra kết nối với máy chấm công...')
      setProgress(10)
      
      const connected = await zkAPI.testConnection()
      if (!connected) {
        throw new Error('Không thể kết nối máy chấm công. Vui lòng kiểm tra backend server (port 3000).')
      }
      setIsConnected(true)

      // Step 2: Process data
      setStatus('Đang lấy dữ liệu từ máy chấm công...')
      setProgress(30)

      const result = await attendanceCalculator.processAttendanceData(
        startDate,
        endDate,
        checkInSettings
      )

      setProgress(60)
      setStatus('Đang xử lý và tính toán điểm chấm công...')

      // Step 3: Validate results
      if (result.employees.length === 0) {
        throw new Error('Không tìm thấy nhân viên nào trong hệ thống')
      }

      setProgress(80)
      setStatus('Đang cập nhật dữ liệu...')

      // Step 4: Import to main application
      onImport(result.attendanceRecords, result.employees)

      // Step 5: Update stats
      setLastImportStats(result.stats)

      setProgress(100)
      setStatus('Import hoàn tất!')

      // Clear status after delay
      setTimeout(() => {
        setIsLoading(false)
        setProgress(0)
        setStatus('')
      }, 2000)

    } catch (error) {
      console.error('Import error:', error)
      setError(`Lỗi khi import dữ liệu: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsLoading(false)
      setProgress(0)
      setStatus('')
      setIsConnected(false)
    }
  }

  /**
   * Format date range for display
   */
  const getDateRangeText = (): string => {
    if (!startDate || !endDate) return ''
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    return `${daysDiff} ngày (${start.toLocaleDateString('vi-VN')} - ${end.toLocaleDateString('vi-VN')})`
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Import từ Máy Chấm Công ZKTeco
          
          {/* Connection status indicator */}
          {isConnected === true && (
            <Badge variant="secondary" className="ml-auto">
              <Wifi className="w-3 h-3 mr-1" />
              Đã kết nối
            </Badge>
          )}
          {isConnected === false && (
            <Badge variant="destructive" className="ml-auto">
              <WifiOff className="w-3 h-3 mr-1" />
              Mất kết nối
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Connection Test Section */}
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={testConnection}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Kiểm tra kết nối
          </Button>
          
          <span className="text-sm text-muted-foreground">
            Backend: {process.env.NEXT_PUBLIC_ZKTECO_BACKEND_URL || 'http://localhost:3000/api'}
          </span>
        </div>

        {/* Date Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Ngày bắt đầu</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="endDate">Ngày kết thúc</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Date Range Info */}
        {startDate && endDate && (
          <div className="text-sm text-muted-foreground bg-secondary/20 rounded-md p-3">
            <Calendar className="w-4 h-4 inline mr-2" />
            Khoảng thời gian: {getDateRangeText()}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Progress Display */}
        {isLoading && (
          <div className="space-y-3">
            <Progress value={progress} className="w-full" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 animate-pulse" />
              {status}
            </div>
          </div>
        )}

        {/* Success Status */}
        {status && !isLoading && !error && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{status}</AlertDescription>
          </Alert>
        )}

        {/* Last Import Stats */}
        {lastImportStats && !isLoading && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Kết quả import:</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Tổng nhân viên:</span>
                <Badge variant="secondary">{lastImportStats.totalUsers}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Có chấm công:</span>
                <Badge variant="secondary">{lastImportStats.processedEmployees}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Lượt chấm công:</span>
                <Badge variant="secondary">{lastImportStats.totalRecords}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Tỷ lệ tham gia:</span>
                <Badge variant="secondary">
                  {Math.round((lastImportStats.processedEmployees / lastImportStats.totalUsers) * 100)}%
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Import Button */}
        <Button 
          onClick={handleImport} 
          disabled={isLoading || !isConnected}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              <Users className="w-4 h-4 mr-2" />
              Import Dữ Liệu Chấm Công
            </>
          )}
        </Button>

        {/* Information Panel */}
        <div className="text-xs text-muted-foreground space-y-2 bg-secondary/10 rounded-md p-3">
          <h4 className="font-medium">Thông tin import:</h4>
          <ul className="space-y-1 ml-4">
            <li>• Kết nối trực tiếp với máy chấm công ZKTeco qua API</li>
            <li>• Tự động chuyển đổi múi giờ Việt Nam (UTC+7)</li>
            <li>• Tính điểm theo cấu hình ca làm việc hiện tại</li>
            <li>• Cập nhật danh sách nhân viên mới nhất (583 người)</li>
            <li>• Phân loại tự động: chấm công sáng/chiều</li>
          </ul>
          
          <div className="mt-2 pt-2 border-t border-secondary/20">
            <span className="font-medium">Lưu ý:</span> Dữ liệu được lấy từ máy chấm công 
            IP: 192.168.1.240, cần backend server chạy trên port 3000.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
