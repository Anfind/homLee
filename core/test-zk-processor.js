import { 
  processZKAttendanceRecord, 
  calculateDailyPoints, 
  categorizeCheckIns,
  convertToVietnamTime,
  formatVietnamDate,
  formatVietnamTime,
  getCheckInSettings 
} from './lib/attendance/zk-processor.js'

console.log('🧪 Testing ZK Attendance Processing Logic...\n')

// Test data mẫu từ máy chấm công
const testRecords = [
  {
    deviceUserId: "1",
    recordTime: "2025-01-15T01:30:00.000Z", // UTC time (8:30 VN)
    ip: "192.168.1.240"
  },
  {
    deviceUserId: "1", 
    recordTime: "2025-01-15T07:00:00.000Z", // UTC time (14:00 VN)
    ip: "192.168.1.240"
  },
  {
    deviceUserId: "2",
    recordTime: "2025-01-15T02:15:00.000Z", // UTC time (9:15 VN)
    ip: "192.168.1.240"
  }
]

console.log('📋 Test Records:')
testRecords.forEach((record, i) => {
  console.log(`${i+1}. Employee ${record.deviceUserId}: ${record.recordTime}`)
})

console.log('\n🔄 Processing Records...\n')

const checkInSettings = getCheckInSettings()
const groupedData = new Map()

// Process each record
testRecords.forEach((record, i) => {
  console.log(`\n--- Processing Record ${i+1} ---`)
  
  const processed = processZKAttendanceRecord(record.recordTime, record.deviceUserId, checkInSettings)
  const key = `${processed.employeeId}-${processed.date}`
  
  console.log(`📅 VN Date: ${processed.date}`)
  console.log(`⏰ VN Time: ${processed.time}`)
  console.log(`🏢 Employee: ${processed.employeeId}`)
  
  if (!groupedData.has(key)) {
    groupedData.set(key, {
      employeeId: processed.employeeId,
      date: processed.date,
      checkIns: []
    })
  }
  
  const group = groupedData.get(key)
  if (!group.checkIns.includes(processed.time)) {
    group.checkIns.push(processed.time)
  }
})

console.log('\n💰 Calculating Points...\n')

// Calculate points for each employee-date
for (const [key, groupData] of groupedData) {
  console.log(`\n--- Employee ${groupData.employeeId} on ${groupData.date} ---`)
  console.log(`Check-ins: ${groupData.checkIns.join(', ')}`)
  
  // Calculate points
  const pointsResult = calculateDailyPoints(
    groupData.date, 
    groupData.checkIns, 
    checkInSettings
  )
  
  console.log(`📊 Total Points: ${pointsResult.totalPoints}`)
  console.log(`🎯 Awarded Shifts:`)
  pointsResult.awardedShifts.forEach(shift => {
    console.log(`   • ${shift.shiftName} at ${shift.checkInTime}: ${shift.points} points`)
  })
  
  // Test categorization
  const { morningCheckIn, afternoonCheckIn } = categorizeCheckIns(groupData.checkIns)
  console.log(`🌅 Morning Check-in: ${morningCheckIn || 'None'}`)
  console.log(`🌆 Afternoon Check-in: ${afternoonCheckIn || 'None'}`)
}

console.log('\n✅ Test Complete!')

// Test timezone conversion edge cases
console.log('\n🌍 Testing Timezone Edge Cases...')

const edgeCases = [
  "2025-01-15T16:59:59.000Z", // 23:59:59 VN (cuối ngày)
  "2025-01-15T17:00:00.000Z", // 00:00:00 VN (đầu ngày hôm sau)
  "2025-01-15T23:30:00.000Z", // 06:30:00 VN (sáng sớm)
]

edgeCases.forEach((time, i) => {
  const vnDate = convertToVietnamTime(time)
  const date = formatVietnamDate(time)
  const formattedTime = formatVietnamTime(time)
  
  console.log(`${i+1}. ${time} → VN: ${vnDate.toISOString()} → ${date} ${formattedTime}`)
})

console.log('\n🎉 All tests completed!')
