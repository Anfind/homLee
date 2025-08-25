const { MongoClient } = require('mongodb');
const fs = require('fs');

async function exportUnassignedEmployees() {
  const client = new MongoClient('mongodb://localhost:27017/homelee-attendance');
  
  try {
    await client.connect();
    const db = client.db();
    
    // Get all employees without department assignment
    const unassignedEmployees = await db.collection('employees')
      .find({ department: 'Nhân viên chưa phân phòng' })
      .sort({ _id: 1 })
      .toArray();
    
    console.log(`📊 Found ${unassignedEmployees.length} employees without department assignment\n`);
    
    // Create detailed report
    const report = {
      summary: {
        total: unassignedEmployees.length,
        exportedAt: new Date().toISOString(),
        description: "Employees without department assignment in Lee Homes attendance system"
      },
      employees: unassignedEmployees.map(emp => ({
        userId: emp._id,
        name: emp.name,
        title: emp.title,
        createdAt: emp.createdAt
      }))
    };
    
    // Export to JSON file
    const fileName = `unassigned-employees-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(fileName, JSON.stringify(report, null, 2));
    
    // Display list in console
    console.log('📋 DANH SÁCH 142 NHÂN VIÊN CHƯA PHÂN PHÒNG BAN:');
    console.log('=' .repeat(60));
    
    unassignedEmployees.forEach((emp, index) => {
      console.log(`${(index + 1).toString().padStart(3, ' ')}. ${emp._id.padEnd(4)} - ${emp.name.padEnd(15)} (${emp.title})`);
    });
    
    console.log('=' .repeat(60));
    console.log(`✅ Exported ${unassignedEmployees.length} employees to ${fileName}`);
    
    // Group by title to see distribution
    const titleStats = {};
    unassignedEmployees.forEach(emp => {
      titleStats[emp.title] = (titleStats[emp.title] || 0) + 1;
    });
    
    console.log('\n📈 PHÂN BỐ THEO CHỨC DANH:');
    Object.entries(titleStats).forEach(([title, count]) => {
      console.log(`  - ${title}: ${count} người`);
    });
    
    // Check if these employees have attendance records
    const attendanceStats = await db.collection('attendancerecords')
      .aggregate([
        { $match: { employeeId: { $in: unassignedEmployees.map(e => e._id) } } },
        { $group: { _id: '$employeeId', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();
    
    console.log(`\n📅 THỐNG KÊ CHẤM CÔNG:`);
    console.log(`  - ${attendanceStats.length}/${unassignedEmployees.length} nhân viên có dữ liệu chấm công`);
    
    if (attendanceStats.length > 0) {
      console.log(`\n🔝 TOP 10 NHÂN VIÊN CHƯA PHÂN PHÒNG CÓ NHIỀU RECORD CHẤM CÔNG NHẤT:`);
      attendanceStats.slice(0, 10).forEach((stat, index) => {
        const emp = unassignedEmployees.find(e => e._id === stat._id);
        console.log(`  ${index + 1}. ${stat._id} - ${emp.name}: ${stat.count} records`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

exportUnassignedEmployees();
