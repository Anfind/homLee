import { NextRequest, NextResponse } from 'next/server';
import { isCloudEnvironment, getBackendUrl } from '@/lib/environment';

/**
 * API Endpoint: /api/auto-sync
 * Tự động đồng bộ dữ liệu điểm danh từ máy ZKTeco (chạy background)
 * Cloud-safe: Returns 503 when zktceo-backend is not available
 */

export async function POST(request: NextRequest) {
  try {
    // Check if running in cloud environment
    if (isCloudEnvironment()) {
      console.log('[AUTO-SYNC] Cloud environment detected, auto-sync not available');
      return NextResponse.json({
        success: false,
        message: 'Auto sync is not available in cloud environment. Please use manual sync or run locally.',
        cloudEnvironment: true,
        available: false,
      }, { status: 503 });
    }

    const body = await request.json();
    const { action, timestamp } = body;

    console.log(`[AUTO-SYNC] ${new Date().toISOString()} - Auto sync request:`, { action, timestamp });

    // Sử dụng endpoint sync-attendance hiện tại với params auto
    const backendUrl = getBackendUrl();
    const syncResponse = await fetch(`${backendUrl}/api/sync-attendance`, {
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
  // Check if running in cloud environment
  if (isCloudEnvironment()) {
    return NextResponse.json({
      service: 'auto-sync',
      status: 'unavailable',
      enabled: false,
      cloudEnvironment: true,
      message: 'Auto sync is not available in cloud environment',
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    service: 'auto-sync',
    status: 'available',
    enabled: true,
    cloudEnvironment: false,
    timestamp: new Date().toISOString(),
  });
}
