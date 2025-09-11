const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');

// MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://leehomes_admin:W029yxWJtYf7z5IC@lee-homes-cluster.xmgrbjn.mongodb.net/homelee-attendance?retryWrites=true&w=majority&appName=lee-homes-cluster';

async function testAtlasConnection() {
  console.log('🚀 Testing MongoDB Atlas Connection...\n');
  
  // Test 1: MongoClient connection
  console.log('📋 Test 1: MongoClient Connection');
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ MongoClient connected successfully to Atlas');
    
    const db = client.db('homelee-attendance');
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections:`);
    
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  - ${collection.name}: ${count} documents`);
    }
    
  } catch (error) {
    console.error('❌ MongoClient connection failed:', error.message);
  } finally {
    await client.close();
    console.log('🔌 MongoClient connection closed\n');
  }
  
  // Test 2: Mongoose connection
  console.log('📋 Test 2: Mongoose Connection');
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
    
    console.log('✅ Mongoose connected successfully to Atlas');
    console.log('🌐 Database name:', mongoose.connection.name);
    console.log('🖥️ Host:', mongoose.connection.host);
    console.log('📊 Ready state:', mongoose.connection.readyState); // 1 = connected
    
  } catch (error) {
    console.error('❌ Mongoose connection failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Mongoose connection closed\n');
  }
  
  console.log('✅ Atlas connection tests completed!');
}

async function testDataRetrieval() {
  console.log('\n🔍 Testing Data Retrieval from Atlas...\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('homelee-attendance');
    
    // Test employees collection
    console.log('👥 Testing Employees Collection:');
    const employeeCount = await db.collection('employees').countDocuments();
    console.log(`  Total employees: ${employeeCount}`);
    
    if (employeeCount > 0) {
      const sampleEmployee = await db.collection('employees').findOne({});
      console.log(`  Sample employee: ${sampleEmployee.name} (${sampleEmployee.department})`);
    }
    
    // Test users collection
    console.log('\n🔐 Testing Users Collection:');
    const userCount = await db.collection('users').countDocuments();
    console.log(`  Total users: ${userCount}`);
    
    if (userCount > 0) {
      const sampleUser = await db.collection('users').findOne({}, { projection: { password: 0 } });
      console.log(`  Sample user: ${sampleUser.username} (${sampleUser.role})`);
    }
    
    // Test departments collection
    console.log('\n🏢 Testing Departments Collection:');
    const deptCount = await db.collection('departments').countDocuments();
    console.log(`  Total departments: ${deptCount}`);
    
    if (deptCount > 0) {
      const sampleDept = await db.collection('departments').findOne({});
      console.log(`  Sample department: ${sampleDept.name}`);
    }
    
    // Test attendance records
    console.log('\n📅 Testing Attendance Records:');
    const attendanceCount = await db.collection('attendancerecords').countDocuments();
    console.log(`  Total attendance records: ${attendanceCount}`);
    
    if (attendanceCount > 0) {
      const latestRecord = await db.collection('attendancerecords')
        .findOne({}, { sort: { timestamp: -1 } });
      console.log(`  Latest record: ${latestRecord.employeeId} at ${latestRecord.timestamp}`);
    }
    
  } catch (error) {
    console.error('❌ Data retrieval failed:', error.message);
  } finally {
    await client.close();
  }
}

// Run tests
async function runAllTests() {
  try {
    await testAtlasConnection();
    await testDataRetrieval();
    
    console.log('\n🎉 All Atlas tests completed successfully!');
    console.log('💡 Your application is ready to use MongoDB Atlas!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

runAllTests();
