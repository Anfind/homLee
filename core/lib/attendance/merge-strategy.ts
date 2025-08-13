/**
 * Merge Strategy for Duplicate Day Sync
 * Xử lý chiến lược merge khi đồng bộ trùng ngày
 */

export interface MergeOptions {
  strategy: 'replace' | 'merge' | 'skip'
  preserveExisting?: boolean
}

export interface ExistingAttendance {
  checkIns: string[]
  points: number
  shifts: any[]
  morningCheckIn?: string
  afternoonCheckIn?: string
}

export interface NewAttendance {
  checkIns: string[]
  points: number
  shifts: any[]
  morningCheckIn?: string
  afternoonCheckIn?: string
}

/**
 * Merge attendance records when sync duplicate dates
 */
export function mergeAttendanceData(
  existing: ExistingAttendance, 
  newData: NewAttendance, 
  options: MergeOptions = { strategy: 'replace' }
): NewAttendance {
  
  switch (options.strategy) {
    case 'replace':
      // Current behavior - replace completely
      return newData
      
    case 'merge':
      // Smart merge - combine unique check-ins
      const mergedCheckIns = [...new Set([...existing.checkIns, ...newData.checkIns])]
        .sort() // Sort chronologically
      
      // Recalculate points based on merged check-ins
      // (This would require calling calculateDailyPoints again)
      return {
        ...newData,
        checkIns: mergedCheckIns,
        // Note: Points and shifts should be recalculated
      }
      
    case 'skip':
      // Keep existing, ignore new data
      return existing as NewAttendance
      
    default:
      return newData
  }
}

/**
 * Check if sync should proceed based on strategy
 */
export function shouldUpdateRecord(
  existing: ExistingAttendance | null,
  newData: NewAttendance,
  strategy: MergeOptions['strategy']
): boolean {
  
  if (!existing) return true // Always create if no existing record
  
  switch (strategy) {
    case 'skip':
      return false // Never update if skip strategy
      
    case 'replace':
    case 'merge':
      return true // Always update for replace/merge
      
    default:
      return true
  }
}

/**
 * Generate sync summary message
 */
export function getSyncMessage(
  created: number, 
  updated: number, 
  skipped: number, 
  strategy: string
): string {
  const parts = []
  
  if (created > 0) parts.push(`${created} mới`)
  if (updated > 0) parts.push(`${updated} cập nhật`)
  if (skipped > 0) parts.push(`${skipped} bỏ qua`)
  
  const summary = parts.join(', ')
  return `Đồng bộ thành công (${strategy}): ${summary}`
}
