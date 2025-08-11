import { zkAPI, type ZKUser, type ZKAttendanceRecord } from '@/lib/zkapi'
import type { Employee, AttendanceRecord, CheckInSettings } from '@/app/page'

interface ProcessedAttendanceData {
  employees: Employee[]
  attendanceRecords: AttendanceRecord[]
  stats: {
    totalUsers: number
    totalRecords: number
    dateRange: string
    processedEmployees: number
  }
}

interface EmployeeAttendanceGroup {
  [employeeId: string]: {
    [date: string]: Date[]  // Array of Vietnam timezone timestamps for that date
  }
}

export class AttendanceCalculator {
  
  /**
   * Convert ZK users to application employees with smart department assignment
   */
  private transformZKUsersToEmployees(zkUsers: ZKUser[]): Employee[] {
    console.log('🔄 Transforming ZK users to employees...')
    
    return zkUsers.map(zkUser => {
      const employee: Employee = {
        id: zkUser.userId,
        name: zkUser.name.trim(),
        title: this.getTitleFromRole(zkUser.role),
        department: this.getDepartmentFromName(zkUser.name)
      }
      
      return employee
    })
  }

  /**
   * Determine job title from ZK role
   */
  private getTitleFromRole(role: number): string {
    switch (role) {
      case 14: 
        return "Trưởng phòng"  // Admin/Manager role
      case 0: 
        return "Nhân viên"     // Regular user role
      default: 
        return "Nhân viên"     // Default fallback
    }
  }

  /**
   * Smart department assignment based on employee name patterns
   * This can be customized based on company naming conventions
   */
  private getDepartmentFromName(name: string): string {
    const nameUpper = name.toUpperCase().trim()
    
    // Leadership patterns
    if (nameUpper.includes('PGD') || 
        nameUpper.includes('GIÁM ĐỐC') || 
        nameUpper.includes('PHẠM XUÂN THẮNG')) {
      return 'Ban Giám đốc'
    }
    
    // Technical department patterns  
    if (nameUpper.includes('KỸ THUẬT') || 
        nameUpper.includes('IT') || 
        nameUpper.includes('DEV') ||
        nameUpper.includes('LẬP TRÌNH')) {
      return 'Phòng Kỹ thuật'
    }
    
    // Sales department patterns
    if (nameUpper.includes('KINH DOANH') || 
        nameUpper.includes('SALE') || 
        nameUpper.includes('BÁN HÀNG') ||
        nameUpper.includes('MARKETING')) {
      return 'Phòng Kinh doanh'
    }
    
    // HR/Admin department patterns
    if (nameUpper.includes('HÀNH CHÍNH') || 
        nameUpper.includes('ADMIN') || 
        nameUpper.includes('NHÂN SỰ') ||
        nameUpper.includes('THƯ KÝ') ||
        nameUpper.includes('KẾ TOÁN')) {
      return 'Phòng Hành chính'
    }
    
    // Production/Operations patterns
    if (nameUpper.includes('SẢN XUẤT') || 
        nameUpper.includes('VẬN HÀNH') || 
        nameUpper.includes('KHO') ||
        nameUpper.includes('BẢO VỆ') ||
        nameUpper.includes('LÁI XE')) {
      return 'Phòng Sản xuất'
    }
    
    // Default fallback - assign to general department
    return 'Phòng Hành chính'
  }

  /**
   * Group attendance records by employee and date (Vietnam timezone)
   */
  private groupAttendanceByEmployeeAndDate(records: ZKAttendanceRecord[]): EmployeeAttendanceGroup {
    console.log('🔄 Grouping attendance records by employee and date...')
    
    const grouped: EmployeeAttendanceGroup = {}

    for (const record of records) {
      const employeeId = record.deviceUserId
      
      // Convert to Vietnam timezone
      const { vietnamDate, vietnamDateTime } = zkAPI.convertTimezone(record.recordTime)
      
      // Initialize employee group if not exists
      if (!grouped[employeeId]) {
        grouped[employeeId] = {}
      }
      
      // Initialize date group if not exists
      if (!grouped[employeeId][vietnamDate]) {
        grouped[employeeId][vietnamDate] = []
      }
      
      // Add timestamp to the date group
      grouped[employeeId][vietnamDate].push(vietnamDateTime)
    }

    const totalEmployees = Object.keys(grouped).length
    const totalDates = Object.values(grouped).reduce((sum, emp) => sum + Object.keys(emp).length, 0)
    console.log(`✅ Grouped ${records.length} records for ${totalEmployees} employees across ${totalDates} employee-days`)

    return grouped
  }

