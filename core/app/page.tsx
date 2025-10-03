"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { AttendanceTable } from "@/components/attendance-table"
import { LoginForm, UserType } from "@/components/login-form"
import { Header } from "@/components/header"
import { XMLImporter } from "@/components/xml-importer"
import { XMLImportManager } from "@/components/xml-import-manager"
import { EmployeeManagement } from "@/components/employee-management"
import { DepartmentManagement } from "@/components/department-management"
import { CheckInSettingsManagement } from "@/components/check-in-settings-management"
import { ShiftInfoPanel } from "@/components/shift-info-panel"
import DataSyncManager from "@/components/data-sync-manager"
// Removed useLocalStorage - now using MongoDB only
import { Calendar, Users, TrendingUp, FileSpreadsheet, UserPlus, Building2, Clock, Download, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface Employee {
  id: string
  _id?: string // MongoDB primary key (optional for compatibility)
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
  employeeId: string | {
    _id: string
    name: string
    department: string
    id: string
  }
  date: string
  points: number
  editedBy: string
  editedAt: string
  previousValue: number
}

export interface PaginationData {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
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

// Initial data - for reference only, actual data comes from MongoDB
const initialEmployees: Employee[] = []
const initialDepartments: Department[] = []

// NEW: Default check-in settings for each day of the week with shifts
const defaultCheckInSettings: CheckInSettings = {
  0: {
    // Sunday - Special timing
    shifts: [
      { id: "sun-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "08:45", points: 1 },
      { id: "sun-shift-2", name: "Ca chiều", startTime: "13:30", endTime: "14:45", points: 1 },
    ],
  },
  1: {
    // Monday
    shifts: [
      { id: "mon-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "07:45", points: 1 },
      { id: "mon-shift-2", name: "Ca chiều", startTime: "13:30", endTime: "14:00", points: 1 },
    ],
  },
  2: {
    // Tuesday
    shifts: [
      { id: "tue-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "07:45", points: 1 },
      { id: "tue-shift-2", name: "Ca chiều", startTime: "13:30", endTime: "14:00", points: 1 },
    ],
  },
  3: {
    // Wednesday
    shifts: [
      { id: "wed-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "07:45", points: 1 },
      { id: "wed-shift-2", name: "Ca chiều", startTime: "13:30", endTime: "14:00", points: 1 },
    ],
  },
  4: {
    // Thursday
    shifts: [
      { id: "thu-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "07:45", points: 1 },
      { id: "thu-shift-2", name: "Ca chiều", startTime: "13:30", endTime: "14:00", points: 1 },
    ],
  },
  5: {
    // Friday
    shifts: [
      { id: "fri-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "07:45", points: 1 },
      { id: "fri-shift-2", name: "Ca chiều", startTime: "13:30", endTime: "14:00", points: 1 },
    ],
  },
  6: {
    // Saturday
    shifts: [
      { id: "sat-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "07:45", points: 1 },
      { id: "sat-shift-2", name: "Ca chiều", startTime: "13:30", endTime: "14:00", points: 1 },
    ],
  },
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  
  // MIGRATED: All data now uses MongoDB instead of localStorage
  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Employee[]>([]) // MongoDB employees only
  const [users, setUsers] = useState<UserType[]>([]) // MongoDB users
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [bonusPoints, setBonusPoints] = useState<BonusPoint[]>([])
  const [customDailyValues, setCustomDailyValues] = useState<CustomDailyValue[]>([])
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 40,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false)
  const [checkInSettings, setCheckInSettings] = useState<CheckInSettings>(defaultCheckInSettings)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Use current month (August 2025) where we have real data
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    // Use March 2025 where we have sample data
    // return "2025-03"
  })
  const [showEmployeeManagement, setShowEmployeeManagement] = useState(false)
  const [showDepartmentManagement, setShowDepartmentManagement] = useState(false)
  const [showCheckInSettingsManagement, setShowCheckInSettingsManagement] = useState(false)
  const [showXMLImport, setShowXMLImport] = useState(false)

  // Load ALL MongoDB data on component mount
  useEffect(() => {
    const fetchMongoData = async () => {
      try {
        // Load employees from MongoDB
        const employeesResponse = await fetch('/api/employees')
        const employeesResult = await employeesResponse.json()
        if (employeesResult.success) {
          setEmployees(employeesResult.data)
          console.log(`✅ Loaded ${employeesResult.data.length} employees from MongoDB`)
        }

        // Load departments from MongoDB
        const departmentsResponse = await fetch('/api/departments')
        const departmentsResult = await departmentsResponse.json()
        if (departmentsResult.success) {
          setDepartments(departmentsResult.data)
          console.log(`✅ Loaded ${departmentsResult.data.length} departments from MongoDB`)
          
          // Auto-seed if no departments exist
          if (departmentsResult.data.length === 0) {
            console.log('🌱 No departments found, seeding initial data...')
            const seedResponse = await fetch('/api/seed-data', { method: 'POST' })
            const seedResult = await seedResponse.json()
            if (seedResult.success) {
              console.log('✅ Initial data seeded successfully')
              // Reload departments after seeding
              const newDepartmentsResponse = await fetch('/api/departments')
              const newDepartmentsResult = await newDepartmentsResponse.json()
              if (newDepartmentsResult.success) {
                setDepartments(newDepartmentsResult.data)
                console.log(`✅ Loaded ${newDepartmentsResult.data.length} departments after seeding`)
              }
            }
          }
        }

        // Load users from MongoDB
        const usersResponse = await fetch('/api/users')
        const usersResult = await usersResponse.json()
        if (usersResult.success) {
          setUsers(usersResult.data)
          console.log(`✅ Loaded ${usersResult.data.length} users from MongoDB`)
        } else {
          console.log('❌ Failed to load users:', usersResult)
        }

        // Load ALL attendance records from MongoDB for the selected month (no pagination)
        console.log(`🔄 Fetching ALL attendance records for month: ${selectedMonth}`)
        const attendanceResponse = await fetch(`/api/attendance?month=${selectedMonth}`)
        console.log(`📡 Attendance API response status:`, attendanceResponse.status)
        
        const attendanceResult = await attendanceResponse.json()
        console.log(`📋 Attendance API result:`, attendanceResult)
        
        if (attendanceResult.success) {
          setAttendanceRecords(attendanceResult.data)
          // Reset pagination since we're doing client-side pagination now
          setPagination({
            page: 1,
            limit: attendanceResult.data.length,
            totalCount: attendanceResult.data.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false
          })
          console.log(`✅ Loaded ALL ${attendanceResult.data.length} attendance records from MongoDB for ${selectedMonth}`)
          console.log('📋 Sample attendance records:', attendanceResult.data.slice(0, 3))
          
          // Debug: Check if employees match attendance records
          if (attendanceResult.data.length > 0) {
            const attendanceEmployeeIds = [...new Set(attendanceResult.data.map((r: AttendanceRecord) => r.employeeId))]
            console.log('👥 Attendance Employee IDs:', attendanceEmployeeIds.slice(0, 10))
            console.log('👥 MongoDB Employee IDs:', employeesResult.data?.slice(0, 10).map((e: Employee) => e.id || e._id))
            
            // Check for matches
            const matches = attendanceEmployeeIds.filter(aId => 
              employeesResult.data?.some((emp: Employee) => emp.id === aId || emp._id === aId)
            )
            console.log(`🔗 Employee ID matches: ${matches.length}/${attendanceEmployeeIds.length}`)
          }
        } else {
          console.log('❌ Failed to load attendance records:', attendanceResult)
        }

        // Load bonus points from MongoDB for the selected month
        const bonusPointsResponse = await fetch(`/api/bonus-points?month=${selectedMonth}`)
        const bonusPointsResult = await bonusPointsResponse.json()
        if (bonusPointsResult.success) {
          setBonusPoints(bonusPointsResult.data)
          console.log(`✅ Loaded ${bonusPointsResult.data.length} bonus points from MongoDB`)
        }

        // Load custom daily values from MongoDB for the selected month
        const customValuesResponse = await fetch(`/api/custom-daily-values?month=${selectedMonth}`)
        const customValuesResult = await customValuesResponse.json()
        if (customValuesResult.success) {
          setCustomDailyValues(customValuesResult.data)
          console.log(`✅ Loaded ${customValuesResult.data.length} custom daily values from MongoDB`)
        }

        // Load check-in settings from MongoDB
        const settingsResponse = await fetch('/api/check-in-settings')
        const settingsResult = await settingsResponse.json()
        if (settingsResult.success) {
          setCheckInSettings(settingsResult.data)
          console.log(`✅ Loaded check-in settings from MongoDB`)
        } else {
          console.log('⚠️ Failed to load check-in settings, using defaults')
          // Keep default settings if MongoDB load fails
        }
      } catch (error) {
        console.error('Error loading MongoDB data:', error)
      } finally {
        setIsLoadingAttendance(false)
      }
    }
    
    if (currentUser) {
      fetchMongoData()
    }
  }, [currentUser, selectedMonth])

  // Pagination handlers
  const loadAttendancePage = async (page: number) => {
    try {
      setIsLoadingAttendance(true)
      console.log(`🔄 Loading attendance page ${page}...`)
      
      const attendanceResponse = await fetch(`/api/attendance?month=${selectedMonth}&page=${page}&limit=${pagination.limit}`)
      const attendanceResult = await attendanceResponse.json()
      
      if (attendanceResult.success) {
        setAttendanceRecords(attendanceResult.data)
        setPagination(attendanceResult.pagination)
        console.log(`✅ Loaded page ${page}/${attendanceResult.pagination.totalPages} (${attendanceResult.data.length} records)`)
        
        // Also reload bonus points and custom daily values for the month (no pagination needed)
        const bonusPointsResponse = await fetch(`/api/bonus-points?month=${selectedMonth}`)
        const bonusPointsResult = await bonusPointsResponse.json()
        if (bonusPointsResult.success) {
          setBonusPoints(bonusPointsResult.data)
          console.log(`✅ Reloaded ${bonusPointsResult.data.length} bonus points`)
        }

        const customValuesResponse = await fetch(`/api/custom-daily-values?month=${selectedMonth}`)
        const customValuesResult = await customValuesResponse.json()
        if (customValuesResult.success) {
          setCustomDailyValues(customValuesResult.data)
          console.log(`✅ Reloaded ${customValuesResult.data.length} custom daily values`)
        }
      }
    } catch (error) {
      console.error('Error loading attendance page:', error)
    } finally {
      setIsLoadingAttendance(false)
    }
  }

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      loadAttendancePage(pagination.page + 1)
    }
  }

  const handlePrevPage = () => {
    if (pagination.hasPrevPage) {
      loadAttendancePage(pagination.page - 1)
    }
  }

  const handlePageSelect = (page: number) => {
    if (page !== pagination.page && page >= 1 && page <= pagination.totalPages) {
      loadAttendancePage(page)
    }
  }

  // Handle month change with pagination reset
  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to page 1
  }

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

  // Function để refresh attendance data
  const refreshAttendanceData = async () => {
    try {
      setIsLoadingAttendance(true)
      
      // Load ALL attendance records from MongoDB for the selected month (no pagination)
      console.log(`🔄 Refreshing attendance records for month: ${selectedMonth}`)
      const attendanceResponse = await fetch(`/api/attendance?month=${selectedMonth}`)
      
      if (attendanceResponse.ok) {
        const attendanceResult = await attendanceResponse.json()
        if (attendanceResult.success) {
          setAttendanceRecords(attendanceResult.data)
          console.log(`✅ Refreshed ${attendanceResult.data.length} attendance records`)
        }
      }
      
      // Also refresh bonus points
      const bonusPointsResponse = await fetch(`/api/bonus-points?month=${selectedMonth}`)
      if (bonusPointsResponse.ok) {
        const bonusPointsResult = await bonusPointsResponse.json()
        if (bonusPointsResult.success) {
          setBonusPoints(bonusPointsResult.data)
        }
      }
    } catch (error) {
      console.error('Error refreshing attendance data:', error)
    } finally {
      setIsLoadingAttendance(false)
    }
  }

  const handleXMLImport = (records: AttendanceRecord[], newEmployees: Employee[]) => {
    // Cập nhật danh sách nhân sự (kiểm tra trùng)
    setEmployees((prevEmployees) => {
      const updatedEmployees = [...prevEmployees]

      newEmployees.forEach((newEmp) => {
        const existingIndex = updatedEmployees.findIndex((emp) => emp.id === newEmp.id)
        if (existingIndex >= 0) {
          // Cập nhật thông tin nhân sự hiện có
          updatedEmployees[existingIndex] = { ...updatedEmployees[existingIndex], ...newEmp }
        } else {
          // Thêm nhân sự mới
          updatedEmployees.push(newEmp)
        }
      })

      return updatedEmployees
    })

    // Cập nhật bản ghi điểm danh
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

  const handleBonusPointUpdate = async (employeeId: string, date: string, points: number) => {
    if (!currentUser) return
    if (currentUser.role !== "admin") {
      console.warn('Chỉ admin mới được phép chỉnh sửa điểm')
      return
    }

    try {
      const response = await fetch('/api/bonus-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          date,
          points,
          editedBy: currentUser.username,
          reason: 'Manual adjustment from UI'
        })
      })

      const result = await response.json()
      if (result.success) {
        // Reload bonus points for current month
        const bonusPointsResponse = await fetch(`/api/bonus-points?month=${selectedMonth}`)
        const bonusPointsResult = await bonusPointsResponse.json()
        if (bonusPointsResult.success) {
          setBonusPoints(bonusPointsResult.data)
          console.log(`✅ Updated bonus points for employee ${employeeId}`)
        }
      } else {
        console.error('Failed to update bonus points:', result.message)
      }
    } catch (error) {
      console.error('Error updating bonus points:', error)
    }
  }

  // New handler for custom daily values
  const handleCustomValueUpdate = async (employeeId: string, date: string, columnKey: string, value: string) => {
    if (!currentUser) return
    if (currentUser.role !== "admin") {
      console.warn('Chỉ admin mới được phép chỉnh sửa điểm')
      return
    }

    try {
      const response = await fetch('/api/custom-daily-values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          date,
          columnKey,
          value,
          editedBy: currentUser.username
        })
      })

      const result = await response.json()
      if (result.success) {
        // Reload custom daily values for current month
        const customValuesResponse = await fetch(`/api/custom-daily-values?month=${selectedMonth}`)
        const customValuesResult = await customValuesResponse.json()
        if (customValuesResult.success) {
          setCustomDailyValues(customValuesResult.data)
          console.log(`✅ Updated custom value for employee ${employeeId}`)
        }
      } else {
        console.error('Failed to update custom value:', result.message)
      }
    } catch (error) {
      console.error('Error updating custom value:', error)
    }
  }

  const handleEmployeeAdd = async (employee: Employee) => {
    try {
      // Optimistic update: Add employee to state immediately
      setEmployees(prev => [...prev, employee])
      
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee)
      })

      const result = await response.json()
      if (result.success) {
        // Update with actual data from server (in case server modified anything)
        setEmployees(prev => prev.map(emp => emp.id === employee.id ? result.data : emp))
        console.log(`✅ Added employee: ${employee.name}`)
      } else {
        // Rollback optimistic update on error
        setEmployees(prev => prev.filter(emp => emp.id !== employee.id))
        console.error('Failed to add employee:', result.error)
        alert(`Lỗi thêm nhân sự: ${result.error}`)
      }
    } catch (error) {
      // Rollback optimistic update on error
      setEmployees(prev => prev.filter(emp => emp.id !== employee.id))
      console.error('Error adding employee:', error)
      alert('Lỗi kết nối khi thêm nhân sự')
    }
  }

  const handleEmployeeUpdate = async (updatedEmployee: Employee) => {
    try {
      // Store original employee for rollback
      const originalEmployee = employees.find(emp => emp.id === updatedEmployee.id)
      
      // Optimistic update: Update employee in state immediately
      setEmployees(prev => prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp))
      
      const response = await fetch(`/api/employees`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEmployee)
      })

      const result = await response.json()
      if (result.success) {
        // Update with actual data from server
        setEmployees(prev => prev.map(emp => emp.id === updatedEmployee.id ? result.data : emp))
        console.log(`✅ Updated employee: ${updatedEmployee.name}`)
      } else {
        // Rollback optimistic update on error
        if (originalEmployee) {
          setEmployees(prev => prev.map(emp => emp.id === updatedEmployee.id ? originalEmployee : emp))
        }
        console.error('Failed to update employee:', result.error)
        alert(`Lỗi cập nhật nhân sự: ${result.error}`)
      }
    } catch (error) {
      // Rollback optimistic update on error
      const originalEmployee = employees.find(emp => emp.id === updatedEmployee.id)
      if (originalEmployee) {
        setEmployees(prev => prev.map(emp => emp.id === updatedEmployee.id ? originalEmployee : emp))
      }
      console.error('Error updating employee:', error)
      alert('Lỗi kết nối khi cập nhật nhân sự')
    }
  }

  const handleEmployeeDelete = async (employeeId: string) => {
    try {
      const response = await fetch(`/api/employees?id=${employeeId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        // Reload employees and related data
        const employeesResponse = await fetch('/api/employees')
        const employeesResult = await employeesResponse.json()
        if (employeesResult.success) {
          setEmployees(employeesResult.data)
          console.log(`✅ Deleted employee: ${employeeId}`)
        }

        // Reload attendance records and bonus points for current month
        const attendanceResponse = await fetch(`/api/attendance?month=${selectedMonth}`)
        const attendanceResult = await attendanceResponse.json()
        if (attendanceResult.success) {
          setAttendanceRecords(attendanceResult.data)
        }

        const bonusPointsResponse = await fetch(`/api/bonus-points?month=${selectedMonth}`)
        const bonusPointsResult = await bonusPointsResponse.json()
        if (bonusPointsResult.success) {
          setBonusPoints(bonusPointsResult.data)
        }

        const customValuesResponse = await fetch(`/api/custom-daily-values?month=${selectedMonth}`)
        const customValuesResult = await customValuesResponse.json()
        if (customValuesResult.success) {
          setCustomDailyValues(customValuesResult.data)
        }
      } else {
        console.error('Failed to delete employee:', result.message)
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
    }
  }

  // User management handlers
  const handleUserAdd = async (user: UserType) => {
    try {
      // Optimistic update: Add user to state immediately
      setUsers(prev => [...prev, user])
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      })

      const result = await response.json()
      if (result.success) {
        // Update with actual data from server
        setUsers(prev => prev.map(u => u.username === user.username ? result.data : u))
        console.log(`✅ Added user: ${user.username}`)
      } else {
        // Rollback optimistic update on error
        setUsers(prev => prev.filter(u => u.username !== user.username))
        console.error('Failed to add user:', result.error)
        alert(`Lỗi thêm tài khoản: ${result.error}`)
      }
    } catch (error) {
      // Rollback optimistic update on error
      setUsers(prev => prev.filter(u => u.username !== user.username))
      console.error('Error adding user:', error)
      alert('Lỗi kết nối khi thêm tài khoản')
    }
  }

  const handleUserUpdate = async (updatedUser: UserType) => {
    try {
      // Store original user for rollback
      const originalUser = users.find(u => u.username === updatedUser.username)
      
      // Optimistic update: Update user in state immediately
      const finalUsername = updatedUser.newUsername || updatedUser.username
      const optimisticUser = { ...updatedUser, username: finalUsername, newUsername: undefined }
      setUsers(prev => prev.map(u => u.username === updatedUser.username ? optimisticUser : u))
      
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      })

      const result = await response.json()
      if (result.success) {
        // Update with actual data from server
        setUsers(prev => prev.map(u => 
          u.username === finalUsername ? result.data : u
        ))
        console.log(`✅ Updated user: ${updatedUser.username}${updatedUser.newUsername ? ` → ${updatedUser.newUsername}` : ''}`)
        
        if (updatedUser.newUsername) {
          alert(`✅ Đã cập nhật tài khoản thành công!\n\n📝 Tên đăng nhập: ${updatedUser.username} → ${updatedUser.newUsername}\n👤 Tên hiển thị: ${updatedUser.name}\n🏢 Vai trò: ${updatedUser.role}`)
        }
      } else {
        // Rollback optimistic update on error
        if (originalUser) {
          setUsers(prev => prev.map(u => u.username === finalUsername ? originalUser : u))
        }
        console.error('Failed to update user:', result.error)
        alert(`Lỗi cập nhật tài khoản: ${result.error}`)
      }
    } catch (error) {
      // Rollback optimistic update on error
      const originalUser = users.find(u => u.username === updatedUser.username)
      if (originalUser) {
        setUsers(prev => prev.map(u => u.username === (updatedUser.newUsername || updatedUser.username) ? originalUser : u))
      }
      console.error('Error updating user:', error)
      alert('Lỗi kết nối khi cập nhật tài khoản')
    }
  }

  const handleUserDelete = async (username: string) => {
    try {
      // Store original user for rollback
      const originalUser = users.find(u => u.username === username)
      
      // Optimistic update: Remove user from state immediately
      setUsers(prev => prev.filter(u => u.username !== username))
      
      const response = await fetch(`/api/users?username=${username}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        console.log(`✅ Deleted user: ${username}`)
      } else {
        // Rollback optimistic update on error
        if (originalUser) {
          setUsers(prev => [...prev, originalUser])
        }
        console.error('Failed to delete user:', result.error)
        alert(`Lỗi xóa tài khoản: ${result.error}`)
      }
    } catch (error) {
      // Rollback optimistic update on error
      const originalUser = users.find(u => u.username === username)
      if (originalUser) {
        setUsers(prev => [...prev, originalUser])
      }
      console.error('Error deleting user:', error)
      alert('Lỗi kết nối khi xóa tài khoản')
    }
  }

  const handleDepartmentAdd = async (department: Department) => {
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: department.name,
          createdBy: currentUser?.username || 'system'
        })
      })

      const result = await response.json()
      if (result.success) {
        // Auto-create user account for the new department
        const departmentName = department.name.trim()
        const username = departmentName.toLowerCase()
          .replace(/\s+/g, '') // Remove spaces
          .replace(/[^a-z0-9]/g, '') // Remove special characters
          .substring(0, 20) // Limit to 20 characters
        
        const defaultPassword = `${username}123` // Default password pattern
        
        try {
          const userResponse = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: username,
              password: defaultPassword,
              name: `Quản lý ${departmentName}`,
              role: 'truongphong',
              department: departmentName
            })
          })

          const userResult = await userResponse.json()
          if (userResult.success) {
            console.log(`✅ Auto-created user account: ${username} for department: ${departmentName}`)
            alert(`🎉 Đã tạo phòng ban "${departmentName}" và tài khoản quản lý:\n\n👤 Tên đăng nhập: ${username}\n🔑 Mật khẩu: ${defaultPassword}\n\n⚠️ Hãy thông báo cho trưởng phòng đổi mật khẩu sau lần đăng nhập đầu tiên!`)
            
            // Reload users
            const usersResponse = await fetch('/api/users')
            const usersResult = await usersResponse.json()
            if (usersResult.success) {
              setUsers(usersResult.data)
            }
          } else {
            console.warn('Failed to auto-create user:', userResult.error)
            alert(`⚠️ Đã tạo phòng ban "${departmentName}" thành công nhưng không thể tự động tạo tài khoản quản lý.\n\nLỗi: ${userResult.error}\n\nBạn có thể tạo tài khoản thủ công trong mục "Quản lý nhân sự".`)
          }
        } catch (userError) {
          console.warn('Error auto-creating user:', userError)
          alert(`⚠️ Đã tạo phòng ban "${departmentName}" thành công nhưng không thể tự động tạo tài khoản quản lý.\n\nBạn có thể tạo tài khoản thủ công trong mục "Quản lý nhân sự".`)
        }

        // Reload departments
        const departmentsResponse = await fetch('/api/departments')
        const departmentsResult = await departmentsResponse.json()
        if (departmentsResult.success) {
          setDepartments(departmentsResult.data)
          console.log(`✅ Added department: ${department.name}`)
        }
      } else {
        console.error('Failed to add department:', result.message)
        alert(`❌ Lỗi tạo phòng ban: ${result.message}`)
      }
    } catch (error) {
      console.error('Error adding department:', error)
      alert('❌ Lỗi kết nối khi tạo phòng ban')
    }
  }

  const handleDepartmentUpdate = async (updatedDepartment: Department) => {
    try {
      // First, get the original department name before updating
      const originalDepartment = departments.find(d => d.id === updatedDepartment.id)
      const originalName = originalDepartment?.name
      const newName = updatedDepartment.name.trim()

      if (!originalName) {
        console.error('Cannot find original department')
        return
      }

      // Update department
      const response = await fetch('/api/departments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updatedDepartment.id,
          name: newName,
          isActive: true
        })
      })

      const result = await response.json()
      if (result.success) {
        console.log(`✅ Updated department: ${originalName} → ${newName}`)

        // Auto-update all employees in this department
        const employeesInDepartment = employees.filter(emp => 
          emp.department && originalName && 
          emp.department.toLowerCase().trim() === originalName.toLowerCase().trim()
        )

        if (employeesInDepartment.length > 0) {
          console.log(`🔄 Updating ${employeesInDepartment.length} employees to new department name...`)
          
          const employeeUpdatePromises = employeesInDepartment.map(async (emp) => {
            const updatedEmployee = { ...emp, department: newName }
            const empResponse = await fetch('/api/employees', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedEmployee)
            })
            const empResult = await empResponse.json()
            if (empResult.success) {
              console.log(`  ✅ Updated employee: ${emp.name}`)
            } else {
              console.warn(`  ⚠️ Failed to update employee: ${emp.name}`)
            }
            return empResult
          })

          await Promise.all(employeeUpdatePromises)
        }

        // Auto-update all users in this department
        const usersInDepartment = users.filter(user => 
          user.department && originalName && 
          user.department.toLowerCase().trim() === originalName.toLowerCase().trim()
        )

        if (usersInDepartment.length > 0) {
          console.log(`🔄 Updating ${usersInDepartment.length} users to new department name...`)
          
          const userUpdatePromises = usersInDepartment.map(async (user) => {
            const updatedUser = { ...user, department: newName }
            const userResponse = await fetch('/api/users', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedUser)
            })
            const userResult = await userResponse.json()
            if (userResult.success) {
              console.log(`  ✅ Updated user: ${user.username}`)
            } else {
              console.warn(`  ⚠️ Failed to update user: ${user.username}`)
            }
            return userResult
          })

          await Promise.all(userUpdatePromises)
        }

        // Reload all related data
        const departmentsResponse = await fetch('/api/departments')
        const departmentsResult = await departmentsResponse.json()
        if (departmentsResult.success) {
          setDepartments(departmentsResult.data)
        }

        const employeesResponse = await fetch('/api/employees')
        const employeesResult = await employeesResponse.json()
        if (employeesResult.success) {
          setEmployees(employeesResult.data)
        }

        const usersResponse = await fetch('/api/users')
        const usersResult = await usersResponse.json()
        if (usersResult.success) {
          setUsers(usersResult.data)
        }

        // Show success message
        const totalUpdated = employeesInDepartment.length + usersInDepartment.length
        if (totalUpdated > 0) {
          alert(`🎉 Đã cập nhật phòng ban "${originalName}" → "${newName}"\n\n📊 Tự động cập nhật:\n• ${employeesInDepartment.length} nhân sự\n• ${usersInDepartment.length} tài khoản\n\n✅ Tất cả dữ liệu đã được đồng bộ!`)
        } else {
          alert(`✅ Đã cập nhật tên phòng ban: "${originalName}" → "${newName}"`)
        }

        console.log(`🎯 Department update completed: ${totalUpdated} records updated`)
      } else {
        console.error('Failed to update department:', result.message)
        alert(`❌ Lỗi cập nhật phòng ban: ${result.message}`)
      }
    } catch (error) {
      console.error('Error updating department:', error)
      alert('❌ Lỗi kết nối khi cập nhật phòng ban')
    }
  }

  const handleDepartmentDelete = async (departmentId: string) => {
    try {
      const response = await fetch(`/api/departments?id=${departmentId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        // Reload departments and employees
        const departmentsResponse = await fetch('/api/departments')
        const departmentsResult = await departmentsResponse.json()
        if (departmentsResult.success) {
          setDepartments(departmentsResult.data)
        }

        const employeesResponse = await fetch('/api/employees')
        const employeesResult = await employeesResponse.json()
        if (employeesResult.success) {
          setEmployees(employeesResult.data)
        }

        console.log(`✅ Deleted department: ${departmentId}`)
      } else {
        console.error('Failed to delete department:', result.message)
      }
    } catch (error) {
      console.error('Error deleting department:', error)
    }
  }

  const handleCheckInSettingsSave = async (newSettings: CheckInSettings) => {
    try {
      // Send each day's settings separately to the API
      const updatePromises = Object.keys(newSettings).map(async (dayIndexStr) => {
        const dayOfWeek = Number.parseInt(dayIndexStr)
        const daySettings = newSettings[dayOfWeek]
        
        const response = await fetch('/api/check-in-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dayOfWeek: dayOfWeek,
            shifts: daySettings.shifts,
            updatedBy: currentUser?.username || 'system'
          })
        })

        const result = await response.json()
        if (!result.success) {
          throw new Error(`Day ${dayOfWeek}: ${result.message}`)
        }
        return result
      })

      await Promise.all(updatePromises)
      
      console.log(`🔄 Reloading settings from database to ensure sync...`)
      // Force reload settings from database to ensure sync
      const settingsResponse = await fetch('/api/check-in-settings')
      const settingsResult = await settingsResponse.json()
      if (settingsResult.success) {
        setCheckInSettings(settingsResult.data)
        console.log(`✅ Settings synced successfully with header`)
      } else {
        setCheckInSettings(newSettings) // Fallback to local data
        console.log(`⚠️ Fallback to local settings data`)
      }
      
      setShowCheckInSettingsManagement(false) // Close modal after successful save
      console.log(`✅ Updated and reloaded check-in settings for all days`)
    } catch (error) {
      console.error('Error updating check-in settings:', error)
    }
  }

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />
  }

  // Calculate stats - MongoDB only
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
      <Header user={currentUser} onLogout={handleLogout} checkInSettings={checkInSettings} />

      <div className="container mx-auto px-4 py-6">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 relative">
                  <Image
                    src="/logo_leeHomes.webp"
                    alt="Lee Homes Logo"
                    width={64}
                    height={64}
                    className="object-contain rounded-xl"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Hệ thống điểm danh Lee Homes
                  </h1>
                  <p className="text-gray-600">
                    Chào mừng <span className="font-semibold text-blue-600">{currentUser.name}</span> 
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded-full ml-2">
                      {currentUser.role === "admin" ? "Quản trị viên" : 
                       currentUser.role === "truongphong" ? "Trưởng phòng" : "Nhân sự"}
                    </span>
                  </p>
                </div>
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
                      {currentUser.role === "admin" ? "Tổng nhân sự" : "Nhân sự phòng"}
                    </p>
                    <p className="text-xs text-blue-600">{currentUser.role === "admin" ? "Toàn công ty" : currentUser.department}</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-blue-900">{totalEmployees}</p>
                {employees.length > 0 && (
                  <p className="text-xs text-blue-500 mt-1">
                    📊 MongoDB: {employees.length} nhân sự
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
                    <p className="text-sm font-medium text-green-700">Đã điểm danh</p>
                    <p className="text-xs text-green-600">Nhân sự hoạt động</p>
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
                    <p className="text-sm font-medium text-orange-700">Lượt điểm danh</p>
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
                      {currentUser.role === "admin" ? "Khối/Phòng" : "Báo cáo"}
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
                  <p className="text-sm text-blue-700">Lấy dữ liệu từ máy điểm danh và lưu vào MongoDB (CHÍNH)</p>
                </div>
              </div>
              <DataSyncManager />
            </div>
          )}

          {/* SECONDARY SECTION: Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* Shift Info Panel */}
            <ShiftInfoPanel className="md:col-span-1" checkInSettings={checkInSettings} />
            
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
                    onChange={(e) => handleMonthChange(e.target.value)}
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
                      Quản lý Khối/Phòng
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
                      Thời gian điểm danh
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowXMLImport(true)}
                      className="w-full justify-start gap-2 h-10"
                    >
                      <Download className="w-4 h-4" />
                      Import XML/Excel
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
                    Quản lý nhân sự
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
        {employees.length === 0 ? (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Chưa có dữ liệu nhân sự
                </h3>
                <p className="text-yellow-700 mb-4">
                  Để bắt đầu sử dụng hệ thống điểm danh, bạn cần có dữ liệu nhân sự trong hệ thống.
                </p>
                <div className="space-y-2 text-sm text-yellow-700">
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    Import dữ liệu từ máy điểm danh ZKTeco
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    Import file XML từ hệ thống cũ
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    Thêm nhân sự thủ công qua chức năng quản lý
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
                  <h2 className="text-xl font-semibold text-gray-900">Bảng điểm danh</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Dữ liệu điểm danh tháng {new Date(selectedMonth + "-01").toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{activeEmployees} đã điểm danh</span>
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
                <h3 className="font-bold text-blue-800">🔍 DEBUG INFO (MongoDB Only):</h3>
                <div className="text-sm text-blue-700">
                  <div>currentUser: {currentUser?.name} ({currentUser?.role})</div>
                  <div>employees: {employees.length}</div>
                  <div>departments: {departments.length}</div>
                  <div>attendanceRecords: {attendanceRecords.length}</div>
                  <div>bonusPoints: {bonusPoints.length}</div>
                  <div>customDailyValues: {customDailyValues.length}</div>
                  <div>selectedMonth: {selectedMonth}</div>
                  {bonusPoints.length > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded">
                      <div className="font-medium">Sample Bonus Points:</div>
                      {bonusPoints.slice(0, 3).map((bp, i) => (
                        <div key={i} className="text-xs">
                          {typeof bp.employeeId === 'string' ? bp.employeeId : bp.employeeId.name} | {bp.date} | {bp.points}đ
                        </div>
                      ))}
                    </div>
                  )}
                  {employees.length > 0 && (
                    <div className="mt-2 p-2 bg-green-50 rounded">
                      <div className="font-medium">Sample MongoDB Employees:</div>
                      {employees.slice(0, 3).map((emp, i) => (
                        <div key={i} className="text-xs">
                          ID: {emp.id || 'none'} | _ID: {emp._id || 'none'} | {emp.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <AttendanceTable
                employees={employees}
                attendanceRecords={attendanceRecords}
                bonusPoints={bonusPoints} // MongoDB data
                customDailyValues={customDailyValues} // MongoDB data
                selectedMonth={selectedMonth}
                user={currentUser}
                pagination={pagination}
                isLoading={isLoadingAttendance}
                onBonusPointUpdate={handleBonusPointUpdate}
                onCustomValueUpdate={handleCustomValueUpdate}
                onEmployeeUpdate={handleEmployeeUpdate}
                onAttendanceUpdate={refreshAttendanceData}
                onPageChange={handlePageSelect}
                onNextPage={handleNextPage}
                onPrevPage={handlePrevPage}
              />
            </div>
          </div>
        )}

        {/* Department Management Modal */}
        {showDepartmentManagement && currentUser.role === "admin" && (
          <DepartmentManagement
            departments={departments}
            employees={employees}
            users={users} // MongoDB users
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
            users={users} // MongoDB users
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

        {/* XML Import Manager Modal */}
        {showXMLImport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  Import Dữ Liệu Điểm Danh từ XML/Excel
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowXMLImport(false)}
                  className="h-8 w-8 p-0"
                >
                  ✕
                </Button>
              </div>
              <div className="p-6">
                <XMLImportManager />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
