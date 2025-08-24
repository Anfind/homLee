import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb/connection';
import { AttendanceRecord } from '@/lib/mongodb/models/AttendanceRecord';

/**
 * API Endpoint: /api/sync-stats
 * Lấy thống kê về các lần sync gần đây
 */

export async function GET() {
  try {
    await connectDB();

    // Lấy thống kê từ database
    const stats = await AttendanceRecord.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            hour: { $hour: "$createdAt" }
          },
          count: { $sum: 1 },
          latestSync: { $max: "$createdAt" }
        }
      },
      {
        $sort: { "_id.date": -1, "_id.hour": -1 }
      },
      {
        $limit: 24 // Last 24 hours
      }
    ]);

    // Tổng số records trong 24h qua
    const totalToday = await AttendanceRecord.countDocuments({
      createdAt: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    });

    // Record mới nhất
    const latestRecord = await AttendanceRecord.findOne(
      {},
      {},
      { sort: { createdAt: -1 } }
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalLast24h: totalToday,
        latestRecord: latestRecord ? {
          timestamp: latestRecord.createdAt,
          employeeId: latestRecord.employeeId,
          checkTime: latestRecord.checkTime,
        } : null,
        hourlyBreakdown: stats,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('[SYNC-STATS] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
