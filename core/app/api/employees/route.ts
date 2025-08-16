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
        { success: false, error: 'Missing required fields: id, name, department' },
        { status: 400 }
      )
    }
    
    // Check if employee already exists
    const existingEmployee = await Employee.findById(id)
    if (existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee with this ID already exists' },
        { status: 409 }
      )
    }
    
    const employee = new Employee({
      _id: id,
      name,
      title: title || 'Nhân viên',
      department
    })
    
    await employee.save()
    
    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Employee created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create employee' },
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
