import { CheckInSettings, Shift } from '@/app/page'

/**
 * Utility để xử lý thời gian và tính điểm điểm danh
 */

// Default check-in settings (EXACT company schedule)
export const getDefaultCheckInSettings = (): CheckInSettings => {
  return {
    0: { // Sunday - Special timing
      shifts: [
        { id: "sun-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "08:45", points: 1 },
        { id: "sun-shift-2", name: "Ca chiều", startTime: "13:30", endTime: "14:45", points: 1 },
      ],
    },
    1: { // Monday
      shifts: [
        { id: "mon-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "07:45", points: 1 },
        { id: "mon-shift-2", name: "Ca chiều", startTime: "13:30", endTime: "14:00", points: 1 },
      ],
    },
    2: { // Tuesday
      shifts: [
        { id: "tue-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "07:45", points: 1 },
        { id: "tue-shift-2", name: "Ca chiều", startTime: "13:30", endTime: "14:00", points: 1 },
      ],
    },
    3: { // Wednesday
      shifts: [
        { id: "wed-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "07:45", points: 1 },
        { id: "wed-shift-2", name: "Ca chiều", startTime: "13:30", endTime: "14:00", points: 1 },
      ],
    },
    4: { // Thursday
      shifts: [
        { id: "thu-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "07:45", points: 1 },
        { id: "thu-shift-2", name: "Ca chiều", startTime: "13:30", endTime: "14:00", points: 1 },
      ],
    },
    5: { // Friday
      shifts: [
        { id: "fri-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "07:45", points: 1 },
        { id: "fri-shift-2", name: "Ca chiều", startTime: "13:30", endTime: "14:00", points: 1 },
      ],
    },
    6: { // Saturday
      shifts: [
        { id: "sat-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "07:45", points: 1 },
        { id: "sat-shift-2", name: "Ca chiều", startTime: "13:30", endTime: "14:00", points: 1 },
      ],
    },
  }
}

/**
 * Convert UTC timestamp từ máy điểm danh sang thời gian VN (UTC+7)
 * QUAN TRỌNG: Kiểm tra xem hệ thống đã ở VN timezone chưa
 */
export function convertToVietnamTime(isoString: string): Date {
  const utcDate = new Date(isoString)
  
  // Kiểm tra timezone của hệ thống
  const systemOffset = utcDate.getTimezoneOffset()
  const vnOffset = -420 // VN = UTC+7 = -420 minutes
  
  if (systemOffset === vnOffset) {
    // Hệ thống đã ở VN timezone, không cần convert
    console.log(`🕐 System already in VN timezone, no conversion needed`)
    return utcDate
  } else {
    // Hệ thống ở timezone khác, cần convert
    console.log(`🕐 Converting from system TZ (${systemOffset}min) to VN timezone`)
    const vnString = utcDate.toLocaleString("sv-SE", {
      timeZone: "Asia/Ho_Chi_Minh"
    })
    return new Date(vnString)
  }
}

/**
 * Format thời gian VN thành YYYY-MM-DD
 * Sử dụng hệ thống timezone hiện tại nếu đã là VN
 */
export function formatVietnamDate(isoString: string): string {
  const utcDate = new Date(isoString)
  const systemOffset = utcDate.getTimezoneOffset()
  
  if (systemOffset === -420) {
    // Hệ thống đã VN timezone
    return utcDate.toISOString().split('T')[0]
  } else {
    // Convert to VN timezone
    const vnString = utcDate.toLocaleString("sv-SE", {
      timeZone: "Asia/Ho_Chi_Minh"
    })
    return vnString.split(' ')[0]
  }
}

/**
 * Format thời gian VN thành HH:MM
 * Sử dụng hệ thống timezone hiện tại nếu đã là VN
 */
export function formatVietnamTime(isoString: string): string {
  const utcDate = new Date(isoString)
  const systemOffset = utcDate.getTimezoneOffset()
  
  if (systemOffset === -420) {
    // Hệ thống đã VN timezone
    const hours = utcDate.getHours().toString().padStart(2, '0')
    const minutes = utcDate.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  } else {
    // Convert to VN timezone
    const vnString = utcDate.toLocaleString("sv-SE", {
      timeZone: "Asia/Ho_Chi_Minh"
    })
    const timePart = vnString.split(' ')[1]
    const [hours, minutes] = timePart.split(':')
    return `${hours}:${minutes}`
  }
}

/**
 * Kiểm tra xem thời gian check-in có nằm trong shift không
 */
export function isTimeInShift(checkInTime: string, shift: Shift): boolean {
  const [checkHour, checkMin] = checkInTime.split(':').map(Number)
  const [startHour, startMin] = shift.startTime.split(':').map(Number)
  const [endHour, endMin] = shift.endTime.split(':').map(Number)
  
  const checkMinutes = checkHour * 60 + checkMin
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  return checkMinutes >= startMinutes && checkMinutes <= endMinutes
}

/**
 * Tính điểm cho 1 ngày dựa trên tất cả check-ins
 * Mỗi shift chỉ được tính điểm 1 lần duy nhất
 */
export function calculateDailyPoints(
  date: string, 
  checkIns: string[], 
  checkInSettings: CheckInSettings
): {
  totalPoints: number
  awardedShifts: Array<{
    shiftId: string
    shiftName: string
    checkInTime: string
    points: number
  }>
} {
  // Lấy ngày trong tuần (0 = Chủ nhật, 1 = Thứ 2, ...)
  const dayOfWeek = new Date(date + 'T00:00:00').getDay()
  const dayShifts = checkInSettings[dayOfWeek]?.shifts || []
  
  console.log(`🔍 [CALCULATE DEBUG] Date: ${date}, DayOfWeek: ${dayOfWeek}`)
  console.log(`🔍 [CALCULATE DEBUG] Check-ins: [${checkIns.join(', ')}]`)
  console.log(`🔍 [CALCULATE DEBUG] Available shifts for day ${dayOfWeek}:`)
  dayShifts.forEach(shift => {
    console.log(`   ${shift.name}: ${shift.startTime}-${shift.endTime} (${shift.points} điểm)`)
  })
  
  const awardedShifts: Array<{
    shiftId: string
    shiftName: string
    checkInTime: string
    points: number
  }> = []
  
  // Sắp xếp check-ins theo thời gian (sớm nhất trước)
  const sortedCheckIns = [...checkIns].sort((a, b) => a.localeCompare(b))
  
  // Duyệt qua từng check-in và kiểm tra với tất cả shifts
  for (const checkIn of sortedCheckIns) {
    console.log(`🔍 [CALCULATE DEBUG] Processing check-in: ${checkIn}`)
    
    for (const shift of dayShifts) {
      // Kiểm tra xem shift này đã được award chưa
      const alreadyAwarded = awardedShifts.some(awarded => awarded.shiftId === shift.id)
      console.log(`   Testing ${shift.name} (${shift.startTime}-${shift.endTime}): already awarded = ${alreadyAwarded}`)
      
      if (!alreadyAwarded && isTimeInShift(checkIn, shift)) {
        awardedShifts.push({
          shiftId: shift.id,
          shiftName: shift.name,
          checkInTime: checkIn,
          points: shift.points
        })
        
        console.log(`✅ [CALCULATE DEBUG] Awarded ${shift.points} points for ${shift.name} at ${checkIn}`)
        break // Chỉ award 1 shift cho mỗi check-in
      } else if (!alreadyAwarded) {
        console.log(`   ❌ ${checkIn} not in range ${shift.startTime}-${shift.endTime}`)
      }
    }
  }
  
  const totalPoints = awardedShifts.reduce((sum, awarded) => sum + awarded.points, 0)
  console.log(`🔍 [CALCULATE DEBUG] Final result: ${totalPoints} points`)
  
  return {
    totalPoints,
    awardedShifts
  }
}

/**
 * Phân loại check-ins thành morning và afternoon (để tương thích với existing code)
 */
export function categorizeCheckIns(
  checkIns: string[], 
  date?: string, 
  checkInSettings?: CheckInSettings
): {
  morningCheckIn?: string
  afternoonCheckIn?: string
} {
  if (checkIns.length === 0) return {}
  
  // Sắp xếp theo thời gian
  const sorted = [...checkIns].sort((a, b) => a.localeCompare(b))
  
  // Determine day of week for shift timing (default to weekday if no date provided)
  let dayOfWeek = 1 // Default to Monday (weekday)
  if (date) {
    const dateObj = new Date(date)
    dayOfWeek = dateObj.getDay() // 0 = Sunday, 1 = Monday, etc.
  }
  
  // Get shift settings for this day - use provided settings or fallback to defaults
  const settings = checkInSettings || getDefaultCheckInSettings()
  const dayShifts = settings[dayOfWeek]?.shifts || settings[1].shifts // Fallback to Monday
  
  console.log(`🔍 categorizeCheckIns: Using ${checkInSettings ? 'MongoDB' : 'default'} settings for day ${dayOfWeek}:`, dayShifts.map(s => `${s.name} ${s.startTime}-${s.endTime} (${s.points}pts)`).join(', '))
  
  // Find morning and afternoon shifts
  const morningShift = dayShifts.find(shift => shift.name === 'Ca sáng')
  const afternoonShift = dayShifts.find(shift => shift.name === 'Ca chiều')
  
  // Find check-in times that fall within actual shift ranges
  const morningCheckIn = sorted.find(time => {
    if (!morningShift) return false
    const [hour, minute] = time.split(':').map(Number)
    const timeInMinutes = hour * 60 + minute
    
    const [startHour, startMinute] = morningShift.startTime.split(':').map(Number)
    const [endHour, endMinute] = morningShift.endTime.split(':').map(Number)
    const startTimeInMinutes = startHour * 60 + startMinute
    const endTimeInMinutes = endHour * 60 + endMinute
    
    return timeInMinutes >= startTimeInMinutes && timeInMinutes <= endTimeInMinutes
  })
  
  const afternoonCheckIn = sorted.find(time => {
    if (!afternoonShift) return false
    const [hour, minute] = time.split(':').map(Number)
    const timeInMinutes = hour * 60 + minute
    
    const [startHour, startMinute] = afternoonShift.startTime.split(':').map(Number)
    const [endHour, endMinute] = afternoonShift.endTime.split(':').map(Number)
    const startTimeInMinutes = startHour * 60 + startMinute
    const endTimeInMinutes = endHour * 60 + endMinute
    
    return timeInMinutes >= startTimeInMinutes && timeInMinutes <= endTimeInMinutes
  })
  
  return {
    morningCheckIn,
    afternoonCheckIn
  }
}

/**
 * Main function để process attendance record từ máy điểm danh
 */
export function processZKAttendanceRecord(
  recordTime: string,
  deviceUserId: string,
  checkInSettings?: CheckInSettings
): {
  employeeId: string
  date: string
  time: string
  vnDate: Date
} {
  const settings = checkInSettings || getDefaultCheckInSettings()
  
  // Convert sang thời gian VN
  const vnDate = convertToVietnamTime(recordTime)
  const date = formatVietnamDate(recordTime)
  const time = formatVietnamTime(recordTime)
  
  console.log(`📅 Processing ZK record: ${recordTime} → VN: ${vnDate.toISOString()} → ${date} ${time}`)
  
  return {
    employeeId: deviceUserId,
    date,
    time,
    vnDate
  }
}

export { getDefaultCheckInSettings as getCheckInSettings }
