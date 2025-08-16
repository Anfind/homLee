/**
 * Test script để đảm bảo format response từ import API đúng
 */

// Mock response format từ import API
const mockApiResponse = {
  success: true,
  message: "Import XML thành công! Tạo mới: 2, Cập nhật: 1, Bỏ qua: 0, Lỗi: 0",
  data: {
    summary: {
      totalRows: 10,
      processedRows: 8,
      created: 2,
      updated: 1,
      skipped: 0,
      errors: 0
    },
    errors: [],
    sampleGroupedData: [
      [
        "3-2025-07-01",
        {
          employeeId: "3",
          date: "2025-07-01",
          checkIns: ["07:54", "13:31"],
          employeeName: "Thúy"
        }
      ],
      [
        "39-2025-07-01", 
        {
          employeeId: "39",
          date: "2025-07-01",
          checkIns: ["07:29", "13:42"],
          employeeName: "Nhân viên 39"
        }
      ]
    ]
  }
}

console.log('🧪 Testing API response format...')

// Test safe access patterns
console.log('\n📊 Summary access:')
console.log('  Created:', mockApiResponse.data.summary?.created || 0)
console.log('  Updated:', mockApiResponse.data.summary?.updated || 0)
console.log('  Skipped:', mockApiResponse.data.summary?.skipped || 0)
console.log('  Errors:', mockApiResponse.data.summary?.errors || 0)

console.log('\n❌ Errors access:')
console.log('  Has errors:', mockApiResponse.data.errors && mockApiResponse.data.errors.length > 0)
console.log('  Error count:', mockApiResponse.data.errors?.length || 0)

console.log('\n📋 Sample data access:')
if (mockApiResponse.data?.sampleGroupedData && mockApiResponse.data.sampleGroupedData.length > 0) {
  mockApiResponse.data.sampleGroupedData.forEach(([key, data], index) => {
    console.log(`  ${index + 1}. ${key}: ${data?.employeeName || 'N/A'}`)
    console.log(`     Check-ins: ${data?.checkIns ? data.checkIns.join(', ') : 'Không có'}`)
  })
} else {
  console.log('  No sample data')
}

console.log('\n✅ All access patterns work safely!')

// Test with undefined/null data
const emptyResponse = {
  success: false,
  message: "Error occurred",
  data: null
}

console.log('\n🧪 Testing with null data...')
console.log('  Created:', emptyResponse.data?.summary?.created || 0)
console.log('  Has sample data:', emptyResponse.data?.sampleGroupedData && emptyResponse.data.sampleGroupedData.length > 0)

console.log('\n✅ Null handling works correctly!')
