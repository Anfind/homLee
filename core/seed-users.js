const { connectDB } = require('./lib/mongodb/connection.js')
const { User } = require('./lib/mongodb/models/index.js')

async function seedUsers() {
  try {
    await connectDB()
    
    const count = await User.countDocuments()
    if (count === 0) {
      console.log('🌱 Seeding default users...')
      
      const defaultUsers = [
        {
          username: 'admin',
          password: 'admin123',
          role: 'admin',
          name: 'Quản trị viên hệ thống',
          isActive: true
        },
        {
          username: 'thao',
          password: 'thao123',
          role: 'truongphong',
          name: 'TP Thảo',
          department: 'Phòng Kinh doanh',
          isActive: true
        },
        {
          username: 'minh',
          password: 'minh123',
          role: 'truongphong',
          name: 'Trưởng phòng Minh',
          department: 'Phòng Kỹ thuật',
          isActive: true
        },
        {
          username: 'demo',
          password: 'demo123',
          role: 'truongphong',
          name: 'Demo User',
          department: 'Phòng Hành chính',
          isActive: true
        }
      ]
      
      await User.insertMany(defaultUsers)
      console.log(`✅ Seeded ${defaultUsers.length} users`)
    } else {
      console.log(`✅ Users already exist in database: ${count}`)
    }
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seedUsers()
