const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homelee-attendance';

async function seedEmployees() {
  console.log('🚀 Starting employee seeding process...');
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const employeesCollection = db.collection('employees');

    // Read users.json file
    const usersFilePath = path.join(__dirname, '..', 'zktceo-backend', 'log', 'users.json');
    console.log('📖 Looking for users.json at:', usersFilePath);
    
    if (!fs.existsSync(usersFilePath)) {
      console.error('❌ users.json file not found at:', usersFilePath);
      
      // Try alternative path
      const altPath = path.join(__dirname, '..', '..', 'zktceo-backend', 'log', 'users.json');
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
      console.log('Data structure:', Object.keys(usersData));
      process.exit(1);
    }

    console.log(`📊 Found ${usersData.data.length} employees in users.json`);

    // Transform ZKTeco users to Employee format
    const employees = usersData.data.map(zkUser => ({
      _id: zkUser.userId.toString(), // Use userId as _id
      name: zkUser.name.trim(),
      title: 'Nhân viên', // Default title
      department: 'Chưa phân bổ', // Default department
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Filter out invalid employees (empty names, etc.)
    const validEmployees = employees.filter(emp => 
      emp.name && emp.name.length > 0 && emp._id
    );

    console.log(`✅ Processing ${validEmployees.length} valid employees...`);

    // Use bulk operations for better performance
    const bulkOps = validEmployees.map(employee => ({
      updateOne: {
        filter: { _id: employee._id },
        update: { $set: employee },
        upsert: true
      }
    }));

    if (bulkOps.length === 0) {
      console.log('⚠️ No valid employees to insert');
      return;
    }

    // Execute bulk operation
    console.log('💾 Inserting/updating employees in database...');
    const result = await employeesCollection.bulkWrite(bulkOps);

    console.log('🎉 Seed completed successfully!');
    console.log(`   - Inserted: ${result.upsertedCount} new employees`);
    console.log(`   - Updated: ${result.modifiedCount} existing employees`);
    console.log(`   - Total processed: ${result.upsertedCount + result.modifiedCount + result.matchedCount}`);

    // Show some sample employees
    const sampleEmployees = await employeesCollection.find({}).limit(5).toArray();
    console.log('\n📋 Sample employees in database:');
    sampleEmployees.forEach(emp => {
      console.log(`   - ID: ${emp._id}, Name: ${emp.name}, Department: ${emp.department}`);
    });

    const totalCount = await employeesCollection.countDocuments();
    console.log(`\n📊 Total employees in database: ${totalCount}`);

  } catch (error) {
    console.error('❌ Error seeding employees:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the seed function
if (require.main === module) {
  seedEmployees().catch(console.error);
}

module.exports = { seedEmployees };
