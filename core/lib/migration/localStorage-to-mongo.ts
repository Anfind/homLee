import { connectDB } from '../mongodb/connection'
import { 
  Employee, 
  User, 
  Department, 
  AttendanceRecord, 
  BonusPoint, 
  CustomDailyValue,
  CheckInSettings 
} from '../mongodb/models'

interface LocalStorageData {
  employees?: any[]
  users?: any[]
  departments?: any[]
  attendanceRecords?: any[]
  bonusPoints?: any[]
  customDailyValues?: any[]
  checkInSettings?: any
}

/**
 * Migration script to transfer data from localStorage to MongoDB
 * Run this script once to migrate existing data
 */
export class LocalStorageToMongoMigration {
  
  /**
   * Main migration function
   */
  static async migrate(localStorageData: LocalStorageData) {
    try {
      console.log('🚀 Starting migration from localStorage to MongoDB...')
      
      await connectDB()
      
      const results = {
        employees: 0,
        users: 0, 
        departments: 0,
        attendanceRecords: 0,
        bonusPoints: 0,
        customDailyValues: 0,
        checkInSettings: 0
      }
      
      // 1. Migrate Departments first (required for other collections)
      if (localStorageData.departments?.length) {
        results.departments = await this.migrateDepartments(localStorageData.departments)
      }
      
      // 2. Migrate Users
      if (localStorageData.users?.length) {
        results.users = await this.migrateUsers(localStorageData.users)
      }
      
      // 3. Migrate Employees
      if (localStorageData.employees?.length) {
        results.employees = await this.migrateEmployees(localStorageData.employees)
      }
      
      // 4. Migrate Attendance Records
      if (localStorageData.attendanceRecords?.length) {
        results.attendanceRecords = await this.migrateAttendanceRecords(localStorageData.attendanceRecords)
      }
      
      // 5. Migrate Bonus Points
      if (localStorageData.bonusPoints?.length) {
        results.bonusPoints = await this.migrateBonusPoints(localStorageData.bonusPoints)
      }
      
      // 6. Migrate Custom Daily Values
      if (localStorageData.customDailyValues?.length) {
        results.customDailyValues = await this.migrateCustomDailyValues(localStorageData.customDailyValues)
      }
      
      // 7. Migrate Check-in Settings
      if (localStorageData.checkInSettings) {
        results.checkInSettings = await this.migrateCheckInSettings(localStorageData.checkInSettings)
      }
      
      console.log('✅ Migration completed successfully!')
      console.log('📊 Migration Results:', results)
      
      return { success: true, results }
    } catch (error) {
      console.error('❌ Migration failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
  
  /**
   * Migrate departments
   */
  private static async migrateDepartments(departments: any[]) {
    console.log(`📁 Migrating ${departments.length} departments...`)
    
    let count = 0
    for (const dept of departments) {
      try {
        await Department.findByIdAndUpdate(
          dept.id,
          {
            _id: dept.id,
            name: dept.name,
            createdBy: dept.createdBy || 'migration',
            isActive: true
          },
          { upsert: true, new: true }
        )
        count++
      } catch (error) {
        console.error(`Failed to migrate department ${dept.id}:`, error)
      }
    }
    
    console.log(`✅ Migrated ${count}/${departments.length} departments`)
    return count
  }
  
  /**
   * Migrate users
   */
  private static async migrateUsers(users: any[]) {
    console.log(`👥 Migrating ${users.length} users...`)
    
    let count = 0
    for (const user of users) {
      try {
        await User.findOneAndUpdate(
          { username: user.username },
          {
            username: user.username,
            password: user.password, // TODO: Hash in production
            name: user.name,
            role: user.role,
            department: user.department,
            isActive: true
          },
          { upsert: true, new: true }
        )
        count++
      } catch (error) {
        console.error(`Failed to migrate user ${user.username}:`, error)
      }
    }
    
    console.log(`✅ Migrated ${count}/${users.length} users`)
    return count
  }
  
  /**
   * Migrate employees
   */
  private static async migrateEmployees(employees: any[]) {
    console.log(`👨‍💼 Migrating ${employees.length} employees...`)
    
    let count = 0
    for (const emp of employees) {
      try {
        await Employee.findByIdAndUpdate(
          emp.id,
          {
            _id: emp.id,
            name: emp.name,
            title: emp.title || 'Nhân viên',
            department: emp.department
          },
          { upsert: true, new: true }
        )
        count++
      } catch (error) {
        console.error(`Failed to migrate employee ${emp.id}:`, error)
      }
    }
    
    console.log(`✅ Migrated ${count}/${employees.length} employees`)
    return count
  }
  
  /**
   * Migrate attendance records
   */
  private static async migrateAttendanceRecords(records: any[]) {
    console.log(`📋 Migrating ${records.length} attendance records...`)
    
    let count = 0
    for (const record of records) {
      try {
        await AttendanceRecord.findOneAndUpdate(
          { employeeId: record.employeeId, date: record.date },
          {
            employeeId: record.employeeId,
            date: record.date,
            morningCheckIn: record.morningCheckIn,
            afternoonCheckIn: record.afternoonCheckIn,
            points: record.points || 0,
            shifts: record.shifts || []
          },
          { upsert: true, new: true }
        )
        count++
      } catch (error) {
        console.error(`Failed to migrate attendance record ${record.employeeId}-${record.date}:`, error)
      }
    }
    
    console.log(`✅ Migrated ${count}/${records.length} attendance records`)
    return count
  }
  
  /**
   * Migrate bonus points
   */
  private static async migrateBonusPoints(bonusPoints: any[]) {
    console.log(`🏆 Migrating ${bonusPoints.length} bonus points...`)
    
    let count = 0
    for (const bonus of bonusPoints) {
      try {
        const bonusPoint = new BonusPoint({
          employeeId: bonus.employeeId,
          date: bonus.date,
          points: bonus.points,
          editedBy: bonus.editedBy,
          editedAt: new Date(bonus.editedAt),
          previousValue: bonus.previousValue || 0,
          reason: 'Migrated from localStorage'
        })
        await bonusPoint.save()
        count++
      } catch (error) {
        console.error(`Failed to migrate bonus point:`, error)
      }
    }
    
    console.log(`✅ Migrated ${count}/${bonusPoints.length} bonus points`)
    return count
  }
  
  /**
   * Migrate custom daily values
   */
  private static async migrateCustomDailyValues(customValues: any[]) {
    console.log(`🔧 Migrating ${customValues.length} custom daily values...`)
    
    let count = 0
    for (const custom of customValues) {
      try {
        await CustomDailyValue.findOneAndUpdate(
          { 
            employeeId: custom.employeeId, 
            date: custom.date, 
            columnKey: custom.columnKey 
          },
          {
            employeeId: custom.employeeId,
            date: custom.date,
            columnKey: custom.columnKey,
            value: custom.value,
            editedBy: custom.editedBy,
            editedAt: new Date(custom.editedAt),
            previousValue: custom.previousValue || ''
          },
          { upsert: true, new: true }
        )
        count++
      } catch (error) {
        console.error(`Failed to migrate custom daily value:`, error)
      }
    }
    
    console.log(`✅ Migrated ${count}/${customValues.length} custom daily values`)
    return count
  }
  
  /**
   * Migrate check-in settings
   */
  private static async migrateCheckInSettings(checkInSettings: any) {
    console.log(`⏰ Migrating check-in settings...`)
    
    let count = 0
    
    // checkInSettings is an object with keys 0-6 (days of week)
    for (const [dayOfWeek, daySettings] of Object.entries(checkInSettings)) {
      try {
        const dayNum = parseInt(dayOfWeek)
        if (dayNum >= 0 && dayNum <= 6 && daySettings && (daySettings as any).shifts) {
          await CheckInSettings.findOneAndUpdate(
            { dayOfWeek: dayNum },
            {
              dayOfWeek: dayNum,
              shifts: (daySettings as any).shifts,
              isActive: true,
              createdBy: 'migration'
            },
            { upsert: true, new: true }
          )
          count++
        }
      } catch (error) {
        console.error(`Failed to migrate check-in settings for day ${dayOfWeek}:`, error)
      }
    }
    
    console.log(`✅ Migrated ${count}/7 check-in settings`)
    return count
  }
  
  /**
   * Create default data if collections are empty
   */
  static async seedDefaultData() {
    try {
      console.log('🌱 Seeding default data...')
      
      await connectDB()
      
      // Default departments
      const departmentCount = await Department.countDocuments()
      if (departmentCount === 0) {
        const defaultDepartments = [
          { _id: 'dept-001', name: 'Phòng Kỹ thuật', createdBy: 'system', isActive: true },
          { _id: 'dept-002', name: 'Phòng Kinh doanh', createdBy: 'system', isActive: true },
          { _id: 'dept-003', name: 'Phòng Hành chính', createdBy: 'system', isActive: true }
        ]
        await Department.insertMany(defaultDepartments)
        console.log('✅ Created default departments')
      }
      
      // Default users
      const userCount = await User.countDocuments()
      if (userCount === 0) {
        const defaultUsers = [
          {
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            name: 'Quản trị viên hệ thống',
            isActive: true
          },
          {
            username: 'thao',
            password: 'thao123',
            role: 'truongphong',
            name: 'TP Thảo',
            department: 'Phòng Kinh doanh',
            isActive: true
          },
          {
            username: 'minh',
            password: 'minh123',
            role: 'truongphong',
            name: 'Trưởng phòng Minh',
            department: 'Phòng Kỹ thuật',
            isActive: true
          },
          {
            username: 'demo',
            password: 'demo123',
            role: 'truongphong',
            name: 'Demo User',
            department: 'Phòng Hành chính',
            isActive: true
          }
        ]
        await User.insertMany(defaultUsers)
        console.log('✅ Created default users')
      }
      
      console.log('✅ Default data seeding completed!')
      return { success: true }
    } catch (error) {
      console.error('❌ Failed to seed default data:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}
