// Seed script to populate initial data to MongoDB
// Run once when setting up the system

const seedEmployees = [
  {
    _id: "001",
    name: "Nguyễn Văn Anh",
    title: "Kỹ sư phần mềm",
    department: "Phòng Kỹ thuật"
  },
  {
    _id: "002", 
    name: "Trần Thị Hương",
    title: "Nhân viên kinh doanh",
    department: "Phòng Kinh doanh"
  },
  {
    _id: "003",
    name: "Lê Văn Minh",
    title: "Chuyên viên hành chính",
    department: "Phòng Hành chính"
  }
]

const seedDepartments = [
  {
    _id: "dept-001",
    name: "Phòng Kỹ thuật",
    createdBy: "system",
    isActive: true
  },
  {
    _id: "dept-002",
    name: "Phòng Kinh doanh", 
    createdBy: "system",
    isActive: true
  },
  {
    _id: "dept-003",
    name: "Phòng Hành chính",
    createdBy: "system",
    isActive: true
  }
]

const seedUsers = [
  {
    username: "admin",
    password: "admin123", // Will be hashed by API
    role: "admin",
    isActive: true
  },
  {
    username: "manager1",
    password: "manager123",
    role: "department_head",
    department: "Phòng Kỹ thuật",
    isActive: true
  }
]

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')
    
    // Seed departments
    console.log('📂 Seeding departments...')
    for (const dept of seedDepartments) {
      const response = await fetch('http://localhost:3001/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dept)
      })
      const result = await response.json()
      if (result.success) {
        console.log(`✅ Created department: ${dept.name}`)
      } else {
        console.log(`ℹ️ Department exists: ${dept.name}`)
      }
    }
    
    // Seed users
    console.log('👥 Seeding users...')
    for (const user of seedUsers) {
      const response = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      })
      const result = await response.json()
      if (result.success) {
        console.log(`✅ Created user: ${user.username}`)
      } else {
        console.log(`ℹ️ User exists: ${user.username}`)
      }
    }
    
    // Seed employees  
    console.log('👷 Seeding employees...')
    for (const emp of seedEmployees) {
      const response = await fetch('http://localhost:3001/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emp)
      })
      const result = await response.json()
      if (result.success) {
        console.log(`✅ Created employee: ${emp.name}`)
      } else {
        console.log(`ℹ️ Employee exists: ${emp.name}`)
      }
    }
    
    console.log('🎉 Database seeding completed!')
    
  } catch (error) {
    console.error('❌ Seeding error:', error)
  }
}

// Auto-run if called directly
if (typeof window === 'undefined') {
  seedDatabase()
}

export { seedDatabase, seedDepartments, seedUsers, seedEmployees }
