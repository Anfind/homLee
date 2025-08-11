// ZK API Service for real-time data from attendance machine
export interface ZKUser {
  uid: number
  role: number        // 14 = admin/manager, 0 = regular user
  password: string
  name: string
  cardno: number
  userId: string      // Used to match with attendance records
}

export interface ZKAttendanceRecord {
  userSn: number
  deviceUserId: string        // Matches with ZKUser.userId
  recordTime: string         // ISO timestamp from machine
  ip: string                // Machine IP address
}

export interface ZKResponse<T> {
  success: boolean
  message: string
  data: T[]
}

class ZKAPIService {
  private baseURL = 'http://localhost:3000/api'

  /**
   * Convert UTC timestamp to Vietnam timezone (UTC+7)
   * Machine timestamps are typically in UTC, need to convert to Vietnam time
   */
  private convertToVietnamTime(utcTimestamp: string): Date {
    const utcDate = new Date(utcTimestamp)
    // Add 7 hours for Vietnam timezone (UTC+7)
    const vietnamDate = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000))
    return vietnamDate
  }

  /**
   * Format Vietnam time to HH:MM string
   */
  private formatVietnamTime(utcTimestamp: string): string {
    const vietnamDate = this.convertToVietnamTime(utcTimestamp)
    return vietnamDate.toTimeString().substring(0, 5) // HH:MM format
  }

  /**
   * Format Vietnam date to YYYY-MM-DD string
   */
  private formatVietnamDate(utcTimestamp: string): string {
    const vietnamDate = this.convertToVietnamTime(utcTimestamp)
    return vietnamDate.toISOString().split('T')[0] // YYYY-MM-DD format
  }

  /**
   * Fetch all users from ZK attendance machine
   * Returns 583 employees from users.json
   */
  async getUsers(): Promise<ZKUser[]> {
    try {
      console.log('🔄 Fetching users from ZK device...')
      const response = await fetch(`${this.baseURL}/users`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result: ZKResponse<ZKUser> = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch users')
      }
      
      console.log(`✅ Retrieved ${result.data.length} users from ZK device`)
      return result.data
    } catch (error) {
      console.error('❌ Error fetching users from ZK device:', error)
      throw new Error(`Failed to connect to ZK device: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Fetch all attendance records from ZK machine
   * Returns ~24,748 records from full.json
   */
  async getAllAttendance(): Promise<ZKAttendanceRecord[]> {
    try {
      console.log('🔄 Fetching all attendance records from ZK device...')
      const response = await fetch(`${this.baseURL}/attendance`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result: ZKResponse<ZKAttendanceRecord> = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch attendance')
      }
      
      console.log(`✅ Retrieved ${result.data.length} attendance records from ZK device`)
      return result.data
    } catch (error) {
      console.error('❌ Error fetching attendance from ZK device:', error)
      throw new Error(`Failed to fetch attendance data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Fetch attendance records by date range from ZK machine
   * Uses time.json API endpoint
   */
  async getAttendanceByDate(startDate: string, endDate: string): Promise<ZKAttendanceRecord[]> {
    try {
      console.log(`🔄 Fetching attendance from ${startDate} to ${endDate}...`)
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        throw new Error('Date format must be YYYY-MM-DD')
      }

      const url = `${this.baseURL}/attendance/by-date?start=${startDate}&end=${endDate}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result: ZKResponse<ZKAttendanceRecord> = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch attendance by date')
      }
      
      console.log(`✅ Retrieved ${result.data.length} attendance records for date range`)
      return result.data
    } catch (error) {
      console.error('❌ Error fetching attendance by date:', error)
      throw new Error(`Failed to fetch attendance by date: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Test connection to ZK device
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing connection to ZK device...')
      const response = await fetch(`${this.baseURL}/users`)
      
      if (response.ok) {
        console.log('✅ ZK device connection successful')
        return true
      } else {
        console.log('❌ ZK device connection failed')
        return false
      }
    } catch (error) {
      console.error('❌ ZK device connection error:', error)
      return false
    }
  }

  /**
   * Get formatted attendance data with Vietnam timezone conversion
   */
  getFormattedAttendance(records: ZKAttendanceRecord[]): Array<{
    deviceUserId: string
    vietnamDate: string      // YYYY-MM-DD in Vietnam timezone
    vietnamTime: string      // HH:MM in Vietnam timezone
    originalTime: string     // Original UTC timestamp
  }> {
    return records.map(record => ({
      deviceUserId: record.deviceUserId,
      vietnamDate: this.formatVietnamDate(record.recordTime),
      vietnamTime: this.formatVietnamTime(record.recordTime),
      originalTime: record.recordTime
    }))
  }

  /**
   * Helper method to convert timezone (exposed for external use)
   */
  convertTimezone(utcTimestamp: string): {
    vietnamDate: string
    vietnamTime: string
    vietnamDateTime: Date
  } {
    const vietnamDateTime = this.convertToVietnamTime(utcTimestamp)
    return {
      vietnamDate: this.formatVietnamDate(utcTimestamp),
      vietnamTime: this.formatVietnamTime(utcTimestamp),
      vietnamDateTime
    }
  }
}

// Export singleton instance
export const zkAPI = new ZKAPIService()

// Export additional utilities
export const ZKUtils = {
  /**
   * Check if user is admin/manager based on role
   */
  isManager: (role: number): boolean => role === 14,
  
  /**
   * Get display name for role
   */
  getRoleDisplay: (role: number): string => {
    switch (role) {
      case 14: return 'Quản lý'
      case 0: return 'Nhân viên'
      default: return 'Không xác định'
    }
  },

  /**
   * Vietnam timezone offset (+7 hours)
   */
  VIETNAM_TIMEZONE_OFFSET: 7
}
