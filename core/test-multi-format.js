// Test multiple date/time format parsing
function parseDateFromMultipleFormats(dateValue) {
  if (!dateValue || dateValue === '') return null
  
  try {
    // Case 1: Excel serial number (e.g., 45839)
    if (typeof dateValue === 'number') {
      const jan1_1900 = new Date(1900, 0, 1)
      const resultDate = new Date(jan1_1900.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000)
      const year = resultDate.getFullYear()
      const month = (resultDate.getMonth() + 1).toString().padStart(2, '0')
      const day = resultDate.getDate().toString().padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    // Case 2: String formats
    const dateStr = dateValue.toString().trim()
    
    // Try DD-MM-YY format (e.g., "01-07-25")
    const ddmmyyMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{2})$/)
    if (ddmmyyMatch) {
      const [, day, month, year] = ddmmyyMatch
      const fullYear = 2000 + parseInt(year) // Assume 20xx
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    
    // Try DD/MM/YYYY format
    const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    
    // Try ISO format or other standard formats
    const parsedDate = new Date(dateStr)
    if (!isNaN(parsedDate.getTime())) {
      const year = parsedDate.getFullYear()
      const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0')
      const day = parsedDate.getDate().toString().padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    console.warn('Could not parse date:', dateValue)
    return null
  } catch (error) {
    console.error('Error parsing date:', dateValue, error)
    return null
  }
}

function parseTimeFromMultipleFormats(timeValue) {
  if (!timeValue || timeValue === '') return null
  
  try {
    // Case 1: Excel serial number with time fraction (e.g., 45839.329780092594)
    if (typeof timeValue === 'number') {
      // Use high-precision method to avoid timezone issues
      const dayFraction = timeValue - Math.floor(timeValue)
      const totalSeconds = Math.round(dayFraction * 24 * 60 * 60)
      
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    }
    
    // Case 2: String formats (PRIORITIZED - most accurate)
    const timeStr = timeValue.toString().trim()
    
    // Try HH:MM:SS format (e.g., "07:54:53") - HIGHEST PRIORITY
    const hhmmssMatch = timeStr.match(/^(\d{1,2}):(\d{2}):(\d{2})$/)
    if (hhmmssMatch) {
      const [, hours, minutes] = hhmmssMatch
      return `${hours.padStart(2, '0')}:${minutes}`
    }
    
    // Try HH:MM format (e.g., "07:54")
    const hhmmMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/)
    if (hhmmMatch) {
      const [, hours, minutes] = hhmmMatch
      return `${hours.padStart(2, '0')}:${minutes}`
    }
    
    // Try decimal hours (e.g., "7.9" = 7:54)
    const decimal = parseFloat(timeStr)
    if (!isNaN(decimal) && decimal >= 0 && decimal < 24) {
      const hours = Math.floor(decimal)
      const minutes = Math.round((decimal - hours) * 60)
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    }
    
    console.warn('Could not parse time:', timeValue)
    return null
  } catch (error) {
    console.error('Error parsing time:', timeValue, error)
    return null
  }
}

// Test with data from Excel screenshot
console.log('🧪 Testing Multiple Format Parsing:')

const testData = [
  // Date tests
  { type: 'date', value: '01-07-25', expected: '2025-07-01' },
  { type: 'date', value: '02-07-25', expected: '2025-07-02' },
  { type: 'date', value: 45839, expected: '2025-07-01' }, // Excel serial
  
  // Time tests
  { type: 'time', value: '07:54:53', expected: '07:54' },
  { type: 'time', value: '13:55:14', expected: '13:55' },
  { type: 'time', value: '14:04:42', expected: '14:04' },
  { type: 'time', value: 45839.329780092594, expected: '07:54' }, // Excel serial with time
  
  // Edge cases
  { type: 'time', value: '', expected: null },
  { type: 'date', value: '', expected: null }
]

testData.forEach(test => {
  let result
  if (test.type === 'date') {
    result = parseDateFromMultipleFormats(test.value)
  } else {
    result = parseTimeFromMultipleFormats(test.value)
  }
  
  const status = result === test.expected ? '✅' : '❌'
  console.log(`${status} ${test.type.toUpperCase()}: ${JSON.stringify(test.value)} → ${result} (expected: ${test.expected})`)
})

console.log('\n✅ Testing completed!')
