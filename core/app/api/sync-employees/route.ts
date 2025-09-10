import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/connection'
import { Employee } from '@/lib/mongodb/models/Employee'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting employee sync...')
    await connectDB()
    
    // Fetch employees data from zktceo-backend
    console.log('📡 Fetching from ZKTeco backend: http://localhost:3000/api/users')
    const response = await fetch('http://localhost:3000/api/users')
    
    if (!response.ok) {
      console.error('❌ ZKTeco backend response not OK:', response.status, response.statusText)
      throw new Error(`Backend responded with ${response.status}: ${response.statusText}`)
    }
    
    const zkData = await response.json()
    console.log('✅ ZKTeco backend response:', zkData.success ? 'Success' : 'Failed')
    
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
        // Check if employee already exists
        const existingEmployee = await Employee.findById(zkEmployee.userId)
        
        if (existingEmployee) {
          // ✅ HOÀN TOÀN KHÔNG CẬP NHẬT - Bỏ qua nhân viên đã tồn tại
          console.log(`✅ Employee ${zkEmployee.userId} (${existingEmployee.name}) already exists - skipping completely`)
          // Không tăng syncResults.updated vì không có gì được cập nhật
        } else {
          // ✅ CHỈ TẠO MỚI - Tạo nhân viên mới với thông tin mặc định
          const newEmployeeData = {
            _id: zkEmployee.userId,
            name: zkEmployee.name.trim(),
            title: 'Nhân sự', // Default title chỉ cho nhân viên mới
            department: 'Chưa phân bổ' // Default department chỉ cho nhân viên mới
          }
          
          await Employee.create(newEmployeeData)
          console.log(`➕ Created new employee: ${zkEmployee.userId} - ${newEmployeeData.name}`)
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
    console.error('❌ Sync employees error:', error)
    
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json({
      success: false,
      message: 'Lỗi đồng bộ nhân sự',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
