/**
 * Test script để verify logic import đã sửa
 * Test case: 01-07-25 với Giờ Vào: 07:54:53, Giờ Ra: 13:31:28
 */

// Mock data từ Excel import của bạn
const testData = {
  'STT': 1,
  'Ngày': '01-07-25',
  'ID': '00003',
  'Họ và Tên': 'Thúy',
  'Giờ Vào': '07:54:53',
  'Giờ Ra': '13:31:28'
}

// Mock parseTimeFromMultipleFormats function
function parseTimeFromMultipleFormats(timeValue) {
  if (!timeValue || timeValue === '') return null
  
  const timeStr = timeValue.toString().trim()
  
  // Try HH:MM:SS format (e.g., "07:54:53")
  const hhmmssMatch = timeStr.match(/^(\d{1,2}):(\d{2}):(\d{2})$/)
  if (hhmmssMatch) {
    const [, hours, minutes] = hhmmssMatch
    return `${hours.padStart(2, '0')}:${minutes}`
  }
  
  return null
}

// Simulate processing logic
console.log('🧪 Testing new import logic...')
console.log('📝 Input data:', testData)

const checkIns = []

// Parse morning check-in time (Giờ Vào = Check-in lần 1)
const morningCheckInTime = parseTimeFromMultipleFormats(testData['Giờ Vào'])
if (morningCheckInTime && !checkIns.includes(morningCheckInTime)) {
  checkIns.push(morningCheckInTime)
  console.log(`✅ Added morning check-in: ${morningCheckInTime}`)
}

// Parse afternoon check-in time (Giờ Ra = Check-in lần 2) 
const afternoonCheckInTime = parseTimeFromMultipleFormats(testData['Giờ Ra'])
if (afternoonCheckInTime && !checkIns.includes(afternoonCheckInTime)) {
  checkIns.push(afternoonCheckInTime)
  console.log(`✅ Added afternoon check-in: ${afternoonCheckInTime}`)
}

console.log(`\n📊 Final check-ins array: [${checkIns.join(', ')}]`)

// Test categorization logic
const date = '2025-07-01' // Tuesday

const morningCheckIn = checkIns.find(time => {
  const [hour, minute] = time.split(':').map(Number)
  const timeInMinutes = hour * 60 + minute
  const morningStart = 7 * 60     // 07:00
  const morningEndWeekday = 7 * 60 + 45  // 07:45
  const morningEndSunday = 8 * 60 + 45   // 08:45
  
  const dateObj = new Date(date)
  const dayOfWeek = dateObj.getDay() // 0 = Sunday, 1 = Monday, etc.
  const morningEnd = dayOfWeek === 0 ? morningEndSunday : morningEndWeekday
  
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
  
  return timeInMinutes >= afternoonStart && timeInMinutes <= afternoonEnd
})

console.log(`\n🎯 Categorization results for ${date} (Tuesday):`)
console.log(`   Morning check-in: ${morningCheckIn || 'None (ngoài khung giờ)'}`)
console.log(`   Afternoon check-in: ${afternoonCheckIn || 'None (ngoài khung giờ)'}`)

// Expected behavior for 07:54 và 13:31:
// - 07:54 ngoài khung 07:00-07:45 → 0 điểm sáng
// - 13:31 trong khung 13:30-14:00 → 1 điểm chiều
// Total: 1 điểm

console.log('\n📈 Expected points calculation:')
console.log('   07:54 → Ngoài khung sáng (07:00-07:45) → 0 điểm ❌')
console.log('   13:31 → Trong khung chiều (13:30-14:00) → 1 điểm ✅')
console.log('   Total: 1 điểm')

console.log('\n🏁 Test completed!')
