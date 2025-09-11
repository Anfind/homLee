/**
 * 🧪 TEST SYNC API WITH MANUAL EDIT PROTECTION
 * Tests actual sync API with manuallyEdited protection
 */

require('dotenv').config({ path: './.env.local' })

const mongoose = require('mongoose')

// Define schemas
const attendanceSchema = new mongoose.Schema({
  employeeId: String,
  date: String,
  morningCheckIn: String,
  afternoonCheckIn: String,
  points: { type: Number, default: 0 },
  manuallyEdited: { type: Boolean, default: false },
  shifts: [{
    id: String,
    name: String,
    startTime: String,
    endTime: String,
    points: Number,
    checkedIn: Boolean
  }]
}, { timestamps: true })

const checkInSettingsSchema = new mongoose.Schema({
  shifts: [{
    id: String,
    name: String,
    startTime: String,
    endTime: String,
    points: Number,
    enabled: Boolean
  }]
})

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceSchema)
const CheckInSettings = mongoose.model('CheckInSettings', checkInSettingsSchema)

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB Atlas')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

async function testSyncWithProtection() {
  await connectDB()
  
  const testEmployeeId = "SYNC_TEST_001"
  const testDate = "2025-01-20"
  
  console.log('\n🧪 TESTING SYNC API WITH MANUAL EDIT PROTECTION')
  console.log('=' .repeat(60))
  
  // Cleanup first
  await AttendanceRecord.findOneAndDelete({ employeeId: testEmployeeId, date: testDate })
  
  // 1. Create initial record via sync
  console.log('\n1️⃣ Creating initial record via sync...')
  
  const mockZKData = [
    {
      recordTime: `${testDate} 08:30:00`,
      deviceUserId: testEmployeeId
    },
    {
      recordTime: `${testDate} 17:15:00`, 
      deviceUserId: testEmployeeId
    }
  ]
  
  // Call sync API
  const syncResponse = await fetch('http://localhost:3001/api/sync-attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: mockZKData })
  })
  
  const syncResult1 = await syncResponse.json()
  console.log(`✅ First sync: ${JSON.stringify(syncResult1)}`)
  
  // Check created record
  const createdRecord = await AttendanceRecord.findOne({ employeeId: testEmployeeId, date: testDate })
  console.log(`   Created record: Points ${createdRecord.points}, ManuallyEdited: ${createdRecord.manuallyEdited}`)
  
  // 2. Simulate admin edit via API
  console.log('\n2️⃣ Simulating admin edit via API...')
  
  const editResponse = await fetch('http://localhost:3001/api/attendance', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employeeId: testEmployeeId,
      date: testDate,
      field: 'points',
      value: 1.0  // Admin changes points
    })
  })
  
  const editResult = await editResponse.json()
  console.log(`✅ Admin edit result: ${JSON.stringify(editResult)}`)
  
  // Check edited record
  const editedRecord = await AttendanceRecord.findOne({ employeeId: testEmployeeId, date: testDate })
  console.log(`   After edit: Points ${editedRecord.points}, ManuallyEdited: ${editedRecord.manuallyEdited}`)
  
  // 3. Try sync again (should be skipped due to manuallyEdited)
  console.log('\n3️⃣ Attempting sync on manually edited record...')
  
  const syncResponse2 = await fetch('http://localhost:3001/api/sync-attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: mockZKData })
  })
  
  const syncResult2 = await syncResponse2.json()
  console.log(`✅ Second sync: ${JSON.stringify(syncResult2)}`)
  
  // Check if record was protected
  const finalRecord = await AttendanceRecord.findOne({ employeeId: testEmployeeId, date: testDate })
  console.log(`   Final record: Points ${finalRecord.points}, ManuallyEdited: ${finalRecord.manuallyEdited}`)
  
  if (finalRecord.points === 1.0 && finalRecord.manuallyEdited === true) {
    console.log('🛡️ SUCCESS: Admin edit was protected from sync overwrite!')
  } else {
    console.log('❌ FAILED: Admin edit was not protected!')
  }
  
  // 4. Test sync with new data (different check-ins)
  console.log('\n4️⃣ Testing sync with completely new check-ins...')
  
  const newZKData = [
    {
      recordTime: `${testDate} 07:00:00`,  // Earlier morning
      deviceUserId: testEmployeeId
    },
    {
      recordTime: `${testDate} 18:00:00`,  // Later afternoon
      deviceUserId: testEmployeeId
    }
  ]
  
  const syncResponse3 = await fetch('http://localhost:3001/api/sync-attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: newZKData })
  })
  
  const syncResult3 = await syncResponse3.json()
  console.log(`✅ New data sync: ${JSON.stringify(syncResult3)}`)
  
  const finalRecord2 = await AttendanceRecord.findOne({ employeeId: testEmployeeId, date: testDate })
  console.log(`   After new sync: Points ${finalRecord2.points}, ManuallyEdited: ${finalRecord2.manuallyEdited}`)
  
  // 5. Cleanup
  console.log('\n5️⃣ Cleaning up...')
  await AttendanceRecord.findOneAndDelete({ employeeId: testEmployeeId, date: testDate })
  console.log('✅ Test record cleaned up')
  
  await mongoose.connection.close()
  console.log('\n✅ API sync test completed!')
}

// Run the test
testSyncWithProtection().catch(error => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})
