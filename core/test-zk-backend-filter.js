// Test logic lọc dữ liệu chấm công theo ngày
console.log('🧪 Testing ZKTeco Backend Date Filtering Logic...\n')

// Simulate the filtering logic from server.js
function testDateFiltering() {
    // Test data giống trong time.json
    const testData = [
        {
            userSn: 24107,
            deviceUserId: "47", 
            recordTime: "2025-07-25T00:18:43.000Z", // 00:18 UTC = 07:18 VN
            ip: "192.168.1.240"
        },
        {
            userSn: 24108,
            deviceUserId: "47",
            recordTime: "2025-07-25T23:45:30.000Z", // 23:45 UTC = 06:45 next day VN
            ip: "192.168.1.240"
        },
        {
            userSn: 24109, 
            deviceUserId: "48",
            recordTime: "2025-07-26T01:30:00.000Z", // 01:30 UTC = 08:30 VN (day 26)
            ip: "192.168.1.240"
        }
    ]

    console.log('📋 Test Data:')
    testData.forEach((record, i) => {
        const utcDate = new Date(record.recordTime)
        const vnDate = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000))
        console.log(`${i+1}. ${record.recordTime} → VN: ${vnDate.toISOString()} (${vnDate.toLocaleDateString('vi-VN')})`)
    })

    console.log('\n🔍 Testing Date Filter Logic...')

    // Test case: Lấy dữ liệu ngày 2025-07-25
    const start = "2025-07-25" 
    const end = "2025-07-25"

    console.log(`\nFilter: ${start} to ${end}`)

    // Logic hiện tại trong server.js (có vấn đề)
    console.log('\n--- Logic hiện tại (có thể sai) ---')
    const startDate = new Date(start)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(end)
    endDate.setHours(23, 59, 59, 999)

    console.log(`Start filter: ${startDate.toISOString()}`)
    console.log(`End filter: ${endDate.toISOString()}`)

    const filteredCurrent = testData.filter(log => {
        const recordDate = new Date(log.recordTime)
        const match = recordDate >= startDate && recordDate <= endDate
        console.log(`  ${log.recordTime} → ${match ? '✅ PASS' : '❌ FAIL'}`)
        return match
    })

    console.log(`Kết quả: ${filteredCurrent.length}/${testData.length} bản ghi`)

    // Logic CHUẨN (convert sang VN time trước khi filter)
    console.log('\n--- Logic CHUẨN (convert VN time) ---')
    
    // Convert start/end sang VN timezone để so sánh
    const vnStartDate = new Date(start + 'T00:00:00+07:00') // VN midnight start
    const vnEndDate = new Date(end + 'T23:59:59+07:00')     // VN midnight end

    console.log(`VN Start filter: ${vnStartDate.toISOString()}`)
    console.log(`VN End filter: ${vnEndDate.toISOString()}`)

    const filteredCorrect = testData.filter(log => {
        const recordDate = new Date(log.recordTime)
        const match = recordDate >= vnStartDate && recordDate <= vnEndDate
        console.log(`  ${log.recordTime} → ${match ? '✅ PASS' : '❌ FAIL'}`)
        return match
    })

    console.log(`Kết quả: ${filteredCorrect.length}/${testData.length} bản ghi`)

    // So sánh kết quả
    console.log('\n📊 So sánh kết quả:')
    console.log(`Logic hiện tại: ${filteredCurrent.length} bản ghi`)
    console.log(`Logic chuẩn: ${filteredCorrect.length} bản ghi`)
    
    if (filteredCurrent.length !== filteredCorrect.length) {
        console.log('❌ KHÁC BIỆT! Logic hiện tại có thể sai!')
    } else {
        console.log('✅ Kết quả giống nhau')
    }
}

// Test edge cases
function testEdgeCases() {
    console.log('\n🌅 Testing Edge Cases...')
    
    const edgeCases = [
        "2025-07-25T16:59:59.000Z", // 23:59:59 VN (cuối ngày 25)
        "2025-07-25T17:00:00.000Z", // 00:00:00 VN (đầu ngày 26)
        "2025-07-24T17:00:01.000Z", // 00:00:01 VN (đầu ngày 25)
    ]

    console.log('\nKhi filter ngày 2025-07-25:')
    
    edgeCases.forEach(time => {
        const utcDate = new Date(time)
        const vnTime = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000))
        
        // Current logic
        const startDate = new Date("2025-07-25")
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date("2025-07-25") 
        endDate.setHours(23, 59, 59, 999)
        
        const currentMatch = utcDate >= startDate && utcDate <= endDate
        
        // Correct logic
        const vnStartDate = new Date("2025-07-25T00:00:00+07:00")
        const vnEndDate = new Date("2025-07-25T23:59:59+07:00")
        
        const correctMatch = utcDate >= vnStartDate && utcDate <= vnEndDate
        
        console.log(`${time}`)
        console.log(`  VN time: ${vnTime.toISOString()}`)
        console.log(`  Current logic: ${currentMatch ? '✅ Match' : '❌ No match'}`)
        console.log(`  Correct logic: ${correctMatch ? '✅ Match' : '❌ No match'}`)
        console.log(`  ${currentMatch === correctMatch ? '✅ Same' : '❌ DIFFERENT!'}`)
        console.log('')
    })
}

testDateFiltering()
testEdgeCases()

console.log('\n🎯 Conclusion:')
console.log('❌ Logic hiện tại có thể sai vì:')
console.log('   1. Filter theo UTC time thay vì VN time')
console.log('   2. Không xét đến timezone offset của VN')
console.log('   3. Có thể bỏ sót hoặc lấy thừa records')
console.log('\n✅ Cần sửa để filter theo VN timezone!')
