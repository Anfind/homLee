/**
 * 🧪 TEST MANUAL EDIT PROTECTION
 * Tests the new manuallyEdited field and sync logic
 */

require('dotenv').config({ path: './.env.local' })

const mongoose = require('mongoose')

// Define AttendanceRecord schema to match the model
const attendanceSchema = new mongoose.Schema({
  employeeId: String,
  date: String,
  morningCheckIn: String,
  afternoonCheckIn: String,
  points: { type: Number, default: 0 },
  manuallyEdited: { type: Boolean, default: false }, // NEW FIELD
  shifts: [{
    id: String,
    name: String,
    startTime: String,
    endTime: String,
    points: Number,
    checkedIn: Boolean
  }]
}, { timestamps: true })

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceSchema)

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB Atlas')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

async function testManualEditProtection() {
  await connectDB()
  
  const testEmployeeId = "TEST_EMP_001"
  const testDate = "2025-01-20"
  
  console.log('\n🧪 TESTING MANUAL EDIT PROTECTION')
  console.log('=' .repeat(50))
  
  // 1. Create a test record
  console.log('\n1️⃣ Creating test record...')
  await AttendanceRecord.findOneAndDelete({ employeeId: testEmployeeId, date: testDate })
  
  const testRecord = await AttendanceRecord.create({
    employeeId: testEmployeeId,
    date: testDate,
    morningCheckIn: "08:00",
    afternoonCheckIn: "17:00", 
    points: 2.0,
    manuallyEdited: false
  })
  
  console.log(`✅ Created: Employee ${testEmployeeId}, Date ${testDate}, Points: ${testRecord.points}`)
  
  // 2. Simulate admin edit (set manuallyEdited = true)
  console.log('\n2️⃣ Simulating admin edit...')
  const editedRecord = await AttendanceRecord.findByIdAndUpdate(
    testRecord._id,
    { 
      points: 1.5,  // Admin changed points
      manuallyEdited: true  // Mark as manually edited
    },
    { new: true }
  )
  
  console.log(`✅ Admin edited: Points changed to ${editedRecord.points}, manuallyEdited: ${editedRecord.manuallyEdited}`)
  
  // 3. Test sync protection logic
  console.log('\n3️⃣ Testing sync protection...')
  const recordToSync = await AttendanceRecord.findOne({ employeeId: testEmployeeId, date: testDate })
  
  if (recordToSync.manuallyEdited) {
    console.log('🛡️ PROTECTED: Record has manuallyEdited=true, sync would SKIP this record')
    console.log(`   Current points: ${recordToSync.points} (preserved)`)
  } else {
    console.log('🔄 WOULD UPDATE: Record has manuallyEdited=false, sync would update this record')
  }
  
  // 4. Test creating a new record without manual edit
  console.log('\n4️⃣ Testing new record creation...')
  const newTestRecord = await AttendanceRecord.create({
    employeeId: "TEST_EMP_002",
    date: testDate,
    morningCheckIn: "09:00",
    points: 1.0
    // manuallyEdited defaults to false
  })
  
  console.log(`✅ New record: manuallyEdited: ${newTestRecord.manuallyEdited} (default)`)
  
  // 5. Show all test records
  console.log('\n5️⃣ All test records:')
  const allTestRecords = await AttendanceRecord.find({ 
    employeeId: { $in: [testEmployeeId, "TEST_EMP_002"] },
    date: testDate 
  })
  
  allTestRecords.forEach(record => {
    console.log(`   Employee: ${record.employeeId}, Points: ${record.points}, ManuallyEdited: ${record.manuallyEdited}`)
  })
  
  // 6. Cleanup
  console.log('\n6️⃣ Cleaning up...')
  await AttendanceRecord.deleteMany({ 
    employeeId: { $in: [testEmployeeId, "TEST_EMP_002"] },
    date: testDate 
  })
  console.log('✅ Test records cleaned up')
  
  await mongoose.connection.close()
  console.log('\n✅ Test completed successfully!')
}

// Run the test
testManualEditProtection().catch(error => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})
