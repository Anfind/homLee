import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/connection'
import { AttendanceRecord } from '@/lib/mongodb/models/AttendanceRecord'
import { Employee } from '@/lib/mongodb/models/Employee'
import { CheckInSettings as CheckInSettingsModel } from '@/lib/mongodb/models/CheckInSettings'
import * as XLSX from 'xlsx'
import { calculateDailyPoints, getDefaultCheckInSettings } from '@/lib/attendance/zk-processor'

interface XMLRow {
  STT: number
  'Ngày': number | string     // Excel serial, DD-MM-YY, or other date formats
  'ID': string                // Employee ID (e.g., "00003")
  'Họ và Tên': string         // Full name
  'Giờ Vào': number | string  // Check-in lần 1 - Excel serial, HH:MM:SS, or other time formats
  'Giờ Ra': number | string   // Check-in lần 2 (nếu có) - Excel serial, HH:MM:SS, or other time formats
}

interface ProcessedAttendance {
  employeeId: string
  date: string              // YYYY-MM-DD
  checkIns: string[]        // Array of HH:MM check-in times (both morning and afternoon)
  employeeName: string
}

/**
 * Parse date from various formats (Excel serial, DD-MM-YY, or ISO string)
 */
function parseDateFromMultipleFormats(dateValue: any): string | null {
  if (!dateValue || dateValue === '') return null
  
  try {
    // Case 1: String formats (PRIORITIZED - most accurate)
    if (typeof dateValue === 'string') {
      const dateStr = dateValue.toString().trim()
      
      // Try DD-MM-YY format (e.g., "01-07-25") - HIGHEST PRIORITY
      const ddmmyyMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{2})$/)
      if (ddmmyyMatch) {
        const [, day, month, year] = ddmmyyMatch
        const fullYear = 2000 + parseInt(year) // Assume 20xx
        return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
      
      // Try DD/MM/YYYY format
      const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
      if (ddmmyyyyMatch) {
        const [, day, month, year] = ddmmyyyyMatch
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
      
      // Try ISO format or other standard formats
      const parsedDate = new Date(dateStr)
      if (!isNaN(parsedDate.getTime())) {
        const year = parsedDate.getFullYear()
        const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0')
        const day = parsedDate.getDate().toString().padStart(2, '0')
        return `${year}-${month}-${day}`
      }
    }
    
    // Case 2: Excel serial number (e.g., 45839) - FALLBACK
    if (typeof dateValue === 'number') {
      const jan1_1900 = new Date(1900, 0, 1)
      const resultDate = new Date(jan1_1900.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000)
      const year = resultDate.getFullYear()
      const month = (resultDate.getMonth() + 1).toString().padStart(2, '0')
      const day = resultDate.getDate().toString().padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    console.warn('Could not parse date:', dateValue)
    return null
  } catch (error) {
    console.error('Error parsing date:', dateValue, error)
    return null
  }
}

/**
 * Parse time from various formats (Excel serial, HH:MM:SS, or decimal)
 */
function parseTimeFromMultipleFormats(timeValue: any): string | null {
  if (!timeValue || timeValue === '') return null
  
  try {
    // Case 1: Excel serial number with time fraction (e.g., 45839.329780092594)
    if (typeof timeValue === 'number') {
      // Use high-precision method to avoid timezone issues
      const dayFraction = timeValue - Math.floor(timeValue)
      const totalSeconds = Math.round(dayFraction * 24 * 60 * 60)
      
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    }
    
    // Case 2: String formats (PRIORITIZED - most accurate)
    const timeStr = timeValue.toString().trim()
    
    // Try HH:MM:SS format (e.g., "07:54:53") - HIGHEST PRIORITY
    const hhmmssMatch = timeStr.match(/^(\d{1,2}):(\d{2}):(\d{2})$/)
    if (hhmmssMatch) {
      const [, hours, minutes] = hhmmssMatch
      return `${hours.padStart(2, '0')}:${minutes}`
    }
    
    // Try HH:MM format (e.g., "07:54")
    const hhmmMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/)
    if (hhmmMatch) {
      const [, hours, minutes] = hhmmMatch
      return `${hours.padStart(2, '0')}:${minutes}`
    }
    
    // Try decimal hours (e.g., "7.9" = 7:54)
    const decimal = parseFloat(timeStr)
    if (!isNaN(decimal) && decimal >= 0 && decimal < 24) {
      const hours = Math.floor(decimal)
      const minutes = Math.round((decimal - hours) * 60)
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    }
    
    console.warn('Could not parse time:', timeValue)
    return null
  } catch (error) {
    console.error('Error parsing time:', timeValue, error)
    return null
  }
}

