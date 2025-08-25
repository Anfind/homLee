const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homelee-attendance';

// Mapping ZKTeco roles to departments and titles
const roleMapping = {
  14: { 
    department: 'Ban Giám Đốc', 
    title: 'Phó Giám Đốc' 
  },
  0: { 
    department: 'Nhân viên', 
    title: 'Nhân viên' 
  }
};

// Default departments based on common Vietnamese company structure
const defaultDepartments = [
  'Ban Giám Đốc',
  'Phòng Hành chính - Nhân sự', 
  'Phòng Kế toán',
  'Phòng Kinh doanh',
  'Phòng Kỹ thuật',
  'Phòng Sản xuất',
  'Phòng Bảo vệ',
  'Nhân viên'
];

function getDepartmentByName(name) {
  const nameUpper = name.toUpperCase();
  
  // Phân theo tên để xác định phòng ban
  if (nameUpper.includes('PGD') || nameUpper.includes('GIÁM ĐỐC')) {
    return 'Ban Giám Đốc';
  }
  if (nameUpper.includes('KẾ TOÁN') || nameUpper.includes('KT')) {
    return 'Phòng Kế toán';
  }
  if (nameUpper.includes('HÀNH CHÍNH') || nameUpper.includes('NHÂN SỰ') || nameUpper.includes('HC')) {
    return 'Phòng Hành chính - Nhân sự';
  }
  if (nameUpper.includes('KINH DOANH') || nameUpper.includes('BÁN HÀNG') || nameUpper.includes('KD')) {
    return 'Phòng Kinh doanh';
  }
  if (nameUpper.includes('KỸ THUẬT') || nameUpper.includes('CÔNG NGHỆ') || nameUpper.includes('IT')) {
    return 'Phòng Kỹ thuật';
  }
  if (nameUpper.includes('SẢN XUẤT') || nameUpper.includes('VẬN HÀNH')) {
    return 'Phòng Sản xuất';
  }
  if (nameUpper.includes('BẢO VỆ') || nameUpper.includes('AN NINH')) {
    return 'Phòng Bảo vệ';
  }
  
  return 'Nhân viên'; // Default department
}

function getTitleByRole(role, name) {
  const nameUpper = name.toUpperCase();
  
  if (role === 14) {
    if (nameUpper.includes('PGD')) {
      return 'Phó Giám Đốc';
    }
    return 'Quản lý cấp cao';
  }
  
  // Phân theo tên để xác định chức danh
  if (nameUpper.includes('TRƯỞNG PHÒNG') || nameUpper.includes('TP')) {
    return 'Trưởng phòng';
  }
  if (nameUpper.includes('PHÓ PHÒNG') || nameUpper.includes('PP')) {
    return 'Phó phòng';
  }
  if (nameUpper.includes('CHUYÊN VIÊN')) {
    return 'Chuyên viên';
  }
  if (nameUpper.includes('THƯ KÝ')) {
    return 'Thư ký';
  }
  if (nameUpper.includes('KẾ TOÁN')) {
    return 'Kế toán viên';
  }
  
  return 'Nhân viên'; // Default title
}

