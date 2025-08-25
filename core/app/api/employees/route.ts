import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/connection'
import { Employee } from '@/lib/mongodb/models'

// GET /api/employees - Get all employees
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const searchParams = request.nextUrl.searchParams
    const department = searchParams.get('department')
    
    let query = {}
    if (department) {
      query = { department }
    }
    
    const employees = await Employee.find(query).sort({ name: 1 })
    
    return NextResponse.json({
      success: true,
      data: employees,
      count: employees.length
    })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}

// POST /api/employees - Create new employee
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { id, name, title, department } = body
    
    // Validation
    if (!id || !name || !department) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc: ID, tên, và phòng ban' },
        { status: 400 }
      )
    }
    
    // Trim and validate ID format
    const trimmedId = id.trim()
    if (!/^[0-9A-Za-z]{3,10}$/.test(trimmedId)) {
      return NextResponse.json(
        { success: false, error: 'ID nhân viên không hợp lệ (3-10 ký tự, chỉ chữ và số)' },
        { status: 400 }
      )
    }
    
    // Check if employee already exists
    const existingEmployee = await Employee.findById(trimmedId)
    if (existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'ID nhân viên đã tồn tại' },
        { status: 409 }
      )
    }
    
    const employee = new Employee({
      _id: trimmedId,
      name: name.trim(),
      title: title || 'Nhân viên',
      department: department.trim()
    })
    
    await employee.save()
    
    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Thêm nhân viên thành công'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    
    // Handle specific MongoDB errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { success: false, error: 'ID nhân viên đã tồn tại' },
          { status: 409 }
        )
      }
      if (error.message.includes('validation failed')) {
        return NextResponse.json(
          { success: false, error: 'Thông tin nhân viên không hợp lệ' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ khi tạo nhân viên' },
      { status: 500 }
    )
  }
}

// PUT /api/employees - Update employee
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { id, name, title, department } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      )
    }
    
    const employee = await Employee.findByIdAndUpdate(
      id,
      { name, title, department },
      { new: true, runValidators: true }
    )
    
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Employee updated successfully'
    })
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update employee' },
      { status: 500 }
    )
  }
}

// DELETE /api/employees - Delete employee
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      )
    }
    
    const employee = await Employee.findByIdAndDelete(id)
    
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete employee' },
      { status: 500 }
    )
  }
}
