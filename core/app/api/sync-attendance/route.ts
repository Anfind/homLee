import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/connection'
import { AttendanceRecord } from '@/lib/mongodb/models/AttendanceRecord'
import { Employee } from '@/lib/mongodb/models/Employee'
import { CheckInSettings as CheckInSettingsModel } from '@/lib/mongodb/models/CheckInSettings'
import { 
  processZKAttendanceRecord, 
  calculateDailyPoints, 
  categorizeCheckIns,
  getDefaultCheckInSettings 
} from '@/lib/attendance/zk-processor'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting attendance sync...')
    await connectDB()
    
    const { startDate, endDate } = await request.json()
    console.log('📅 Sync params:', { startDate, endDate })
    
    // Fetch attendance data from zktceo-backend
    let apiUrl = 'http://localhost:3000/api/attendance'
    if (startDate && endDate) {
      apiUrl += `/by-date?start=${startDate}&end=${endDate}`
    }
    
    console.log('📡 Fetching from ZKTeco backend:', apiUrl)
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      console.error('❌ ZKTeco backend response not OK:', response.status, response.statusText)
      throw new Error(`Backend responded with ${response.status}: ${response.statusText}`)
    }
    
    const zkData = await response.json()
    console.log('✅ ZKTeco backend response:', zkData.success ? 'Success' : 'Failed')
    
    if (!zkData.success) {
      return NextResponse.json({
        success: false,
        message: 'Không thể lấy dữ liệu điểm danh từ ZKTeco backend',
        error: zkData.message
      }, { status: 500 })
    }

    const attendanceRecords = zkData.data
    
    // Load check-in settings from MongoDB (fallback to default if not found)
    let checkInSettings = getDefaultCheckInSettings()
    try {
      // Load all active check-in settings (one per day of week)
      const settings = await CheckInSettingsModel.find({ isActive: true }).sort({ dayOfWeek: 1 })
      
      if (settings && settings.length > 0) {
        // Convert to client format
        const mongoSettings: any = settings.reduce((acc: any, setting: any) => {
          acc[setting.dayOfWeek] = {
            shifts: setting.shifts
          }
          return acc
        }, {})
        
        // Fill missing days with defaults
        for (let day = 0; day <= 6; day++) {
          if (!mongoSettings[day]) {
            mongoSettings[day] = checkInSettings[day]
          }
        }
        
        checkInSettings = mongoSettings
        console.log('✅ Sync using check-in settings from MongoDB:')
        Object.keys(mongoSettings).forEach(day => {
          const shifts = mongoSettings[day].shifts
          console.log(`   Day ${day}: ${shifts.map((s: any) => `${s.name} ${s.startTime}-${s.endTime} (${s.points}pts)`).join(', ')}`)
        })
      } else {
        console.log('⚠️ No settings found in MongoDB, using defaults for sync')
      }
    } catch (error) {
      console.error('❌ Error loading check-in settings for sync:', error)
      console.log('⚠️ Falling back to default settings for sync')
    }
    
    const syncResults = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: [] as Array<{
        record?: any
        employeeId?: string
        date?: string
        key?: string
        error: string
      }>
    }

    // Group records by employeeId and date for processing
    const groupedRecords = new Map<string, {
      employeeId: string
      date: string
      checkIns: string[] // Array of all check-in times for the day
    }>()
    
    console.log(`🔄 Processing ${attendanceRecords.length} ZK attendance records...`)
    
    for (const record of attendanceRecords) {
      try {
        // Process each ZK record với timezone conversion
        const processed = processZKAttendanceRecord(record.recordTime, record.deviceUserId, checkInSettings)
        const key = `${processed.employeeId}-${processed.date}`
        
        if (!groupedRecords.has(key)) {
          groupedRecords.set(key, {
            employeeId: processed.employeeId,
            date: processed.date,
            checkIns: []
          })
        }
        
        const group = groupedRecords.get(key)!
        
        // Thêm time vào danh sách check-ins (tránh duplicate)
        if (!group.checkIns.includes(processed.time)) {
          group.checkIns.push(processed.time)
        }
        
        syncResults.processed++
        
      } catch (error) {
        syncResults.errors.push({
          record: record,
          error: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      }
    }

    console.log(`📊 Grouped into ${groupedRecords.size} unique employee-date combinations`)

    // Process grouped records và calculate points properly
    for (const [key, groupData] of groupedRecords) {
      try {
        // Verify employee exists
        const employeeExists = await Employee.findById(groupData.employeeId)
        if (!employeeExists) {
          syncResults.errors.push({
            employeeId: groupData.employeeId,
            date: groupData.date,
            error: 'Employee not found in database'
          })
          continue
        }

        // Calculate points using proper logic với tất cả check-ins
        const pointsResult = calculateDailyPoints(
          groupData.date, 
          groupData.checkIns, 
          checkInSettings
        )
        
        // Categorize check-ins để tương thích với existing schema - truyền settings từ MongoDB
        const { morningCheckIn, afternoonCheckIn } = categorizeCheckIns(
          groupData.checkIns, 
          groupData.date, 
          checkInSettings
        )
        
        // Build attendance record
        const attendanceData = {
          employeeId: groupData.employeeId,
          date: groupData.date,
          morningCheckIn,
          afternoonCheckIn,
          points: pointsResult.totalPoints,
          // Store detailed shift information for reference
          shifts: pointsResult.awardedShifts.map(awarded => ({
            id: awarded.shiftId,
            name: awarded.shiftName,
            startTime: awarded.checkInTime, // Store actual check-in time
            endTime: awarded.checkInTime,   // Same as start for awarded shifts
            points: awarded.points,
            checkedIn: true
          }))
        }

        console.log(`💰 Employee ${groupData.employeeId} on ${groupData.date}: ${pointsResult.totalPoints} points from ${groupData.checkIns.length} check-ins`)

        // Upsert attendance record
        const existingRecord = await AttendanceRecord.findOne({
          employeeId: attendanceData.employeeId,
          date: attendanceData.date
        })

        if (existingRecord) {
          // Update existing record
          await AttendanceRecord.findByIdAndUpdate(existingRecord._id, attendanceData, {
            runValidators: true
          })
          syncResults.updated++
        } else {
          // Create new record
          await AttendanceRecord.create(attendanceData)
          syncResults.created++
        }

      } catch (error) {
        syncResults.errors.push({
          key: key,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đồng bộ thành công: ${syncResults.created} mới, ${syncResults.updated} cập nhật từ ${syncResults.processed} bản ghi ZK`,
      data: syncResults
    })

  } catch (error) {
    console.error('❌ Sync attendance error:', error)
    
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json({
      success: false,
      message: 'Lỗi đồng bộ dữ liệu điểm danh',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
