import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/connection'
import { AttendanceRecord } from '@/lib/mongodb/models'

// GET /api/attendance - Get attendance records
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get('employeeId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const month = searchParams.get('month') // YYYY-MM format
    
    let query: any = {}
    
    if (employeeId) {
      query.employeeId = employeeId
    }
    
    if (date) {
      query.date = date
    } else if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate }
    } else if (month) {
      query.date = { $regex: `^${month}` }
    }
    
    const records = await AttendanceRecord.find(query)
      .populate('employeeId', 'name title department')
      .sort({ date: -1, employeeId: 1 })
    
    return NextResponse.json({
      success: true,
      data: records,
      count: records.length
    })
  } catch (error) {
    console.error('Error fetching attendance records:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance records' },
      { status: 500 }
    )
  }
}

// POST /api/attendance - Create or update attendance record
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { employeeId, date, morningCheckIn, afternoonCheckIn, points, shifts } = body
    
    // Validation
    if (!employeeId || !date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: employeeId, date' },
        { status: 400 }
      )
    }
    
    // Check if record already exists
    let record = await AttendanceRecord.findOne({ employeeId, date })
    
    if (record) {
      // Update existing record
      record.morningCheckIn = morningCheckIn
      record.afternoonCheckIn = afternoonCheckIn
      record.points = points || 0
      record.shifts = shifts || []
      await record.save()
    } else {
      // Create new record
      record = new AttendanceRecord({
        employeeId,
        date,
        morningCheckIn,
        afternoonCheckIn,
        points: points || 0,
        shifts: shifts || []
      })
      await record.save()
    }
    
    return NextResponse.json({
      success: true,
      data: record,
      message: record.isNew ? 'Attendance record created successfully' : 'Attendance record updated successfully'
    }, { status: record.isNew ? 201 : 200 })
  } catch (error) {
    console.error('Error saving attendance record:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save attendance record' },
      { status: 500 }
    )
  }
}

// PUT /api/attendance - Update attendance record
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { employeeId, date, morningCheckIn, afternoonCheckIn, points, shifts } = body
    
    if (!employeeId || !date) {
      return NextResponse.json(
        { success: false, error: 'Employee ID and date are required' },
        { status: 400 }
      )
    }
    
    const record = await AttendanceRecord.findOneAndUpdate(
      { employeeId, date },
      { morningCheckIn, afternoonCheckIn, points, shifts },
      { new: true, runValidators: true }
    )
    
    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Attendance record not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: record,
      message: 'Attendance record updated successfully'
    })
  } catch (error) {
    console.error('Error updating attendance record:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update attendance record' },
      { status: 500 }
    )
  }
}

// DELETE /api/attendance - Delete attendance record
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get('employeeId')
    const date = searchParams.get('date')
    
    if (!employeeId || !date) {
      return NextResponse.json(
        { success: false, error: 'Employee ID and date are required' },
        { status: 400 }
      )
    }
    
    const record = await AttendanceRecord.findOneAndDelete({ employeeId, date })
    
    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Attendance record not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Attendance record deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting attendance record:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete attendance record' },
      { status: 500 }
    )
  }
}
