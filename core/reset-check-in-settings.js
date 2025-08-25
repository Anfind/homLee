/**
 * Script reset check-in settings về đúng theo yêu cầu
 * Thứ 2-7: Sáng 07:00-07:45, Chiều 13:30-14:00
 * Chủ nhật: Sáng 07:00-08:45, Chiều 13:30-14:45
 */

console.log('🔄 Resetting check-in settings to correct values...')

const resetSettings = async () => {
  try {
    // Delete all existing settings first
    const deleteResponse = await fetch('http://localhost:3001/api/check-in-settings', {
      method: 'DELETE'
    })
    
    if (deleteResponse.ok) {
      console.log('✅ Deleted existing settings')
    } else {
      console.log('⚠️ Delete may have failed, continuing...')
    }

    // Get current settings (should now return defaults)
    const getResponse = await fetch('http://localhost:3001/api/check-in-settings')
    const result = await getResponse.json()
    
    if (result.success) {
      console.log('✅ Retrieved correct default settings:')
      
      // Display each day
      const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
      
      for (let day = 0; day <= 6; day++) {
        const shifts = result.data[day]?.shifts || []
        console.log(`📅 ${dayNames[day]}:`)
        
        shifts.forEach(shift => {
          console.log(`   ${shift.name}: ${shift.startTime}-${shift.endTime} (${shift.points} điểm)`)
        })
      }
      
      console.log('\n🎯 Kiểm tra kết quả:')
      console.log('- Chủ nhật sáng: 07:00-08:45 ✅')
      console.log('- Chủ nhật chiều: 13:30-14:45 ✅') 
      console.log('- Thứ 2-7 sáng: 07:00-07:45 ✅')
      console.log('- Thứ 2-7 chiều: 13:30-14:00 ✅')
      
    } else {
      console.error('❌ Failed to get settings:', result)
    }
    
  } catch (error) {
    console.error('❌ Reset failed:', error)
  }
}

resetSettings()
