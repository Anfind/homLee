const mongoose = require('mongoose')

const MONGODB_URI = 'mongodb://localhost:27017/homelee-attendance'

async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...')
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI)
    console.log('✅ MongoDB connection successful!')
    
    // Create a simple test collection to make database appear
    const testSchema = new mongoose.Schema({ 
      name: String, 
      created: { type: Date, default: Date.now } 
    })
    const TestModel = mongoose.model('Test', testSchema)
    
    // Insert test data
    await TestModel.create({ name: 'test-connection' })
    console.log('✅ Test document created!')
    
    // Create collections structure
    const collections = [
      'employees',
      'users', 
      'departments',
      'attendancerecords',
      'bonuspoints',
      'customdailyvalues',
      'checkinsettings'
    ]
    
    for (const collName of collections) {
      await mongoose.connection.db.createCollection(collName)
      console.log(`✅ Created collection: ${collName}`)
    }
    
    console.log('📊 Database "homelee-attendance" should now appear in MongoDB Compass!')
    console.log('🔗 Connection string: mongodb://localhost:27017')
    console.log('🏢 Database name: homelee-attendance')
    
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    process.exit(1)
  }
}

testConnection()
