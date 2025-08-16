import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/connection'
import { CheckInSettings } from '@/lib/mongodb/models/CheckInSettings'

// GET /api/check-in-settings - Get all check-in settings
export async function GET() {
  try {
    await connectDB()
    
    // Load all active check-in settings (one per day of week)
    const settings = await CheckInSettings.find({ isActive: true }).sort({ dayOfWeek: 1 })
    
    // Convert to client format
    const clientSettings: any = settings.reduce((acc: any, setting: any) => {
      acc[setting.dayOfWeek] = {
        shifts: setting.shifts
      }
      return acc
    }, {})
    
    // Fill missing days with default settings
    for (let day = 0; day <= 6; day++) {
      if (!clientSettings[day]) {
        clientSettings[day] = {
          shifts: [
            { id: `day-${day}-shift-1`, name: "Ca sáng", startTime: "07:00", endTime: "11:00", points: 1 },
            { id: `day-${day}-shift-2`, name: "Ca chiều", startTime: "13:00", endTime: "17:00", points: 1 }
          ]
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: clientSettings
    })

  } catch (error) {
    console.error('Get check-in settings error:', error)
    return NextResponse.json({
      success: false,
      message: 'Lỗi khi lấy cấu hình chấm công',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/check-in-settings - Update check-in settings
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { dayOfWeek, shifts, updatedBy } = await request.json()
    
    // Validate input
    if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json({
        success: false,
        message: 'dayOfWeek phải là số từ 0-6'
      }, { status: 400 })
    }
    
    if (!Array.isArray(shifts)) {
      return NextResponse.json({
        success: false,
        message: 'shifts phải là array'
      }, { status: 400 })
    }

    // Update or create setting for this day
    const setting = await CheckInSettings.findOneAndUpdate(
      { dayOfWeek },
      {
        dayOfWeek,
        shifts,
        isActive: true,
        createdBy: updatedBy || 'system',
        updatedAt: new Date()
      },
      { 
        upsert: true, 
        new: true 
      }
    )

    return NextResponse.json({
      success: true,
      message: `Cập nhật cấu hình cho ${getDayName(dayOfWeek)} thành công`,
      data: setting
    })

  } catch (error) {
    console.error('Update check-in settings error:', error)
    return NextResponse.json({
      success: false,
      message: 'Lỗi khi cập nhật cấu hình chấm công',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getDayName(dayOfWeek: number): string {
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  return days[dayOfWeek] || 'Unknown'
}
