import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/connection'
import { Department } from '@/lib/mongodb/models/Department'

// GET /api/departments - Get all departments
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const departments = await Department.find({ isActive: true }).sort({ name: 1 })
    
    return NextResponse.json({
      success: true,
      message: `Lấy thành công ${departments.length} phòng ban`,
      data: departments
    })
  } catch (error) {
    console.error('Get departments error:', error)
    return NextResponse.json({
      success: false,
      message: 'Lỗi lấy danh sách phòng ban',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/departments - Create new department
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { name, createdBy } = await request.json()
    
    // Generate ID based on name
    const id = `dept-${Date.now()}`
    
    const department = await Department.create({
      _id: id,
      name: name.trim(),
      createdBy: createdBy || 'system',
      isActive: true
    })
    
    return NextResponse.json({
      success: true,
      message: 'Tạo phòng ban thành công',
      data: department
    })
  } catch (error) {
    console.error('Create department error:', error)
    
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json({
        success: false,
        message: 'Phòng ban này đã tồn tại',
        error: 'Duplicate department name'
      }, { status: 409 })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Lỗi tạo phòng ban',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT /api/departments/[id] - Update department
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    const { id, name, isActive } = await request.json()
    
    const department = await Department.findByIdAndUpdate(
      id,
      { 
        name: name?.trim(),
        isActive: isActive !== undefined ? isActive : true
      },
      { new: true, runValidators: true }
    )
    
    if (!department) {
      return NextResponse.json({
        success: false,
        message: 'Không tìm thấy phòng ban'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cập nhật phòng ban thành công',
      data: department
    })
  } catch (error) {
    console.error('Update department error:', error)
    return NextResponse.json({
      success: false,
      message: 'Lỗi cập nhật phòng ban',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/departments?id=... - Soft delete department
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Department ID is required'
      }, { status: 400 })
    }
    
    const department = await Department.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    )
    
    if (!department) {
      return NextResponse.json({
        success: false,
        message: 'Không tìm thấy phòng ban'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Xóa phòng ban thành công',
      data: department
    })
  } catch (error) {
    console.error('Delete department error:', error)
    return NextResponse.json({
      success: false,
      message: 'Lỗi xóa phòng ban',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
