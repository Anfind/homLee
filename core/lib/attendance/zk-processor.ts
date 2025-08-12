import { CheckInSettings, Shift } from '@/app/page'

/**
 * Utility để xử lý thời gian và tính điểm chấm công
 */

// Default check-in settings (copy từ page.tsx)
export const getDefaultCheckInSettings = (): CheckInSettings => {
  return {
    0: { // Sunday
      shifts: [
        { id: "sun-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "11:00", points: 1 },
        { id: "sun-shift-2", name: "Ca chiều", startTime: "13:00", endTime: "17:00", points: 1 },
      ],
    },
    1: { // Monday
      shifts: [
        { id: "mon-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "11:00", points: 1 },
        { id: "mon-shift-2", name: "Ca chiều", startTime: "13:00", endTime: "17:00", points: 1 },
      ],
    },
    2: { // Tuesday
      shifts: [
        { id: "tue-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "11:00", points: 1 },
        { id: "tue-shift-2", name: "Ca chiều", startTime: "13:00", endTime: "17:00", points: 1 },
      ],
    },
    3: { // Wednesday
      shifts: [
        { id: "wed-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "11:00", points: 1 },
        { id: "wed-shift-2", name: "Ca chiều", startTime: "13:00", endTime: "17:00", points: 1 },
      ],
    },
    4: { // Thursday
      shifts: [
        { id: "thu-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "11:00", points: 1 },
        { id: "thu-shift-2", name: "Ca chiều", startTime: "13:00", endTime: "17:00", points: 1 },
      ],
    },
    5: { // Friday
      shifts: [
        { id: "fri-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "11:00", points: 1 },
        { id: "fri-shift-2", name: "Ca chiều", startTime: "13:00", endTime: "17:00", points: 1 },
      ],
    },
    6: { // Saturday
      shifts: [
        { id: "sat-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "11:00", points: 1 },
        { id: "sat-shift-2", name: "Ca chiều", startTime: "13:00", endTime: "17:00", points: 1 },
      ],
    },
  }
}

/**
 * Convert UTC timestamp từ máy chấm công sang thời gian VN (UTC+7)
 */
export function convertToVietnamTime(isoString: string): Date {
  const utcDate = new Date(isoString)
  
  // Sử dụng toLocaleString để convert sang VN timezone chính xác
  const vnString = utcDate.toLocaleString("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh"
  })
  
  // vnString format: "2025-03-03 11:36:24"
  // Convert back to Date object
  return new Date(vnString)
}

/**
 * Format thời gian VN thành YYYY-MM-DD
 */
export function formatVietnamDate(isoString: string): string {
  const utcDate = new Date(isoString)
  
  const vnString = utcDate.toLocaleString("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh"
  })
  
  // Extract date part: "2025-03-03 11:36:24" -> "2025-03-03"
  return vnString.split(' ')[0]
}

/**
 * Format thời gian VN thành HH:MM
 */
export function formatVietnamTime(isoString: string): string {
  const utcDate = new Date(isoString)
  
  const vnString = utcDate.toLocaleString("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh"
  })
  
  // Extract time part: "2025-03-03 11:36:24" -> "11:36"
  const timePart = vnString.split(' ')[1]
  const [hours, minutes] = timePart.split(':')
  return `${hours}:${minutes}`
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
    for (const shift of dayShifts) {
      // Kiểm tra xem shift này đã được award chưa
      const alreadyAwarded = awardedShifts.some(awarded => awarded.shiftId === shift.id)
      
      if (!alreadyAwarded && isTimeInShift(checkIn, shift)) {
        awardedShifts.push({
          shiftId: shift.id,
          shiftName: shift.name,
          checkInTime: checkIn,
          points: shift.points
        })
        
        console.log(`✅ Awarded ${shift.points} points for ${shift.name} at ${checkIn}`)
        break // Chỉ award 1 shift cho mỗi check-in
      }
    }
  }
  
  const totalPoints = awardedShifts.reduce((sum, awarded) => sum + awarded.points, 0)
  
  return {
    totalPoints,
    awardedShifts
  }
}

/**
 * Phân loại check-ins thành morning và afternoon (để tương thích với existing code)
 */
export function categorizeCheckIns(checkIns: string[]): {
  morningCheckIn?: string
  afternoonCheckIn?: string
} {
  if (checkIns.length === 0) return {}
  
  // Sắp xếp theo thời gian
  const sorted = [...checkIns].sort((a, b) => a.localeCompare(b))
  
  // Tìm check-in sáng (trước 12:00)
  const morningCheckIn = sorted.find(time => {
    const [hour] = time.split(':').map(Number)
    return hour < 12
  })
  
  // Tìm check-in chiều (từ 12:00 trở đi)
  const afternoonCheckIn = sorted.find(time => {
    const [hour] = time.split(':').map(Number)
    return hour >= 12
  })
  
  return {
    morningCheckIn,
    afternoonCheckIn
  }
}

/**
 * Main function để process attendance record từ máy chấm công
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
