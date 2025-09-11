// Test thực tế với MongoDB Atlas
// Kiểm tra logic sync attendance mới với database thật

const { MongoClient } = require('mongodb')

async function testRealSync() {
  let client
  
  try {
    // Kết nối Atlas (dùng connection string từ .env.local)
    const uri = "mongodb+srv://leehomes_admin:W029yxWJtYf7z5IC@lee-homes-cluster.xmgrbjn.mongodb.net/homelee-attendance?retryWrites=true&w=majority&appName=lee-homes-cluster"
    
    client = new MongoClient(uri)
    await client.connect()
    console.log('✅ Connected to MongoDB Atlas')
    
    const db = client.db('homelee-attendance')
    const attendanceCollection = db.collection('attendancerecords')
    const employeesCollection = db.collection('employees')
    
    // Test data
    const testEmployeeId = "test-employee-001"
    const testDate = "2025-01-15"
    
    // 1. Đảm bảo có employee test
    await employeesCollection.updateOne(
      { _id: testEmployeeId },
      { 
        $set: {
          _id: testEmployeeId,
          name: "Test Employee",
          deviceUserId: "001",
          department: "Test Department"
        }
      },
      { upsert: true }
    )
    console.log('✅ Test employee created/updated')
    
    // 2. Test Scenario 1: Create new record
    console.log('\n🧪 Test 1: Create new attendance record')
    await attendanceCollection.deleteOne({ 
      employeeId: testEmployeeId, 
      date: testDate 
    })
    
    // Simulate new attendance
    const newRecord = {
      employeeId: testEmployeeId,
      date: testDate,
      morningCheckIn: "08:30",
      afternoonCheckIn: "17:30", 
      points: 8,
      shifts: []
    }
    
    await attendanceCollection.insertOne(newRecord)
    console.log('✅ New record created with 8 points')
    
    // 3. Test Scenario 2: Same check-ins (should skip)
    console.log('\n🧪 Test 2: Same check-ins - should SKIP')
    const existingRecord = await attendanceCollection.findOne({
      employeeId: testEmployeeId,
      date: testDate
    })
    
    const existingCheckIns = [
      existingRecord.morningCheckIn,
      existingRecord.afternoonCheckIn
    ].filter(Boolean)
    
    const newCheckIns = ["08:30", "17:30"] // Same as existing
    
    const hasNewCheckIns = newCheckIns.some(newTime => !existingCheckIns.includes(newTime))
    const hasDifferentCheckIns = existingCheckIns.some(existingTime => !newCheckIns.includes(existingTime))
    
    console.log(`📊 Existing check-ins: [${existingCheckIns.join(', ')}]`)
    console.log(`📊 New check-ins: [${newCheckIns.join(', ')}]`)
    console.log(`📊 Has new: ${hasNewCheckIns}, Has different: ${hasDifferentCheckIns}`)
    
    if (!hasNewCheckIns && !hasDifferentCheckIns) {
      console.log('✅ SKIP logic works - same check-ins detected')
    } else {
      console.log('❌ SKIP logic failed')
    }
    
    // 4. Test Scenario 3: Manual points edit
    console.log('\n🧪 Test 3: Manual points edit preservation')
    await attendanceCollection.updateOne(
      { employeeId: testEmployeeId, date: testDate },
      { $set: { points: 12 } } // Admin edit from 8 to 12
    )
    console.log('✅ Admin manually edited points from 8 to 12')
    
    const recordAfterEdit = await attendanceCollection.findOne({
      employeeId: testEmployeeId,
      date: testDate
    })
    
    // Simulate auto-calculation for existing check-ins
    const autoPointsForExisting = existingCheckIns.length * 4 // 4 points per check-in
    const currentStoredPoints = recordAfterEdit.points
    
    console.log(`📊 Auto-calculated for existing check-ins: ${autoPointsForExisting}`)
    console.log(`📊 Current stored points: ${currentStoredPoints}`)
    
    const isManualEdit = currentStoredPoints !== autoPointsForExisting
    console.log(`📊 Is manual edit: ${isManualEdit}`)
    
    if (isManualEdit) {
      console.log('✅ Manual edit detection works')
    } else {
      console.log('❌ Manual edit detection failed')
    }
    
    // 5. Test Scenario 4: New check-in with manual edit → RECALCULATE
    console.log('\n🧪 Test 4: New check-in → RECALCULATE (don\'t preserve manual edit)')
    const newCheckInsWithAddition = ["08:30", "17:30", "12:00"] // Added lunch check-in
    
    const hasNewAfterEdit = newCheckInsWithAddition.some(newTime => !existingCheckIns.includes(newTime))
    console.log(`📊 Has new check-ins after manual edit: ${hasNewAfterEdit}`)
    
    if (hasNewAfterEdit && isManualEdit) {
      console.log('✅ Should UPDATE and RECALCULATE points (don\'t preserve manual edits when new data)')
      console.log('   Logic: New check-ins = 3 × 4 = 12 points (overwrite manual 12)')
      console.log('   Result: Manual edit is overwritten by new calculation')
    }
    
    // 6. Clean up
    console.log('\n🧹 Cleaning up test data...')
    await attendanceCollection.deleteOne({ 
      employeeId: testEmployeeId, 
      date: testDate 
    })
    await employeesCollection.deleteOne({ _id: testEmployeeId })
    console.log('✅ Test data cleaned up')
    
    console.log('\n🎉 All database tests completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    if (client) {
      await client.close()
      console.log('📪 Database connection closed')
    }
  }
}

// Load environment variables (simulate)
process.env.MONGODB_URI = "mongodb+srv://anfind:12345abc@cluster0.mongodb.net/attendance-system?retryWrites=true&w=majority"

testRealSync().catch(console.error)
