import { NextRequest, NextResponse } from 'next/server';

/**
 * API Endpoint: /api/auto-sync
 * Tự động đồng bộ dữ liệu chấm công từ máy ZKTeco (chạy background)
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, timestamp } = body;

    console.log(`[AUTO-SYNC] ${new Date().toISOString()} - Auto sync request:`, { action, timestamp });

    // Sử dụng endpoint sync-attendance hiện tại với params auto
    const syncResponse = await fetch('http://localhost:3001/api/sync-attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auto: true,
        startDate: null, // Sync all recent data
        endDate: null,
      }),
      // Timeout 25 seconds
      signal: AbortSignal.timeout(25000),
    });

    if (!syncResponse.ok) {
      throw new Error(`Sync API error: ${syncResponse.status} ${syncResponse.statusText}`);
    }

    const syncResult = await syncResponse.json();

    console.log(`[AUTO-SYNC] Completed:`, syncResult);

    return NextResponse.json({
      success: true,
      message: `Auto sync completed successfully`,
      recordsCount: syncResult.totalSynced || 0,
      data: {
        ...syncResult,
        autoSync: true,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[AUTO-SYNC] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      message: `Auto sync failed: ${errorMessage}`,
      error: errorMessage,
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'auto-sync',
    status: 'available',
    enabled: true,
    timestamp: new Date().toISOString(),
  });
}
