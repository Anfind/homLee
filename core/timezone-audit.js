// Comprehensive timezone analysis for ZK attendance system
console.log('🕐 COMPREHENSIVE TIMEZONE ANALYSIS\n')

// Analyze sample data from different sources
const zkRawData = [
    { recordTime: "2025-03-03T04:36:24.000Z", source: "full.json" },
    { recordTime: "2025-03-03T05:16:14.000Z", source: "full.json" },
    { recordTime: "2025-03-03T06:30:17.000Z", source: "full.json" },
    { recordTime: "2025-07-25T00:18:43.000Z", source: "time.json" },
    { recordTime: "2025-07-25T00:19:02.000Z", source: "time.json" }
]

console.log('📊 RAW DATA FROM MACHINE:')
zkRawData.forEach((record, i) => {
    console.log(`${i+1}. [${record.source}] ${record.recordTime}`)
})

console.log('\n🌍 TIMEZONE CONVERSION ANALYSIS:')

function analyzeTimezone(isoString, label) {
    console.log(`\n--- ${label}: ${isoString} ---`)
    
    // Method 1: Direct Date parsing (what the machine likely does)
    const directDate = new Date(isoString)
    console.log(`Direct parse: ${directDate.toString()}`)
    console.log(`Timezone offset: ${directDate.getTimezoneOffset()} minutes`)
    
    // Method 2: Manual UTC+7 (what we currently do)
    const manualVN = new Date(directDate.getTime() + (7 * 60 * 60 * 1000))
    console.log(`Manual +7hrs: ${manualVN.toISOString()} → ${manualVN.toString()}`)
    
    // Method 3: Locale conversion (what we should do)
    const localeVN = directDate.toLocaleString("sv-SE", {
        timeZone: "Asia/Ho_Chi_Minh"
    })
    console.log(`Locale VN: ${localeVN}`)
    
    // Analysis
    const directHour = directDate.getHours()
    const manualHour = manualVN.getHours()
    const localeHour = parseInt(localeVN.split(' ')[1].split(':')[0])
    
    console.log(`Hours comparison: Direct=${directHour}, Manual=${manualHour}, Locale=${localeHour}`)
    
    // Expected VN time (UTC+7)
    const utcHour = directDate.getUTCHours()
    const expectedVNHour = (utcHour + 7) % 24
    console.log(`Expected VN hour: UTC ${utcHour} + 7 = ${expectedVNHour}`)
    
    return {
        utcHour,
        expectedVNHour,
        directHour,
        manualHour,
        localeHour,
        localeVN
    }
}

// Analyze each record
const analyses = zkRawData.map((record, i) => 
    analyzeTimezone(record.recordTime, `Record ${i+1}`)
)

console.log('\n📋 SUMMARY OF ISSUES:')

// Check for timezone inconsistencies
const issues = []

analyses.forEach((analysis, i) => {
    const record = zkRawData[i]
    
    // Check if manual conversion matches expected
    if (analysis.manualHour !== analysis.expectedVNHour) {
        issues.push(`Record ${i+1}: Manual conversion wrong - got ${analysis.manualHour}, expected ${analysis.expectedVNHour}`)
    }
    
    // Check if locale conversion matches expected  
    if (analysis.localeHour !== analysis.expectedVNHour) {
        issues.push(`Record ${i+1}: Locale conversion wrong - got ${analysis.localeHour}, expected ${analysis.expectedVNHour}`)
    }
    
    // Check if we're double-converting
    if (analysis.directHour === analysis.expectedVNHour) {
        issues.push(`Record ${i+1}: Data might already be in VN time! UTC shows ${analysis.utcHour}, but local shows ${analysis.directHour}`)
    }
})

if (issues.length === 0) {
    console.log('✅ No timezone issues detected')
} else {
    console.log('❌ ISSUES FOUND:')
    issues.forEach(issue => console.log(`   • ${issue}`))
}

console.log('\n🔧 TESTING DIFFERENT SCENARIOS:')

// Scenario 1: Data is actually UTC (normal)
console.log('\n--- Scenario 1: Data is UTC (expected) ---')
const utcTime = "2025-08-12T01:30:00.000Z" // 1:30 UTC
const utcAnalysis = analyzeTimezone(utcTime, "UTC Sample")

// Scenario 2: Data is already VN time but marked as UTC (problematic)
console.log('\n--- Scenario 2: Data is VN time but marked UTC (problematic) ---')
const fakeUtcTime = "2025-08-12T08:30:00.000Z" // Actually 8:30 VN but marked as UTC
const fakeAnalysis = analyzeTimezone(fakeUtcTime, "Fake UTC Sample")

console.log('\n🎯 RECOMMENDATIONS:')

// Check current system timezone
const systemTZ = Intl.DateTimeFormat().resolvedOptions().timeZone
console.log(`System timezone: ${systemTZ}`)

if (systemTZ === 'Asia/Ho_Chi_Minh' || systemTZ.includes('Bangkok')) {
    console.log('✅ System is in Asia timezone')
    console.log('❗ CRITICAL: If system is VN timezone, new Date() will create VN time!')
    console.log('❗ This means adding +7 hours is DOUBLE CONVERSION!')
} else {
    console.log('⚠️  System is not in Asia timezone')
    console.log('✅ Adding +7 hours should be correct')
}

console.log('\n📝 AUDIT TRAIL:')
console.log('1. Machine sends: "2025-03-03T04:36:24.000Z"')
console.log('2. Node.js receives: Date object')
console.log('3. If system TZ = VN: Date already shows VN time')
console.log('4. If we add +7: We get VN time + 7 hours = WRONG!')
console.log('5. Solution: Check if data is already local time')

// Test with actual data pattern
console.log('\n🧪 TESTING WITH ACTUAL DATA PATTERN:')
const testRecord = "2025-07-25T00:18:43.000Z"
console.log(`Test record: ${testRecord}`)
console.log('This should be VN time: 07:18 on 2025-07-25')

const testDate = new Date(testRecord)
console.log(`Direct parsing: ${testDate.toString()}`)
console.log(`getHours(): ${testDate.getHours()}`)
console.log(`getUTCHours(): ${testDate.getUTCHours()}`)

if (testDate.getHours() === 7 && testDate.getUTCHours() === 0) {
    console.log('✅ CONFIRMED: System auto-converts to VN time')
    console.log('❌ PROBLEM: Our +7 conversion is wrong!')
} else if (testDate.getUTCHours() === 0) {
    console.log('⚠️  Data might need timezone conversion')
} else {
    console.log('❓ Unclear timezone situation')
}
