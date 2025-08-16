// Test timezone conversion với dữ liệu thực
console.log('🧪 Testing timezone conversion với dữ liệu thực từ ZKTeco...\n')

// Sample data từ response
const sampleRecords = [
  { deviceUserId: "27", recordTime: "2025-03-03T04:36:24.000Z" },
  { deviceUserId: "36", recordTime: "2025-03-03T06:30:17.000Z" },
  { deviceUserId: "41", recordTime: "2025-03-03T06:31:05.000Z" },
  { deviceUserId: "5", recordTime: "2025-03-03T06:34:14.000Z" },
  { deviceUserId: "3", recordTime: "2025-03-03T07:01:33.000Z" },
  { deviceUserId: "2", recordTime: "2025-03-03T07:27:02.000Z" },
  { deviceUserId: "138", recordTime: "2025-03-03T08:46:18.000Z" }
]

// Shifts configuration
const shifts = [
  { id: "morning", name: "Ca sáng", startTime: "07:00", endTime: "11:00", points: 1 },
  { id: "afternoon", name: "Ca chiều", startTime: "13:00", endTime: "17:00", points: 1 }
]

function convertToVietnamTime(isoString) {
  const utcDate = new Date(isoString)
  const systemOffset = utcDate.getTimezoneOffset()
  const vnOffset = -420 // VN = UTC+7 = -420 minutes
  
  if (systemOffset === vnOffset) {
    // Already in VN timezone
    return utcDate
  } else {
    // Need conversion
    const vnString = utcDate.toLocaleString("sv-SE", {
      timeZone: "Asia/Ho_Chi_Minh"
    })
    return new Date(vnString)
  }
}

function formatVietnamTime(isoString) {
  const utcDate = new Date(isoString)
  const systemOffset = utcDate.getTimezoneOffset()
  
  if (systemOffset === -420) {
    // Already VN timezone
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

function isTimeInShift(checkInTime, shift) {
  const [checkHour, checkMin] = checkInTime.split(':').map(Number)
  const [startHour, startMin] = shift.startTime.split(':').map(Number)
  const [endHour, endMin] = shift.endTime.split(':').map(Number)
  
  const checkMinutes = checkHour * 60 + checkMin
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  return checkMinutes >= startMinutes && checkMinutes <= endMinutes
}

console.log('📊 PHÂN TÍCH DỮ LIỆU THỰC:')
console.log('='*50)

sampleRecords.forEach((record, i) => {
  const vnTime = formatVietnamTime(record.recordTime)
  const utcDate = new Date(record.recordTime)
  
  console.log(`\nRecord ${i+1}: User ${record.deviceUserId}`)
  console.log(`UTC Time: ${record.recordTime}`)
  console.log(`VN Time: ${vnTime}`)
  
  // Check which shift
  let matchedShift = null
  let points = 0
  
  for (const shift of shifts) {
    if (isTimeInShift(vnTime, shift)) {
      matchedShift = shift
      points = shift.points
      break
    }
  }
  
  if (matchedShift) {
    console.log(`✅ Shift: ${matchedShift.name} (+${points} điểm)`)
  } else {
    console.log(`❌ Ngoài giờ làm việc (0 điểm)`)
  }
})

console.log('\n📈 THỐNG KÊ:')
console.log('='*30)

let morningCount = 0
let afternoonCount = 0
let outsideCount = 0

sampleRecords.forEach(record => {
  const vnTime = formatVietnamTime(record.recordTime)
  
  let matched = false
  for (const shift of shifts) {
    if (isTimeInShift(vnTime, shift)) {
      if (shift.id === 'morning') morningCount++
      else if (shift.id === 'afternoon') afternoonCount++
      matched = true
      break
    }
  }
  if (!matched) outsideCount++
})

console.log(`Ca sáng (07:00-11:00): ${morningCount} records`)
console.log(`Ca chiều (13:00-17:00): ${afternoonCount} records`) 
console.log(`Ngoài giờ: ${outsideCount} records`)

console.log('\n🎯 KẾT LUẬN:')
console.log('='*30)
if (afternoonCount > morningCount) {
  console.log('⚠️  CẢNH BÁO: Đa số records rơi vào ca chiều!')
  console.log('🔍 Cần kiểm tra lại dữ liệu máy chấm công có đúng timezone không')
} else {
  console.log('✅ Phân bố shifts hợp lý')
}

console.log('\n🚀 NEXT STEPS:')
console.log('1. Kiểm tra cấu hình timezone trên máy ZKTeco')
console.log('2. Xác nhận giờ làm việc thực tế')
console.log('3. Test với DataSyncManager để sync vào MongoDB')
