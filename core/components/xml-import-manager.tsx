'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'

interface ImportResult {
  success: boolean
  message: string
  data?: {
    summary: {
      totalRows: number
      processedRows: number
      created: number
      updated: number
      skipped: number
      errors: number
    }
    errors: Array<{
      row: number
      error: string
      data?: any
    }>
    sampleGroupedData?: any[]
  }
}

export function XMLImportManager() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const isXmlOrExcel = file.name.toLowerCase().match(/\.(xml|xlsx|xls)$/)
      if (!isXmlOrExcel) {
        alert('Vui lòng chọn file XML hoặc Excel (.xml, .xlsx, .xls)')
        return
      }
      setSelectedFile(file)
      setResult(null) // Clear previous results
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Vui lòng chọn file trước khi import')
      return
    }

    setIsUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/import-xml', {
        method: 'POST',
        body: formData
      })

      const result: ImportResult = await response.json()
      setResult(result)

      if (result.success) {
        // Clear file selection on success
        setSelectedFile(null)
        const input = document.getElementById('file-input') as HTMLInputElement
        if (input) input.value = ''
      }

    } catch (error) {
      console.error('Upload error:', error)
      setResult({
        success: false,
        message: 'Lỗi kết nối server. Vui lòng thử lại.'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Import Dữ Liệu Điểm Danh XML/Excel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Section */}
        <div className="space-y-4">
          <Label htmlFor="file-input">Chọn file XML hoặc Excel</Label>
          <div className="flex items-center gap-4">
            <Input
              id="file-input"
              type="file"
              accept=".xml,.xlsx,.xls"
              onChange={handleFileChange}
              className="flex-1"
            />
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="min-w-[120px]"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </div>

          {selectedFile && (
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>File:</strong> {selectedFile.name}</p>
              <p><strong>Kích thước:</strong> {formatFileSize(selectedFile.size)}</p>
              <p><strong>Loại:</strong> {selectedFile.type || 'N/A'}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Format Instructions */}
        <div className="space-y-2">
          <h3 className="font-medium">📋 Định dạng file yêu cầu:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• <strong>Cột 1:</strong> STT (số thứ tự)</p>
            <p>• <strong>Cột 2:</strong> Ngày (định dạng datetime)</p>
            <p>• <strong>Cột 3:</strong> ID (mã nhân sự)</p>
            <p>• <strong>Cột 4:</strong> Họ và Tên</p>
            <p>• <strong>Cột 5:</strong> Giờ Vào (datetime với giờ:phút)</p>
            <p>• <strong>Cột 6:</strong> Giờ Ra (datetime với giờ:phút, có thể trống)</p>
          </div>
        </div>

        <Separator />

        {/* Results Section */}
        {result && (
          <div className="space-y-4">
            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                )}
                <AlertDescription className="text-sm">
                  {result.message}
                </AlertDescription>
              </div>
            </Alert>

            {result.success && result.data && (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{result.data.summary?.created || 0}</div>
                    <div className="text-sm text-blue-600">Tạo mới</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{result.data.summary?.updated || 0}</div>
                    <div className="text-sm text-green-600">Cập nhật</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{result.data.summary?.skipped || 0}</div>
                    <div className="text-sm text-yellow-600">Bỏ qua</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{result.data.summary?.errors || 0}</div>
                    <div className="text-sm text-red-600">Lỗi</div>
                  </div>
                </div>

                {/* Error Details */}
                {result.data.errors && result.data.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-700">Chi tiết lỗi:</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {result.data.errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="text-xs bg-red-50 p-2 rounded border">
                          <p><strong>Dòng {error.row}:</strong> {error.error}</p>
                          {error.data && (
                            <p className="text-gray-600 mt-1">
                              Data: {JSON.stringify(error.data, null, 0).slice(0, 100)}...
                            </p>
                          )}
                        </div>
                      ))}
                      {result.data.errors.length > 10 && (
                        <p className="text-xs text-gray-500">
                          ... và {result.data.errors.length - 10} lỗi khác
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Sample Processed Data */}
                {result.data?.sampleGroupedData && result.data.sampleGroupedData.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-700">Mẫu dữ liệu đã xử lý:</h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {result.data.sampleGroupedData.map(([key, data], index) => (
                        <div key={index} className="text-xs bg-green-50 p-2 rounded border">
                          <p><strong>{key}:</strong> {data?.employeeName || 'N/A'}</p>
                          <p>Check-ins: {data?.checkIns ? data.checkIns.join(', ') : 'Không có'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Usage Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 <strong>Lưu ý:</strong></p>
          <p>• File XML phải được export từ Excel với cấu trúc đúng</p>
          <p>• Hệ thống sẽ tự động group các lần điểm danh theo ngày</p>
          <p>• Điểm attendance sẽ được tính tự động theo quy tắc hiện tại</p>
          <p>• Nếu đã có dữ liệu ngày đó, hệ thống sẽ cập nhật (không tạo trùng)</p>
        </div>
      </CardContent>
    </Card>
  )
}
