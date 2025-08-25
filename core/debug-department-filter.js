const { MongoClient } = require('mongodb');

async function testDepartmentFilter() {
  const client = new MongoClient('mongodb://localhost:27017/homelee-attendance');
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🧪 TESTING DEPARTMENT FILTER FIX\n');
    
    // Test the new filter logic
    const depManagers = await db.collection('users').find({ role: 'department_manager' }).toArray();
    
    console.log('📋 Testing filter logic for each department manager:\n');
    
    for (const user of depManagers) {
      console.log(`� User: ${user.username} | Department: "${user.department}"`);
      
      // Get all employees
      const allEmployees = await db.collection('employees').find({}).toArray();
      
      // Apply the new filter logic (same as in frontend)
      const filteredEmployees = allEmployees.filter((emp) => 
        emp.department && user.department && 
        emp.department.toLowerCase().trim() === user.department.toLowerCase().trim()
      );
      
      console.log(`   ✅ Filtered result: ${filteredEmployees.length} employees`);
      
      if (filteredEmployees.length > 0) {
        console.log('   📝 Sample employees:');
        filteredEmployees.slice(0, 3).forEach(emp => {
          console.log(`     - ID: ${emp._id} | Name: ${emp.name}`);
        });
      } else {
        console.log('   ⚠️  No employees found - checking for exact matches...');
        const exactMatch = allEmployees.filter(emp => emp.department === user.department);
        console.log(`     Exact match: ${exactMatch.length} employees`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

testDepartmentFilter().catch(console.error);
