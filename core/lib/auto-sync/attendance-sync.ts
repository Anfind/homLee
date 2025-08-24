/**
 * Attendance Sync Module - Đồng bộ dữ liệu chấm công từ ZKTeco
 */

import { logAutoSync } from './sync-logger';

interface SyncResponse {
  success: boolean;
  message: string;
  data?: any;
  recordsCount?: number;
}

/**
 * Đồng bộ dữ liệu chấm công từ máy ZKTeco
 */
export async function syncAttendanceData(): Promise<SyncResponse> {
  try {
    logAutoSync('info', 'Starting attendance data sync...');

    // Gọi API auto-sync để đồng bộ dữ liệu
    const response = await fetch('/api/auto-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'auto-sync',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      logAutoSync('success', `Sync completed: ${result.recordsCount || 0} records processed`);
      return {
        success: true,
        message: result.message || 'Sync completed successfully',
        data: result.data,
        recordsCount: result.recordsCount,
      };
    } else {
      throw new Error(result.message || 'Sync failed');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logAutoSync('error', `Sync failed: ${errorMessage}`, error);
    
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Kiểm tra kết nối với máy ZKTeco
 */
export async function checkZKConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/zk-status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return result.connected === true;

  } catch (error) {
    logAutoSync('warn', 'Cannot check ZK connection', error);
    return false;
  }
}

/**
 * Lấy thống kê sync gần đây
 */
export async function getSyncStats(): Promise<any> {
  try {
    const response = await fetch('/api/sync-stats', {
      method: 'GET',
    });

    if (response.ok) {
      return await response.json();
    }
    return null;

  } catch (error) {
    logAutoSync('warn', 'Cannot get sync stats', error);
    return null;
  }
}
