/**
 * Test script để kiểm tra logic sync ZK đã được sửa
 */

// Mock data từ ZK backend (giống format thật)
const zkMockData = [
  {
    recordTime: "2025-07-01T00:29:00.000Z", // 07:29 VN time
    deviceUserId: "39"
  },
  {
    recordTime: "2025-07-01T06:42:00.000Z", // 13:42 VN time  
    deviceUserId: "39"
  },
  {
    recordTime: "2025-07-01T00:54:00.000Z", // 07:54 VN time (ngoài giờ)
    deviceUserId: "3"
  },
  {
    recordTime: "2025-07-01T06:31:00.000Z", // 13:31 VN time
    deviceUserId: "3"
  }
]

// Mock functions từ zk-processor
function convertToVietnamTime(isoString) {
  return new Date(isoString)
}

function formatVietnamDate(isoString) {
  const date = new Date(isoString)
  return date.toISOString().split('T')[0]
}

function formatVietnamTime(isoString) {
  const date = new Date(isoString)
  const hours = (date.getUTCHours() + 7) % 24 // Convert UTC to VN time
  const minutes = date.getUTCMinutes()
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

function processZKAttendanceRecord(recordTime, deviceUserId) {
  const vnDate = convertToVietnamTime(recordTime)
  const date = formatVietnamDate(recordTime)
  const time = formatVietnamTime(recordTime)
  
  return {
    employeeId: deviceUserId,
    date,
    time,
    vnDate
  }
}

function categorizeCheckIns(checkIns, date) {
  if (checkIns.length === 0) return {}
  
  const sorted = [...checkIns].sort((a, b) => a.localeCompare(b))
  
  // Determine day of week (0 = Sunday, 1 = Monday, etc.)
  const dateObj = new Date(date)
  const dayOfWeek = dateObj.getDay()
  
  // Define shift ranges based on day of week
  let morningStart = 7 * 60      // 07:00
  let morningEnd = 7 * 60 + 45   // 07:45
  let afternoonStart = 13 * 60 + 30  // 13:30
  let afternoonEnd = 14 * 60         // 14:00
  
  if (dayOfWeek === 0) { // Sunday
    morningEnd = 8 * 60 + 45     // 08:45
    afternoonEnd = 14 * 60 + 45  // 14:45
  }
  
  // Find check-ins within actual shift ranges
  const morningCheckIn = sorted.find(time => {
    const [hour, minute] = time.split(':').map(Number)
    const timeInMinutes = hour * 60 + minute
    return timeInMinutes >= morningStart && timeInMinutes <= morningEnd
  })
  
  const afternoonCheckIn = sorted.find(time => {
    const [hour, minute] = time.split(':').map(Number)
    const timeInMinutes = hour * 60 + minute
    return timeInMinutes >= afternoonStart && timeInMinutes <= afternoonEnd
  })
  
  return { morningCheckIn, afternoonCheckIn }
}

// Simulate ZK sync logic
console.log('🧪 Testing ZK sync logic...')

// Group records by employeeId and date
const groupedRecords = new Map()

for (const record of zkMockData) {
  const processed = processZKAttendanceRecord(record.recordTime, record.deviceUserId)
  const key = `${processed.employeeId}-${processed.date}`
  
  if (!groupedRecords.has(key)) {
    groupedRecords.set(key, {
      employeeId: processed.employeeId,
      date: processed.date,
      checkIns: []
    })
  }
  
  const group = groupedRecords.get(key)
  if (!group.checkIns.includes(processed.time)) {
    group.checkIns.push(processed.time)
  }
}

console.log(`📊 Grouped into ${groupedRecords.size} unique employee-date combinations`)

// Process each group
for (const [key, groupData] of groupedRecords) {
  console.log(`\n👤 Processing ${key}:`)
  console.log(`   Check-ins: [${groupData.checkIns.join(', ')}]`)
  
  // Test new categorization logic
  const { morningCheckIn, afternoonCheckIn } = categorizeCheckIns(groupData.checkIns, groupData.date)
  
  console.log(`   📅 Date: ${groupData.date} (${new Date(groupData.date).toLocaleDateString('en-US', { weekday: 'long' })})`)
  console.log(`   🌅 Morning check-in: ${morningCheckIn || 'None (ngoài khung giờ)'}`)
  console.log(`   🌇 Afternoon check-in: ${afternoonCheckIn || 'None (ngoài khung giờ)'}`)
  
  // Calculate expected points
  const morningPoints = morningCheckIn ? 1 : 0
  const afternoonPoints = afternoonCheckIn ? 1 : 0
  const totalPoints = morningPoints + afternoonPoints
  
  console.log(`   💰 Expected points: ${morningPoints} + ${afternoonPoints} = ${totalPoints}`)
}

console.log('\n✅ ZK sync logic test completed!')
console.log('\n🎯 Expected improvements:')
console.log('   - Employee 39: 07:29 + 13:42 → 2 điểm (cả 2 trong khung giờ)')
console.log('   - Employee 3: 07:54 + 13:31 → 1 điểm (chỉ chiều trong khung giờ)')
console.log('   - Logic dựa trên khung giờ thực tế, không phải < 12h và >= 12h')