async function seedEmployeesFromZKTeco() {
  console.log('🚀 Starting ZKTeco employees seeding process...');
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const employeesCollection = db.collection('employees');
    const departmentsCollection = db.collection('departments');

    // Read users.json file from ZKTeco backend
    const usersFilePath = path.join(__dirname, '..', 'zktceo-backend', 'log', 'users.json');
    console.log('📖 Reading ZKTeco users.json from:', usersFilePath);
    
    if (!fs.existsSync(usersFilePath)) {
      console.error('❌ users.json file not found at:', usersFilePath);
      
      // Try alternative path
      const altPath = path.join(__dirname, 'zktceo-backend', 'log', 'users.json');
      console.log('🔍 Trying alternative path:', altPath);
      
      if (!fs.existsSync(altPath)) {
        console.error('❌ users.json also not found at alternative path');
        process.exit(1);
      } else {
        usersFilePath = altPath;
        console.log('✅ Found users.json at alternative path');
      }
    }

    const rawData = fs.readFileSync(usersFilePath, 'utf8');
    const usersData = JSON.parse(rawData);

    if (!usersData.success || !usersData.data) {
      console.error('❌ Invalid users.json format');
      console.log('Expected format: { success: true, data: [...] }');
      console.log('Actual keys:', Object.keys(usersData));
      process.exit(1);
    }

    console.log(`📊 Found ${usersData.data.length} employees in ZKTeco data`);
    console.log(`📝 Message: ${usersData.message}`);

    // First, ensure departments exist
    console.log('🏢 Creating default departments...');
    
    for (const deptName of defaultDepartments) {
      const deptId = `dept-${deptName.toLowerCase().replace(/\s+/g, '-')}`;
      try {
        await departmentsCollection.updateOne(
          { name: deptName },
          { 
            $setOnInsert: {
              _id: deptId,
              name: deptName,
              createdBy: 'zkteco-seed',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );
      } catch (error) {
        if (error.code !== 11000) { // Ignore duplicate key errors
          console.error(`Error creating department ${deptName}:`, error.message);
        }
      }
    }

    console.log('✅ Departments processed successfully');

    // Transform ZKTeco users to Employee format
    const employees = usersData.data.map(zkUser => {
      const cleanName = zkUser.name ? zkUser.name.trim() : `User_${zkUser.userId}`;
      const department = getDepartmentByName(cleanName);
      const title = getTitleByRole(zkUser.role, cleanName);
      
      return {
        _id: zkUser.userId.toString(), // Use ZKTeco userId as MongoDB _id
        name: cleanName,
        title: title,
        department: department,
        zktecoData: {
          uid: zkUser.uid,
          role: zkUser.role,
          cardno: zkUser.cardno,
          originalUserId: zkUser.userId
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    // Filter out invalid employees
    const validEmployees = employees.filter(emp => 
      emp.name && 
      emp.name.length > 0 && 
      emp._id && 
      emp.name !== 'undefined' &&
      !emp.name.startsWith('User_')
    );

    console.log(`✅ Processing ${validEmployees.length} valid employees out of ${employees.length} total...`);

    // Show department distribution
    const deptStats = {};
    validEmployees.forEach(emp => {
      deptStats[emp.department] = (deptStats[emp.department] || 0) + 1;
    });

    console.log('\n📊 Department distribution:');
    Object.entries(deptStats).forEach(([dept, count]) => {
      console.log(`   - ${dept}: ${count} employees`);
    });

    // Use bulk operations for better performance
    // Split _id from other fields to avoid immutable field error
    const bulkOps = validEmployees.map(employee => {
      const { _id, ...updateData } = employee;
      return {
        updateOne: {
          filter: { _id: _id },
          update: { $set: updateData },
          upsert: true
        }
      };
    });

    if (bulkOps.length === 0) {
      console.log('⚠️ No valid employees to insert');
      return;
    }

    // Execute bulk operation
    console.log('💾 Inserting/updating employees in MongoDB...');
    const result = await employeesCollection.bulkWrite(bulkOps);

    console.log('\n🎉 ZKTeco employees seed completed successfully!');
    console.log(`   - Inserted: ${result.upsertedCount} new employees`);
    console.log(`   - Updated: ${result.modifiedCount} existing employees`);
    console.log(`   - Matched: ${result.matchedCount} unchanged employees`);
    console.log(`   - Total processed: ${validEmployees.length} employees`);

    // Show some sample employees
    const sampleEmployees = await employeesCollection.find({}).limit(10).toArray();
    console.log('\n📋 Sample employees in database:');
    sampleEmployees.forEach(emp => {
      console.log(`   - ID: ${emp._id}, Name: ${emp.name}, Title: ${emp.title}, Dept: ${emp.department}`);
    });

    // Show statistics by department
    const pipeline = [
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ];
    
    const departmentStats = await employeesCollection.aggregate(pipeline).toArray();
    console.log('\n📊 Final department statistics:');
    departmentStats.forEach(stat => {
      console.log(`   - ${stat._id}: ${stat.count} employees`);
    });

    const totalCount = await employeesCollection.countDocuments();
    console.log(`\n📈 Total employees in database: ${totalCount}`);

    // Show role distribution
    const roleStats = await employeesCollection.aggregate([
      { $group: { _id: '$zktecoData.role', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('\n🔑 ZKTeco role distribution:');
    roleStats.forEach(stat => {
      console.log(`   - Role ${stat._id}: ${stat.count} employees`);
    });

  } catch (error) {
    console.error('❌ Error seeding employees from ZKTeco:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the seed function
if (require.main === module) {
  seedEmployeesFromZKTeco().catch(console.error);
}

module.exports = { seedEmployeesFromZKTeco };
