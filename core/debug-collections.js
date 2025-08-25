const mongoose = require('mongoose')

async function checkCollections() {
  try {
    // Use the SAME connection string as the API
    await mongoose.connect('mongodb://localhost:27017/homelee-attendance')
    console.log('✅ Connected to MongoDB (homelee-attendance)')
    console.log('🗄️  Database name:', mongoose.connection.db.databaseName)

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log('\n📦 All collections in database:')
    collections.forEach(col => {
      console.log(`   - ${col.name}`)
    })

    // Check checkinsettings collection specifically
    const checkInSettingsCol = collections.find(col => col.name === 'checkinsettings')

    if (checkInSettingsCol) {
      console.log(`\n🎯 Found collection: ${checkInSettingsCol.name}`)
      
      // Query the collection directly without any filter
      const collection = mongoose.connection.db.collection(checkInSettingsCol.name)
      const documents = await collection.find({}).toArray()
      
      console.log(`📋 Documents in ${checkInSettingsCol.name}: ${documents.length}`)
      
      if (documents.length > 0) {
        console.log('\n📄 All documents:')
        
        // Sort by dayOfWeek
        documents.sort((a, b) => (a.dayOfWeek || 0) - (b.dayOfWeek || 0))
        
        const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
        
        documents.forEach((doc, index) => {
          const dayName = dayNames[doc.dayOfWeek] || `Day ${doc.dayOfWeek}`
          console.log(`\n📅 ${dayName} (dayOfWeek: ${doc.dayOfWeek}):`)
          console.log('   _id:', doc._id)
          console.log('   isActive:', doc.isActive)
          console.log('   createdAt:', doc.createdAt)
          console.log('   updatedAt:', doc.updatedAt)
          
          if (doc.shifts && doc.shifts.length > 0) {
            console.log('   shifts:')
            doc.shifts.forEach(shift => {
              console.log(`      ${shift.name}: ${shift.startTime}-${shift.endTime} (${shift.points} điểm)`)
            })
          } else {
            console.log('   ❌ No shifts found!')
          }
        })

        // Check for custom points
        let customPointsFound = false
        documents.forEach(doc => {
          if (doc.shifts) {
            doc.shifts.forEach(shift => {
              if (shift.points && shift.points !== 1) {
                console.log(`\n✨ CUSTOM POINTS FOUND: ${dayNames[doc.dayOfWeek]} - ${shift.name}: ${shift.points} điểm`)
                customPointsFound = true
              }
            })
          }
        })

        if (!customPointsFound) {
          console.log('\n⚠️ Không tìm thấy custom points - tất cả vẫn là 1 điểm')
        }

        // Test API query (giống như trong code)
        console.log('\n🔍 Testing API query (isActive: true):')
        const activeDocuments = await collection.find({ isActive: true }).sort({ dayOfWeek: 1 }).toArray()
        console.log(`Found ${activeDocuments.length} active documents`)
        
        if (activeDocuments.length > 0) {
          console.log('Active documents:')
          activeDocuments.forEach(doc => {
            console.log(`   Day ${doc.dayOfWeek}: ${doc.shifts?.length || 0} shifts`)
          })
        }

      } else {
        console.log('❌ Collection rỗng!')
      }
    } else {
      console.log('\n❌ Không tìm thấy collection checkinsettings')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

checkCollections()
