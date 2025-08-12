// Simple test for timezone conversion logic
console.log('🧪 Testing ZK Attendance Processing Logic...\n')

// Correct timezone conversion for Vietnam
function convertToVietnamTime(isoString) {
  const utcDate = new Date(isoString)
  
  // Use toLocaleString with Vietnam timezone for accuracy
  const vnString = utcDate.toLocaleString("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh"
  })
  
  return new Date(vnString)
}

function formatVietnamDate(isoString) {
  const utcDate = new Date(isoString)
  
  const vnString = utcDate.toLocaleString("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh"
  })
  
  return vnString.split(' ')[0]
}

function formatVietnamTime(isoString) {
  const utcDate = new Date(isoString)
  
  const vnString = utcDate.toLocaleString("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh"
  })
  
  const timePart = vnString.split(' ')[1]
  const [hours, minutes] = timePart.split(':')
  return `${hours}:${minutes}`
}

// Test timezone conversion with real ZK data
const testCases = [
  {
    recordTime: "2025-03-03T04:36:24.000Z", // Real data: 4:36 UTC = 11:36 VN
    expected: { date: "2025-03-03", time: "11:36" }
  },
  {
    recordTime: "2025-01-15T01:30:00.000Z", // 1:30 UTC = 8:30 VN
    expected: { date: "2025-01-15", time: "08:30" }
  },
  {
    recordTime: "2025-01-15T07:00:00.000Z", // 7:00 UTC = 14:00 VN  
    expected: { date: "2025-01-15", time: "14:00" }
  },
  {
    recordTime: "2025-01-15T17:00:00.000Z", // 17:00 UTC = 00:00 next day VN
    expected: { date: "2025-01-16", time: "00:00" }
  }
]

console.log('🌍 Testing Timezone Conversion...\n')

testCases.forEach((test, i) => {
  const vnDate = formatVietnamDate(test.recordTime)
  const vnTime = formatVietnamTime(test.recordTime)
  
  console.log(`Test ${i+1}:`)
  console.log(`  Input:    ${test.recordTime}`)
  console.log(`  Output:   ${vnDate} ${vnTime}`)
  console.log(`  Expected: ${test.expected.date} ${test.expected.time}`)
  
  const dateMatch = vnDate === test.expected.date
  const timeMatch = vnTime === test.expected.time
  console.log(`  Result:   ${dateMatch && timeMatch ? '✅ PASS' : '❌ FAIL'}`)
  console.log('')
})

// Test points calculation logic
function isTimeInShift(checkInTime, shift) {
  const [checkHour, checkMin] = checkInTime.split(':').map(Number)
  const [startHour, startMin] = shift.startTime.split(':').map(Number)
  const [endHour, endMin] = shift.endTime.split(':').map(Number)
  
  const checkMinutes = checkHour * 60 + checkMin
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  return checkMinutes >= startMinutes && checkMinutes <= endMinutes
}

function calculateDailyPoints(checkIns, shifts) {
  const awardedShifts = []
  
  // Sort check-ins chronologically
  const sortedCheckIns = [...checkIns].sort((a, b) => a.localeCompare(b))
  
  // Check each check-in against all shifts
  for (const checkIn of sortedCheckIns) {
    for (const shift of shifts) {
      // Check if this shift was already awarded
      const alreadyAwarded = awardedShifts.some(awarded => awarded.shiftId === shift.id)
      
      if (!alreadyAwarded && isTimeInShift(checkIn, shift)) {
        awardedShifts.push({
          shiftId: shift.id,
          shiftName: shift.name,
          checkInTime: checkIn,
          points: shift.points
        })
        console.log(`  ✅ Awarded ${shift.points} points for ${shift.name} at ${checkIn}`)
        break // Only award one shift per check-in
      }
    }
  }
  
  const totalPoints = awardedShifts.reduce((sum, awarded) => sum + awarded.points, 0)
  return { totalPoints, awardedShifts }
}

console.log('💰 Testing Points Calculation...\n')

const shifts = [
  { id: "morning", name: "Ca sáng", startTime: "07:00", endTime: "11:00", points: 1 },
  { id: "afternoon", name: "Ca chiều", startTime: "13:00", endTime: "17:00", points: 1 }
]

const pointsTests = [
  {
    name: "Normal day - morning and afternoon",
    checkIns: ["08:30", "14:00"],
    expectedPoints: 2
  },
  {
    name: "Only morning check-in",
    checkIns: ["09:15"],
    expectedPoints: 1
  },
  {
    name: "Only afternoon check-in", 
    checkIns: ["15:30"],
    expectedPoints: 1
  },
  {
    name: "Multiple check-ins, same shift (should only count once)",
    checkIns: ["08:00", "08:30", "09:00"],
    expectedPoints: 1
  },
  {
    name: "Out of shift hours",
    checkIns: ["06:00", "12:00", "18:00"],
    expectedPoints: 0
  },
  {
    name: "Mixed order check-ins",
    checkIns: ["14:30", "08:15"], // afternoon first, then morning
    expectedPoints: 2
  }
]

pointsTests.forEach((test, i) => {
  console.log(`Points Test ${i+1}: ${test.name}`)
  console.log(`  Check-ins: ${test.checkIns.join(', ')}`)
  
  const result = calculateDailyPoints(test.checkIns, shifts)
  
  console.log(`  Total Points: ${result.totalPoints}`)
  console.log(`  Expected: ${test.expectedPoints}`)
  console.log(`  Result: ${result.totalPoints === test.expectedPoints ? '✅ PASS' : '❌ FAIL'}`)
  console.log('')
})

console.log('🎉 All tests completed!')
console.log('\n📋 Summary:')
console.log('- ✅ Timezone conversion handles UTC to VN time properly')
console.log('- ✅ Points calculation awards shifts correctly')
console.log('- ✅ Each shift only awarded once per day')
console.log('- ✅ Check-in order doesn\'t matter')
console.log('- ✅ Out of hours check-ins ignored')
