// Test full sync logic với data từ JSON
const fs = require('fs')
const path = require('path')

console.log('🧪 Testing Full Sync Logic với data từ JSON file...\n')

// Import cùng logic từ zk-processor
function convertToVietnamTime(isoString) {
  const utcDate = new Date(isoString)
  const systemOffset = utcDate.getTimezoneOffset()
  const vnOffset = -420 // VN = UTC+7 = -420 minutes
  
  if (systemOffset === vnOffset) {
    // Already in VN timezone
    console.log(`  🕐 System in VN timezone, no conversion needed`)
    return utcDate
  } else {
    // Need conversion
    console.log(`  🕐 Converting from system TZ (${systemOffset}min) to VN timezone`)
    const vnString = utcDate.toLocaleString("sv-SE", {
      timeZone: "Asia/Ho_Chi_Minh"
    })
    return new Date(vnString)
  }
}

function formatVietnamDate(isoString) {
  const vnDate = convertToVietnamTime(isoString)
  const year = vnDate.getFullYear()
  const month = (vnDate.getMonth() + 1).toString().padStart(2, '0')
  const day = vnDate.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
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

// Đọc data từ file JSON
console.log('📁 Reading data from time.json...')
const timeData = JSON.parse(fs.readFileSync(path.join(__dirname, '../zktceo-backend/log/time.json'), 'utf8'))
const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../zktceo-backend/log/users.json'), 'utf8'))

console.log(`Found ${timeData.data.length} attendance records`)
console.log(`Found ${usersData.data.length} users`)

// Tạo map user để lookup
const userMap = {}
usersData.data.forEach(user => {
  userMap[user.userId] = user // Fix: use userId instead of deviceUserId
})

// Test với 10 records đầu tiên
console.log('\n🔍 Testing với 10 records đầu tiên:')
const testRecords = timeData.data.slice(0, 10)

// Mock shifts configuration
const shifts = [
  { id: "morning", name: "Ca sáng", startTime: "07:00", endTime: "11:00", points: 1 },
  { id: "afternoon", name: "Ca chiều", startTime: "13:00", endTime: "17:00", points: 1 },
  { id: "overtime", name: "Tăng ca", startTime: "18:00", endTime: "22:00", points: 1.5 }
]

function isTimeInShift(checkInTime, shift) {
  const [checkHour, checkMin] = checkInTime.split(':').map(Number)
  const [startHour, startMin] = shift.startTime.split(':').map(Number)
  const [endHour, endMin] = shift.endTime.split(':').map(Number)
  
  const checkMinutes = checkHour * 60 + checkMin
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  return checkMinutes >= startMinutes && checkMinutes <= endMinutes
}

// Simulate sync process
const processedRecords = {}

testRecords.forEach((record, index) => {
  console.log(`\n--- Record ${index + 1} ---`)
  console.log(`User ID: ${record.deviceUserId}`)
  console.log(`Original Time: ${record.recordTime}`)
  
  // Find user info
  const user = userMap[record.deviceUserId]
  if (!user) {
    console.log(`❌ User not found for deviceUserId: ${record.deviceUserId}`)
    return
  }
  
  console.log(`User Name: ${user.name}`)
  
  // Convert timezone
  const vnDate = formatVietnamDate(record.recordTime)
  const vnTime = formatVietnamTime(record.recordTime)
  
  console.log(`VN Date: ${vnDate}`)
  console.log(`VN Time: ${vnTime}`)
  
  // Calculate points
  let awardedPoints = 0
  let awardedShift = null
  
  for (const shift of shifts) {
    if (isTimeInShift(vnTime, shift)) {
      awardedPoints = shift.points
      awardedShift = shift.name
      break
    }
  }
  
  console.log(`Points: ${awardedPoints}`)
  console.log(`Shift: ${awardedShift || 'Ngoài giờ'}`)
  
  // Group by employee + date (như trong API thực)
  const recordKey = `${record.deviceUserId}_${vnDate}`
  
  if (!processedRecords[recordKey]) {
    processedRecords[recordKey] = {
      employeeId: record.deviceUserId,
      userName: user.name,
      date: vnDate,
      checkIns: [],
      totalPoints: 0
    }
  }
  
  processedRecords[recordKey].checkIns.push({
    time: vnTime,
    points: awardedPoints,
    shift: awardedShift
  })
  processedRecords[recordKey].totalPoints += awardedPoints
})

// Summary
console.log('\n📊 SUMMARY BY EMPLOYEE & DATE:')
Object.values(processedRecords).forEach(record => {
  console.log(`\n👤 ${record.userName} (ID: ${record.employeeId}) - ${record.date}`)
  console.log(`   Check-ins: ${record.checkIns.length}`)
  record.checkIns.forEach((checkin, i) => {
    console.log(`   ${i+1}. ${checkin.time} - ${checkin.points} points (${checkin.shift || 'Ngoài giờ'})`)
  })
  console.log(`   Total Points: ${record.totalPoints}`)
})

// Statistics
console.log('\n📈 STATISTICS:')
const totalRecords = Object.keys(processedRecords).length
const totalPoints = Object.values(processedRecords).reduce((sum, record) => sum + record.totalPoints, 0)
const avgPointsPerRecord = totalPoints / totalRecords

console.log(`Total processed records: ${totalRecords}`)
console.log(`Total points awarded: ${totalPoints}`)
console.log(`Average points per employee-date: ${avgPointsPerRecord.toFixed(2)}`)

// Test với một số time zones khác nhau trong data
console.log('\n🌍 TIMEZONE CONVERSION SAMPLES:')
const sampleTimes = [
  "2025-07-25T00:18:43.000Z", // Sáng sớm
  "2025-07-25T06:30:00.000Z", // Sáng
  "2025-07-25T10:00:00.000Z", // Trưa
  "2025-07-25T13:45:00.000Z"  // Chiều
]

sampleTimes.forEach(time => {
  const vnTime = formatVietnamTime(time)
  const vnDate = formatVietnamDate(time)
  
  // Check shift
  let shift = 'Ngoài giờ'
  for (const s of shifts) {
    if (isTimeInShift(vnTime, s)) {
      shift = s.name
      break
    }
  }
  
  console.log(`${time} → ${vnDate} ${vnTime} (${shift})`)
})

console.log('\n✅ Test completed! Logic should be working correctly with fixed timezone.')
