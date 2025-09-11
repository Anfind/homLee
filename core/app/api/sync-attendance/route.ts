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
      skipped: 0, // Records skipped (no new check-ins)
      preserved: 0, // Records with preserved manual points
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

        // 🔍 CHECK EXISTING RECORD AND COMPARE CHECK-INS
        const existingRecord = await AttendanceRecord.findOne({
          employeeId: groupData.employeeId,
          date: groupData.date
        })

        let shouldUpdate = false
        let shouldPreservePoints = false
        let finalPoints = pointsResult.totalPoints

        if (existingRecord) {
          // 🔍 COMPARE CHECK-INS: employee + date + times
          const existingCheckIns = [
            existingRecord.morningCheckIn,
            existingRecord.afternoonCheckIn
          ].filter(Boolean) // Remove null/undefined values

          const newCheckIns = groupData.checkIns
          
          // Compare arrays of check-ins
          const hasNewCheckIns = newCheckIns.some(newTime => !existingCheckIns.includes(newTime))
          const hasDifferentCheckIns = existingCheckIns.some(existingTime => !newCheckIns.includes(existingTime))
          
          console.log(`🔍 Employee ${groupData.employeeId} on ${groupData.date}:`)
          console.log(`   Existing check-ins: [${existingCheckIns.join(', ')}]`)
          console.log(`   New check-ins: [${newCheckIns.join(', ')}]`)
          console.log(`   Has new check-ins: ${hasNewCheckIns}`)
          console.log(`   Has different check-ins: ${hasDifferentCheckIns}`)

          if (!hasNewCheckIns && !hasDifferentCheckIns) {
            // ⏭️ SAME CHECK-INS: Skip completely
            console.log(`⏭️ SKIPPED: Same check-ins for ${groupData.employeeId} on ${groupData.date}`)
            syncResults.skipped++
            continue
          } else {
            // 🔄 DIFFERENT CHECK-INS: Update needed
            shouldUpdate = true
            
            // 🛡️ PRESERVE MANUAL POINTS if admin edited
            const autoCalculatedPoints = pointsResult.totalPoints
            const currentStoredPoints = existingRecord.points || 0
            
            // Check if points were manually edited by comparing with what auto-calculation would have given for EXISTING check-ins
            const existingPointsResult = calculateDailyPoints(
              groupData.date,
              existingCheckIns, // Calculate based on existing check-ins
              checkInSettings
            )
            
            // If stored points differ from what existing check-ins would auto-calculate = manual edit
            if (currentStoredPoints !== existingPointsResult.totalPoints) {
              console.log(`🔒 PRESERVING manual edit: Employee ${groupData.employeeId} on ${groupData.date}`)
              console.log(`   Existing check-ins would auto-calculate: ${existingPointsResult.totalPoints} points`)
              console.log(`   Admin edited to: ${currentStoredPoints} points`)
              console.log(`   → Keeping admin's value: ${currentStoredPoints}`)
              
              finalPoints = currentStoredPoints
              shouldPreservePoints = true
              syncResults.preserved++
            } else {
              console.log(`🔄 UPDATING: New check-ins detected, recalculating points`)
            }
          }
        }
        
        // Build attendance record với preserved or calculated points
        const attendanceData = {
          employeeId: groupData.employeeId,
          date: groupData.date,
          morningCheckIn,
          afternoonCheckIn,
          points: finalPoints, // Use preserved or calculated points
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

        if (shouldPreservePoints) {
          console.log(`� Employee ${groupData.employeeId} on ${groupData.date}: PRESERVED ${finalPoints} points (was ${pointsResult.totalPoints} auto-calculated)`)
        } else {
          console.log(`💰 Employee ${groupData.employeeId} on ${groupData.date}: ${pointsResult.totalPoints} points from ${groupData.checkIns.length} check-ins`)
        }

        // 🔄 CREATE OR UPDATE LOGIC
        if (existingRecord && shouldUpdate) {
          // Update existing record with new check-ins
          await AttendanceRecord.findByIdAndUpdate(existingRecord._id, attendanceData, {
            runValidators: true
          })
          syncResults.updated++
        } else if (!existingRecord) {
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

    // 📊 Enhanced response message
    const message = syncResults.preserved > 0
      ? `Đồng bộ thành công: ${syncResults.created} mới, ${syncResults.updated} cập nhật (${syncResults.preserved} điểm được bảo toàn), ${syncResults.skipped} bỏ qua từ ${syncResults.processed} bản ghi ZK`
      : syncResults.skipped > 0
        ? `Đồng bộ thành công: ${syncResults.created} mới, ${syncResults.updated} cập nhật, ${syncResults.skipped} bỏ qua từ ${syncResults.processed} bản ghi ZK`
        : `Đồng bộ thành công: ${syncResults.created} mới, ${syncResults.updated} cập nhật từ ${syncResults.processed} bản ghi ZK`

    return NextResponse.json({
      success: true,
      message,
      data: {
        ...syncResults,
        totalSynced: syncResults.created + syncResults.updated,
        preservedEdits: syncResults.preserved,
        skippedSame: syncResults.skipped
      }
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
