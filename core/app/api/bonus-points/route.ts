import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/connection'
import { BonusPoint } from '@/lib/mongodb/models/BonusPoint'
import { Employee } from '@/lib/mongodb/models/Employee'

// GET /api/bonus-points - Get bonus points with optional filters
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const month = url.searchParams.get('month') // YYYY-MM format
    
    // Build query filter
    const filter: any = {}
    
    if (employeeId) {
      filter.employeeId = employeeId
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
    
    const bonusPoints = await BonusPoint.find(filter)
      .populate('employeeId', 'name department')
      .sort({ date: -1, editedAt: -1 })
    
    return NextResponse.json({
      success: true,
      message: `Lấy thành công ${bonusPoints.length} bản ghi điểm thưởng`,
      data: bonusPoints
    })
  } catch (error) {
    console.error('Get bonus points error:', error)
    return NextResponse.json({
      success: false,
      message: 'Lỗi lấy danh sách điểm thưởng',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/bonus-points - Create bonus point adjustment
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { employeeId, date, points, editedBy, reason } = await request.json()
    
    // Verify employee exists
    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return NextResponse.json({
        success: false,
        message: 'Không tìm thấy nhân viên'
      }, { status: 404 })
    }
    
    // Get current points for this employee on this date (if any)
    const existingBonusPoints = await BonusPoint.find({
      employeeId,
      date
    })
    
    const currentBonusTotal = existingBonusPoints.reduce((sum, bp) => sum + bp.points, 0)
    
    const bonusPoint = await BonusPoint.create({
      employeeId,
      date,
      points,
      editedBy: editedBy || 'system',
      editedAt: new Date(),
      previousValue: currentBonusTotal,
      reason: reason || 'Manual adjustment'
    })
    
    // Populate employee info for response
    await bonusPoint.populate('employeeId', 'name department')
    
    return NextResponse.json({
      success: true,
      message: 'Tạo điều chỉnh điểm thành công',
      data: bonusPoint
    })
  } catch (error) {
    console.error('Create bonus point error:', error)
    return NextResponse.json({
      success: false,
      message: 'Lỗi tạo điều chỉnh điểm',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT /api/bonus-points/[id] - Update bonus point
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    const { id, points, reason, editedBy } = await request.json()
    
    const bonusPoint = await BonusPoint.findByIdAndUpdate(
      id,
      {
        points,
        reason,
        editedBy: editedBy || 'system',
        editedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('employeeId', 'name department')
    
    if (!bonusPoint) {
      return NextResponse.json({
        success: false,
        message: 'Không tìm thấy bản ghi điểm thưởng'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cập nhật điểm thưởng thành công',
      data: bonusPoint
    })
  } catch (error) {
    console.error('Update bonus point error:', error)
    return NextResponse.json({
      success: false,
      message: 'Lỗi cập nhật điểm thưởng',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/bonus-points/[id] - Delete bonus point
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    
    const url = new URL(request.url)
    const id = url.pathname.split('/').pop()
    
    const bonusPoint = await BonusPoint.findByIdAndDelete(id)
    
    if (!bonusPoint) {
      return NextResponse.json({
        success: false,
        message: 'Không tìm thấy bản ghi điểm thưởng'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Xóa điểm thưởng thành công',
      data: bonusPoint
    })
  } catch (error) {
    console.error('Delete bonus point error:', error)
    return NextResponse.json({
      success: false,
      message: 'Lỗi xóa điểm thưởng',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
