// Test script to verify complete workflow
const fs = require('fs');
const path = require('path');

// Sample data from backend
const sampleUsers = [
  { uid: 1, role: 14, name: "PGD THANG", userId: "1" },
  { uid: 2, role: 0, name: "Nguyen Van A", userId: "27" },
  { uid: 3, role: 0, name: "Le Thi B", userId: "47" }
];

const sampleAttendance = [
  { userSn: 1, deviceUserId: "27", recordTime: "2025-07-25T00:18:43.000Z", ip: "192.168.1.240" },
  { userSn: 2, deviceUserId: "27", recordTime: "2025-07-25T05:30:15.000Z", ip: "192.168.1.240" },
  { userSn: 3, deviceUserId: "47", recordTime: "2025-07-25T01:19:02.000Z", ip: "192.168.1.240" },
  { userSn: 4, deviceUserId: "47", recordTime: "2025-07-25T06:45:30.000Z", ip: "192.168.1.240" }
];

// Timezone conversion function (from ZK API)
function convertToVietnamTime(utcTimestamp) {
  const utcDate = new Date(utcTimestamp);
  const vietnamDate = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000));
  return vietnamDate;
}

function formatVietnamTime(utcTimestamp) {
  const vietnamDate = convertToVietnamTime(utcTimestamp);
  return vietnamDate.toTimeString().substring(0, 5);
}

function formatVietnamDate(utcTimestamp) {
  const vietnamDate = convertToVietnamTime(utcTimestamp);
  return vietnamDate.toISOString().split('T')[0];
}

// Employee transformation (from Attendance Calculator)
function transformZKUsersToEmployees(zkUsers) {
  return zkUsers.map(zkUser => ({
    id: zkUser.userId,
    name: zkUser.name.trim(),
    title: zkUser.role === 14 ? "Trưởng phòng" : "Nhân viên",
    department: zkUser.name.includes('PGD') ? 'Ban Giám đốc' : 'Phòng Hành chính'
  }));
}

// Group attendance by employee and date
function groupAttendanceByEmployeeAndDate(records) {
  const grouped = {};
  
  for (const record of records) {
    const employeeId = record.deviceUserId;
    const vietnamDate = formatVietnamDate(record.recordTime);
    const vietnamDateTime = convertToVietnamTime(record.recordTime);
    
    if (!grouped[employeeId]) grouped[employeeId] = {};
    if (!grouped[employeeId][vietnamDate]) grouped[employeeId][vietnamDate] = [];
    
    grouped[employeeId][vietnamDate].push(vietnamDateTime);
  }
  
  return grouped;
}

// Categorize check-ins
function categorizeCheckIns(timestamps) {
  if (timestamps.length === 0) return {};
  
  const sortedTimes = timestamps.sort((a, b) => a.getTime() - b.getTime());
  const morningCutoff = 12;
  const result = {};
  
  for (const time of sortedTimes) {
    const hour = time.getHours();
    if (hour < morningCutoff && !result.morning) {
      result.morning = time.toTimeString().substring(0, 5);
      break;
    }
  }
  
  for (const time of sortedTimes) {
    const hour = time.getHours();
    if (hour >= morningCutoff && !result.afternoon) {
      result.afternoon = time.toTimeString().substring(0, 5);
      break;
    }
  }
  
  return result;
}

// Calculate points (simplified version)
function calculatePoints(dateStr, morningCheckIn, afternoonCheckIn) {
  let points = 0;
  
  // Sample shift: Morning 07:00-11:00 (1 point), Afternoon 13:00-17:00 (1 point)
  if (morningCheckIn) {
    const hour = parseInt(morningCheckIn.split(':')[0]);
    if (hour >= 7 && hour <= 11) points += 1;
  }
  
  if (afternoonCheckIn) {
    const hour = parseInt(afternoonCheckIn.split(':')[0]);
    if (hour >= 13 && hour <= 17) points += 1;
  }
  
  return points;
}

// Main test function
function testCompleteWorkflow() {
  console.log('🚀 Testing Complete Data Workflow');
  console.log('==================================');
  
  // Step 1: Transform users
  console.log('\n📋 Step 1: Transform Users');
  const employees = transformZKUsersToEmployees(sampleUsers);
  console.log('Employees:', employees);
  
  // Step 2: Group attendance
  console.log('\n⏰ Step 2: Group Attendance');
  const groupedAttendance = groupAttendanceByEmployeeAndDate(sampleAttendance);
  console.log('Grouped Attendance:', JSON.stringify(groupedAttendance, null, 2));
  
  // Step 3: Process attendance records
  console.log('\n📊 Step 3: Process Attendance Records');
  const attendanceRecords = [];
  
  for (const [employeeId, dateMap] of Object.entries(groupedAttendance)) {
    for (const [dateStr, timestamps] of Object.entries(dateMap)) {
      console.log(`\nProcessing Employee ${employeeId} on ${dateStr}:`);
      
      // Show original UTC times
      console.log('  UTC times:', timestamps.map(t => t.toISOString()));
      
      // Show Vietnam times
      console.log('  Vietnam times:', timestamps.map(t => t.toTimeString().substring(0, 5)));
      
      const { morning, afternoon } = categorizeCheckIns(timestamps);
      console.log(`  Categorized: Morning=${morning}, Afternoon=${afternoon}`);
      
      const points = calculatePoints(dateStr, morning, afternoon);
      console.log(`  Points calculated: ${points}`);
      
      attendanceRecords.push({
        employeeId,
        date: dateStr,
        morningCheckIn: morning,
        afternoonCheckIn: afternoon,
        points
      });
    }
  }
  
  // Step 4: Final results
  console.log('\n✅ Final Results:');
  console.log('================');
  console.log(`Employees: ${employees.length}`);
  console.log(`Attendance Records: ${attendanceRecords.length}`);
  console.log('\nAttendance Records:');
  attendanceRecords.forEach(record => {
    const employee = employees.find(emp => emp.id === record.employeeId);
    console.log(`  ${employee?.name}: ${record.date} - Morning: ${record.morningCheckIn || 'N/A'}, Afternoon: ${record.afternoonCheckIn || 'N/A'}, Points: ${record.points}`);
  });
  
  // Verify timezone conversion
  console.log('\n🌐 Timezone Conversion Verification:');
  console.log('====================================');
  sampleAttendance.forEach(record => {
    const utcTime = new Date(record.recordTime);
    const vietnamTime = convertToVietnamTime(record.recordTime);
    console.log(`UTC: ${utcTime.toISOString()} -> Vietnam: ${vietnamTime.toISOString()} (${formatVietnamTime(record.recordTime)})`);
  });
  
  return { employees, attendanceRecords };
}

// Run test
if (require.main === module) {
  testCompleteWorkflow();
}

module.exports = { testCompleteWorkflow };
