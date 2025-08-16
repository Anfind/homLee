/**
 * Test script để kiểm tra logic import mới
 * Test case: 01-07-25 với 07:54:53 và 13:31:28
 */

// Simulate the logic from route.ts
function categorizeCheckIns(checkIns, date) {
  console.log(`\n📅 Testing date: ${date}`)
  console.log(`🕐 Check-ins: ${checkIns.join(', ')}`)
  
  const morningCheckIn = checkIns.find(time => {
    const [hour, minute] = time.split(':').map(Number)
    const timeInMinutes = hour * 60 + minute
    // Morning shift: 07:00-07:45 (Mon-Sat) or 07:00-08:45 (Sun)
    const morningStart = 7 * 60     // 07:00
    const morningEndWeekday = 7 * 60 + 45  // 07:45
    const morningEndSunday = 8 * 60 + 45   // 08:45
    
    // Check day of week to determine morning end time
    const dateObj = new Date(date)
    const dayOfWeek = dateObj.getDay() // 0 = Sunday, 1 = Monday, etc.
    const morningEnd = dayOfWeek === 0 ? morningEndSunday : morningEndWeekday
    
    console.log(`  - Checking ${time}: ${timeInMinutes} minutes`)
    console.log(`  - Morning range: ${morningStart}-${morningEnd} minutes`)
    console.log(`  - Day of week: ${dayOfWeek} (${dayOfWeek === 0 ? 'Sunday' : 'Weekday'})`)
    
    const inMorningRange = timeInMinutes >= morningStart && timeInMinutes <= morningEnd
    console.log(`  - In morning range: ${inMorningRange}`)
    
    return inMorningRange
  })

  const afternoonCheckIn = checkIns.find(time => {
    const [hour, minute] = time.split(':').map(Number)
    const timeInMinutes = hour * 60 + minute
    // Afternoon shift: 13:30-14:00 (Mon-Sat) or 13:30-14:45 (Sun)
    const afternoonStart = 13 * 60 + 30    // 13:30
    const afternoonEndWeekday = 14 * 60    // 14:00
    const afternoonEndSunday = 14 * 60 + 45 // 14:45
    
    // Check day of week to determine afternoon end time
    const dateObj = new Date(date)
    const dayOfWeek = dateObj.getDay() // 0 = Sunday, 1 = Monday, etc.
    const afternoonEnd = dayOfWeek === 0 ? afternoonEndSunday : afternoonEndWeekday
    
    console.log(`  - Checking ${time}: ${timeInMinutes} minutes`)
    console.log(`  - Afternoon range: ${afternoonStart}-${afternoonEnd} minutes`)
    console.log(`  - Day of week: ${dayOfWeek} (${dayOfWeek === 0 ? 'Sunday' : 'Weekday'})`)
    
    const inAfternoonRange = timeInMinutes >= afternoonStart && timeInMinutes <= afternoonEnd
    console.log(`  - In afternoon range: ${inAfternoonRange}`)
    
    return inAfternoonRange
  })
  
  return { morningCheckIn, afternoonCheckIn }
}

// Test cases
console.log('🧪 Testing import logic with real data...')

// Test case 1: Data from your import (should be Tuesday 01-07-2025)
const testCase1 = {
  date: '2025-07-01',  // Tuesday
  checkIns: ['07:54', '13:31']
}

const result1 = categorizeCheckIns(testCase1.checkIns, testCase1.date)
console.log(`\n✅ Result for ${testCase1.date}:`)
console.log(`   Morning check-in: ${result1.morningCheckIn || 'None'}`)
console.log(`   Afternoon check-in: ${result1.afternoonCheckIn || 'None'}`)

// Test case 2: Data from ZK machine (Tuesday 04-03-2025)
const testCase2 = {
  date: '2025-03-04',  // Tuesday  
  checkIns: ['07:29', '13:42']
}

const result2 = categorizeCheckIns(testCase2.checkIns, testCase2.date)
console.log(`\n✅ Result for ${testCase2.date}:`)
console.log(`   Morning check-in: ${result2.morningCheckIn || 'None'}`)
console.log(`   Afternoon check-in: ${result2.afternoonCheckIn || 'None'}`)

// Test case 3: Edge case - check times at exact boundaries
const testCase3 = {
  date: '2025-07-06',  // Sunday
  checkIns: ['07:45', '13:30']  // Morning boundary for weekday, afternoon start
}

const result3 = categorizeCheckIns(testCase3.checkIns, testCase3.date)
console.log(`\n✅ Result for ${testCase3.date} (Sunday):`)
console.log(`   Morning check-in: ${result3.morningCheckIn || 'None'}`)
console.log(`   Afternoon check-in: ${result3.afternoonCheckIn || 'None'}`)

console.log('\n🏁 Test completed!')
