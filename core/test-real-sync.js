// Test sync với MongoDB thực tế
console.log('🚀 Testing Real MongoDB Sync...\n')

async function testRealSync() {
  try {
    // Test sync employees first
    console.log('1. Testing employee sync...')
    const employeeResponse = await fetch('http://localhost:3001/api/sync-employees', {
      method: 'POST'
    })
    
    if (employeeResponse.ok) {
      const employeeResult = await employeeResponse.json()
      console.log('✅ Employee sync:', employeeResult.message)
      console.log(`   Added: ${employeeResult.added}, Updated: ${employeeResult.updated}`)
    } else {
      console.log('❌ Employee sync failed:', employeeResponse.status)
    }
    
    // Test sync attendance 
    console.log('\n2. Testing attendance sync...')
    const attendanceResponse = await fetch('http://localhost:3001/api/sync-attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: '2025-07-25' // Test với date có data
      })
    })
    
    if (attendanceResponse.ok) {
      const attendanceResult = await attendanceResponse.json()
      console.log('✅ Attendance sync:', attendanceResult.message)
      console.log(`   Processed: ${attendanceResult.processedRecords}`)
      console.log(`   Total Points: ${attendanceResult.totalPoints}`)
      
      if (attendanceResult.details && attendanceResult.details.length > 0) {
        console.log('\n📊 Sample records:')
        attendanceResult.details.slice(0, 5).forEach((record, i) => {
          console.log(`   ${i+1}. ${record.employeeName} - ${record.date}`)
          console.log(`      Times: ${record.checkInTimes.join(', ')}`)
          console.log(`      Points: ${record.totalPoints}`)
        })
      }
    } else {
      const errorText = await attendanceResponse.text()
      console.log('❌ Attendance sync failed:', attendanceResponse.status)
      console.log('Error:', errorText)
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message)
    console.log('\n💡 Make sure Next.js app is running on http://localhost:3001')
    console.log('💡 Make sure ZKTeco backend is running on http://localhost:3000')
  }
}

testRealSync()
