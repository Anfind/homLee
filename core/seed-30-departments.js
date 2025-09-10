const mongoose = require('mongoose')

const MONGODB_URI = 'mongodb://localhost:27017/homelee-attendance'

async function seed30Departments() {
  try {
    console.log('🌱 Adding 30 Sample departments with accounts (preserving existing data)...')
    
    await mongoose.connect(MONGODB_URI)
    
    // User Schema
    const userSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['admin', 'truongphong', 'department_manager'], required: true },
      department: String,
      name: { type: String, required: true },
      isActive: { type: Boolean, default: true }
    }, { timestamps: true })
    
    // Department Schema  
    const departmentSchema = new mongoose.Schema({
      _id: String,
      name: { type: String, required: true, unique: true },
      createdBy: { type: String, required: true },
      isActive: { type: Boolean, default: true }
    }, { 
      _id: false,
      timestamps: true 
    })
    
    const User = mongoose.model('User', userSchema)
    const Department = mongoose.model('Department', departmentSchema)
    
    // Generate 30 departments
    const departments = []
    const users = []
    
    // Check existing data first
    console.log('🔍 Checking existing data...')
    const existingDepartments = await Department.find({})
    const existingUsers = await User.find({})
    console.log(`   Found ${existingDepartments.length} existing departments`)
    console.log(`   Found ${existingUsers.length} existing users`)
    
    // Ensure admin account exists
    const adminExists = await User.findOne({ username: 'admin' })
    if (!adminExists) {
      users.push({
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        name: 'Quản trị viên hệ thống'
      })
      console.log('   ➕ Will create admin account')
    } else {
      console.log('   ✅ Admin account already exists')
    }
    
    // Generate 30 departments with Sample names
    for (let i = 1; i <= 30; i++) {
      const departmentId = `dept-${String(i).padStart(3, '0')}`
      const departmentName = `Sample ${i}`
      const username = `sample${i}`
      const password = `sample${i}123`
      
      // Check if department already exists
      const deptExists = existingDepartments.some(dept => dept.name === departmentName || dept._id === departmentId)
      const userExists = existingUsers.some(user => user.username === username)
      
      if (!deptExists) {
        // Create department
        departments.push({
          _id: departmentId,
          name: departmentName,
          createdBy: 'admin'
        })
      } else {
        console.log(`   ⏭️ Department "${departmentName}" already exists, skipping`)
      }
      
      if (!userExists) {
        // Create corresponding user account
        users.push({
          username: username,
          password: password,
          role: 'truongphong',
          name: `Quản lý ${departmentName}`,
          department: departmentName
        })
      } else {
        console.log(`   ⏭️ User "${username}" already exists, skipping`)
      }
    }
    
    // Insert new data only (no clearing)
    if (departments.length > 0) {
      console.log(`📁 Creating ${departments.length} new departments...`)
      await Department.insertMany(departments)
      console.log(`✅ Created ${departments.length} departments`)
    } else {
      console.log('📁 No new departments to create')
    }
    
    if (users.length > 0) {
      console.log(`👤 Creating ${users.length} new user accounts...`)
      await User.insertMany(users)
      console.log(`✅ Created ${users.length} users`)
    } else {
      console.log('👤 No new users to create')
    }
    
    // Get final count
    const finalDepartments = await Department.find({})
    const finalUsers = await User.find({})
    
    console.log('\n🎉 Department seeding completed!')
    console.log('\n📋 New Departments Added:')
    departments.forEach((dept, index) => {
      console.log(`   ${index + 1}. ${dept.name} (ID: ${dept._id})`)
    })
    
    if (users.length > 1 || (users.length === 1 && users[0].username !== 'admin')) {
      console.log('\n👤 New Login Credentials:')
      users.forEach(user => {
        if (user.username !== 'admin') {
          console.log(`   ${user.name}: ${user.username} / ${user.password}`)
        }
      })
    }
    
    console.log('\n📊 Final Summary:')
    console.log(`   - Total Departments in DB: ${finalDepartments.length}`)
    console.log(`   - Total Users in DB: ${finalUsers.length}`)
    console.log(`   - New Departments Added: ${departments.length}`)
    console.log(`   - New Users Added: ${users.length}`)
    
    if (departments.length === 0 && users.length === 0) {
      console.log('\n✨ All 30 Sample departments and accounts already exist!')
    }
    
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
    console.error('Stack trace:', error.stack)
    process.exit(1)
  }
}

seed30Departments()
