"use client"

import React, { useState, useEffect } from "react"
import { AttendanceTable } from "@/components/attendance-table"
import { LoginForm, UserType } from "@/components/login-form"
import { Header } from "@/components/header"
import { XMLImporter } from "@/components/xml-importer"
import { EmployeeManagement } from "@/components/employee-management"
import { DepartmentManagement } from "@/components/department-management"
import { CheckInSettingsManagement } from "@/components/check-in-settings-management"
import DataSyncManager from "@/components/data-sync-manager"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Calendar, Users, TrendingUp, FileSpreadsheet, UserPlus, Building2, Clock, Download, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface Employee {
  id: string
  name: string
  title: string
  department: string
}

export interface AttendanceRecord {
  employeeId: string
  date: string
  morningCheckIn?: string
  afternoonCheckIn?: string
  points: number
}

export interface BonusPoint {
  employeeId: string
  date: string
  points: number
  editedBy: string
  editedAt: string
  previousValue: number
}

export interface Department {
  id: string
  name: string
  createdAt: string
  createdBy: string
}

// NEW: Interface for a single shift
export interface Shift {
  id: string // Unique ID for each shift, useful for React keys and removal
  name: string // e.g., "Ca sáng", "Ca chiều"
  startTime: string // HH:MM
  endTime: string // HH:MM
  points: number // Points awarded for this shift
}

// NEW: Interface for check-in settings per day of week, now containing an array of shifts
export type CheckInSettings = {
  [key: number]: {
    shifts: Shift[]
  }
}

// New interface for custom daily values (including commission and other custom columns)
export interface CustomDailyValue {
  employeeId: string
  date: string
  columnKey: string // e.g., "commission", "custom1", "custom2", "custom3"
  value: string
  editedBy: string
  editedAt: string
  previousValue: string
}

// Khởi tạo với danh sách rỗng - sẽ được tạo từ XML
const initialEmployees: Employee[] = []

// Danh sách phòng ban mặc định
const initialDepartments: Department[] = [
  {
    id: "dept-001",
    name: "Phòng Kỹ thuật",
    createdAt: new Date().toISOString(),
    createdBy: "system",
  },
  {
    id: "dept-002", 
    name: "Phòng Kinh doanh",
    createdAt: new Date().toISOString(),
    createdBy: "system",
  },
  {
    id: "dept-003",
    name: "Phòng Hành chính",
    createdAt: new Date().toISOString(),
    createdBy: "system",
  },
]

