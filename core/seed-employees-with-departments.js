const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homelee-attendance';

// Paths to log files
const USERS_JSON_PATH = path.join(__dirname, '../zktceo-backend/log/users.json');
const DEPARTMENTS_JSON_PATH = path.join(__dirname, '../zktceo-backend/log/department.json');

// Helper function to get title based on role and name
function getTitleByRole(role, name) {
  if (role === 14) {
    const nameUpper = name.toUpperCase();
    if (nameUpper.includes('PGD') || nameUpper.includes('GIÁM ĐỐC')) {
      return 'Phó Giám Đốc';
    }
    return 'Trưởng phòng';
  }
  return 'Nhân viên';
}

// Helper function to create department ID
function createDepartmentId(departmentName) {
  return departmentName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9-]/g, '');
}

async function seedEmployeesWithDepartments() {
  console.log('🔄 Starting employee and department seeding...');
  console.log('📁 Reading log files...');

  // Read log files
  let usersData, departmentsData;
  
  try {
    const usersRaw = fs.readFileSync(USERS_JSON_PATH, 'utf8');
    usersData = JSON.parse(usersRaw);
    console.log(`✅ Loaded ${usersData.data.length} users from ZKTeco`);
  } catch (error) {
    console.error('❌ Error reading users.json:', error.message);
    return;
  }

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

    // Create mapping: userId -> employee info
    const userMap = new Map();
    usersData.data.forEach(user => {
      if (user.name && user.userId) {
        userMap.set(user.userId, {
          name: user.name,
          role: user.role || 0,
          uid: user.uid
        });
      }
    });

    // Create mapping: userId -> department
    const userToDepartment = new Map();
    Object.entries(departmentsData).forEach(([departmentName, employees]) => {
      employees.forEach(emp => {
        userToDepartment.set(emp.userId, departmentName);
      });
    });

    console.log(`📊 User mapping: ${userMap.size} users with complete info`);
    console.log(`📊 Department mapping: ${userToDepartment.size} user-department assignments`);

    // Seed departments first
    console.log('\n🏢 Seeding departments...');
    const departmentDocs = Object.keys(departmentsData).map(departmentName => ({
      _id: createDepartmentId(departmentName),
      name: departmentName,
      isActive: true,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await db.collection('departments').deleteMany({});
    const departmentResult = await db.collection('departments').insertMany(departmentDocs);
    console.log(`✅ Seeded ${departmentResult.insertedCount} departments`);

    // Log department summary
    console.log('\n📋 Department Summary:');
    Object.entries(departmentsData).forEach(([name, employees]) => {
      console.log(`  - ${name}: ${employees.length} nhân viên`);
    });

    // Seed employees
    console.log('\n👥 Seeding employees...');
    const employeeDocs = [];
    let matchedCount = 0;
    let unmatchedUsers = [];
    let unmatchedDepartments = [];

    // Process users who have department assignments
    userToDepartment.forEach((departmentName, userId) => {
      const userInfo = userMap.get(userId);
      
      if (userInfo) {
        // User exists in both files - use data from users.json (more reliable)
        employeeDocs.push({
          _id: userId,
          name: userInfo.name,
          title: getTitleByRole(userInfo.role, userInfo.name),
          department: departmentName,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        matchedCount++;
      } else {
        // User in department but not in users.json - use department data
        const deptEmployee = Object.values(departmentsData).flat()
          .find(emp => emp.userId === userId);
        
        if (deptEmployee && deptEmployee.name) {
          employeeDocs.push({
            _id: userId,
            name: deptEmployee.name,
            title: 'Nhân viên', // Default title since no role info
            department: departmentName,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          unmatchedDepartments.push({ userId, departmentName, name: deptEmployee.name });
        }
      }
    });

    // Process users who don't have department assignments
    userMap.forEach((userInfo, userId) => {
      if (!userToDepartment.has(userId)) {
        // User exists but no department assignment
        unmatchedUsers.push({ userId, name: userInfo.name });
        
        // Assign to default department
        employeeDocs.push({
          _id: userId,
          name: userInfo.name,
          title: getTitleByRole(userInfo.role, userInfo.name),
          department: 'Nhân viên chưa phân phòng',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });

    // Add default department for unassigned users
    if (unmatchedUsers.length > 0) {
      await db.collection('departments').insertOne({
        _id: 'nhan-vien-chua-phan-phong',
        name: 'Nhân viên chưa phân phòng',
        isActive: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Insert employees
    await db.collection('employees').deleteMany({});
    const employeeResult = await db.collection('employees').insertMany(employeeDocs);
    console.log(`✅ Seeded ${employeeResult.insertedCount} employees`);

    // Summary report
    console.log('\n📊 SEEDING SUMMARY:');
    console.log(`✅ Perfect matches: ${matchedCount} (có trong cả users.json và department.json)`);
    console.log(`⚠️  Users without department: ${unmatchedUsers.length}`);
    console.log(`⚠️  Department entries without user info: ${unmatchedDepartments.length}`);
    console.log(`📈 Total employees seeded: ${employeeDocs.length}`);
    console.log(`📈 Total departments: ${Object.keys(departmentsData).length + (unmatchedUsers.length > 0 ? 1 : 0)}`);

    if (unmatchedUsers.length > 0) {
      console.log('\n⚠️  Users without department assignment:');
      unmatchedUsers.slice(0, 10).forEach(user => {
        console.log(`   - ${user.userId}: ${user.name}`);
      });
      if (unmatchedUsers.length > 10) {
        console.log(`   ... and ${unmatchedUsers.length - 10} more`);
      }
    }

    if (unmatchedDepartments.length > 0) {
      console.log('\n⚠️  Department entries added without full user data:');
      unmatchedDepartments.slice(0, 10).forEach(entry => {
        console.log(`   - ${entry.userId} (${entry.name}) in ${entry.departmentName}`);
      });
      if (unmatchedDepartments.length > 10) {
        console.log(`   ... and ${unmatchedDepartments.length - 10} more`);
      }
    }

    console.log('\n🎉 Employee and department seeding completed!');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the seed function
if (require.main === module) {
  seedEmployeesWithDepartments()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedEmployeesWithDepartments };
