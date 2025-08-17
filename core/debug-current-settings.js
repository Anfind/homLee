const mongoose = require('mongoose')

async function checkCurrentSettings() {
  try {
    await mongoose.connect('mongodb://localhost:27017/homlee')
    console.log('✅ Connected to MongoDB')

    // Define CheckInSettings schema
    const checkInSettingsSchema = new mongoose.Schema({
      dayOfWeek: { type: Number, required: true },
      shifts: [{
        id: String,
        name: String,
        startTime: String,
        endTime: String,
        points: Number
      }],
      isActive: { type: Boolean, default: true },
      createdBy: String,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    })

    const CheckInSettings = mongoose.model('CheckInSettings', checkInSettingsSchema)

    console.log('\n📅 Current MongoDB settings:')
    const settings = await CheckInSettings.find({ isActive: true }).sort({ dayOfWeek: 1 })
    
    const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
    
    if (settings.length === 0) {
      console.log('❌ KHÔNG CÓ SETTINGS NÀO TRONG MONGODB!')
      console.log('   Điều này có nghĩa là API sẽ dùng default settings (1, 1)')
    } else {
      settings.forEach(setting => {
        console.log(`📅 ${dayNames[setting.dayOfWeek]} (day ${setting.dayOfWeek}):`)
        setting.shifts.forEach(shift => {
          console.log(`   ${shift.name}: ${shift.startTime}-${shift.endTime} (${shift.points} điểm)`)
        })
      })
    }

    // Check specifically for weekdays (Mon-Sat) để xem có settings custom không
    const weekdaySettings = settings.filter(s => s.dayOfWeek >= 1 && s.dayOfWeek <= 6)
    const hasCustomPoints = weekdaySettings.some(setting => 
      setting.shifts.some(shift => shift.points !== 1)
    )

    if (hasCustomPoints) {
      console.log('\n✅ TÌM THẤY CUSTOM POINTS trong MongoDB!')
      console.log('   API import/sync SẼ dùng điểm custom này')
    } else {
      console.log('\n⚠️ KHÔNG TÌM THẤY CUSTOM POINTS')
      console.log('   Tất cả shifts vẫn là 1 điểm, hoặc chưa có settings trong MongoDB')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

checkCurrentSettings()
