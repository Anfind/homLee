const mongoose = require('mongoose')

const MONGODB_URI = 'mongodb://localhost:27017/homelee-attendance'

async function seedData() {
  try {
    console.log('🌱 Seeding default data...')
    
    await mongoose.connect(MONGODB_URI)
    
    // User Schema
    const userSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['admin', 'truongphong'], required: true },
      department: String,
      name: { type: String, required: true },
      isActive: { type: Boolean, default: true }
    })
    
    // Department Schema  
    const departmentSchema = new mongoose.Schema({
      _id: String,
      name: { type: String, required: true },
      createdBy: { type: String, required: true },
      isActive: { type: Boolean, default: true }
    }, { _id: false })
    
    const User = mongoose.model('User', userSchema)
    const Department = mongoose.model('Department', departmentSchema)
    
    // Default departments
    const departments = [
      { _id: 'dept-001', name: 'Phòng Kỹ thuật', createdBy: 'system' },
      { _id: 'dept-002', name: 'Phòng Kinh doanh', createdBy: 'system' },
      { _id: 'dept-003', name: 'Phòng Hành chính', createdBy: 'system' }
    ]
    
    // Default users
    const users = [
      {
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        name: 'Quản trị viên hệ thống'
      },
      {
        username: 'thao',
        password: 'thao123',
        role: 'truongphong',
        name: 'TP Thảo',
        department: 'Phòng Kinh doanh'
      },
      {
        username: 'minh',
        password: 'minh123',
        role: 'truongphong',
        name: 'Trưởng phòng Minh',
        department: 'Phòng Kỹ thuật'
      },
      {
        username: 'demo',
        password: 'demo123',
        role: 'truongphong',
        name: 'Demo User',
        department: 'Phòng Hành chính'
      }
    ]
    
    // Clear existing data
    await Department.deleteMany({})
    await User.deleteMany({})
    
    // Insert data
    await Department.insertMany(departments)
    console.log(`✅ Created ${departments.length} departments`)
    
    await User.insertMany(users)
    console.log(`✅ Created ${users.length} users`)
    
    console.log('🎉 Default data seeded successfully!')
    console.log('👤 Login credentials:')
    console.log('   Admin: admin / admin123')
    console.log('   TP Thảo: thao / thao123')
    console.log('   TP Minh: minh / minh123')
    console.log('   Demo: demo / demo123')
    
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
    process.exit(1)
  }
}

seedData()
