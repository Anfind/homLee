import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/connection'
import { CustomDailyValue } from '@/lib/mongodb/models/CustomDailyValue'
import { Employee } from '@/lib/mongodb/models/Employee'

// GET /api/custom-daily-values - Get custom daily values with optional filters
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const month = url.searchParams.get('month') // YYYY-MM format
    const columnKey = url.searchParams.get('columnKey') // commission, custom1, etc.
    
    // Build query filter
    const filter: any = {}
    
    if (employeeId) {
      filter.employeeId = employeeId
    }
    
    if (columnKey) {
      filter.columnKey = columnKey
    }
    
    if (month) {
      // Filter by month (YYYY-MM)
      const startOfMonth = `${month}-01`
      const year = parseInt(month.split('-')[0])
      const monthNum = parseInt(month.split('-')[1])
      const nextMonth = monthNum === 12 ? 1 : monthNum + 1
      const nextYear = monthNum === 12 ? year + 1 : year
      const endOfMonth = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`
      
      filter.date = {
        $gte: startOfMonth,
        $lt: endOfMonth
      }
    } else if (startDate && endDate) {
      filter.date = {
        $gte: startDate,
        $lte: endDate
      }
    }
    
    const customValues = await CustomDailyValue.find(filter)
      .populate('employeeId', 'name department')
      .sort({ date: -1, editedAt: -1 })
    
    return NextResponse.json({
      success: true,
      message: `Lấy thành công ${customValues.length} giá trị tùy chỉnh`,
      data: customValues
    })
  } catch (error) {
    console.error('Get custom daily values error:', error)
    return NextResponse.json({
      success: false,
      message: 'Lỗi lấy danh sách giá trị tùy chỉnh',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/custom-daily-values - Create custom daily value
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { employeeId, date, columnKey, value, editedBy } = await request.json()
    
    // Verify employee exists
    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return NextResponse.json({
        success: false,
        message: 'Không tìm thấy nhân viên'
      }, { status: 404 })
    }
    
    // Check if value already exists for this employee, date, and columnKey
    const existingValue = await CustomDailyValue.findOne({
      employeeId,
      date,
      columnKey
    })
    
    let customValue
    
    if (existingValue) {
      // Update existing value
      customValue = await CustomDailyValue.findByIdAndUpdate(
        existingValue._id,
        {
          value: value.toString(),
          editedBy: editedBy || 'system',
          editedAt: new Date(),
          previousValue: existingValue.value
        },
        { new: true, runValidators: true }
      ).populate('employeeId', 'name department')
    } else {
      // Create new value
      customValue = await CustomDailyValue.create({
        employeeId,
        date,
        columnKey,
        value: value.toString(),
        editedBy: editedBy || 'system',
        editedAt: new Date(),
        previousValue: ''
      })
      
      await customValue.populate('employeeId', 'name department')
    }
    
    return NextResponse.json({
      success: true,
      message: existingValue ? 'Cập nhật giá trị tùy chỉnh thành công' : 'Tạo giá trị tùy chỉnh thành công',
      data: customValue
    })
  } catch (error) {
    console.error('Create/Update custom daily value error:', error)
    return NextResponse.json({
      success: false,
      message: 'Lỗi tạo/cập nhật giá trị tùy chỉnh',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT /api/custom-daily-values/[id] - Update custom daily value
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    const { id, value, editedBy } = await request.json()
    
    const existingValue = await CustomDailyValue.findById(id)
    if (!existingValue) {
      return NextResponse.json({
        success: false,
        message: 'Không tìm thấy giá trị tùy chỉnh'
      }, { status: 404 })
    }
    
    const customValue = await CustomDailyValue.findByIdAndUpdate(
      id,
      {
        value: value.toString(),
        editedBy: editedBy || 'system',
        editedAt: new Date(),
        previousValue: existingValue.value
      },
      { new: true, runValidators: true }
    ).populate('employeeId', 'name department')
    
    return NextResponse.json({
      success: true,
      message: 'Cập nhật giá trị tùy chỉnh thành công',
      data: customValue
    })
  } catch (error) {
    console.error('Update custom daily value error:', error)
    return NextResponse.json({
      success: false,
      message: 'Lỗi cập nhật giá trị tùy chỉnh',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/custom-daily-values/[id] - Delete custom daily value
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    
    const url = new URL(request.url)
    const id = url.pathname.split('/').pop()
    
    const customValue = await CustomDailyValue.findByIdAndDelete(id)
    
    if (!customValue) {
      return NextResponse.json({
        success: false,
        message: 'Không tìm thấy giá trị tùy chỉnh'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Xóa giá trị tùy chỉnh thành công',
      data: customValue
    })
  } catch (error) {
    console.error('Delete custom daily value error:', error)
    return NextResponse.json({
      success: false,
      message: 'Lỗi xóa giá trị tùy chỉnh',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
