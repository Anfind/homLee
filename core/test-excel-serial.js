// Test Excel serial date conversion - corrected version
function excelSerialToDate(serial) {
  // Excel serial date: 1 = January 1, 1900
  // But Excel has a bug treating 1900 as leap year
  // So we need to account for that
  
  // Start from Jan 1, 1900
  const excelBaseDate = new Date(1900, 0, 1) // January 1, 1900
  
  // Subtract 2 days to account for Excel's leap year bug and 0-indexing
  // Serial 1 = Jan 1, 1900, but we want serial 45839 = July 1, 2025
  const adjustedDays = serial - 2
  
  const result = new Date(excelBaseDate.getTime() + adjustedDays * 24 * 60 * 60 * 1000)
  return result
}

// Alternative simpler approach - let's verify with online converter
function excelSerialToDateSimple(serial) {
  // Known: Excel serial 45839 should be July 1, 2025
  // Let's calculate backwards: July 1, 2025 - Jan 1, 1900 = ? days
  
  const july1_2025 = new Date(2025, 6, 1) // July 1, 2025 (month is 0-indexed)
  const jan1_1900 = new Date(1900, 0, 1)  // January 1, 1900
  
  const daysDiff = (july1_2025.getTime() - jan1_1900.getTime()) / (24 * 60 * 60 * 1000)
  console.log(`Days from Jan 1, 1900 to July 1, 2025: ${daysDiff}`)
  
  // Excel adds 1 for the leap year bug, so July 1, 2025 should be daysDiff + 1
  console.log(`Expected Excel serial for July 1, 2025: ${daysDiff + 1}`)
  
  // Now convert using the correct offset
  const jan1_1900_base = new Date(1900, 0, 1)
  const resultDate = new Date(jan1_1900_base.getTime() + (serial - 1) * 24 * 60 * 60 * 1000)
  
  return resultDate
}

function parseDateFromExcelSerial(serial) {
  if (!serial || serial === '') return null
  
  try {
    const numSerial = typeof serial === 'string' ? parseFloat(serial) : serial
    if (isNaN(numSerial)) return null
    
    const date = excelSerialToDate(Math.floor(numSerial))
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (error) {
    console.error('Error parsing Excel serial date:', serial, error)
    return null
  }
}

function parseTimeFromExcelSerial(serial) {
  if (!serial || serial === '') return null
  
  try {
    const numSerial = typeof serial === 'string' ? parseFloat(serial) : serial
    if (isNaN(numSerial)) return null
    
    const date = excelSerialToDate(numSerial)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  } catch (error) {
    console.error('Error parsing Excel serial time:', serial, error)
    return null
  }
}

// Test with sample data from XML
const testData = [
  { serial: 45839, description: 'Date 45839' },
  { serial: 45839.329780092594, description: 'DateTime 45839.329780092594' },
  { serial: 45840.58002314815, description: 'DateTime 45840.58002314815' }
]

console.log('🧪 Testing Excel Serial Date Conversion:')

// First, let's figure out the correct offset
excelSerialToDateSimple(45839)

testData.forEach(test => {
  const date1 = parseDateFromExcelSerial(test.serial)
  const time1 = parseTimeFromExcelSerial(test.serial)
  
  const date2 = excelSerialToDateSimple(test.serial)
  const dateStr2 = `${date2.getFullYear()}-${(date2.getMonth() + 1).toString().padStart(2, '0')}-${date2.getDate().toString().padStart(2, '0')}`
  const timeStr2 = `${date2.getHours().toString().padStart(2, '0')}:${date2.getMinutes().toString().padStart(2, '0')}`
  
  console.log(`${test.description}:`)
  console.log(`  Method 1 -> Date: ${date1}, Time: ${time1}`)
  console.log(`  Method 2 -> Date: ${dateStr2}, Time: ${timeStr2}`)
})

// Verify with a known date: Excel serial 45839 should be 2025-07-01
console.log('\n✅ Expected: 2025-07-01 (July 1, 2025)')