  /**
   * Determine morning and afternoon check-ins from raw timestamps
   * Uses intelligent logic to separate work sessions
   */
  private categorizeCheckIns(timestamps: Date[]): { morning?: string, afternoon?: string } {
    if (timestamps.length === 0) return {}

    // Sort timestamps chronologically
    const sortedTimes = timestamps.sort((a, b) => a.getTime() - b.getTime())
    
    const morningCutoff = 12 // 12:00 PM noon cutoff
    const result: { morning?: string, afternoon?: string } = {}

    // Find first check-in before noon (morning)
    for (const time of sortedTimes) {
      const hour = time.getHours()
      if (hour < morningCutoff && !result.morning) {
        result.morning = time.toTimeString().substring(0, 5) // HH:MM format
        break
      }
    }

    // Find first check-in after noon (afternoon)  
    for (const time of sortedTimes) {
      const hour = time.getHours()
      if (hour >= morningCutoff && !result.afternoon) {
        result.afternoon = time.toTimeString().substring(0, 5) // HH:MM format
        break
      }
    }

    return result
  }

  /**
   * Calculate attendance points using existing shift configuration logic
   * Replicates the XML importer logic exactly
   */
  private calculatePoints(
    dateStr: string,
    checkInSettings: CheckInSettings,
    morningCheckIn?: string,
    afternoonCheckIn?: string
  ): number {
    let points = 0
    const date = new Date(dateStr)
    const dayOfWeek = date.getDay() // 0=Sunday, 1=Monday, ..., 6=Saturday

    const daySettings = checkInSettings[dayOfWeek]
    if (!daySettings?.shifts?.length) {
      return 0 // No shifts configured for this day
    }

    // Helper function to convert time string to minutes for comparison
    const timeToMinutes = (timeStr: string): number => {
      const [hour, minute] = timeStr.split(":").map(Number)
      return hour * 60 + minute
    }

    let morningPointsAwarded = false
    let afternoonPointsAwarded = false

    // Check morning check-in against all shifts
    if (morningCheckIn && !morningPointsAwarded) {
      const morningMinutes = timeToMinutes(morningCheckIn)
      
      for (const shift of daySettings.shifts) {
        const startMinutes = timeToMinutes(shift.startTime)
        const endMinutes = timeToMinutes(shift.endTime)

        // Check if morning check-in falls within this shift
        if (morningMinutes >= startMinutes && morningMinutes <= endMinutes) {
          points += shift.points
          morningPointsAwarded = true
          break // Only award points for one shift per session
        }
      }
    }

    // Check afternoon check-in against all shifts
    if (afternoonCheckIn && !afternoonPointsAwarded) {
      const afternoonMinutes = timeToMinutes(afternoonCheckIn)
      
      for (const shift of daySettings.shifts) {
        const startMinutes = timeToMinutes(shift.startTime)
        const endMinutes = timeToMinutes(shift.endTime)

        // Check if afternoon check-in falls within this shift
        if (afternoonMinutes >= startMinutes && afternoonMinutes <= endMinutes) {
          points += shift.points
          afternoonPointsAwarded = true
          break // Only award points for one shift per session
        }
      }
    }

    return points
  }

