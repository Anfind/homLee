/**
 * Test script với logic mới - test các trường hợp edge
 */

console.log('🧪 Testing new logic - edge cases...')

// Test case 1: Chỉ check-in chiều, nhảy lên cột "Giờ Vào"
const testCase1 = {
  'Giờ Vào': '13:35',  // Chỉ có check-in chiều
  'Giờ Ra': ''         // Không có check-in lần 2
}

// Test case 2: Check-in cả 2 ca
const testCase2 = {
  'Giờ Vào': '07:30',  // Check-in sáng
  'Giờ Ra': '13:40'    // Check-in chiều
}

// Test case 3: Chỉ check-in sáng
const testCase3 = {
  'Giờ Vào': '07:20',  // Chỉ có check-in sáng
  'Giờ Ra': ''         // Không có check-in lần 2
}

// Test case 4: Check-in muộn sáng, vẫn có chiều
const testCase4 = {
  'Giờ Vào': '08:00',  // Check-in sáng muộn (ngoài giờ)
  'Giờ Ra': '13:35'    // Check-in chiều đúng giờ
}

function parseTimeFromMultipleFormats(timeValue) {
  if (!timeValue || timeValue === '') return null
  
  const timeStr = timeValue.toString().trim()
  
  const hhmmMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/)
  if (hhmmMatch) {
    const [, hours, minutes] = hhmmMatch
    return `${hours.padStart(2, '0')}:${minutes}`
  }
  
  return null
}

function processCheckIns(testData, caseName) {
  console.log(`\n📋 ${caseName}:`)
  console.log(`   Input: Giờ Vào=${testData['Giờ Vào']}, Giờ Ra=${testData['Giờ Ra']}`)
  
  const checkIns = []
  
  // Parse check-in time từ cột "Giờ Vào" (check-in lần 1)
  const checkInTime1 = parseTimeFromMultipleFormats(testData['Giờ Vào'])
  if (checkInTime1 && !checkIns.includes(checkInTime1)) {
    checkIns.push(checkInTime1)
  }

  // Parse check-in time từ cột "Giờ Ra" (check-in lần 2, nếu có)
  const checkInTime2 = parseTimeFromMultipleFormats(testData['Giờ Ra'])
  if (checkInTime2 && !checkIns.includes(checkInTime2)) {
    checkIns.push(checkInTime2)
  }
  
  console.log(`   Processed: [${checkIns.join(', ')}]`)
  
  // Simulate categorization based on time ranges
  const morningCheckIn = checkIns.find(time => {
    const [hour, minute] = time.split(':').map(Number)
    const timeInMinutes = hour * 60 + minute
    return timeInMinutes >= 420 && timeInMinutes <= 465 // 07:00-07:45
  })
  
  const afternoonCheckIn = checkIns.find(time => {
    const [hour, minute] = time.split(':').map(Number)
    const timeInMinutes = hour * 60 + minute
    return timeInMinutes >= 810 && timeInMinutes <= 840 // 13:30-14:00
  })
  
  console.log(`   Morning: ${morningCheckIn || 'None'} (${morningCheckIn ? '1 điểm' : '0 điểm'})`)
  console.log(`   Afternoon: ${afternoonCheckIn || 'None'} (${afternoonCheckIn ? '1 điểm' : '0 điểm'})`)
  
  const totalPoints = (morningCheckIn ? 1 : 0) + (afternoonCheckIn ? 1 : 0)
  console.log(`   Total: ${totalPoints} điểm`)
  
  return { checkIns, morningCheckIn, afternoonCheckIn, totalPoints }
}

// Run tests
processCheckIns(testCase1, 'Case 1: Chỉ check-in chiều')
processCheckIns(testCase2, 'Case 2: Check-in cả 2 ca')
processCheckIns(testCase3, 'Case 3: Chỉ check-in sáng')
processCheckIns(testCase4, 'Case 4: Check-in sáng muộn + chiều đúng giờ')

console.log('\n🎯 Logic này cho phép:')
console.log('   - Check-in chiều có thể ở cột "Giờ Vào" nếu không có check-in sáng')
console.log('   - Mỗi thời gian được kiểm tra với CẢ khung giờ sáng VÀ chiều')
console.log('   - Hàm calculateDailyPoints sẽ tự động phân loại đúng ca')

console.log('\n🏁 Test completed!')
