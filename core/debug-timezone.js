// Debug timezone conversion
console.log('🐛 Debug Timezone Conversion...\n')

const testTime = "2025-03-03T04:36:24.000Z"
console.log('Input UTC time:', testTime)

const utcDate = new Date(testTime)
console.log('UTC Date object:', utcDate.toISOString())
console.log('Local time (system):', utcDate.toString())
console.log('Timezone offset (minutes):', utcDate.getTimezoneOffset())

// Method 1: Add 7 hours manually
const method1 = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000))
console.log('\nMethod 1 (add 7 hours):')
console.log('Result:', method1.toISOString())
console.log('Date:', method1.toISOString().split('T')[0])
console.log('Time:', method1.toTimeString().slice(0, 5))

// Method 2: Use toLocaleString with VN timezone
const method2 = new Date(utcDate.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}))
console.log('\nMethod 2 (toLocaleString):')
console.log('Result:', method2.toString())

// Method 3: Correct approach for VN time
function correctVNTime(isoString) {
  const utc = new Date(isoString)
  
  // Format as VN time string first
  const vnString = utc.toLocaleString("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh"
  })
  
  console.log('VN string format:', vnString)
  
  // Split and format properly
  const [datePart, timePart] = vnString.split(' ')
  const [hours, minutes] = timePart.split(':')
  
  return {
    date: datePart,
    time: `${hours}:${minutes}`
  }
}

console.log('\nMethod 3 (correct VN time):')
const result = correctVNTime(testTime)
console.log('Date:', result.date)
console.log('Time:', result.time)

// Expected: 2025-03-03T04:36:24.000Z (UTC) -> 2025-03-03 11:36 (VN)
console.log('\nExpected: 2025-03-03 11:36 (VN)')
console.log('Got:', result.date, result.time)
