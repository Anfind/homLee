"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, FileText, Building2 } from "lucide-react"
import type { AttendanceRecord, Employee, Department, CheckInSettings } from "@/app/page"
import type { UserType } from "@/components/login-form"

interface XMLImporterProps {
  onImport: (records: AttendanceRecord[], employees: Employee[]) => void
  user: UserType
  departments: Department[]
  checkInSettings: CheckInSettings // Đã có sẵn checkInSettings
}

export function XMLImporter({ onImport, user, departments, checkInSettings }: XMLImporterProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Helper to convert HH:MM to total minutes from midnight
  const timeToMinutes = (timeStr: string): number => {
    const [hour, minute] = timeStr.split(":").map(Number)
    return hour * 60 + minute
  }

  // Cập nhật hàm calculatePoints để sử dụng cấu hình ca làm việc mới
  const calculatePoints = (
    dateStr: string,
    allCheckInSettings: CheckInSettings, // Truyền toàn bộ settings vào
    morningCheckIn?: string,
    afternoonCheckIn?: string,
  ): number => {
    let points = 0
    const date = new Date(dateStr)
    const dayOfWeek = date.getDay() // 0 for Sunday, 1 for Monday, ..., 6 for Saturday

    const daySettings = allCheckInSettings[dayOfWeek]

    if (!daySettings || !daySettings.shifts || daySettings.shifts.length === 0) {
      console.warn(`No check-in settings or shifts found for day of week: ${dayOfWeek}. Returning 0 points.`)
      return 0
    }

    let morningPointsAwarded = false
    let afternoonPointsAwarded = false

    // Kiểm tra giờ chấm công buổi sáng
    if (morningCheckIn && !morningPointsAwarded) {
      const morningCheckInMinutes = timeToMinutes(morningCheckIn)
      for (const shift of daySettings.shifts) {
        const shiftStartMinutes = timeToMinutes(shift.startTime)
        const shiftEndMinutes = timeToMinutes(shift.endTime)

        // Giả định: chấm công phải nằm trong khung giờ của ca để được tính điểm
        if (morningCheckInMinutes >= shiftStartMinutes && morningCheckInMinutes <= shiftEndMinutes) {
          points += shift.points
          morningPointsAwarded = true // Đánh dấu đã cộng điểm cho buổi sáng
          break // Chỉ cộng điểm cho một ca duy nhất cho giờ chấm công buổi sáng
        }
      }
    }

    // Kiểm tra giờ chấm công buổi chiều
    if (afternoonCheckIn && !afternoonPointsAwarded) {
      const afternoonCheckInMinutes = timeToMinutes(afternoonCheckIn)
      for (const shift of daySettings.shifts) {
        const shiftStartMinutes = timeToMinutes(shift.startTime)
        const shiftEndMinutes = timeToMinutes(shift.endTime)

        // Giả định: chấm công phải nằm trong khung giờ của ca để được tính điểm
        if (afternoonCheckInMinutes >= shiftStartMinutes && afternoonCheckInMinutes <= shiftEndMinutes) {
          points += shift.points
          afternoonPointsAwarded = true // Đánh dấu đã cộng điểm cho buổi chiều
          break // Chỉ cộng điểm cho một ca duy nhất cho giờ chấm công buổi chiều
        }
      }
    }

    return points
  }

  // Tự động xác định tước vị dựa trên tên
  const getTitleFromName = (name: string): string => {
    if (name.includes("TP") || name.includes("Trưởng")) {
      return "Trưởng phòng"
    }
    return "Nhân viên"
  }

  const parseXMLFile = async (
    file: File,
    targetDepartment: string,
  ): Promise<{ records: AttendanceRecord[]; employees: Employee[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const xmlText = e.target?.result as string
          const parser = new DOMParser()
          const xmlDoc = parser.parseFromString(xmlText, "text/xml")

          const rows = xmlDoc.querySelectorAll("Row")
          const records: AttendanceRecord[] = []
          const employees: Employee[] = []
          const employeeRecords = new Map<
            string,
            { date: string; morningCheckIn?: string; afternoonCheckIn?: string }
          >()
          const employeeSet = new Set<string>()

          console.log(`📊 Processing ${rows.length} rows from XML file`)

          // Skip header rows (first 4 rows) và parse từ row thứ 5
          for (let i = 4; i < rows.length; i++) {
            const row = rows[i]
            const cells = row.querySelectorAll("Cell")

            if (cells.length >= 6) {
              // Cấu trúc: STT, Ngày, ID, Họ và Tên, Giờ Vào, Giờ Ra
              const dateCell = cells[1]?.querySelector("Data")?.textContent
              const idCell = cells[2]?.querySelector("Data")?.textContent
              const nameCell = cells[3]?.querySelector("Data")?.textContent
              const timeInCell = cells[4]?.querySelector("Data")?.textContent
              const timeOutCell = cells[5]?.querySelector("Data")?.textContent

              if (dateCell && idCell && nameCell) {
                const date = new Date(dateCell).toISOString().split("T")[0]
                const employeeId = idCell.trim()
                const employeeName = nameCell.trim()
                const key = `${employeeId}-${date}`

                // Tạo employee nếu chưa có - tất cả thuộc phòng được chọn
                if (!employeeSet.has(employeeId)) {
                  const title = getTitleFromName(employeeName)

                  employees.push({
                    id: employeeId,
                    name: employeeName,
                    title: title,
                    department: targetDepartment, // Sử dụng phòng ban được chọn
                  })
                  employeeSet.add(employeeId)
                }

                let morningCheckIn: string | undefined
                let afternoonCheckIn: string | undefined

                // Xử lý Giờ Vào
                if (timeInCell && timeInCell.trim()) {
                  const timeStr = new Date(timeInCell).toTimeString().split(" ")[0]
                  const hour = Number.parseInt(timeStr.split(":")[0])

                  if (hour < 12) {
                    morningCheckIn = timeStr
                  } else {
                    afternoonCheckIn = timeStr
                  }
                }

                // Xử lý Giờ Ra
                if (timeOutCell && timeOutCell.trim()) {
                  const timeStr = new Date(timeOutCell).toTimeString().split(" ")[0]
                  const hour = Number.parseInt(timeStr.split(":")[0])

                  if (hour < 12) {
                    morningCheckIn = timeStr
                  } else {
                    afternoonCheckIn = timeStr
                  }
                }

                // Lưu hoặc cập nhật record
                const existingRecord = employeeRecords.get(key)
                if (existingRecord) {
                  if (morningCheckIn) existingRecord.morningCheckIn = morningCheckIn
                  if (afternoonCheckIn) existingRecord.afternoonCheckIn = afternoonCheckIn
                } else {
                  employeeRecords.set(key, {
                    date,
                    morningCheckIn,
                    afternoonCheckIn,
                  })
                }
              }
            }
          }

          console.log(`✅ Created ${employeeSet.size} employees and ${employeeRecords.size} attendance records`)

          // Chuyển đổi Map thành AttendanceRecord array
          employeeRecords.forEach((record, key) => {
            const employeeId = key.split("-")[0]
            // Truyền checkInSettings vào hàm calculatePoints
            const points = calculatePoints(record.date, checkInSettings, record.morningCheckIn, record.afternoonCheckIn)

            records.push({
              employeeId,
              date: record.date,
              morningCheckIn: record.morningCheckIn,
              afternoonCheckIn: record.afternoonCheckIn,
              points,
            })

          })

          resolve({ records, employees })
        } catch (error) {
          console.error("Parse error:", error)
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error("Không thể đọc file"))
      reader.readAsText(file)
    })
  }

  const handleFileSelect = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".xml")) {
      alert("Vui lòng chọn file XML")
      return
    }

    // Nếu là admin, cần chọn phòng ban
    if (user.role === "admin") {
      setPendingFile(file)
      setShowDepartmentDialog(true)
      return
    }

    // Nếu là trưởng phòng hoặc quản lý phòng ban, tự động sử dụng phòng của mình
    if ((user.role === "truongphong" || user.role === "department_manager") && user.department) {
      await processFile(file, user.department)
    }
  }

  const processFile = async (file: File, targetDepartment: string) => {
    setIsProcessing(true)
    console.log(`🔄 Starting XML import for file: ${file.name}`)

    try {
      console.log(`📝 Parsing XML file and calculating points...`)
      const { records, employees } = await parseXMLFile(file, targetDepartment)
      console.log(`✅ Import completed: ${employees.length} employees, ${records.length} attendance records`)
      onImport(records, employees)
      alert(
        `Đã import thành công vào ${targetDepartment}:\n- ${employees.length} nhân viên\n- ${records.length} bản ghi chấm công`,
      )
    } catch (error) {
      console.error("Error parsing XML:", error)
      alert("Có lỗi xảy ra khi đọc file XML")
    } finally {
      setIsProcessing(false)
      setShowDepartmentDialog(false)
      setPendingFile(null)
      setSelectedDepartment("")
    }
  }

  const handleDepartmentConfirm = () => {
    if (!selectedDepartment || !pendingFile) return
    processFile(pendingFile, selectedDepartment)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  // Get available departments based on user role
  const availableDepartments =
    user.role === "admin" ? departments.map((d) => d.name) : user.department ? [user.department] : []

  return (
    <>
      <div className="flex items-center gap-2">
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-4 transition-colors
            ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"}
            ${isProcessing ? "opacity-50 pointer-events-none" : "hover:border-gray-400"}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isProcessing}
          />

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span>{isProcessing ? "Đang xử lý..." : "Kéo thả file XML hoặc click để chọn"}</span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Import XML
        </Button>
      </div>

      {/* Department Selection Dialog */}
      {showDepartmentDialog && (
        <Dialog open={true} onOpenChange={() => setShowDepartmentDialog(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Chọn phòng ban cho file import
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File XML này thuộc phòng ban nào?
                </label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phòng ban" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDepartments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Lưu ý:</strong> Tất cả nhân viên trong file XML này sẽ được gán vào phòng ban được chọn.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDepartmentDialog(false)}>
                  Hủy
                </Button>
                <Button onClick={handleDepartmentConfirm} disabled={!selectedDepartment}>
                  Xác nhận Import
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
