const { MongoClient } = require('mongodb')

async function debugUsers() {
  const client = new MongoClient('mongodb://localhost:27017')
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')
    
    const db = client.db('homelee-attendance')
    const usersCollection = db.collection('users')
    
    // Count users
    const userCount = await usersCollection.countDocuments()
    console.log(`📊 Total users: ${userCount}`)
    
    // Get all users (excluding password for security)
    const users = await usersCollection.find({}).project({ password: 0 }).toArray()
    console.log(`👥 Users:`)
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.name}) | Role: ${user.role} | Department: ${user.department || 'N/A'} | Active: ${user.isActive}`)
    })
    
    // Check if admin user exists
    const adminUser = await usersCollection.findOne({ username: 'admin' })
    if (adminUser) {
      console.log('✅ Admin user exists')
    } else {
      console.log('❌ Admin user not found')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
  }
}

debugUsers()
