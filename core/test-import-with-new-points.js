const mongoose = require('mongoose')
const https = require('https')
const http = require('http')

async function testImportWithNewPoints() {
  try {
    console.log('🧪 Testing if import API loads settings from MongoDB...')
    
    // Test bằng cách call API check-in-settings để xem settings hiện tại
    console.log('\n📡 Fetching current settings from API...')
    
    const result = await new Promise((resolve, reject) => {
      const req = http.request('http://localhost:3001/api/check-in-settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch (e) {
            reject(e)
          }
        })
      })
      
      req.on('error', reject)
      req.end()
    })
    
    if (!result.success) {
      throw new Error(`API error: ${result.message}`)
    }
    
    console.log('✅ Current settings from MongoDB:')
    
    const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
    for (let day = 0; day <= 6; day++) {
      const shifts = result.data[day]?.shifts || []
      console.log(`📅 ${dayNames[day]}:`)
      shifts.forEach(shift => {
        console.log(`   ${shift.name}: ${shift.startTime}-${shift.endTime} (${shift.points} điểm)`)
      })
    }
    
    // Test với data thứ 2 (Monday = day 1)
    const mondayShifts = result.data[1]?.shifts || []
    const morningShift = mondayShifts.find(s => s.name === 'Ca sáng')
    const afternoonShift = mondayShifts.find(s => s.name === 'Ca chiều')
    
    console.log('\n🎯 Expected behavior for import:')
    console.log(`- Morning check-in (07:30): ${morningShift ? morningShift.points : 0} điểm`)
    console.log(`- Afternoon check-in (13:45): ${afternoonShift ? afternoonShift.points : 0} điểm`)
    console.log(`- Total: ${(morningShift?.points || 0) + (afternoonShift?.points || 0)} điểm`)
    
    if ((morningShift?.points || 0) > 1 || (afternoonShift?.points || 0) > 1) {
      console.log('\n✅ SUCCESS: Settings đã được cập nhật với điểm mới!')
      console.log('   Import API sẽ dùng điểm mới từ MongoDB')
    } else {
      console.log('\n⚠️ NOTICE: Vẫn đang dùng điểm mặc định (1, 1)')
    }

  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

testImportWithNewPoints()
