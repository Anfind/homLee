/**
 * Test với data từ máy chấm công thực
 * Test case: 04-03-25 với 07:29 và 13:42
 */

// Mock data từ ZK machine của bạn
const zkTestData = {
  'STT': 1,
  'Ngày': '04-03-25',
  'ID': '00039',
  'Họ và Tên': 'Nhân viên 39',
  'Giờ Vào': '07:29',
  'Giờ Ra': '13:42'
}

// Mock parseTimeFromMultipleFormats function
function parseTimeFromMultipleFormats(timeValue) {
  if (!timeValue || timeValue === '') return null
  
  const timeStr = timeValue.toString().trim()
  
  // Try HH:MM format
  const hhmmMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/)
  if (hhmmMatch) {
    const [, hours, minutes] = hhmmMatch
    return `${hours.padStart(2, '0')}:${minutes}`
  }
  
  return null
}

// Simulate processing logic
console.log('🧪 Testing with ZK machine data...')
console.log('📝 Input data:', zkTestData)

const checkIns = []

// Parse morning check-in time (Giờ Vào = Check-in lần 1)
const morningCheckInTime = parseTimeFromMultipleFormats(zkTestData['Giờ Vào'])
if (morningCheckInTime && !checkIns.includes(morningCheckInTime)) {
  checkIns.push(morningCheckInTime)
  console.log(`✅ Added morning check-in: ${morningCheckInTime}`)
}

// Parse afternoon check-in time (Giờ Ra = Check-in lần 2) 
const afternoonCheckInTime = parseTimeFromMultipleFormats(zkTestData['Giờ Ra'])
if (afternoonCheckInTime && !checkIns.includes(afternoonCheckInTime)) {
  checkIns.push(afternoonCheckInTime)
  console.log(`✅ Added afternoon check-in: ${afternoonCheckInTime}`)
}

console.log(`\n📊 Final check-ins array: [${checkIns.join(', ')}]`)

// Test categorization logic
const date = '2025-03-04' // Tuesday

const morningCheckIn = checkIns.find(time => {
  const [hour, minute] = time.split(':').map(Number)
  const timeInMinutes = hour * 60 + minute
  const morningStart = 7 * 60     // 07:00
  const morningEndWeekday = 7 * 60 + 45  // 07:45
  const morningEndSunday = 8 * 60 + 45   // 08:45
  
  const dateObj = new Date(date)
  const dayOfWeek = dateObj.getDay() // 0 = Sunday, 1 = Monday, etc.
  const morningEnd = dayOfWeek === 0 ? morningEndSunday : morningEndWeekday
  
  console.log(`  - Checking ${time}: ${timeInMinutes} vs range ${morningStart}-${morningEnd}`)
  
  return timeInMinutes >= morningStart && timeInMinutes <= morningEnd
})

const afternoonCheckIn = checkIns.find(time => {
  const [hour, minute] = time.split(':').map(Number)
  const timeInMinutes = hour * 60 + minute
  const afternoonStart = 13 * 60 + 30    // 13:30
  const afternoonEndWeekday = 14 * 60    // 14:00
  const afternoonEndSunday = 14 * 60 + 45 // 14:45
  
  const dateObj = new Date(date)
  const dayOfWeek = dateObj.getDay() // 0 = Sunday, 1 = Monday, etc.
  const afternoonEnd = dayOfWeek === 0 ? afternoonEndSunday : afternoonEndWeekday
  
  console.log(`  - Checking ${time}: ${timeInMinutes} vs range ${afternoonStart}-${afternoonEnd}`)
  
  return timeInMinutes >= afternoonStart && timeInMinutes <= afternoonEnd
})

console.log(`\n🎯 Categorization results for ${date} (Tuesday):`)
console.log(`   Morning check-in: ${morningCheckIn || 'None (ngoài khung giờ)'}`)
console.log(`   Afternoon check-in: ${afternoonCheckIn || 'None (ngoài khung giờ)'}`)

// Expected behavior for 07:29 và 13:42:
// - 07:29 trong khung 07:00-07:45 → 1 điểm sáng
// - 13:42 ngoài khung 13:30-14:00 → 0 điểm chiều
// Total: 1 điểm? (nhưng data ZK cho 2 điểm)

console.log('\n📈 Expected points calculation:')
console.log('   07:29 → Trong khung sáng (07:00-07:45) → 1 điểm ✅')
console.log('   13:42 → Ngoài khung chiều (13:30-14:00) → 0 điểm ❌')
console.log('   Total: 1 điểm (nhưng ZK data cho 2 điểm - cần kiểm tra)')

console.log('\n🏁 Test completed!')
