// Test script để kiểm tra logic sync attendance mới
// So sánh check-ins cụ thể: employee + date + times

const { MongoClient } = require('mongodb')

// Test data simulation
const testScenarios = [
  {
    name: "Scenario 1: New Employee Record",
    description: "Hoàn toàn mới - chưa có trong DB",
    existing: null,
    zkData: [
      { deviceUserId: "001", recordTime: "2025-01-15 08:30:00" },
      { deviceUserId: "001", recordTime: "2025-01-15 17:30:00" }
    ],
    expected: "CREATE new record"
  },
  {
    name: "Scenario 2: Same Check-ins",
    description: "Cùng nhân viên, cùng ngày, cùng giờ chấm công",
    existing: {
      employeeId: "001",
      date: "2025-01-15", 
      morningCheckIn: "08:30",
      afternoonCheckIn: "17:30",
      points: 8
    },
    zkData: [
      { deviceUserId: "001", recordTime: "2025-01-15 08:30:00" },
      { deviceUserId: "001", recordTime: "2025-01-15 17:30:00" }
    ],
    expected: "SKIP - no changes"
  },
  {
    name: "Scenario 3: New Check-in Added",
    description: "Có thêm lần chấm công mới trong ngày",
    existing: {
      employeeId: "001",
      date: "2025-01-15",
      morningCheckIn: "08:30", 
      afternoonCheckIn: null,
      points: 4
    },
    zkData: [
      { deviceUserId: "001", recordTime: "2025-01-15 08:30:00" },
      { deviceUserId: "001", recordTime: "2025-01-15 17:30:00" } // NEW
    ],
    expected: "UPDATE with new check-in"
  },
  {
    name: "Scenario 4: Manual Points Edit",
    description: "Admin đã sửa điểm nhưng check-ins giống nhau",
    existing: {
      employeeId: "001", 
      date: "2025-01-15",
      morningCheckIn: "08:30",
      afternoonCheckIn: "17:30", 
      points: 10 // Admin edited from 8 to 10
    },
    zkData: [
      { deviceUserId: "001", recordTime: "2025-01-15 08:30:00" },
      { deviceUserId: "001", recordTime: "2025-01-15 17:30:00" }
    ],
    expected: "SKIP - preserve manual edit"
  },
  {
    name: "Scenario 5: Manual Edit + New Check-in",
    description: "Admin đã sửa điểm VÀ có thêm check-in mới",
    existing: {
      employeeId: "001",
      date: "2025-01-15", 
      morningCheckIn: "08:30",
      afternoonCheckIn: null,
      points: 6 // Admin edited from 4 to 6
    },
    zkData: [
      { deviceUserId: "001", recordTime: "2025-01-15 08:30:00" },
      { deviceUserId: "001", recordTime: "2025-01-15 17:30:00" } // NEW
    ],
    expected: "UPDATE" // ← CHANGED: Recalculate because new check-ins
  }
]

// Mock functions to simulate the logic
function categorizeCheckIns(checkIns, date, settings) {
  // Simplified categorization
  const sorted = checkIns.sort()
  return {
    morningCheckIn: sorted[0] || null,
    afternoonCheckIn: sorted[1] || null
  }
}

function calculateDailyPoints(date, checkIns, settings) {
  // Simplified points calculation
  return {
    totalPoints: checkIns.length * 4, // 4 points per check-in
    awardedShifts: []
  }
}

// Test logic function
function testSyncLogic(scenario) {
  console.log(`\n🧪 ${scenario.name}`)
  console.log(`📝 ${scenario.description}`)
  
  // Simulate ZK data processing
  const groupData = {
    employeeId: "001",
    date: "2025-01-15",
    checkIns: scenario.zkData.map(zk => {
      const time = zk.recordTime.split(' ')[1] // Extract time part
      return time.substring(0, 5) // HH:MM format
    })
  }
  
  console.log(`📥 ZK Check-ins: [${groupData.checkIns.join(', ')}]`)
  
  // Calculate points
  const pointsResult = calculateDailyPoints(
    groupData.date,
    groupData.checkIns,
    {}
  )
  
  const { morningCheckIn, afternoonCheckIn } = categorizeCheckIns(
    groupData.checkIns,
    groupData.date, 
    {}
  )
  
  console.log(`⏰ Categorized: Morning=${morningCheckIn}, Afternoon=${afternoonCheckIn}`)
  console.log(`💰 Auto-calculated points: ${pointsResult.totalPoints}`)
  
  // Check existing record
  const existingRecord = scenario.existing
  
  let shouldUpdate = false
  let shouldPreservePoints = false
  let finalPoints = pointsResult.totalPoints
  let action = "CREATE"
  
  if (existingRecord) {
    console.log(`📊 Existing record: Morning=${existingRecord.morningCheckIn}, Afternoon=${existingRecord.afternoonCheckIn}, Points=${existingRecord.points}`)
    
    // Compare check-ins
    const existingCheckIns = [
      existingRecord.morningCheckIn,
      existingRecord.afternoonCheckIn
    ].filter(Boolean)
    
    const newCheckIns = groupData.checkIns
    
    const hasNewCheckIns = newCheckIns.some(newTime => !existingCheckIns.includes(newTime))
    const hasDifferentCheckIns = existingCheckIns.some(existingTime => !newCheckIns.includes(existingTime))
    
    console.log(`🔍 Existing check-ins: [${existingCheckIns.join(', ')}]`)
    console.log(`🔍 New check-ins: [${newCheckIns.join(', ')}]`)
    console.log(`🔍 Has new check-ins: ${hasNewCheckIns}`)
    console.log(`🔍 Has different check-ins: ${hasDifferentCheckIns}`)
    
    if (!hasNewCheckIns && !hasDifferentCheckIns) {
      // Same check-ins - skip
      action = "SKIP"
    } else {
      // Different check-ins - update needed with RECALCULATED points
      shouldUpdate = true
      action = "UPDATE"
      
      // 🆕 NEW LOGIC: When check-ins change, ALWAYS recalculate (don't preserve manual points)
      finalPoints = pointsResult.totalPoints
    }
  }
  
  console.log(`🎯 Final Action: ${action}`)
  console.log(`🎯 Final Points: ${finalPoints}`)
  console.log(`🎯 Expected: ${scenario.expected}`)
  
  // Validate result
  const isCorrect = action.includes(scenario.expected.split(' ')[0])
  console.log(`${isCorrect ? '✅' : '❌'} Test Result: ${isCorrect ? 'PASS' : 'FAIL'}`)
  
  return {
    scenario: scenario.name,
    action,
    finalPoints,
    expected: scenario.expected,
    passed: isCorrect
  }
}

// Run all test scenarios
async function runTests() {
  console.log('🚀 Testing Sync Attendance Logic')
  console.log('=' .repeat(50))
  
  const results = []
  
  for (const scenario of testScenarios) {
    const result = testSyncLogic(scenario)
    results.push(result)
  }
  
  console.log('\n📊 TEST SUMMARY')
  console.log('=' .repeat(50))
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.scenario}: ${result.action}`)
  })
  
  const passedCount = results.filter(r => r.passed).length
  const totalCount = results.length
  
  console.log(`\n🎯 Overall: ${passedCount}/${totalCount} tests passed`)
  
  if (passedCount === totalCount) {
    console.log('🎉 All tests passed! Logic is working correctly.')
  } else {
    console.log('❌ Some tests failed. Please review the logic.')
  }
}

// Run the tests
runTests().catch(console.error)
