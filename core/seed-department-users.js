const { MongoClient } = require('mongodb');
const fs = require('fs');

// MongoDB connection URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homelee-attendance';

// Read department data
const DEPARTMENTS_JSON_PATH = '../zktceo-backend/log/department.json';

// Helper function to create username from department name
function createUsername(departmentName) {
  return departmentName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

// Helper function to create simple password from department name
function createPassword(departmentName) {
  const base = departmentName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
  
  return base + '2024'; // Add year for security
}

async function seedDepartmentUsers() {
  console.log('🔄 Starting department users seeding...');
  
  // Read department data
  let departmentsData;
  try {
    const departmentsRaw = fs.readFileSync(DEPARTMENTS_JSON_PATH, 'utf8');
    departmentsData = JSON.parse(departmentsRaw);
    console.log(`✅ Loaded ${Object.keys(departmentsData).length} departments`);
  } catch (error) {
    console.error('❌ Error reading department.json:', error.message);
    return;
  }

  // Connect to MongoDB
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    console.log('✅ Connected to MongoDB');

    // Check existing users to avoid duplicates
    const existingUsers = await db.collection('users').find({}).toArray();
    const existingUsernames = new Set(existingUsers.map(u => u.username));
    
    console.log(`📊 Found ${existingUsers.length} existing users`);

    // Create department users
    const departmentUsers = [];
    const credentials = []; // For export to file

    for (const [departmentName, employees] of Object.entries(departmentsData)) {
      const username = createUsername(departmentName);
      const password = createPassword(departmentName);
      
      // Skip if username already exists
      if (existingUsernames.has(username)) {
        console.log(`⚠️  User ${username} already exists, skipping...`);
        continue;
      }

      // Create user document - NO PASSWORD HASHING (để phù hợp với auth logic hiện tại)
      const userDoc = {
        username: username,
        password: password, // Lưu plain text password
        role: 'department_manager', // New role for department managers
        isActive: true,
        department: departmentName, // Link to department
        employeeCount: employees.length,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      departmentUsers.push(userDoc);
      
      // Store credentials for export
      credentials.push({
        department: departmentName,
        username: username,
        password: password, // Plain text for first-time login
        employeeCount: employees.length,
        employees: employees.map(emp => `${emp.userId} - ${emp.name}`)
      });
    }

    // Insert new users
    if (departmentUsers.length > 0) {
      const result = await db.collection('users').insertMany(departmentUsers);
      console.log(`✅ Created ${result.insertedCount} department manager accounts`);

      // Export credentials to file
      const fileName = `department-users-credentials-${new Date().toISOString().split('T')[0]}.json`;
      const exportData = {
        summary: {
          total: departmentUsers.length,
          createdAt: new Date().toISOString(),
          description: "Department manager accounts for Lee Homes attendance system",
          note: "Please change passwords after first login"
        },
        departments: credentials
      };

      fs.writeFileSync(fileName, JSON.stringify(exportData, null, 2));
      console.log(`📄 Exported credentials to ${fileName}`);

      // Display summary
      console.log('\n📋 DEPARTMENT MANAGER ACCOUNTS CREATED:');
      console.log('=' .repeat(80));
      console.log(`${'Department'.padEnd(30)} | ${'Username'.padEnd(20)} | ${'Password'.padEnd(15)} | Employees`);
      console.log('=' .repeat(80));
      
      credentials.forEach(cred => {
        console.log(`${cred.department.padEnd(30)} | ${cred.username.padEnd(20)} | ${cred.password.padEnd(15)} | ${cred.employeeCount}`);
      });
      
      console.log('=' .repeat(80));
      console.log(`✅ Total: ${departmentUsers.length} accounts created`);

      // Display role distribution
      const allUsers = await db.collection('users').find({}).toArray();
      const roleStats = {};
      allUsers.forEach(user => {
        roleStats[user.role] = (roleStats[user.role] || 0) + 1;
      });

      console.log('\n📈 USER ROLE DISTRIBUTION:');
      Object.entries(roleStats).forEach(([role, count]) => {
        console.log(`  - ${role}: ${count} users`);
      });

      console.log('\n🔐 SECURITY NOTES:');
      console.log('  - All passwords are temporary and should be changed');
      console.log('  - Department managers can only access their own department data');
      console.log('  - Default role: "department_manager"');
      console.log(`  - Credentials exported to: ${fileName}`);

    } else {
      console.log('ℹ️  No new users to create (all usernames already exist)');
    }

  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the seed function
if (require.main === module) {
  seedDepartmentUsers()
    .then(() => {
      console.log('\n✅ Department users seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Department users seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDepartmentUsers };
