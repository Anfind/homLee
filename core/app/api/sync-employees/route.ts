import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/connection'
import { Employee } from '@/lib/mongodb/models/Employee'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Fetch employees data from zktceo-backend
    const response = await fetch('http://localhost:3000/api/users')
    const zkData = await response.json()
    
    if (!zkData.success) {
      return NextResponse.json({
        success: false,
        message: 'Không thể lấy dữ liệu từ ZKTeco backend',
        error: zkData.message
      }, { status: 500 })
    }

    const employees = zkData.data
    const syncResults = {
      created: 0,
      updated: 0,
      errors: [] as Array<{
        employeeId?: string
        name?: string
        error: string
      }>
    }

    // Process each employee from ZKTeco
    for (const zkEmployee of employees) {
      try {
        const employeeData = {
          _id: zkEmployee.userId, // deviceUserId làm primary key
          name: zkEmployee.name.trim(),
          title: 'Nhân viên', // Default title
          department: 'Chưa phân bổ' // Default department, sẽ cập nhật sau
        }

        // Upsert employee (create if not exists, update if exists)
        const existingEmployee = await Employee.findById(employeeData._id)
        
        if (existingEmployee) {
          // Update existing employee
          await Employee.findByIdAndUpdate(employeeData._id, employeeData, {
            runValidators: true
          })
          syncResults.updated++
        } else {
          // Create new employee
          await Employee.create(employeeData)
          syncResults.created++
        }

      } catch (error) {
        syncResults.errors.push({
          employeeId: zkEmployee.userId,
          name: zkEmployee.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đồng bộ thành công: ${syncResults.created} mới, ${syncResults.updated} cập nhật`,
      data: syncResults
    })

  } catch (error) {
    console.error('Sync employees error:', error)
    return NextResponse.json({
      success: false,
      message: 'Lỗi đồng bộ nhân viên',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
