import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/connection'
import { AttendanceRecord } from '@/lib/mongodb/models/AttendanceRecord'
import { Employee } from '@/lib/mongodb/models/Employee'

// Helper function to convert ISO string to date and time
function parseAttendanceTime(isoString: string) {
  const date = new Date(isoString)
  
  // Format date as YYYY-MM-DD
  const dateStr = date.toISOString().split('T')[0]
  
  // Format time as HH:MM (24-hour format)
  const timeStr = date.toTimeString().slice(0, 5)
  
  return { date: dateStr, time: timeStr }
}

// Helper function to determine if time is morning or afternoon
function getShiftType(time: string): 'morning' | 'afternoon' {
  const [hours] = time.split(':').map(Number)
  // Assuming morning shift: 6:00-12:00, afternoon shift: 12:01-18:00
  return hours <= 12 ? 'morning' : 'afternoon'
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { startDate, endDate } = await request.json()
    
    // Fetch attendance data from zktceo-backend
    let apiUrl = 'http://localhost:3000/api/attendance'
    if (startDate && endDate) {
      apiUrl += `/by-date?start=${startDate}&end=${endDate}`
    }
    
    const response = await fetch(apiUrl)
    const zkData = await response.json()
    
    if (!zkData.success) {
      return NextResponse.json({
        success: false,
        message: 'Không thể lấy dữ liệu chấm công từ ZKTeco backend',
        error: zkData.message
      }, { status: 500 })
    }

    const attendanceRecords = zkData.data
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
      checkIns: Array<{
        time: string
        shift: 'morning' | 'afternoon'
      }>
    }>()
    
    for (const record of attendanceRecords) {
      try {
        const { date, time } = parseAttendanceTime(record.recordTime)
        const employeeId = record.deviceUserId
        const key = `${employeeId}-${date}`
        
        if (!groupedRecords.has(key)) {
          groupedRecords.set(key, {
            employeeId,
            date,
            checkIns: []
          })
        }
        
        const group = groupedRecords.get(key)!
        group.checkIns.push({
          time,
          shift: getShiftType(time)
        })
        
        syncResults.processed++
      } catch (error) {
        syncResults.errors.push({
          record: record,
          error: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      }
    }

    // Process grouped records and save to MongoDB
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

        // Sort check-ins by time and determine morning/afternoon
        const sortedCheckIns = groupData.checkIns.sort((a: any, b: any) => a.time.localeCompare(b.time))
        
        const morningCheckIns = sortedCheckIns.filter((c: any) => c.shift === 'morning')
        const afternoonCheckIns = sortedCheckIns.filter((c: any) => c.shift === 'afternoon')
        
        // Build attendance record
        const attendanceData = {
          employeeId: groupData.employeeId,
          date: groupData.date,
          morningCheckIn: morningCheckIns.length > 0 ? morningCheckIns[0].time : undefined,
          afternoonCheckIn: afternoonCheckIns.length > 0 ? afternoonCheckIns[0].time : undefined,
          points: 0 // Will be calculated based on check-in rules
        }

        // Calculate points based on check-ins
        let points = 0
        if (attendanceData.morningCheckIn) points += 0.5
        if (attendanceData.afternoonCheckIn) points += 0.5
        attendanceData.points = points

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
      message: `Đồng bộ thành công: ${syncResults.created} mới, ${syncResults.updated} cập nhật từ ${syncResults.processed} bản ghi`,
      data: syncResults
    })

  } catch (error) {
    console.error('Sync attendance error:', error)
    return NextResponse.json({
      success: false,
      message: 'Lỗi đồng bộ dữ liệu chấm công',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
