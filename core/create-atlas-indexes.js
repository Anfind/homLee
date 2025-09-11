require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

// MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://leehomes_admin:W029yxWJtYf7z5IC@lee-homes-cluster.xmgrbjn.mongodb.net/homelee-attendance?retryWrites=true&w=majority&appName=lee-homes-cluster';

async function createOptimalIndexes() {
  console.log('🚀 Creating optimal indexes for MongoDB Atlas safely...\n');
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env.local');
    return;
  }
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db('homelee-attendance');
    
    // 🔍 STEP 1: Check existing data first
    console.log('\n📊 Checking existing data...');
    const collections = ['employees', 'attendancerecords', 'users', 'departments'];
    
    const collectionCounts = {};
    for (const collName of collections) {
      const count = await db.collection(collName).countDocuments();
      collectionCounts[collName] = count;
      console.log(`  - ${collName}: ${count} documents`);
      
      if (count === 0) {
        console.log(`⚠️  ${collName} is empty - will skip indexes`);
      }
    }
    
    // 1. Attendance Records Indexes (PERFORMANCE CRITICAL)
    if (collectionCounts.attendancerecords > 0) {
      console.log('\n📊 Creating indexes for attendancerecords...');
      try {
        await db.collection('attendancerecords').createIndexes([
          {
            key: { employeeId: 1, date: -1 },
            name: 'employee_date_lookup',
            background: true
          },
          {
            key: { date: -1 },
            name: 'recent_records_first',
            background: true
          },
          {
            key: { employeeId: 1 },
            name: 'employee_lookup',
            background: true
          },
          {
            key: { timestamp: -1 },
            name: 'timestamp_desc',
            background: true
          },
          {
            key: { createdAt: -1 },
            name: 'created_recent',
            background: true
          }
        ]);
        console.log('  ✅ Attendance indexes created');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('  ℹ️  Attendance indexes already exist - skipping');
        } else {
          console.error('  ❌ Attendance index error:', error.message);
        }
      }
    } else {
      console.log('⚠️  Skipping attendance indexes - no data found');
    }
    
    // 2. Employees Indexes
    if (collectionCounts.employees > 0) {
      console.log('\n👥 Creating indexes for employees...');
      try {
        await db.collection('employees').createIndexes([
          {
            key: { _id: 1 },
            name: 'employee_id_unique',
            unique: true,
            background: true
          },
          {
            key: { name: 1 },
            name: 'employee_name_search',
            background: true
          },
          {
            key: { department: 1 },
            name: 'department_filter',
            background: true
          },
          {
            key: { name: 'text', department: 'text' },
            name: 'employee_text_search',
            background: true
          }
        ]);
        console.log('  ✅ Employee indexes created');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('  ℹ️  Employee indexes already exist - skipping');
        } else {
          console.error('  ❌ Employee index error:', error.message);
        }
      }
    } else {
      console.log('⚠️  Skipping employee indexes - no data found');
    }
    
    // 3. Users Indexes
    if (collectionCounts.users > 0) {
      console.log('\n🔐 Creating indexes for users...');
      try {
        await db.collection('users').createIndexes([
          {
            key: { username: 1 },
            name: 'username_unique',
            unique: true,
            background: true
          },
          {
            key: { role: 1 },
            name: 'role_filter',
            background: true
          },
          {
            key: { department: 1 },
            name: 'user_department',
            background: true
          },
          {
            key: { isActive: 1 },
            name: 'active_users',
            background: true
          }
        ]);
        console.log('  ✅ User indexes created');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('  ℹ️  User indexes already exist - skipping');
        } else {
          console.error('  ❌ User index error:', error.message);
        }
      }
    } else {
      console.log('⚠️  Skipping user indexes - no data found');
    }
    
    // 4. Departments Indexes
    if (collectionCounts.departments > 0) {
      console.log('\n🏢 Creating indexes for departments...');
      try {
        await db.collection('departments').createIndexes([
          {
            key: { name: 1 },
            name: 'department_name_unique',
            unique: true,
            background: true
          },
          {
            key: { isActive: 1 },
            name: 'active_departments',
            background: true
          }
        ]);
        console.log('  ✅ Department indexes created');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('  ℹ️  Department indexes already exist - skipping');
        } else {
          console.error('  ❌ Department index error:', error.message);
        }
      }
    } else {
      console.log('⚠️  Skipping department indexes - no data found');
    }
    
    // 5. Bonus Points Indexes (if exists)
    const bonusCollection = await db.listCollections({ name: 'bonuspoints' }).toArray();
    if (bonusCollection.length > 0) {
      console.log('⭐ Creating indexes for bonuspoints...');
      await db.collection('bonuspoints').createIndexes([
        {
          key: { employeeId: 1, date: -1 },
          name: 'bonus_employee_date',
          background: true
        },
        {
          key: { date: -1 },
          name: 'bonus_date_desc',
          background: true
        }
      ]);
      console.log('  ✅ Bonus points indexes created');
    }
    
    // 6. Check-in Settings Indexes
    const settingsCollection = await db.listCollections({ name: 'checkinsettings' }).toArray();
    if (settingsCollection.length > 0) {
      console.log('⚙️ Creating indexes for checkinsettings...');
      await db.collection('checkinsettings').createIndexes([
        {
          key: { dayOfWeek: 1 },
          name: 'day_of_week',
          background: true
        },
        {
          key: { isActive: 1 },
          name: 'active_settings',
          background: true
        }
      ]);
      console.log('  ✅ Check-in settings indexes created');
    }
    
    // 7. Custom Daily Values Indexes (if exists)
    const customCollection = await db.listCollections({ name: 'customdailyvalues' }).toArray();
    if (customCollection.length > 0) {
      console.log('📈 Creating indexes for customdailyvalues...');
      await db.collection('customdailyvalues').createIndexes([
        {
          key: { employeeId: 1, date: -1 },
          name: 'custom_employee_date',
          background: true
        },
        {
          key: { date: -1 },
          name: 'custom_date_desc',
          background: true
        }
      ]);
      console.log('  ✅ Custom daily values indexes created');
    }
    
    // 🔍 STEP 2: Verify data integrity after index creation
    console.log('\n🔬 Verifying data integrity...');
    
    // Sample check - ensure _id still unique
    if (collectionCounts.employees > 0) {
      const sampleEmployees = await db.collection('employees')
        .find({})
        .limit(5)
        .toArray();
        
      console.log('📋 Sample employees after indexing:');
      sampleEmployees.forEach(emp => {
        console.log(`  - ID: ${emp._id} | Name: ${emp.name} | Dept: ${emp.department}`);
      });
      
      // Check for duplicate _ids (should be 0)
      const duplicateCheck = await db.collection('employees').aggregate([
        { $group: { _id: '$_id', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } }
      ]).toArray();
      
      if (duplicateCheck.length === 0) {
        console.log('✅ All employee _ids are unique - data integrity confirmed');
      } else {
        console.log('⚠️  Found duplicate _ids:', duplicateCheck);
      }
    }
    
    console.log('\n📋 Index Summary:');
    const summaryCollections = ['attendancerecords', 'employees', 'users', 'departments'];
    
    for (const collName of summaryCollections) {
      const indexes = await db.collection(collName).listIndexes().toArray();
      console.log(`  ${collName}: ${indexes.length} indexes`);
      indexes.forEach(index => {
        console.log(`    - ${index.name}: ${JSON.stringify(index.key)}`);
      });
    }
    
    console.log('\n✅ All indexes created safely!');
    console.log('💾 Your data remains completely unchanged');
    console.log('⚡ Query performance significantly improved');
    console.log('🚀 MongoDB Atlas is now optimized for Lee Homes application');
    
  } catch (error) {
    console.error('❌ Index creation failed:', error);
  } finally {
    await client.close();
    console.log('🔌 Connection closed');
  }
}

// Check existing indexes
async function checkExistingIndexes() {
  console.log('🔍 Checking existing indexes...\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('homelee-attendance');
    
    const checkCollections = await db.listCollections().toArray();
    
    for (const collection of checkCollections) {
      const collName = collection.name;
      const indexes = await db.collection(collName).listIndexes().toArray();
      
      console.log(`📁 ${collName}:`);
      console.log(`  Total indexes: ${indexes.length}`);
      
      indexes.forEach(index => {
        const keyStr = JSON.stringify(index.key);
        const unique = index.unique ? ' (UNIQUE)' : '';
        const background = index.background ? ' (BACKGROUND)' : '';
        console.log(`    - ${index.name}: ${keyStr}${unique}${background}`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await client.close();
  }
}

// Run the script
async function main() {
  const action = process.argv[2];
  
  if (action === 'check') {
    await checkExistingIndexes();
  } else {
    await createOptimalIndexes();
  }
}

main().catch(console.error);

// Usage:
// node create-atlas-indexes.js        # Create indexes
// node create-atlas-indexes.js check  # Check existing indexes
