const mongoose = require('mongoose')
const http = require('http')

async function testSaveSettings() {
  try {
    console.log('🧪 Testing save check-in settings...')

    // Test data: Thay đổi thứ 2 thành sáng 5 điểm, chiều 1 điểm  
    const testSettings = {
      dayOfWeek: 1, // Monday
      shifts: [
        { id: "mon-shift-1", name: "Ca sáng", startTime: "07:00", endTime: "07:45", points: 5 },
        { id: "mon-shift-2", name: "Ca chiều", startTime: "13:30", endTime: "14:00", points: 1 }
      ],
      updatedBy: 'test-script'
    }

    console.log('📤 Sending test data:', JSON.stringify(testSettings, null, 2))

    // Call API để save
    const result = await new Promise((resolve, reject) => {
      const postData = JSON.stringify(testSettings)
      
      const req = http.request({
        hostname: 'localhost',
        port: 3001,
        path: '/api/check-in-settings',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          try {
            const result = JSON.parse(data)
            console.log('📨 API Response:', result)
            resolve(result)
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}, Raw data: ${data}`))
          }
        })
      })
      
      req.on('error', reject)
      req.write(postData)
      req.end()
    })

    if (result.success) {
      console.log('✅ Save thành công!')
      
      // Verify data trong MongoDB
      await mongoose.connect('mongodb://localhost:27017/homlee')
      const collection = mongoose.connection.db.collection('checkinsettings')
      const documents = await collection.find({}).toArray()
      
      console.log(`\n📋 Documents in MongoDB after save: ${documents.length}`)
      documents.forEach((doc, index) => {
        console.log(`Document ${index + 1}:`)
        console.log(`   dayOfWeek: ${doc.dayOfWeek}`)
        console.log(`   isActive: ${doc.isActive}`)
        doc.shifts.forEach(shift => {
          console.log(`   ${shift.name}: ${shift.startTime}-${shift.endTime} (${shift.points} điểm)`)
        })
      })
      
      await mongoose.disconnect()
    } else {
      console.log('❌ Save thất bại:', result.message)
    }

  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

testSaveSettings()
