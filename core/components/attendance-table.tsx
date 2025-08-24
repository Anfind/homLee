"use client"

import type React from "react"

import { useState, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Download, History, Edit3, DollarSign, PlusSquare } from "lucide-react"
import type { Employee, AttendanceRecord, BonusPoint, CustomDailyValue, PaginationData } from "@/app/page"
import type { UserType } from "@/components/login-form"
import * as XLSX from "xlsx"

interface AttendanceTableProps {
  employees: Employee[]
  attendanceRecords: AttendanceRecord[]
  bonusPoints: BonusPoint[]
  customDailyValues: CustomDailyValue[]
  selectedMonth: string
  user: UserType
  pagination: PaginationData
  isLoading: boolean
  onBonusPointUpdate: (employeeId: string, date: string, points: number) => void
  onCustomValueUpdate: (employeeId: string, date: string, columnKey: string, value: string) => void
  onEmployeeUpdate: (employee: Employee) => void
  onPageChange: (page: number) => void
  onNextPage: () => void
  onPrevPage: () => void
}

export function AttendanceTable({
  employees,
  attendanceRecords,
  bonusPoints,
  customDailyValues,
  selectedMonth,
  user,
  pagination,
  isLoading,
  onBonusPointUpdate,
  onCustomValueUpdate,
  onEmployeeUpdate,
  onPageChange,
  onNextPage,
  onPrevPage,
}: AttendanceTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [editingBonus, setEditingBonus] = useState<{ employeeId: string; date: string } | null>(null)
  const [bonusValue, setBonusValue] = useState("")
  const [historyDialog, setHistoryDialog] = useState<{ employeeId: string; date: string } | null>(null)

  // Helper to get employeeId (handle both id and _id fields from MongoDB)
  const getEmployeeId = (employee: any): string => {
    return employee.id || employee._id || ''
  }

  // State for direct editing of custom daily values (including commission)
  const [editingCustomCell, setEditingCustomCell] = useState<{
    employeeId: string
    columnKey: string // "commission", "custom1", "custom2", "custom3"
  } | null>(null)
  const [customCellInputValue, setCustomCellInputValue] = useState("")
  const customInputRef = useRef<HTMLInputElement>(null) // Ref to focus the custom input

  // State for direct editing of employee title
  const [editingTitle, setEditingTitle] = useState<{ employeeId: string } | null>(null)
  const [titleInputValue, setTitleInputValue] = useState("")
  const titleInputRef = useRef<HTMLInputElement>(null) // Ref to focus the title input

  // Focus input when editingCustomCell changes
  useEffect(() => {
    if (editingCustomCell && customInputRef.current) {
      customInputRef.current.focus()
    }
  }, [editingCustomCell])

  // Focus title input when editingTitle changes
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [editingTitle])

  // Define custom column keys and their display names
  const customColumns = [
    { key: "custom1", name: "Cột tùy chỉnh 1" },
    { key: "custom2", name: "Cột tùy chỉnh 2" },
    { key: "custom3", name: "Cột tùy chỉnh 3" },
  ]

  // Helper to get Vietnamese day name
  const getVietnameseDayName = (date: Date): string => {
    const day = date.getDay() // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
    return dayNames[day]
  }

  // Generate days for selected month and their day names
  const daysInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number)
    const daysCount = new Date(year, month, 0).getDate()
    return Array.from({ length: daysCount }, (_, i) => {
      const date = new Date(year, month - 1, i + 1)
      return {
        day: i + 1,
        dateStr: `${selectedMonth}-${String(i + 1).padStart(2, "0")}`,
        dayName: getVietnameseDayName(date),
      }
    })
  }, [selectedMonth])

  // Filter employees based on user role and search/filter criteria + current page attendance records
  const filteredEmployees = useMemo(() => {
    // Get unique employee IDs from current page's attendance records
    const currentPageEmployeeIds = [...new Set(attendanceRecords.map(record => record.employeeId))]
    
    // Filter employees to only include those with attendance records in current page
    let filtered = employees.filter(emp => 
      currentPageEmployeeIds.includes(getEmployeeId(emp))
    )

    // Role-based filtering
    if ((user.role === "truongphong" || user.role === "department_manager") && user.department) {
      filtered = filtered.filter((emp) => emp.department === user.department)
    }

    // Search filtering
    if (searchTerm) {
      filtered = filtered.filter(
        (emp) =>
          emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getEmployeeId(emp).includes(searchTerm) ||
          emp.department.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Department filtering
    if (departmentFilter !== "all") {
      filtered = filtered.filter((emp) => emp.department === departmentFilter)
    }

    // Sort by ID (numeric sorting for better order)
    filtered.sort((a, b) => {
      const idA = parseInt(getEmployeeId(a)) || 0
      const idB = parseInt(getEmployeeId(b)) || 0
      return idA - idB
    })

    console.log(`📊 Filtered employees for page: ${filtered.length} (from ${currentPageEmployeeIds.length} unique employees with attendance records)`)
    return filtered
  }, [employees, attendanceRecords, user, searchTerm, departmentFilter])

  // Get attendance record for specific employee and date
  const getAttendanceRecord = (employeeId: string, day: number): AttendanceRecord | undefined => {
    const dateStr = `${selectedMonth}-${String(day).padStart(2, "0")}`
    const record = attendanceRecords.find((record) => record.employeeId === employeeId && record.date === dateStr)
    
    // Debug first few calls
    if (employeeId === "117" && day <= 5) {
      console.log(`🔍 Looking for employee ${employeeId} on ${dateStr}:`)
      console.log(`   - Found record:`, record)
      console.log(`   - Total attendanceRecords:`, attendanceRecords.length)
      console.log(`   - Sample records:`, attendanceRecords.slice(0, 2))
    }
    
    return record
  }

  // Get bonus points for specific employee and date
  const getBonusPoints = (employeeId: string, day: number): number => {
    const dateStr = `${selectedMonth}-${String(day).padStart(2, "0")}`
    
    // Find the employee to get both possible IDs
    const employee = employees.find(emp => getEmployeeId(emp) === employeeId)
    
    // Helper function to get actual employeeId from bonus point
    const getBonusEmployeeId = (bp: BonusPoint): string => {
      return typeof bp.employeeId === 'string' ? bp.employeeId : bp.employeeId._id
    }
    
    // Try to find bonus points with current employeeId first
    let bonus = bonusPoints.find((bp) => getBonusEmployeeId(bp) === employeeId && bp.date === dateStr)
    
    // If not found and employee has alternative ID, try with that
    if (!bonus && employee) {
      const altId = employee.id !== employeeId ? employee.id : employee._id
      if (altId && altId !== employeeId) {
        bonus = bonusPoints.find((bp) => getBonusEmployeeId(bp) === altId && bp.date === dateStr)
      }
    }
    
    return bonus?.points || 0
  }

  // Get custom daily value for specific employee, date, and column key
  const getCustomDailyValue = (employeeId: string, dateStr: string, columnKey: string): string => {
    // Find the employee to get both possible IDs
    const employee = employees.find(emp => getEmployeeId(emp) === employeeId)
    
    // Try to find custom value with current employeeId first
    let customValue = customDailyValues.find(
      (cdv) => cdv.employeeId === employeeId && cdv.date === dateStr && cdv.columnKey === columnKey,
    )
    
    // If not found and employee has alternative ID, try with that
    if (!customValue && employee) {
      const altId = employee.id !== employeeId ? employee.id : employee._id
      if (altId && altId !== employeeId) {
        customValue = customDailyValues.find(
          (cdv) => cdv.employeeId === altId && cdv.date === dateStr && cdv.columnKey === columnKey,
        )
      }
    }
    
    return customValue?.value || ""
  }

  // Get bonus history for specific employee and date
  const getBonusHistory = (employeeId: string, day: number): BonusPoint[] => {
    const dateStr = `${selectedMonth}-${String(day).padStart(2, "0")}`
    
    // Find the employee to get both possible IDs
    const employee = employees.find(emp => getEmployeeId(emp) === employeeId)
    
    // Helper function to get actual employeeId from bonus point
    const getBonusEmployeeId = (bp: BonusPoint): string => {
      return typeof bp.employeeId === 'string' ? bp.employeeId : bp.employeeId._id
    }
    
    // Get bonus points for current employeeId
    let bonusHistory = bonusPoints.filter((bp) => getBonusEmployeeId(bp) === employeeId && bp.date === dateStr)
    
    // If employee has alternative ID, also get bonus points for that ID
    if (employee) {
      const altId = employee.id !== employeeId ? employee.id : employee._id
      if (altId && altId !== employeeId) {
        const altBonusHistory = bonusPoints.filter((bp) => getBonusEmployeeId(bp) === altId && bp.date === dateStr)
        bonusHistory = [...bonusHistory, ...altBonusHistory]
      }
    }
    
    return bonusHistory.sort((a, b) => new Date(b.editedAt).getTime() - new Date(a.editedAt).getTime())
  }

  // Calculate total points for employee in month
  const getTotalPoints = (employeeId: string): number => {
    let total = 0
    daysInMonth.forEach((dayInfo) => {
      const record = getAttendanceRecord(employeeId, dayInfo.day)
      const bonus = getBonusPoints(employeeId, dayInfo.day)
      total += (record?.points || 0) + bonus
    })
    return total
  }

  // Handle bonus point editing (still uses dialog for daily bonus)
  const handleBonusEdit = (employeeId: string, day: number) => {
    const dateStr = `${selectedMonth}-${String(day).padStart(2, "0")}`
    const currentBonus = getBonusPoints(employeeId, day)
    setEditingBonus({ employeeId, date: dateStr })
    setBonusValue(currentBonus.toString())
  }

  const handleBonusSave = () => {
    if (!editingBonus) return
    const points = Number.parseFloat(bonusValue) || 0
    onBonusPointUpdate(editingBonus.employeeId, editingBonus.date, points)
    setEditingBonus(null)
    setBonusValue("")
  }

  // Handle custom value editing (direct input)
  const handleCustomCellEdit = (employeeId: string, columnKey: string) => {
    // For monthly values, we associate them with the first day of the month
    const dateStr = daysInMonth[0].dateStr
    const currentValue = getCustomDailyValue(employeeId, dateStr, columnKey)
    setEditingCustomCell({ employeeId, columnKey })
    setCustomCellInputValue(currentValue)
  }

  const handleCustomCellSave = () => {
    if (!editingCustomCell) return
    // For monthly values, we associate them with the first day of the month
    const dateStr = daysInMonth[0].dateStr
    onCustomValueUpdate(editingCustomCell.employeeId, dateStr, editingCustomCell.columnKey, customCellInputValue)
    setEditingCustomCell(null)
    setCustomCellInputValue("")
  }

  const handleCustomCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCustomCellSave()
    }
  }

  // Handle title editing (direct input)
  const handleEditTitle = (employeeId: string, currentTitle: string) => {
    setEditingTitle({ employeeId })
    setTitleInputValue(currentTitle)
  }

  const handleSaveTitle = (employeeId: string) => {
    if (!editingTitle) return
    const updatedEmployee = employees.find((emp) => emp.id === employeeId)
    if (updatedEmployee) {
      onEmployeeUpdate({ ...updatedEmployee, title: titleInputValue })
    }
    setEditingTitle(null)
    setTitleInputValue("")
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, employeeId: string) => {
    if (e.key === "Enter") {
      handleSaveTitle(employeeId)
    }
  }

  // Show bonus history
  const showBonusHistory = (employeeId: string, day: number) => {
    const dateStr = `${selectedMonth}-${String(day).padStart(2, "0")}`
    setHistoryDialog({ employeeId, date: dateStr })
  }

  // Export to Excel
  const exportToExcel = () => {
    if (filteredEmployees.length === 0) {
      alert("Không có dữ liệu nhân viên để xuất Excel.")
      return
    }

    const data = filteredEmployees.map((employee, index) => {
      const employeeId = getEmployeeId(employee)
      const row: any = {
        STT: index + 1,
        ID: employeeId,
        Tên: employee.name,
        "Tước vị": employee.title, // Use the updated title
        "Phòng ban": employee.department,
      }

      // Add daily points
      daysInMonth.forEach((dayInfo) => {
        const record = getAttendanceRecord(employeeId, dayInfo.day)
        const bonus = getBonusPoints(employeeId, dayInfo.day)
        const totalDayPoints = (record?.points || 0) + bonus
        row[`${dayInfo.dayName} ${dayInfo.day}`] = totalDayPoints // Include day name in header
      })

      row["Tổng điểm"] = getTotalPoints(employeeId)
      row["Điểm cộng thêm"] = daysInMonth.reduce((sum, dayInfo) => sum + getBonusPoints(employeeId, dayInfo.day), 0)

      // Commission is now a custom column, let's assume it's also a monthly value for export
      row["Hoa hồng"] = getCustomDailyValue(employeeId, daysInMonth[0].dateStr, "commission")

      // Add custom columns to export
      customColumns.forEach((col) => {
        const monthlyCustomValue = getCustomDailyValue(employeeId, daysInMonth[0].dateStr, col.key)
        row[col.name] = monthlyCustomValue
      })

      return row
    })

    console.log("Data for Excel export:", data) // Debugging log

    try {
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Chấm công")

      // Use XLSX.write to get binary data and then trigger download in browser
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const fileName = `cham-cong-${selectedMonth}.xlsx`

      // Create a Blob and trigger download
      const blob = new Blob([wbout], { type: "application/octet-stream" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      document.body.appendChild(a)
      a.href = url
      a.download = fileName
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert("Xuất file Excel thành công!") // Success feedback
    } catch (error) {
      console.error("Error exporting to Excel:", error) // Error logging
      alert("Có lỗi xảy ra khi xuất file Excel. Vui lòng thử lại.") // Error feedback
    }
  }

  // Get unique departments for filter
  const departments = [...new Set(employees.map((emp) => emp.department))]

  return (
    <div className="space-y-4">
      {/* Debug Panel - Always visible at top */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-yellow-800">
            <strong>Debug Info:</strong> selectedMonth: {selectedMonth} | attendanceRecords: {attendanceRecords.length}
          </div>
          <Button 
            onClick={() => {
              console.log(`🔍 DETAILED DEBUG INFO:`)
              console.log(`   - selectedMonth: ${selectedMonth}`)
              console.log(`   - attendanceRecords.length: ${attendanceRecords.length}`)
              console.log(`   - Sample records:`, attendanceRecords.slice(0, 3))
              console.log(`   - Looking for employee 117 on 2025-03-04:`, 
                attendanceRecords.find(r => r.employeeId === "117" && r.date === "2025-03-04"))
              
              // Test getAttendanceRecord for March 4th (day 4 of March)
              const record = getAttendanceRecord("117", 4)
              console.log(`   - getAttendanceRecord("117", 4):`, record)
              
              // Test all employees for day 4
              const allRecordsDay4 = employees.slice(0, 3).map(emp => ({
                employeeId: emp.id,
                record: getAttendanceRecord(emp.id, 4),
                points: getAttendanceRecord(emp.id, 4)?.points || 0
              }))
              console.log(`   - All employees day 4:`, allRecordsDay4)
              
              alert(`Debug info logged to console! Records: ${attendanceRecords.length}`)
            }}
            size="sm"
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            🔍 DEBUG CONSOLE
          </Button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm theo tên, ID hoặc phòng ban..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {user.role === "admin" && departments.length > 1 && (
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phòng ban</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={exportToExcel} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Xuất Excel
          </Button>
          <Button 
            onClick={() => {
              console.log(`🔍 DEBUG INFO:`)
              console.log(`   - selectedMonth: ${selectedMonth}`)
              console.log(`   - attendanceRecords.length: ${attendanceRecords.length}`)
              console.log(`   - Sample records:`, attendanceRecords.slice(0, 3))
              console.log(`   - Looking for employee 117 on 2025-03-04:`, 
                attendanceRecords.find(r => r.employeeId === "117" && r.date === "2025-03-04"))
              
              // Test getAttendanceRecord for March 4th (day 4 of March)
              const record = getAttendanceRecord("117", 4)
              console.log(`   - getAttendanceRecord("117", 4):`, record)
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            🔍 Debug
          </Button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th
                  rowSpan={2}
                  className="px-3 py-2 text-left font-medium text-gray-900 border-r sticky left-0 bg-gray-50 z-10"
                >
                  STT
                </th>
                <th
                  rowSpan={2}
                  className="px-3 py-2 text-left font-medium text-gray-900 border-r sticky left-12 bg-gray-50 z-10 min-w-20"
                >
                  ID
                </th>
                <th
                  rowSpan={2}
                  className="px-3 py-2 text-left font-medium text-gray-900 border-r sticky left-32 bg-gray-50 z-10 min-w-32"
                >
                  Tên
                </th>
                <th
                  rowSpan={2}
                  className="px-3 py-2 text-left font-medium text-gray-900 border-r sticky left-64 bg-gray-50 z-10 min-w-24"
                >
                  Tước vị
                </th>
                {daysInMonth.map((dayInfo) => (
                  <th
                    key={`day-name-${dayInfo.day}`}
                    className="px-2 py-1 text-center font-medium text-gray-900 border-r min-w-12"
                  >
                    {dayInfo.dayName}
                  </th>
                ))}
                <th rowSpan={2} className="px-3 py-2 text-center font-medium text-gray-900 border-r min-w-20">
                  Tổng điểm
                </th>
                <th rowSpan={2} className="px-3 py-2 text-center font-medium text-gray-900 border-r min-w-24">
                  Điểm cộng
                </th>
                {/* New editable Commission column */}
                <th rowSpan={2} className="px-3 py-2 text-center font-medium text-gray-900 border-r min-w-24">
                  Hoa hồng
                </th>
                {/* New custom columns */}
                {customColumns.map((col) => (
                  <th
                    key={col.key}
                    rowSpan={2}
                    className="px-3 py-2 text-center font-medium text-gray-900 border-r min-w-24"
                  >
                    {col.name}
                  </th>
                ))}
              </tr>
              <tr>
                {daysInMonth.map((dayInfo) => (
                  <th
                    key={`day-num-${dayInfo.day}`}
                    className="px-2 py-1 text-center font-medium text-gray-900 border-r min-w-12"
                  >
                    {dayInfo.day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7 + daysInMonth.length} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7 + daysInMonth.length} className="px-6 py-8 text-center text-gray-500">
                    Không có dữ liệu chấm công cho tháng này
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee, index) => {
                const employeeId = getEmployeeId(employee)
                const totalPoints = getTotalPoints(employeeId)
                const totalBonusPoints = daysInMonth.reduce(
                  (sum, dayInfo) => sum + getBonusPoints(employeeId, dayInfo.day),
                  0,
                )

                return (
                  <tr key={employeeId} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 border-r sticky left-0 bg-white z-10">{index + 1}</td>
                    <td className="px-3 py-2 border-r sticky left-12 bg-white z-10 font-mono text-xs">{getEmployeeId(employee)}</td>
                    <td className="px-3 py-2 border-r sticky left-32 bg-white z-10 font-medium">{employee.name}</td>
                    {/* Editable Title Cell */}
                    <td className="px-3 py-2 border-r sticky left-64 bg-white z-10 text-gray-600">
                      {editingTitle?.employeeId === employeeId ? (
                        <Input
                          ref={titleInputRef}
                          type="text"
                          value={titleInputValue}
                          onChange={(e) => setTitleInputValue(e.target.value)}
                          onBlur={() => handleSaveTitle(employeeId)}
                          onKeyDown={(e) => handleTitleKeyDown(e, employeeId)}
                          className="h-8 text-center p-1"
                        />
                      ) : (
                        <button
                          onClick={() => handleEditTitle(employeeId, employee.title)}
                          className="flex items-center gap-1 mx-auto text-gray-600 hover:text-gray-800"
                        >
                          {employee.title}
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                    </td>

                    {daysInMonth.map((dayInfo) => {
                      const record = getAttendanceRecord(employeeId, dayInfo.day)
                      const bonus = getBonusPoints(employeeId, dayInfo.day)
                      const totalDayPoints = (record?.points || 0) + bonus
                      const isLowPoints = totalDayPoints <= 1

                      return (
                        <td
                          key={dayInfo.day}
                          className={`px-2 py-2 text-center border-r relative group cursor-pointer ${
                            isLowPoints ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                          }`}
                          onClick={() => bonus > 0 && showBonusHistory(employeeId, dayInfo.day)}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>{totalDayPoints}</span>
                            {bonus > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleBonusEdit(employeeId, dayInfo.day)
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit3 className="w-3 h-3 text-blue-600" />
                              </button>
                            )}
                          </div>

                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                            {record ? (
                              <>
                                <div>Sáng: {record.morningCheckIn || "Không có"}</div>
                                <div>Chiều: {record.afternoonCheckIn || "Không có"}</div>
                                <div>Điểm gốc: {record.points}</div>
                                {bonus > 0 && <div>Điểm cộng: {bonus}</div>}
                              </>
                            ) : (
                              <div>Không có dữ liệu chấm công</div>
                            )}
                          </div>
                        </td>
                      )
                    })}

                    <td className="px-3 py-2 text-center border-r font-semibold">{totalPoints}</td>
                    <td className="px-3 py-2 text-center border-r">
                      <button
                        onClick={() => handleBonusEdit(employeeId, 1)} // Default to day 1 for monthly bonus
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 mx-auto"
                      >
                        {totalBonusPoints}
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </td>
                    {/* Editable Commission Cell */}
                    <td className="px-3 py-2 text-center border-r">
                      {editingCustomCell?.employeeId === employeeId &&
                      editingCustomCell?.columnKey === "commission" ? (
                        <Input
                          ref={customInputRef}
                          type="text"
                          value={customCellInputValue}
                          onChange={(e) => setCustomCellInputValue(e.target.value)}
                          onBlur={handleCustomCellSave}
                          onKeyDown={handleCustomCellKeyDown}
                          className="h-8 text-center p-1"
                        />
                      ) : (
                        <button
                          onClick={() => handleCustomCellEdit(employeeId, "commission")}
                          className="text-purple-600 hover:text-purple-800 flex items-center gap-1 mx-auto"
                        >
                          {getCustomDailyValue(employeeId, daysInMonth[0].dateStr, "commission") || "Nhập"}
                          <DollarSign className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                    {/* Editable Custom Columns Cells */}
                    {customColumns.map((col) => (
                      <td key={col.key} className="px-3 py-2 text-center border-r">
                        {editingCustomCell?.employeeId === employeeId && editingCustomCell?.columnKey === col.key ? (
                          <Input
                            ref={customInputRef}
                            type="text"
                            value={customCellInputValue}
                            onChange={(e) => setCustomCellInputValue(e.target.value)}
                            onBlur={handleCustomCellSave}
                            onKeyDown={handleCustomCellKeyDown}
                            className="h-8 text-center p-1"
                          />
                        ) : (
                          <button
                            onClick={() => handleCustomCellEdit(employeeId, col.key)}
                            className="text-gray-600 hover:text-gray-800 flex items-center gap-1 mx-auto"
                          >
                            {getCustomDailyValue(employeeId, daysInMonth[0].dateStr, col.key) || "Nhập"}
                            <PlusSquare className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    ))}
                  </tr>
                )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bonus Edit Dialog (still exists for daily bonus points) */}
      {editingBonus && (
        <Dialog open={true} onOpenChange={() => setEditingBonus(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa điểm cộng thêm</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Điểm cộng thêm</label>
                <Input
                  type="number"
                  step="0.1"
                  value={bonusValue}
                  onChange={(e) => setBonusValue(e.target.value)}
                  placeholder="Nhập điểm cộng thêm"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingBonus(null)}>
                  Hủy
                </Button>
                <Button onClick={handleBonusSave}>Lưu</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bonus History Dialog */}
      {historyDialog && (
        <Dialog open={true} onOpenChange={() => setHistoryDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Lịch sử chỉnh sửa điểm cộng
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {getBonusHistory(historyDialog.employeeId, Number.parseInt(historyDialog.date.split("-")[2])).map(
                (history, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {history.previousValue} → {history.points} điểm
                        </div>
                        <div className="text-sm text-gray-600">Bởi: {history.editedBy}</div>
                      </div>
                      <div className="text-sm text-gray-500">{new Date(history.editedAt).toLocaleString("vi-VN")}</div>
                    </div>
                  </div>
                ),
              )}
              {getBonusHistory(historyDialog.employeeId, Number.parseInt(historyDialog.date.split("-")[2])).length ===
                0 && <div className="text-center text-gray-500 py-4">Chưa có lịch sử chỉnh sửa</div>}
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600">
          Hiển thị {attendanceRecords.length} trong {pagination.totalCount.toLocaleString()} records
          {pagination.totalPages > 1 && ` (Trang ${pagination.page}/${pagination.totalPages})`}
        </div>
        
        {pagination.totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevPage}
              disabled={!pagination.hasPrevPage || isLoading}
              className="text-sm"
            >
              ← Trước
            </Button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const startPage = Math.max(1, pagination.page - 2)
                const pageNum = startPage + i
                if (pageNum > pagination.totalPages) return null
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    disabled={isLoading}
                    className="w-8 h-8 p-0 text-sm"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onNextPage}
              disabled={!pagination.hasNextPage || isLoading}
              className="text-sm"
            >
              Sau →
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
