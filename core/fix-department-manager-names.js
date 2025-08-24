const { MongoClient } = require('mongodb');

// MongoDB connection URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homelee-attendance';

async function fixDepartmentManagerNames() {
  console.log('🔧 Fixing department manager names...\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    console.log('✅ Connected to MongoDB\n');

    // Get all department managers without name field
    const departmentManagers = await db.collection('users').find({ 
      role: 'department_manager',
      name: { $exists: false } 
    }).toArray();
    
    console.log(`📊 Found ${departmentManagers.length} department managers without name field`);
    
    if (departmentManagers.length === 0) {
      console.log('✅ All department managers already have name field');
      return;
    }

    // Update each department manager to add name field
    let updatedCount = 0;
    for (const manager of departmentManagers) {
      const managerName = `${manager.department} Manager`;
      
      await db.collection('users').updateOne(
        { _id: manager._id },
        { 
          $set: { 
            name: managerName,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log(`✅ Updated ${manager.username} -> name: "${managerName}"`);
      updatedCount++;
    }
    
    console.log(`\n📈 Updated ${updatedCount} department managers`);
    
    // Verify the fix
    const allManagers = await db.collection('users').find({ role: 'department_manager' }).toArray();
    console.log('\n🔍 Verification:');
    allManagers.forEach(manager => {
      console.log(`   ${manager.username}: name="${manager.name || 'MISSING'}"`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

fixDepartmentManagerNames().catch(console.error);
