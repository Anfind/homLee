// Debug Excel serial time conversion chi tiết
function debugExcelSerial() {
  console.log('🔍 DEBUGGING EXCEL SERIAL TIME CONVERSION')
  
  // Test case: 45839.329780092594 should be 07:54:53
  const testSerial = 45839.329780092594
  
  console.log('\n📊 Raw data:')
  console.log('Serial:', testSerial)
  console.log('Integer part (date):', Math.floor(testSerial))
  console.log('Decimal part (time):', testSerial - Math.floor(testSerial))
  
  // Method 1: Current approach
  console.log('\n🧮 Method 1 (Current):')
  const jan1_1900 = new Date(1900, 0, 1)
  const resultDate1 = new Date(jan1_1900.getTime() + (testSerial - 1) * 24 * 60 * 60 * 1000)
  console.log('Result Date:', resultDate1)
  console.log('Hours:', resultDate1.getHours())
  console.log('Minutes:', resultDate1.getMinutes())
  console.log('Seconds:', resultDate1.getSeconds())
  console.log('Formatted:', `${resultDate1.getHours().toString().padStart(2, '0')}:${resultDate1.getMinutes().toString().padStart(2, '0')}:${resultDate1.getSeconds().toString().padStart(2, '0')}`)
  
  // Method 2: Pure time calculation
  console.log('\n🧮 Method 2 (Pure time):')
  const timeFraction = testSerial - Math.floor(testSerial)
  console.log('Time fraction:', timeFraction)
  
  const totalMinutes = timeFraction * 24 * 60
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.floor(totalMinutes % 60)
  const seconds = Math.floor((totalMinutes % 1) * 60)
  
  console.log('Total minutes:', totalMinutes)
  console.log('Hours:', hours)
  console.log('Minutes:', minutes)
  console.log('Seconds:', seconds)
  console.log('Formatted:', `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
  
  // Method 3: More precise calculation
  console.log('\n🧮 Method 3 (High precision):')
  const dayFraction = testSerial - Math.floor(testSerial)
  const totalSeconds = Math.round(dayFraction * 24 * 60 * 60)
  
  const hours3 = Math.floor(totalSeconds / 3600)
  const minutes3 = Math.floor((totalSeconds % 3600) / 60)
  const seconds3 = totalSeconds % 60
  
  console.log('Day fraction:', dayFraction)
  console.log('Total seconds:', totalSeconds)
  console.log('Hours:', hours3)
  console.log('Minutes:', minutes3)
  console.log('Seconds:', seconds3)
  console.log('Formatted:', `${hours3.toString().padStart(2, '0')}:${minutes3.toString().padStart(2, '0')}:${seconds3.toString().padStart(2, '0')}`)
  
  // Verify with known value: 07:54:53
  console.log('\n✅ Expected: 07:54:53')
  console.log('\n🎯 CONCLUSION: Method 3 should be most accurate')
}

debugExcelSerial()

// Test reverse calculation to verify
console.log('\n🔄 REVERSE VERIFICATION:')
// If 07:54:53 = what decimal?
const expectedHours = 7
const expectedMinutes = 54
const expectedSeconds = 53

const expectedDecimal = (expectedHours * 3600 + expectedMinutes * 60 + expectedSeconds) / (24 * 60 * 60)
console.log('Expected decimal for 07:54:53:', expectedDecimal)
console.log('Actual decimal from Excel:', 45839.329780092594 - 45839)
console.log('Difference:', Math.abs(expectedDecimal - (45839.329780092594 - 45839)))
