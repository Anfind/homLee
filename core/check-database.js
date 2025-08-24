const { MongoClient } = require('mongodb');

async function checkDatabase() {
  const client = new MongoClient('mongodb://localhost:27017/homelee-attendance');
  
  try {
    await client.connect();
    const db = client.db();
    
    const employeeCount = await db.collection('employees').countDocuments();
    const deptCount = await db.collection('departments').countDocuments();
    
    console.log('📊 DATABASE CHECK:');
    console.log(`👥 Employees: ${employeeCount}`);
    console.log(`🏢 Departments: ${deptCount}`);
    
    // Sample employees
    const samples = await db.collection('employees').find({}).limit(5).toArray();
    console.log('\n🔍 Sample employees:');
    samples.forEach(emp => {
      console.log(`  - ${emp._id}: ${emp.name} (${emp.department}) - ${emp.title}`);
    });
    
    // Department distribution
    const deptStats = await db.collection('employees').aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();
    
    console.log('\n📈 Top 10 departments by employee count:');
    deptStats.forEach(stat => {
      console.log(`  - ${stat._id}: ${stat.count} nhân viên`);
    });
    
    // Check specific users mentioned in attendance sync
    const testUsers = ['11', '41', '43'];
    console.log('\n🎯 Key test users:');
    for (const userId of testUsers) {
      const user = await db.collection('employees').findOne({ _id: userId });
      if (user) {
        console.log(`  ✅ ${userId}: ${user.name} (${user.department})`);
      } else {
        console.log(`  ❌ ${userId}: NOT FOUND`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkDatabase();
