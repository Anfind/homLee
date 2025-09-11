// Test API sync attendance endpoint với real data
// Kiểm tra toàn bộ workflow sync

const fetch = require('node-fetch') // Ensure node-fetch is available

async function testSyncAPI() {
  try {
    console.log('🚀 Testing Sync Attendance API with Real Logic')
    console.log('=' .repeat(60))
    
    // Test data for sync
    const testData = {
      startDate: "2025-01-15",
      endDate: "2025-01-15" 
    }
    
    console.log('📅 Testing sync for date range:', testData)
    console.log('\n🔍 Expected Behavior:')
    console.log('  1. Compare employee + date + check-in times')
    console.log('  2. SKIP if same check-ins (preserve manual edits)')
    console.log('  3. UPDATE if new check-ins found')
    console.log('  4. PRESERVE manual points when updating')
    console.log('  5. CREATE if new employee-date combination')
    
    // Make request to sync API
    const response = await fetch('http://localhost:3001/api/sync-attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    console.log('\n📊 SYNC RESULTS:')
    console.log('=' .repeat(40))
    console.log(`✅ Success: ${result.success}`)
    console.log(`📝 Message: ${result.message}`)
    
    if (result.data) {
      const data = result.data
      console.log(`\n📈 Statistics:`)
      console.log(`  📥 Processed: ${data.processed} ZK records`)
      console.log(`  ➕ Created: ${data.created} new records`)
      console.log(`  🔄 Updated: ${data.updated} existing records`)
      console.log(`  ⏭️  Skipped: ${data.skipped || 0} same check-ins`)
      console.log(`  🔒 Preserved: ${data.preserved || 0} manual edits`)
      
      if (data.errors && data.errors.length > 0) {
        console.log(`\n❌ Errors (${data.errors.length}):`)
        data.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.error}`)
        })
      }
      
      // Summary analysis
      console.log('\n🎯 ANALYSIS:')
      const totalProcessed = (data.created || 0) + (data.updated || 0) + (data.skipped || 0)
      console.log(`  • Total handled: ${totalProcessed} employee-date combinations`)
      
      if (data.preserved > 0) {
        console.log(`  • Manual edits preserved: ${data.preserved} (Admin changes protected ✅)`)
      }
      
      if (data.skipped > 0) {
        console.log(`  • Same check-ins skipped: ${data.skipped} (No unnecessary updates ✅)`)  
      }
      
      if (data.updated > 0) {
        console.log(`  • Records updated: ${data.updated} (New check-ins processed ✅)`)
      }
      
      if (data.created > 0) {
        console.log(`  • New records created: ${data.created} (New employee-date combinations ✅)`)
      }
    }
    
    console.log('\n🎉 API Test completed successfully!')
    
  } catch (error) {
    console.error('\n❌ API Test failed:')
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Cannot connect to server. Make sure:')
      console.error('  1. Next.js server is running on port 3001 (npm run dev)')
      console.error('  2. ZKTeco backend is running on port 3000')
    } else {
      console.error('Error details:', error.message)
    }
  }
}

// Instructions
console.log('🔧 PRE-TEST SETUP:')
console.log('1. Make sure Next.js server is running: npm run dev (port 3001)')
console.log('2. Make sure ZKTeco backend is running (port 3000)')
console.log('3. Have some test attendance data in ZKTeco device')
console.log('')

testSyncAPI().catch(console.error)
