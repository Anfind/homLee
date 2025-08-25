// Test logic tính điểm với data thật từ máy chấm công

// Simulate the conversion process
function convertToVietnamTime(utcTimeString) {
  const utcDate = new Date(utcTimeString)
  // Vietnam is UTC+7
  const vnDate = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000))
  return vnDate
}

function formatVietnamDate(utcTimeString) {
  const vnDate = convertToVietnamTime(utcTimeString)
  return vnDate.toISOString().split('T')[0]
}

function formatVietnamTime(utcTimeString) {
  const vnDate = convertToVietnamTime(utcTimeString)
  const hours = vnDate.getUTCHours().toString().padStart(2, '0')
  const minutes = vnDate.getUTCMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
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

// Default settings (same as in TypeScript)
const defaultSettings = {
  0: { // Sunday
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
  // Add other days (similar pattern)
  2: { shifts: [
      { id: "tue-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "07:45", points: 1 },
      { id: "tue-shift-2", name: "Ca chiều", startTime: "13:30", endTime: "14:00", points: 1 },
    ]},
  3: { shifts: [
      { id: "wed-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "07:45", points: 1 },
      { id: "wed-shift-2", name: "Ca chiều", startTime: "13:30", endTime: "14:00", points: 1 },
    ]},
  4: { shifts: [
      { id: "thu-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "07:45", points: 1 },
      { id: "thu-shift-2", name: "Ca chiều", startTime: "13:30", endTime: "14:00", points: 1 },
    ]},
  5: { shifts: [
      { id: "fri-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "07:45", points: 1 },
      { id: "fri-shift-2", name: "Ca chiều", startTime: "13:30", endTime: "14:00", points: 1 },
    ]},
  6: { shifts: [
      { id: "sat-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "07:45", points: 1 },
      { id: "sat-shift-2", name: "Ca chiều", startTime: "13:30", endTime: "14:00", points: 1 },
    ]}
}

// Test data from cur.txt
const testRecords = [
  { "recordTime": "2025-08-19T00:20:42.000Z", "deviceUserId": "30" },
  { "recordTime": "2025-08-18T07:04:24.000Z", "deviceUserId": "1" },
  { "recordTime": "2025-08-18T07:07:37.000Z", "deviceUserId": "1" },
  { "recordTime": "2025-08-19T00:29:35.000Z", "deviceUserId": "61" }
]

console.log('🧪 TESTING POINT CALCULATION LOGIC WITH REAL DATA\n')

testRecords.forEach((record, index) => {
  console.log(`\n=== TEST ${index + 1}: ${record.deviceUserId} ===`)
  console.log(`UTC Time: ${record.recordTime}`)
  
  // 1. Convert time
  const vnDate = convertToVietnamTime(record.recordTime)
  const date = formatVietnamDate(record.recordTime)
  const time = formatVietnamTime(record.recordTime)
  
  console.log(`VN Date: ${vnDate.toISOString()}`)
  console.log(`Date: ${date}`)
  console.log(`Time: ${time}`)
  
  // 2. Get day of week
  const dayOfWeek = new Date(date + 'T00:00:00').getDay()
  console.log(`Day of week: ${dayOfWeek} (0=Sun, 1=Mon...)`)
  
  // 3. Check shifts for this day
  const dayShifts = defaultSettings[dayOfWeek]?.shifts || []
  console.log(`Available shifts:`)
  dayShifts.forEach(shift => {
    console.log(`  ${shift.name}: ${shift.startTime}-${shift.endTime} (${shift.points} points)`)
  })
  
  // 4. Test if time fits in any shift
  let totalPoints = 0
  const awardedShifts = []
  
  dayShifts.forEach(shift => {
    const inShift = isTimeInShift(time, shift)
    console.log(`  ⚡ ${time} in ${shift.name} (${shift.startTime}-${shift.endTime}): ${inShift}`)
    
    if (inShift) {
      totalPoints += shift.points
      awardedShifts.push(shift)
    }
  })
  
  console.log(`🎯 RESULT: ${totalPoints} points, ${awardedShifts.length} shifts`)
  if (awardedShifts.length === 0) {
    console.log('❌ NO POINTS AWARDED - THIS IS THE PROBLEM!')
  }
})
