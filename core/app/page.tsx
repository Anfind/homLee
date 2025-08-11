"use client"

import { useState } from "react"
import { AttendanceTable } from "@/components/attendance-table"
import { LoginForm } from "@/components/login-form"
import { Header } from "@/components/header"
import { XMLImporter } from "@/components/xml-importer"
import { EmployeeManagement } from "@/components/employee-management"
import { DepartmentManagement } from "@/components/department-management"
import { CheckInSettingsManagement } from "@/components/check-in-settings-management"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Calendar, Users, TrendingUp, FileSpreadsheet, UserPlus, Building2, Clock } from "lucide-react"
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

export interface User {
  username: string
  password: string
  role: "admin" | "truongphong"
  department?: string
  name: string
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

// Danh sách tài khoản mặc định với các tài khoản demo
const defaultUsers: User[] = [
  {
    username: "admin",
    password: "admin123",
    role: "admin",
    name: "Quản trị viên hệ thống",
  },
  {
    username: "thao",
    password: "thao123",
    role: "truongphong",
    name: "TP Thảo",
    department: "Phòng Kinh doanh",
  },
  {
    username: "minh",
    password: "minh123",
    role: "truongphong",
    name: "Trưởng phòng Minh",
    department: "Phòng Kỹ thuật",
  },
  {
    username: "demo",
    password: "demo123",
    role: "truongphong",
    name: "Demo User",
    department: "Phòng Hành chính",
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
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>("currentUser", null)
  const [users, setUsers] = useLocalStorage<User[]>("users", defaultUsers)
  const [departments, setDepartments] = useLocalStorage<Department[]>("departments", initialDepartments)
  const [employees, setEmployees] = useLocalStorage<Employee[]>("employees", initialEmployees)
  const [attendanceRecords, setAttendanceRecords] = useLocalStorage<AttendanceRecord[]>("attendanceRecords", [])
  const [bonusPoints, setBonusPoints] = useLocalStorage<BonusPoint[]>("bonusPoints", [])
  const [customDailyValues, setCustomDailyValues] = useLocalStorage<CustomDailyValue[]>("customDailyValues", []) // New state for custom values
  const [checkInSettings, setCheckInSettings] = useLocalStorage<CheckInSettings>(
    "checkInSettings",
    defaultCheckInSettings,
  )
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [showEmployeeManagement, setShowEmployeeManagement] = useState(false)
  const [showDepartmentManagement, setShowDepartmentManagement] = useState(false)
  const [showCheckInSettingsManagement, setShowCheckInSettingsManagement] = useState(false)

  const handleLogin = (userData: User) => {
    setCurrentUser(userData)
  }

  const handleLogout = () => {
    setCurrentUser(null)
  }

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

  const handleUserAdd = (user: User) => {
    setUsers((prev) => [...prev, user])
  }

  const handleUserUpdate = (updatedUser: User) => {
    setUsers((prev) => prev.map((user) => (user.username === updatedUser.username ? updatedUser : user)))
  }

  const handleUserDelete = (username: string) => {
    setUsers((prev) => prev.filter((user) => user.username !== username))
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
    // Xóa tài khoản trưởng phòng thuộc phòng ban này
    setUsers((prev) => prev.filter((user) => user.department !== department.name))
    // Xóa phòng ban
    setDepartments((prev) => prev.filter((dept) => dept.id !== departmentId))
  }

  const handleCheckInSettingsSave = (newSettings: CheckInSettings) => {
    setCheckInSettings(newSettings)
  }

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} users={users} />
  }

  // Calculate stats
  const filteredEmployees =
    currentUser.role === "admin" ? employees : employees.filter((emp) => emp.department === currentUser.department)

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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {currentUser.role === "admin" ? "Tổng nhân viên" : "Nhân viên phòng"}
                </p>
                <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Đã chấm công</p>
                <p className="text-2xl font-bold text-gray-900">{activeEmployees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Lượt chấm công</p>
                <p className="text-2xl font-bold text-gray-900">{totalCheckIns}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {currentUser.role === "admin" ? `${userDepartments.length} phòng ban` : "Tháng hiện tại"}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentUser.role === "admin"
                    ? userDepartments.length
                    : `${selectedMonth.split("-")[1]}/${selectedMonth.split("-")[0]}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Bảng chấm công</h2>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <label htmlFor="month-select" className="text-sm font-medium text-gray-700">
                  Tháng:
                </label>
                <input
                  id="month-select"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentUser.role === "admin" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDepartmentManagement(true)}
                    className="flex items-center gap-2"
                  >
                    <Building2 className="w-4 h-4" />
                    Quản lý phòng ban
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEmployeeManagement(true)}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Quản lý nhân sự
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCheckInSettingsManagement(true)}
                    className="flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Cấu hình giờ
                  </Button>
                </>
              )}
              {currentUser.role === "truongphong" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEmployeeManagement(true)}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Quản lý nhân viên
                </Button>
              )}
              <XMLImporter
                onImport={handleXMLImport}
                user={currentUser}
                departments={departments}
                checkInSettings={checkInSettings}
              />
            </div>
          </div>
        </div>

        {/* Show message if no employees */}
        {employees.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800">
                <strong>Chưa có dữ liệu nhân viên.</strong> Vui lòng import file XML hoặc thêm nhân viên thủ công để tạo
                danh sách nhân viên và dữ liệu chấm công.
              </p>
            </div>
          </div>
        )}

        {/* Attendance Table */}
        {employees.length > 0 && (
          <AttendanceTable
            employees={employees}
            attendanceRecords={attendanceRecords}
            bonusPoints={bonusPoints}
            customDailyValues={customDailyValues} // Pass custom values
            selectedMonth={selectedMonth}
            user={currentUser}
            onBonusPointUpdate={handleBonusPointUpdate}
            onCustomValueUpdate={handleCustomValueUpdate} // Pass custom value update handler
            onEmployeeUpdate={handleEmployeeUpdate} // Pass employee update handler
          />
        )}

        {/* Department Management Modal */}
        {showDepartmentManagement && currentUser.role === "admin" && (
          <DepartmentManagement
            departments={departments}
            employees={employees}
            users={users}
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
            users={users}
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
