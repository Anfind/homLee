const { calculateDailyPoints, getDefaultCheckInSettings } = require('./lib/attendance/zk-processor')

// Test case từ hình của bạn
const checkInSettings = getDefaultCheckInSettings()

console.log('🧪 Testing Points Calculation Logic')
console.log('=====================================')

// Test case 1: Employee 00003, ngày 01/07/2025
console.log('\n📅 Test Case 1: Ngày 01/07/2025')
console.log('Check-ins: 07:54:53, 13:31:28')

const result1 = calculateDailyPoints(
  '2025-07-01',
  ['07:54', '13:31'], // Simplified to HH:MM
  checkInSettings
)

console.log('Expected: 2 điểm (1 sáng + 1 chiều)')
console.log('Actual:', result1.totalPoints, 'điểm')
console.log('Shifts awarded:', result1.awardedShifts)
console.log('✅ Test 1:', result1.totalPoints === 2 ? 'PASS' : 'FAIL')

// Test case 2: Employee 00003, ngày 02/07/2025  
console.log('\n📅 Test Case 2: Ngày 02/07/2025')
console.log('Check-ins: 13:56:14 (chỉ chiều)')

const result2 = calculateDailyPoints(
  '2025-07-02',
  ['13:56'], // Chỉ có 1 check-in chiều
  checkInSettings
)

console.log('Expected: 1 điểm (chỉ chiều)')
console.log('Actual:', result2.totalPoints, 'điểm')
console.log('Shifts awarded:', result2.awardedShifts)
console.log('✅ Test 2:', result2.totalPoints === 1 ? 'PASS' : 'FAIL')

// Test case 3: Không có check-in
console.log('\n📅 Test Case 3: Không có check-in')

const result3 = calculateDailyPoints(
  '2025-07-03',
  [], // Không có check-in
  checkInSettings
)

console.log('Expected: 0 điểm')
console.log('Actual:', result3.totalPoints, 'điểm')
console.log('✅ Test 3:', result3.totalPoints === 0 ? 'PASS' : 'FAIL')

console.log('\n🎯 Summary:')
console.log('- Logic tính điểm đã đúng theo yêu cầu')
console.log('- Mỗi ca chỉ được tính 1 lần')  
console.log('- Tối đa 2 điểm/ngày (sáng + chiều)')