/**
 * Clean employee ID by removing leading zeros if needed
 * Auto-create employee if not exists
 * Input: "00003" -> Output: "3"
 */
async function ensureEmployeeExists(rawId: string, employeeName: string): Promise<string> {
  if (!rawId) return ''
  
  // Clean the ID first
  const cleanId = rawId.toString().trim()
  
  // Try original ID first
  let employee = await Employee.findOne({ _id: cleanId })
  if (employee) {
    return cleanId
  }
  
  // Try without leading zeros
  const numericId = cleanId.replace(/^0+/, '') || '0'
  if (numericId !== cleanId) {
    employee = await Employee.findOne({ _id: numericId })
    if (employee) {
      return numericId
    }
  }
  
  // Auto-create employee if not exists
  const finalId = numericId
  const newEmployee = {
    _id: finalId,
    name: employeeName || `Nhân viên ${finalId}`,
    title: 'Nhân viên',
    department: 'Chưa phân loại'
  }
  
  try {
    await Employee.create(newEmployee)
    return finalId
  } catch (error) {
    console.error(`❌ Failed to create employee ${finalId}:`, error)
    return finalId // Return anyway to continue processing
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'Không tìm thấy file XML'
      }, { status: 400 })
    }

    // Parse XML file using XLSX (supports XML format)
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convert to JSON, skipping first 3 rows (header info)
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:F1000')
    range.s.r = 4 // Start from row 5 (0-indexed, so 4 = row 5)
    const newRef = XLSX.utils.encode_range(range)
    
    const jsonData: XMLRow[] = XLSX.utils.sheet_to_json(worksheet, { 
      range: newRef,
      header: ['STT', 'Ngày', 'ID', 'Họ và Tên', 'Giờ Vào', 'Giờ Ra']
    })

    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as Array<{
        row: number
        error: string
        data?: any
      }>
    }

    // Group data by employee + date
    const groupedData = new Map<string, ProcessedAttendance>()

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      
      try {
        // Skip empty rows
        if (!row['ID'] || !row['Ngày']) {
          results.skipped++
          continue
        }

        // Normalize employee ID and auto-create if needed
        const rawEmployeeId = row['ID']?.toString().trim()
        const employeeName = row['Họ và Tên']?.toString().trim()
        const employeeId = await ensureEmployeeExists(rawEmployeeId, employeeName)
        
        // Skip if still no valid employee ID (shouldn't happen now)
        if (!employeeId) {
          results.errors.push({
            row: i + 5,
            error: `Không thể xử lý employee ID: ${rawEmployeeId}`,
            data: row
          })
          continue
        }

        // Parse date from multiple formats (Excel serial, DD-MM-YY, etc.)
        const formattedDate = parseDateFromMultipleFormats(row['Ngày'])
        if (!formattedDate) {
          results.errors.push({
            row: i + 5,
            error: 'Không thể parse ngày từ dữ liệu',
            data: row
          })
          continue
        }

        // Group key: employeeId + date
        const key = `${employeeId}-${formattedDate}`

        // Initialize group if not exists
        if (!groupedData.has(key)) {
          groupedData.set(key, {
            employeeId,
            date: formattedDate,
            checkIns: [],
            employeeName: employeeName || `Nhân viên ${employeeId}`
          })
        }

        const group = groupedData.get(key)!

        // Parse check-in time từ cột "Giờ Vào" (check-in lần 1)
        const checkInTime1 = parseTimeFromMultipleFormats(row['Giờ Vào'])
        if (checkInTime1 && !group.checkIns.includes(checkInTime1)) {
          group.checkIns.push(checkInTime1)
        }

        // Parse check-in time từ cột "Giờ Ra" (check-in lần 2, nếu có)
        const checkInTime2 = parseTimeFromMultipleFormats(row['Giờ Ra'])
        if (checkInTime2 && !group.checkIns.includes(checkInTime2)) {
          group.checkIns.push(checkInTime2)
        }

        results.processed++

      } catch (error) {
        results.errors.push({
          row: i + 5,
          error: `Lỗi xử lý dòng: ${error instanceof Error ? error.message : 'Unknown error'}`,
          data: row
        })
      }
    }

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
        
        // Log custom points for debugging
        const customPoints: string[] = []
        settings.forEach(setting => {
          setting.shifts.forEach((shift: any) => {
            if (shift.points !== 1) {
              customPoints.push(`Day ${setting.dayOfWeek} ${shift.name}: ${shift.points} điểm`)
            }
          })
        })
        
        // Fill missing days with defaults
        for (let day = 0; day <= 6; day++) {
          if (!mongoSettings[day]) {
            mongoSettings[day] = checkInSettings[day]
          }
        }
        
        checkInSettings = mongoSettings
      }
    } catch (error) {
      console.error('❌ Error loading check-in settings:', error)
    }

    // Process grouped data and create attendance records

    for (const [key, groupData] of groupedData) {
      try {
        // Sort check-ins chronologically
        groupData.checkIns.sort()

        // Calculate points based on all check-ins
        // calculateDailyPoints will automatically categorize each check-in time 
        // based on shift time ranges, not column position
        const pointsResult = calculateDailyPoints(
          groupData.date,
          groupData.checkIns,
          checkInSettings
        )

        // For backward compatibility, categorize check-ins based on awarded shifts
        const morningShift = pointsResult.awardedShifts.find(shift => 
          shift.shiftName === 'Ca sáng'
        )
        const afternoonShift = pointsResult.awardedShifts.find(shift => 
          shift.shiftName === 'Ca chiều'
        )

        const morningCheckIn = morningShift?.checkInTime
        const afternoonCheckIn = afternoonShift?.checkInTime

        // Build attendance record
        const attendanceData = {
          employeeId: groupData.employeeId,
          date: groupData.date,
          morningCheckIn,
          afternoonCheckIn,
          points: pointsResult.totalPoints,
          shifts: pointsResult.awardedShifts.map(awarded => ({
            id: awarded.shiftId,
            name: awarded.shiftName,
            startTime: awarded.checkInTime,
            endTime: awarded.checkInTime,
            points: awarded.points,
            checkedIn: true
          }))
        }

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
          results.updated++
        } else {
          // Create new record
          await AttendanceRecord.create(attendanceData)
          results.created++
        }

      } catch (error) {
        results.errors.push({
          row: 0,
          error: `Lỗi lưu database cho ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          data: groupData
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import XML thành công! Tạo mới: ${results.created}, Cập nhật: ${results.updated}, Bỏ qua: ${results.skipped}, Lỗi: ${results.errors.length}`,
      data: {
        summary: {
          totalRows: jsonData.length,
          processedRows: results.processed,
          created: results.created,
          updated: results.updated,
          skipped: results.skipped,
          errors: results.errors.length
        },
        errors: results.errors,
        sampleGroupedData: Array.from(groupedData.entries()).slice(0, 3)
      }
    })

  } catch (error) {
    console.error('❌ XML import error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Lỗi import file XML',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