  /**
   * Main processing method - transforms ZK machine data into application format
   */
  async processAttendanceData(
    startDate: string, 
    endDate: string, 
    checkInSettings: CheckInSettings
  ): Promise<ProcessedAttendanceData> {
    console.log(`🚀 Starting attendance data processing from ${startDate} to ${endDate}`)
    
    try {
      // Step 1: Test connection first
      const isConnected = await zkAPI.testConnection()
      if (!isConnected) {
        throw new Error('Cannot connect to ZK attendance machine. Please check if backend is running on port 3000.')
      }

      // Step 2: Fetch users from ZK device (583 employees)
      console.log('📋 Step 1: Fetching employee list...')
      const zkUsers = await zkAPI.getUsers()
      
      if (zkUsers.length === 0) {
        throw new Error('No users found in ZK device. Please check device connection.')
      }

      // Step 3: Fetch attendance records for date range
      console.log('📊 Step 2: Fetching attendance records...')
      const zkAttendance = await zkAPI.getAttendanceByDate(startDate, endDate)
      
      console.log(`📈 Raw data: ${zkUsers.length} users, ${zkAttendance.length} attendance records`)

      // Step 4: Transform users to employees
      console.log('👥 Step 3: Processing employee data...')
      const employees = this.transformZKUsersToEmployees(zkUsers)

      // Step 5: Group and process attendance records
      console.log('⏰ Step 4: Processing attendance records...')
      const groupedAttendance = this.groupAttendanceByEmployeeAndDate(zkAttendance)
      const attendanceRecords: AttendanceRecord[] = []

      let processedDays = 0
      for (const [employeeId, dateMap] of Object.entries(groupedAttendance)) {
        for (const [dateStr, timestamps] of Object.entries(dateMap)) {
          // Categorize check-ins for this employee-date
          const { morning, afternoon } = this.categorizeCheckIns(timestamps)
          
          // Calculate points based on check-in times and shift settings
          const points = this.calculatePoints(dateStr, checkInSettings, morning, afternoon)

          // Create attendance record
          attendanceRecords.push({
            employeeId,
            date: dateStr,
            morningCheckIn: morning,
            afternoonCheckIn: afternoon,
            points
          })
          
          processedDays++
        }
      }

      // Step 6: Compile results
      const stats = {
        totalUsers: zkUsers.length,
        totalRecords: zkAttendance.length,
        dateRange: `${startDate} to ${endDate}`,
        processedEmployees: Object.keys(groupedAttendance).length
      }

      console.log('✅ Processing completed successfully!')
      console.log(`📊 Results: ${employees.length} employees, ${attendanceRecords.length} attendance records`)
      console.log(`📈 Coverage: ${stats.processedEmployees}/${stats.totalUsers} employees have attendance data`)

      return {
        employees,
        attendanceRecords,
        stats
      }

    } catch (error) {
      console.error('❌ Error processing attendance data:', error)
      throw new Error(`Attendance processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate date range for processing
   */
  validateDateRange(startDate: string, endDate: string): { valid: boolean, error?: string } {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date()

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { valid: false, error: 'Invalid date format. Use YYYY-MM-DD.' }
    }

    if (start > end) {
      return { valid: false, error: 'Start date cannot be after end date.' }
    }

    if (end > now) {
      return { valid: false, error: 'End date cannot be in the future.' }
    }

    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 90) {
      return { valid: false, error: 'Date range cannot exceed 90 days.' }
    }

    return { valid: true }
  }

  /**
   * Get processing statistics for UI display
   */
  getProcessingStats(data: ProcessedAttendanceData): string[] {
    const { stats, employees, attendanceRecords } = data
    
    return [
      `📊 Tổng nhân viên: ${employees.length}`,
      `⏰ Tổng lượt chấm công: ${stats.totalRecords}`,
      `📅 Bản ghi tính điểm: ${attendanceRecords.length}`,
      `👥 Nhân viên có chấm công: ${stats.processedEmployees}`,
      `📈 Tỷ lệ tham gia: ${Math.round((stats.processedEmployees / stats.totalUsers) * 100)}%`
    ]
  }
}

// Export singleton instance
export const attendanceCalculator = new AttendanceCalculator()
