const { processZKAttendanceRecord, calculateDailyPoints, getDefaultCheckInSettings, isTimeInShift } = require('./core/lib/attendance/zk-processor.ts')

// Test data từ file cur.txt
const testRecord = {
  "recordTime": "2025-08-19T00:20:42.000Z",
  "deviceUserId": "30"
}

console.log('🧪 TESTING POINT CALCULATION LOGIC\n')

// 1. Test conversion
console.log('1️⃣ Testing ZK record processing:')
const processed = processZKAttendanceRecord(testRecord.recordTime, testRecord.deviceUserId)
console.log('Processed:', processed)

// 2. Test point calculation
console.log('\n2️⃣ Testing point calculation:')
const settings = getDefaultCheckInSettings()
const dayOfWeek = new Date(processed.date + 'T00:00:00').getDay()
console.log(`Date: ${processed.date}, Day of week: ${dayOfWeek}`)
console.log(`Available shifts for day ${dayOfWeek}:`, settings[dayOfWeek].shifts)

const pointsResult = calculateDailyPoints(processed.date, [processed.time], settings)
console.log('Points result:', pointsResult)

// 3. Test isTimeInShift specifically
console.log('\n3️⃣ Testing isTimeInShift function:')
const shifts = settings[dayOfWeek].shifts
shifts.forEach(shift => {
  const inShift = isTimeInShift(processed.time, shift)
  console.log(`${processed.time} in ${shift.name} (${shift.startTime}-${shift.endTime}): ${inShift}`)
})