// NEW: Default check-in settings for each day of the week with shifts
const defaultCheckInSettings: CheckInSettings = {
  0: {
    // Sunday
    shifts: [
      { id: "sun-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "11:00", points: 1 },
      { id: "sun-shift-2", name: "Ca chiều", startTime: "13:00", endTime: "17:00", points: 1 },
    ],
  },
  1: {
    // Monday
    shifts: [
      { id: "mon-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "11:00", points: 1 },
      { id: "mon-shift-2", name: "Ca chiều", startTime: "13:00", endTime: "17:00", points: 1 },
    ],
  },
  2: {
    // Tuesday
    shifts: [
      { id: "tue-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "11:00", points: 1 },
      { id: "tue-shift-2", name: "Ca chiều", startTime: "13:00", endTime: "17:00", points: 1 },
    ],
  },
  3: {
    // Wednesday
    shifts: [
      { id: "wed-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "11:00", points: 1 },
      { id: "wed-shift-2", name: "Ca chiều", startTime: "13:00", endTime: "17:00", points: 1 },
    ],
  },
  4: {
    // Thursday
    shifts: [
      { id: "thu-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "11:00", points: 1 },
      { id: "thu-shift-2", name: "Ca chiều", startTime: "13:00", endTime: "17:00", points: 1 },
    ],
  },
  5: {
    // Friday
    shifts: [
      { id: "fri-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "11:00", points: 1 },
      { id: "fri-shift-2", name: "Ca chiều", startTime: "13:00", endTime: "17:00", points: 1 },
    ],
  },
  6: {
    // Saturday
    shifts: [
      { id: "sat-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "11:00", points: 1 },
      { id: "sat-shift-2", name: "Ca chiều", startTime: "13:00", endTime: "17:00", points: 1 },
    ],
  },
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  
  // TODO: Migrate these to MongoDB API calls instead of localStorage
  const [departments, setDepartments] = useLocalStorage<Department[]>("departments", initialDepartments)
  const [employees, setEmployees] = useLocalStorage<Employee[]>("employees", initialEmployees)
  const [mongoEmployees, setMongoEmployees] = useState<Employee[]>([]) // MongoDB employees
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]) // Changed to useState, load from MongoDB
  const [bonusPoints, setBonusPoints] = useLocalStorage<BonusPoint[]>("bonusPoints", [])
  const [customDailyValues, setCustomDailyValues] = useLocalStorage<CustomDailyValue[]>("customDailyValues", [])
  const [checkInSettings, setCheckInSettings] = useState<CheckInSettings>(defaultCheckInSettings) // Changed to useState, load from MongoDB
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Use March 2025 where we have sample data
    return "2025-03"
    // Use current month to test with real data  
    // const now = new Date()
    // return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [showEmployeeManagement, setShowEmployeeManagement] = useState(false)
  const [showDepartmentManagement, setShowDepartmentManagement] = useState(false)
  const [showCheckInSettingsManagement, setShowCheckInSettingsManagement] = useState(false)

  // Load MongoDB employees and attendance records on component mount
  useEffect(() => {
    const fetchMongoData = async () => {
      try {
        // Load employees from MongoDB
        const employeesResponse = await fetch('/api/employees')
        const employeesResult = await employeesResponse.json()
        if (employeesResult.success) {
          setMongoEmployees(employeesResult.data)
          console.log(`✅ Loaded ${employeesResult.data.length} employees from MongoDB`)
        }

        // Load attendance records from MongoDB for the selected month
        console.log(`🔄 Fetching attendance records for month: ${selectedMonth}`)
        const attendanceResponse = await fetch(`/api/attendance?month=${selectedMonth}`)
        console.log(`📡 Attendance API response status:`, attendanceResponse.status)
        
        const attendanceResult = await attendanceResponse.json()
        console.log(`📋 Attendance API result:`, attendanceResult)
        
        if (attendanceResult.success) {
          setAttendanceRecords(attendanceResult.data)
          console.log(`✅ Loaded ${attendanceResult.data.length} attendance records from MongoDB for ${selectedMonth}`)
          console.log('📋 Sample attendance records:', attendanceResult.data.slice(0, 3))
          
          // Debug: Check if employees match attendance records
          if (attendanceResult.data.length > 0) {
            const attendanceEmployeeIds = [...new Set(attendanceResult.data.map(r => r.employeeId))]
            console.log('👥 Attendance Employee IDs:', attendanceEmployeeIds.slice(0, 10))
            console.log('👥 MongoDB Employee IDs:', mongoEmployees.slice(0, 10).map(e => e.id || e._id))
            
            // Check for matches
            const matches = attendanceEmployeeIds.filter(aId => 
              mongoEmployees.some(emp => emp.id === aId || emp._id === aId)
            )
            console.log(`🔗 Employee ID matches: ${matches.length}/${attendanceEmployeeIds.length}`)
          }
        } else {
          console.log('❌ Failed to load attendance records:', attendanceResult)
        }

        // Load check-in settings from MongoDB
        const settingsResponse = await fetch('/api/check-in-settings')
        const settingsResult = await settingsResponse.json()
        if (settingsResult.success) {
          setCheckInSettings(settingsResult.data)
          console.log(`✅ Loaded check-in settings from MongoDB`)
        }
      } catch (error) {
        console.error('Error loading MongoDB data:', error)
      }
    }
    
    if (currentUser) {
      fetchMongoData()
    }
  }, [currentUser, selectedMonth])

  const handleLogin = (userData: UserType) => {
    setCurrentUser(userData)
    // Store in sessionStorage for browser refresh (optional)
    sessionStorage.setItem('currentUser', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setCurrentUser(null)
    sessionStorage.removeItem('currentUser')
  }

  // Check sessionStorage on mount for user persistence
  useEffect(() => {
    const storedUser = sessionStorage.getItem('currentUser')
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        sessionStorage.removeItem('currentUser')
      }
    }
  }, [])

  const handleXMLImport = (records: AttendanceRecord[], newEmployees: Employee[]) => {
    // Cập nhật danh sách nhân viên (kiểm tra trùng)
    setEmployees((prevEmployees) => {
      const updatedEmployees = [...prevEmployees]

      newEmployees.forEach((newEmp) => {
        const existingIndex = updatedEmployees.findIndex((emp) => emp.id === newEmp.id)
        if (existingIndex >= 0) {
          // Cập nhật thông tin nhân viên hiện có
          updatedEmployees[existingIndex] = { ...updatedEmployees[existingIndex], ...newEmp }
        } else {
          // Thêm nhân viên mới
          updatedEmployees.push(newEmp)
        }
      })

      return updatedEmployees
    })

    // Cập nhật bản ghi chấm công
    setAttendanceRecords((prev) => {
      const newRecords = [...prev]
      records.forEach((record) => {
        const existingIndex = newRecords.findIndex((r) => r.employeeId === record.employeeId && r.date === record.date)
        if (existingIndex >= 0) {
          newRecords[existingIndex] = record
        } else {
          newRecords.push(record)
        }
      })
      return newRecords
    })
  }

  const handleBonusPointUpdate = (employeeId: string, date: string, points: number) => {
    if (!currentUser) return

    const existingBonus = bonusPoints.find((bp) => bp.employeeId === employeeId && bp.date === date)

    const newBonusPoint: BonusPoint = {
      employeeId,
      date,
      points,
      editedBy: currentUser.username,
      editedAt: new Date().toISOString(),
      previousValue: existingBonus?.points || 0,
    }

    setBonusPoints((prev) => {
      const filtered = prev.filter((bp) => !(bp.employeeId === employeeId && bp.date === date))
      return [...filtered, newBonusPoint]
    })
  }

  // New handler for custom daily values
  const handleCustomValueUpdate = (employeeId: string, date: string, columnKey: string, value: string) => {
    if (!currentUser) return

    const existingValue = customDailyValues.find(
      (cdv) => cdv.employeeId === employeeId && cdv.date === date && cdv.columnKey === columnKey,
    )

    const newCustomValue: CustomDailyValue = {
      employeeId,
      date,
      columnKey,
      value,
      editedBy: currentUser.username,
      editedAt: new Date().toISOString(),
      previousValue: existingValue?.value || "",
    }

    setCustomDailyValues((prev) => {
      const filtered = prev.filter(
        (cdv) => !(cdv.employeeId === employeeId && cdv.date === date && cdv.columnKey === columnKey),
      )
      return [...filtered, newCustomValue]
    })
  }

  const handleEmployeeAdd = (employee: Employee) => {
    setEmployees((prev) => [...prev, employee])
  }

  const handleEmployeeUpdate = (updatedEmployee: Employee) => {
    setEmployees((prev) => prev.map((emp) => (emp.id === updatedEmployee.id ? updatedEmployee : emp)))
  }

  const handleEmployeeDelete = (employeeId: string) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId))
    // Xóa luôn dữ liệu chấm công và điểm cộng
    setAttendanceRecords((prev) => prev.filter((record) => record.employeeId !== employeeId))
    setBonusPoints((prev) => prev.filter((bp) => bp.employeeId !== employeeId))
    setCustomDailyValues((prev) => prev.filter((cdv) => cdv.employeeId !== employeeId)) // Delete custom values too
  }

  // Temporary stub functions for user management - these should be replaced with MongoDB API calls
  const handleUserAdd = (user: UserType) => {
    console.log('User add should call MongoDB API:', user)
    // TODO: Call /api/users POST
  }

  const handleUserUpdate = (updatedUser: UserType) => {
    console.log('User update should call MongoDB API:', updatedUser)
    // TODO: Call /api/users PUT
  }

  const handleUserDelete = (username: string) => {
    console.log('User delete should call MongoDB API:', username)
    // TODO: Call /api/users DELETE
  }

  const handleDepartmentAdd = (department: Department) => {
    setDepartments((prev) => [...prev, department])
  }

  const handleDepartmentUpdate = (updatedDepartment: Department) => {
    setDepartments((prev) => prev.map((dept) => (dept.id === updatedDepartment.id ? updatedDepartment : dept)))
  }

  const handleDepartmentDelete = (departmentId: string) => {
    const department = departments.find((d) => d.id === departmentId)
    if (!department) return

    // Xóa tất cả nhân viên thuộc phòng ban này
    setEmployees((prev) => prev.filter((emp) => emp.department !== department.name))
    // Xóa phòng ban
    setDepartments((prev) => prev.filter((dept) => dept.id !== departmentId))
  }

  const handleCheckInSettingsSave = (newSettings: CheckInSettings) => {
    setCheckInSettings(newSettings)
  }

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />
  }

  // Calculate stats
  const allEmployees = mongoEmployees.length > 0 ? mongoEmployees : employees // Use MongoDB data if available
  const filteredEmployees =
    currentUser.role === "admin" ? allEmployees : allEmployees.filter((emp) => emp.department === currentUser.department)

  const currentMonthRecords = attendanceRecords.filter((record) => record.date.startsWith(selectedMonth))

  const totalEmployees = filteredEmployees.length
  const activeEmployees = new Set(currentMonthRecords.map((r) => r.employeeId)).size
  const totalCheckIns = currentMonthRecords.length

  // Get departments for stats
  const userDepartments =
    currentUser.role === "admin" ? departments : departments.filter((d) => d.name === currentUser.department)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={currentUser} onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-6">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Hệ thống chấm công HomeLee
                </h1>
                <p className="text-gray-600">
                  Chào mừng <span className="font-semibold text-blue-600">{currentUser.name}</span> 
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded-full ml-2">
                    {currentUser.role === "admin" ? "Quản trị viên" : 
                     currentUser.role === "truongphong" ? "Trưởng phòng" : "Nhân viên"}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('vi-VN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Tháng báo cáo: {new Date(selectedMonth + "-01").toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      {currentUser.role === "admin" ? "Tổng nhân viên" : "Nhân viên phòng"}
                    </p>
                    <p className="text-xs text-blue-600">{currentUser.role === "admin" ? "Toàn công ty" : currentUser.department}</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-blue-900">{totalEmployees}</p>
                {mongoEmployees.length > 0 && (
                  <p className="text-xs text-blue-500 mt-1">
                    📊 MongoDB: {mongoEmployees.length} nhân viên
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-sm">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700">Đã chấm công</p>
                    <p className="text-xs text-green-600">Nhân viên hoạt động</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-green-900">{activeEmployees}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm border border-orange-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-700">Lượt chấm công</p>
                    <p className="text-xs text-orange-600">Tháng hiện tại</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-orange-900">{totalCheckIns}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-sm">
                    <FileSpreadsheet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-700">
                      {currentUser.role === "admin" ? "Phòng ban" : "Báo cáo"}
                    </p>
                    <p className="text-xs text-purple-600">
                      {currentUser.role === "admin" ? "Đang quản lý" : "Tháng hiện tại"}
                    </p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-purple-900">
                  {currentUser.role === "admin"
                    ? userDepartments.length
                    : `${selectedMonth.split("-")[1]}/${selectedMonth.split("-")[0]}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panels - FIXED LAYOUT */}
        <div className="space-y-6 mb-8">
          
          {/* PRIMARY SECTION: Data Sync (Only for Admin) */}
          {currentUser.role === "admin" && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-blue-900">🔄 Đồng Bộ Dữ Liệu ZKTeco</h2>
                  <p className="text-sm text-blue-700">Lấy dữ liệu từ máy chấm công và lưu vào MongoDB (CHÍNH)</p>
                </div>
              </div>
              <DataSyncManager />
            </div>
          )}

          {/* SECONDARY SECTION: Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* Time Selection Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">📅 Thời Gian Báo Cáo</h3>
                  <p className="text-xs text-gray-500">Chọn tháng để xem</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Tháng báo cáo:
                  </label>
                  <input
                    id="month-select"
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  📊 Hiển thị: {new Date(selectedMonth + "-01").toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Management Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">⚙️ Quản Lý Hệ Thống</h3>
                  <p className="text-xs text-gray-500">Cấu hình và quản lý</p>
                </div>
              </div>
              <div className="space-y-3">
                {currentUser.role === "admin" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDepartmentManagement(true)}
                      className="w-full justify-start gap-2 h-10"
                    >
                      <Building2 className="w-4 h-4" />
                      Quản lý phòng ban
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEmployeeManagement(true)}
                      className="w-full justify-start gap-2 h-10"
                    >
                      <UserPlus className="w-4 h-4" />
                      Quản lý nhân sự
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCheckInSettingsManagement(true)}
                      className="w-full justify-start gap-2 h-10"
                    >
                      <Clock className="w-4 h-4" />
                      Cấu hình giờ làm việc
                    </Button>
                  </>
                )}
                {currentUser.role === "truongphong" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEmployeeManagement(true)}
                    className="w-full justify-start gap-2 h-10"
                  >
                    <UserPlus className="w-4 h-4" />
                    Quản lý nhân viên
                  </Button>
                )}
                {(currentUser.role === "admin" || currentUser.role === "truongphong") && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                      Quyền {currentUser.role === "admin" ? "quản trị viên" : "trưởng phòng"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Legacy Import Panel - Collapsed by default */}
            <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800">🔧 Import Khác</h3>
                  <p className="text-xs text-yellow-600">Dự phòng hoặc thủ công</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-yellow-700 bg-yellow-100 p-3 rounded-lg">
                  <p className="font-medium mb-1">⚠️ Lưu ý:</p>
                  <p className="text-xs">Khuyến nghị dùng "Đồng Bộ ZKTeco" ở trên thay vì import thủ công.</p>
                </div>
                
                {/* Uncomment if need legacy import */}
                {/* 
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-yellow-700 hover:text-yellow-800">
                    🔽 Hiện tùy chọn import cũ
                  </summary>
                  <div className="mt-3 pt-3 border-t border-yellow-200">
                    <XMLImporter
                      onImport={handleXMLImport}
                      user={currentUser}
                      departments={departments}
                      checkInSettings={checkInSettings}
                    />
                  </div>
                </details>
                */}
                
                <p className="text-xs text-yellow-600 italic">
                  💡 Import XML và ZK cũ đã được thay thế bằng DataSync ở trên
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Data Status and Attendance Table */}
        {allEmployees.length === 0 ? (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Chưa có dữ liệu nhân viên
                </h3>
                <p className="text-yellow-700 mb-4">
                  Để bắt đầu sử dụng hệ thống chấm công, bạn cần có dữ liệu nhân viên trong hệ thống.
                </p>
                <div className="space-y-2 text-sm text-yellow-700">
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    Import dữ liệu từ máy chấm công ZKTeco
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    Import file XML từ hệ thống cũ
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    Thêm nhân viên thủ công qua chức năng quản lý
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Bảng chấm công</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Dữ liệu chấm công tháng {new Date(selectedMonth + "-01").toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{activeEmployees} đã chấm công</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{totalCheckIns} lượt check-in</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              {/* Debug info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-blue-800">🔍 DEBUG INFO:</h3>
                <div className="text-sm text-blue-700">
                  <div>currentUser: {currentUser?.name} ({currentUser?.role})</div>
                  <div>allEmployees: {allEmployees.length}</div>
                  <div>mongoEmployees: {mongoEmployees.length}</div>
                  <div>attendanceRecords: {attendanceRecords.length}</div>
                  <div>selectedMonth: {selectedMonth}</div>
                </div>
              </div>
              
              <AttendanceTable
                employees={allEmployees}
                attendanceRecords={attendanceRecords}
                bonusPoints={[]} // TODO: Load from MongoDB API instead of localStorage
                customDailyValues={[]} // TODO: Load from MongoDB API instead of localStorage  
                selectedMonth={selectedMonth}
                user={currentUser}
                onBonusPointUpdate={handleBonusPointUpdate}
                onCustomValueUpdate={handleCustomValueUpdate}
                onEmployeeUpdate={handleEmployeeUpdate}
              />
            </div>
          </div>
        )}

        {/* Department Management Modal */}
        {showDepartmentManagement && currentUser.role === "admin" && (
          <DepartmentManagement
            departments={departments}
            employees={employees}
            users={[]} // TODO: Fetch from MongoDB API
            onClose={() => setShowDepartmentManagement(false)}
            onDepartmentAdd={handleDepartmentAdd}
            onDepartmentUpdate={handleDepartmentUpdate}
            onDepartmentDelete={handleDepartmentDelete}
            currentUser={currentUser}
          />
        )}

        {/* Employee Management Modal */}
        {showEmployeeManagement && (
          <EmployeeManagement
            employees={employees}
            users={[]} // TODO: Fetch from MongoDB API
            departments={departments}
            currentUser={currentUser}
            onClose={() => setShowEmployeeManagement(false)}
            onEmployeeAdd={handleEmployeeAdd}
            onEmployeeUpdate={handleEmployeeUpdate}
            onEmployeeDelete={handleEmployeeDelete}
            onUserAdd={handleUserAdd}
            onUserUpdate={handleUserUpdate}
            onUserDelete={handleUserDelete}
          />
        )}

        {/* Check-in Settings Management Modal */}
        {showCheckInSettingsManagement && currentUser.role === "admin" && (
          <CheckInSettingsManagement
            currentSettings={checkInSettings}
            onSave={handleCheckInSettingsSave}
            onClose={() => setShowCheckInSettingsManagement(false)}
          />
        )}
      </div>
    </div>
  )
}
