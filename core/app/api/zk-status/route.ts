import { NextResponse } from 'next/server';

/**
 * API Endpoint: /api/zk-status
 * Kiểm tra trạng thái kết nối với máy ZKTeco
 */

export async function GET() {
  try {
    // Kiểm tra zktceo-backend server
    const zkResponse = await fetch('http://localhost:3000/api/status', {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (zkResponse.ok) {
      const zkStatus = await zkResponse.json();
      return NextResponse.json({
        connected: true,
        backend: 'available',
        zkStatus: zkStatus,
        timestamp: new Date().toISOString(),
      });
    } else {
      throw new Error(`Backend not responding: ${zkResponse.status}`);
    }

  } catch (error) {
    console.warn('[ZK-STATUS] Backend connection check failed:', error);
    
    return NextResponse.json({
      connected: false,
      backend: 'unavailable',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
