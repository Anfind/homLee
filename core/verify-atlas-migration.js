const { MongoClient } = require('mongodb');

// Connection strings
const ATLAS_URI = 'mongodb+srv://leehomes_admin:W029yxWJtYf7z5IC@lee-homes-cluster.xmgrbjn.mongodb.net/homelee-attendance?retryWrites=true&w=majority&appName=lee-homes-cluster';
const LOCAL_URI = 'mongodb://localhost:27017/homelee-attendance';

async function verifyMigration() {
  console.log('🔍 Verifying data migration from Local to Atlas...\n');
  
  const localClient = new MongoClient(LOCAL_URI);
  const atlasClient = new MongoClient(ATLAS_URI);
  
  try {
    // Connect to both databases
    console.log('🔌 Connecting to databases...');
    await localClient.connect();
    await atlasClient.connect();
    console.log('✅ Connected to both Local and Atlas\n');
    
    const localDb = localClient.db('homelee-attendance');
    const atlasDb = atlasClient.db('homelee-attendance');
    
    // Collections to check
    const collections = [
      'employees',
      'users', 
      'departments',
      'attendancerecords',
      'bonuspoints',
      'customdailyvalues',
      'checkinsettings'
    ];
    
    console.log('📊 Data comparison:');
    console.log('=' .repeat(80));
    console.log(sprintf('%-20s | %-15s | %-15s | %-10s', 'Collection', 'Local Count', 'Atlas Count', 'Status'));
    console.log('=' .repeat(80));
    
    let totalMigrated = 0;
    let migrationStatus = 'SUCCESS';
    
    for (const collName of collections) {
      try {
        // Check if collection exists in local
        const localCollections = await localDb.listCollections({ name: collName }).toArray();
        const localExists = localCollections.length > 0;
        
        // Check if collection exists in atlas
        const atlasCollections = await atlasDb.listCollections({ name: collName }).toArray();
        const atlasExists = atlasCollections.length > 0;
        
        let localCount = 0;
        let atlasCount = 0;
        let status = 'N/A';
        
        if (localExists) {
          localCount = await localDb.collection(collName).countDocuments();
        }
        
        if (atlasExists) {
          atlasCount = await atlasDb.collection(collName).countDocuments();
        }
        
        // Determine status
        if (!localExists && !atlasExists) {
          status = 'N/A';
        } else if (!localExists && atlasExists) {
          status = '✅ ATLAS ONLY';
          totalMigrated += atlasCount;
        } else if (localExists && !atlasExists) {
          status = '⚠️ NOT MIGRATED';
          migrationStatus = 'PARTIAL';
        } else if (localCount === atlasCount) {
          status = '✅ COMPLETE';
          totalMigrated += atlasCount;
        } else {
          status = '⚠️ MISMATCH';
          migrationStatus = 'PARTIAL';
        }
        
        console.log(sprintf('%-20s | %-15s | %-15s | %-10s', 
          collName, 
          localExists ? localCount.toString() : 'N/A',
          atlasExists ? atlasCount.toString() : 'N/A',
          status
        ));
        
      } catch (error) {
        console.log(sprintf('%-20s | %-15s | %-15s | %-10s', 
          collName, 'ERROR', 'ERROR', '❌ ERROR'
        ));
        migrationStatus = 'ERROR';
      }
    }
    
    console.log('=' .repeat(80));
    console.log(`\n📈 Migration Summary:`);
    console.log(`  Total records in Atlas: ${totalMigrated}`);
    console.log(`  Migration status: ${migrationStatus === 'SUCCESS' ? '✅ SUCCESS' : '⚠️ ' + migrationStatus}`);
    
    // Test sample data integrity
    console.log('\n🔍 Sample Data Integrity Check:');
    
    // Check employees
    try {
      const atlasEmployee = await atlasDb.collection('employees').findOne({});
      if (atlasEmployee) {
        console.log(`  ✅ Sample employee: ${atlasEmployee.name} (${atlasEmployee.department})`);
      } else {
        console.log('  ❌ No employees found in Atlas');
      }
    } catch (error) {
      console.log('  ❌ Error checking employees:', error.message);
    }
    
    // Check users
    try {
      const atlasUser = await atlasDb.collection('users').findOne({}, { projection: { password: 0 } });
      if (atlasUser) {
        console.log(`  ✅ Sample user: ${atlasUser.username} (${atlasUser.role})`);
      } else {
        console.log('  ❌ No users found in Atlas');
      }
    } catch (error) {
      console.log('  ❌ Error checking users:', error.message);
    }
    
    // Check latest attendance
    try {
      const latestAttendance = await atlasDb.collection('attendancerecords')
        .findOne({}, { sort: { timestamp: -1 } });
      if (latestAttendance) {
        console.log(`  ✅ Latest attendance: Employee ${latestAttendance.employeeId} at ${latestAttendance.timestamp}`);
      } else {
        console.log('  ❌ No attendance records found in Atlas');
      }
    } catch (error) {
      console.log('  ❌ Error checking attendance:', error.message);
    }
    
    console.log('\n🎯 Next Steps:');
    if (migrationStatus === 'SUCCESS') {
      console.log('  ✅ Migration completed successfully!');
      console.log('  🚀 Your application is ready to use MongoDB Atlas');
      console.log('  💡 You can now start the application with Atlas connection');
    } else if (migrationStatus === 'PARTIAL') {
      console.log('  ⚠️ Some collections need attention');
      console.log('  📋 Check collections marked as "NOT MIGRATED" or "MISMATCH"');
      console.log('  🔄 Consider re-running migration for missing data');
    } else {
      console.log('  ❌ Migration has errors');
      console.log('  🔧 Check connection strings and database permissions');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await localClient.close();
    await atlasClient.close();
    console.log('\n🔌 Database connections closed');
  }
}

// Simple sprintf function
function sprintf(format, ...args) {
  let i = 0;
  return format.replace(/%[-#+ 0]*\*?[0-9]*(?:\.[0-9]*)?[hlL]?[diouxXeEfFgGaAcspn%]/g, () => {
    return args[i++];
  });
}

// Test Atlas connection only
async function testAtlasOnly() {
  console.log('🌐 Testing Atlas connection only...\n');
  
  const atlasClient = new MongoClient(ATLAS_URI);
  
  try {
    await atlasClient.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = atlasClient.db('homelee-attendance');
    const collections = await db.listCollections().toArray();
    
    console.log(`\n📁 Found ${collections.length} collections in Atlas:`);
    
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  - ${collection.name}: ${count} documents`);
    }
    
    console.log('\n✅ Atlas is ready for use!');
    
  } catch (error) {
    console.error('❌ Atlas connection failed:', error.message);
  } finally {
    await atlasClient.close();
  }
}

// Main function
async function main() {
  const mode = process.argv[2];
  
  if (mode === 'atlas-only') {
    await testAtlasOnly();
  } else {
    await verifyMigration();
  }
}

main().catch(console.error);

// Usage:
// node verify-atlas-migration.js           # Compare local vs atlas
// node verify-atlas-migration.js atlas-only # Test atlas connection only
