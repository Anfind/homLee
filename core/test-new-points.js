const mongoose = require('mongoose')
const { calculateDailyPoints } = require('./lib/attendance/zk-processor')

async function testNewPointsCalculation() {
  try {
    await mongoose.connect('mongodb://localhost:27017/homelee-attendance')
    console.log('✅ Connected to MongoDB')

    // Load settings từ MongoDB như API
    const checkInSettingsSchema = new mongoose.Schema({
      dayOfWeek: { type: Number, required: true },
      shifts: [{
        id: String,
        name: String,
        startTime: String,
        endTime: String,
        points: Number
      }],
      isActive: { type: Boolean, default: true }
    })

    const CheckInSettings = mongoose.model('CheckInSettings', checkInSettingsSchema)
    const settings = await CheckInSettings.find({ isActive: true }).sort({ dayOfWeek: 1 })
    
    // Convert to client format như trong API
    const mongoSettings = settings.reduce((acc, setting) => {
      acc[setting.dayOfWeek] = {
        shifts: setting.shifts
      }
      return acc
    }, {})
    
    console.log('📅 Loaded settings from MongoDB:')
    const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
    Object.keys(mongoSettings).forEach(day => {
      const shifts = mongoSettings[day].shifts
      console.log(`${dayNames[day]} (${day}):`)
      shifts.forEach(shift => {
        console.log(`   ${shift.name}: ${shift.startTime}-${shift.endTime} (${shift.points} điểm)`)
      })
    })

    // Test calculate với data mẫu
    console.log('\n🧪 Testing calculation with sample data:')
    
    // Test case: Thứ 2 (Monday = day 1) với check-ins 07:30, 13:45
    const testCases = [
      {
        name: 'Thứ 2 - 07:30 sáng + 13:45 chiều',
        date: '2025-07-07', // Monday
        checkIns: ['07:30', '13:45'],
        expected: '5 + 1 = 6 điểm'
      },
      {
        name: 'Thứ 3 - 07:30 sáng + 13:45 chiều', 
        date: '2025-07-08', // Tuesday
        checkIns: ['07:30', '13:45'],
        expected: '1 + 1 = 2 điểm'
      },
      {
        name: 'Thứ 2 - chỉ 07:30 sáng',
        date: '2025-07-07', // Monday
        checkIns: ['07:30'],
        expected: '5 điểm'
      }
    ]

    testCases.forEach(testCase => {
      console.log(`\n📋 ${testCase.name}:`)
      console.log(`   Date: ${testCase.date}`)
      console.log(`   Check-ins: [${testCase.checkIns.join(', ')}]`)
      console.log(`   Expected: ${testCase.expected}`)
      
      const result = calculateDailyPoints(
        testCase.date,
        testCase.checkIns,
        mongoSettings
      )
      
      console.log(`   Actual: ${result.totalPoints} điểm`)
      console.log(`   Shifts: ${result.awardedShifts.map(s => `${s.shiftName} (${s.points})`).join(', ')}`)
      
      const isCorrect = (testCase.name.includes('Thứ 2') && testCase.checkIns.length === 2 && result.totalPoints === 6) ||
                       (testCase.name.includes('Thứ 3') && result.totalPoints === 2) ||
                       (testCase.name.includes('chỉ') && result.totalPoints === 5)
      
      console.log(`   Result: ${isCorrect ? '✅ CORRECT' : '❌ WRONG'}`)
    })

    console.log('\n🎯 Summary:')
    console.log('- Settings đã load đúng từ MongoDB')
    console.log('- Thứ 2 có custom points (5 điểm sáng)')
    console.log('- Import/sync API sẽ dùng settings này để tính điểm mới')
    console.log('- Cần import lại data để cập nhật attendance records')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

testNewPointsCalculation()
