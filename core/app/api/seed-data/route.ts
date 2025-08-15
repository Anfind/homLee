import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/connection'
import { Department } from '@/lib/mongodb/models/Department'
import { User } from '@/lib/mongodb/models/User'
import { Employee } from '@/lib/mongodb/models/Employee'

// POST /api/seed-data - Seed initial data if database is empty
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const results = {
      departments: { created: 0, existing: 0 },
      users: { created: 0, existing: 0 },
      employees: { created: 0, existing: 0 }
    }

    // Seed default departments
    const defaultDepartments = [
      {
        _id: "dept-001",
        name: "Phòng Kỹ thuật",
        createdBy: "system",
        isActive: true
      },
      {
        _id: "dept-002",
        name: "Phòng Kinh doanh",
        createdBy: "system", 
        isActive: true
      },
      {
        _id: "dept-003",
        name: "Phòng Hành chính",
        createdBy: "system",
        isActive: true
      }
    ]

    for (const deptData of defaultDepartments) {
      const existing = await Department.findById(deptData._id)
      if (!existing) {
        await Department.create(deptData)
        results.departments.created++
      } else {
        results.departments.existing++
      }
    }

    // Seed default admin user
    const defaultUsers = [
      {
        username: "admin",
        password: "admin123",
        role: "admin",
        isActive: true
      }
    ]

    for (const userData of defaultUsers) {
      const existing = await User.findOne({ username: userData.username })
      if (!existing) {
        await User.create(userData)
        results.users.created++
      } else {
        results.users.existing++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seed hoàn tất: ${results.departments.created} departments, ${results.users.created} users mới`,
      data: results
    })

  } catch (error) {
    console.error('Seed data error:', error)
    return NextResponse.json({
      success: false,
      message: 'Lỗi seed dữ liệu ban đầu',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
