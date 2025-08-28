/**
 * Auto Sync Module - Tự động đồng bộ dữ liệu điểm danh từ máy ZKTeco
 * 
 * Chức năng này có thể được bật/tắt dễ dàng bằng cách thay đổi flag AUTO_SYNC_ENABLED
 * Khi không cần thiết, chỉ cần set AUTO_SYNC_ENABLED = false
 */

// Import các functions inline để tránh module resolution issues
async function syncAttendanceData(): Promise<{ success: boolean; message: string; recordsCount?: number }> {
  try {
    console.log('🔄 [AUTO-SYNC] Starting attendance data sync...');

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
      console.log('✅ [AUTO-SYNC] Sync completed:', result.recordsCount || 0, 'records processed');
      return {
        success: true,
        message: result.message || 'Sync completed successfully',
        recordsCount: result.recordsCount,
      };
    } else {
      throw new Error(result.message || 'Sync failed');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [AUTO-SYNC] Sync failed:', errorMessage);
    
    return {
      success: false,
      message: errorMessage,
    };
  }
}

function logAutoSync(level: 'info' | 'warn' | 'error' | 'success', message: string, details?: any) {
  const timestamp = new Date();
  const prefix = `[AUTO-SYNC ${timestamp.toLocaleTimeString()}]`;
  
  switch (level) {
    case 'info':
      console.log(`🔄 ${prefix} ${message}`, details || '');
      break;
    case 'success':
      console.log(`✅ ${prefix} ${message}`, details || '');
      break;
    case 'warn':
      console.warn(`⚠️ ${prefix} ${message}`, details || '');
      break;
    case 'error':
      console.error(`❌ ${prefix} ${message}`, details || '');
      break;
  }
}

// 🔧 CONFIGURATION - Thay đổi để bật/tắt auto sync
export const AUTO_SYNC_CONFIG = {
  enabled: true, // Set false để tắt auto sync
  syncOnLoad: true, // Sync khi load trang LẦN ĐẦU TIÊN trong session
  
  // 📅 DAILY SYNC SCHEDULE - Chỉ sync 2-3 lần/ngày vào các thời điểm quan trọng
  dailySchedule: [
    '08:30', // Sáng - đầu giờ làm việc
    '13:30', // Trưa - sau giờ nghỉ trưa  
    '17:30', // Chiều - cuối giờ làm việc
  ],
  
  // Cài đặt cũ (giữ lại để fallback)
  syncInterval: 4 * 60 * 60 * 1000, // 4 tiếng (backup interval)
  maxRetries: 3,
  timeoutMs: 30000,
  sessionKey: 'autoSyncSession',
  minTimeBetweenSyncs: 2 * 60 * 60 * 1000, // Tối thiểu 2 tiếng giữa các lần sync
};

// 🔄 Auto Sync Manager
class AutoSyncManager {
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private retryCount = 0;
  private lastSyncTime = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  /**
   * Kiểm tra xem có nên sync không (dựa trên schedule và thời gian)
   */
  private shouldPerformSync(): boolean {
    const now = Date.now();
    const lastSync = this.getLastSyncTime();
    const timeSinceLastSync = now - lastSync;

    // Nếu chưa bao giờ sync
    if (lastSync === 0) {
      return true;
    }

    // Nếu đã quá lâu (quá minTimeBetweenSyncs) - failsafe
    if (timeSinceLastSync > AUTO_SYNC_CONFIG.minTimeBetweenSyncs) {
      return true;
    }

    logAutoSync('info', `Skipping sync - last sync was ${Math.round(timeSinceLastSync / 1000 / 60)}min ago (min: ${AUTO_SYNC_CONFIG.minTimeBetweenSyncs / 1000 / 60}min)`);
    return false;
  }

  /**
   * Kiểm tra xem hiện tại có trong khung giờ sync theo schedule không
   */
  private isScheduledSyncTime(): boolean {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Kiểm tra có trong khoảng ±15 phút của schedule không
    for (const scheduleTime of AUTO_SYNC_CONFIG.dailySchedule) {
      const [scheduleHour, scheduleMinute] = scheduleTime.split(':').map(Number);
      const scheduledTime = new Date();
      scheduledTime.setHours(scheduleHour, scheduleMinute, 0, 0);
      
      const timeDiff = Math.abs(now.getTime() - scheduledTime.getTime());
      const fifteenMinutes = 15 * 60 * 1000;
      
      if (timeDiff <= fifteenMinutes) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Kiểm tra xem hôm nay đã sync trong khung giờ này chưa
   */
  private hasAlreadySyncedInCurrentSchedule(): boolean {
    const lastSync = this.getLastSyncTime();
    if (lastSync === 0) return false;
    
    const now = new Date();
    const lastSyncDate = new Date(lastSync);
    
    // Nếu không cùng ngày, chưa sync
    if (now.toDateString() !== lastSyncDate.toDateString()) {
      return false;
    }
    
    // Kiểm tra xem sync cuối có trong khung giờ hiện tại không
    for (const scheduleTime of AUTO_SYNC_CONFIG.dailySchedule) {
      const [scheduleHour, scheduleMinute] = scheduleTime.split(':').map(Number);
      const scheduledTime = new Date();
      scheduledTime.setHours(scheduleHour, scheduleMinute, 0, 0);
      
      const timeDiffFromSchedule = Math.abs(lastSyncDate.getTime() - scheduledTime.getTime());
      const timeDiffFromNow = Math.abs(now.getTime() - scheduledTime.getTime());
      const thirtyMinutes = 30 * 60 * 1000;
      
      // Nếu cả last sync và hiện tại đều trong cùng khung 30p của schedule
      if (timeDiffFromSchedule <= thirtyMinutes && timeDiffFromNow <= thirtyMinutes) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Lấy thời gian sync cuối từ localStorage
   */
  private getLastSyncTime(): number {
    try {
      const stored = localStorage.getItem('lastAutoSyncTime');
      return stored ? parseInt(stored) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Lưu thời gian sync
   */
  private setLastSyncTime(time: number) {
    try {
      localStorage.setItem('lastAutoSyncTime', time.toString());
      this.lastSyncTime = time;
    } catch {
      // Ignore localStorage errors
    }
  }

  /**
   * Kiểm tra xem có phải session mới không
   */
  private isNewSession(): boolean {
    try {
      const sessionMarker = sessionStorage.getItem(AUTO_SYNC_CONFIG.sessionKey);
      if (!sessionMarker) {
        // Đánh dấu session mới
        sessionStorage.setItem(AUTO_SYNC_CONFIG.sessionKey, Date.now().toString());
        return true;
      }
      return false;
    } catch {
      return true; // Nếu không access được sessionStorage, coi như session mới
    }
  }

  /**
   * Khởi tạo auto sync
   */
  private initialize() {
    if (!AUTO_SYNC_CONFIG.enabled) {
      logAutoSync('info', 'Auto sync is disabled in config');
      return;
    }

    logAutoSync('info', 'Auto sync module initialized with daily schedule');

    // Chỉ sync khi load trang nếu:
    // 1. Cấu hình cho phép
    // 2. Là session mới HOẶC trong khung giờ schedule và chưa sync
    if (AUTO_SYNC_CONFIG.syncOnLoad) {
      const isNewSession = this.isNewSession();
      const isScheduledTime = this.isScheduledSyncTime();
      const alreadySynced = this.hasAlreadySyncedInCurrentSchedule();
      const shouldSync = this.shouldPerformSync();
      
      if (isNewSession && shouldSync) {
        logAutoSync('info', 'New session detected - performing initial sync');
        this.performInitialSync();
      } else if (isScheduledTime && !alreadySynced && shouldSync) {
        logAutoSync('info', `Scheduled sync time (${AUTO_SYNC_CONFIG.dailySchedule.join(', ')}) - performing sync`);
        this.performInitialSync();
      } else {
        const nextSchedule = this.getNextScheduledTime();
        logAutoSync('info', `Skipping sync - next scheduled sync: ${nextSchedule}`);
      }
    }

    // Setup interval sync với schedule checking
    this.startScheduledSync();

    // Cleanup khi đóng tab
    window.addEventListener('beforeunload', () => {
      this.stop();
    });
  }

  /**
   * Lấy thời gian sync tiếp theo theo schedule
   */
  private getNextScheduledTime(): string {
    const now = new Date();
    const today = now.toDateString();
    
    for (const scheduleTime of AUTO_SYNC_CONFIG.dailySchedule) {
      const [hour, minute] = scheduleTime.split(':').map(Number);
      const scheduledTime = new Date();
      scheduledTime.setHours(hour, minute, 0, 0);
      
      if (scheduledTime > now) {
        return `${scheduleTime} hôm nay`;
      }
    }
    
    // Nếu đã qua tất cả schedule hôm nay, lấy schedule đầu tiên ngày mai
    return `${AUTO_SYNC_CONFIG.dailySchedule[0]} ngày mai`;
  }

  /**
   * Thực hiện sync lần đầu khi load trang
   */
  private async performInitialSync() {
    logAutoSync('info', 'Performing initial sync on page load...');
    await this.syncWithRetry();
  }

  /**
   * Bắt đầu sync theo schedule thay vì interval cố định
   */
  private startScheduledSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Kiểm tra mỗi 30 phút xem có trong khung giờ schedule không
    const checkInterval = 30 * 60 * 1000; // 30 phút
    
    this.syncInterval = setInterval(async () => {
      if (!this.isRunning) {
        const isScheduledTime = this.isScheduledSyncTime();
        const alreadySynced = this.hasAlreadySyncedInCurrentSchedule();
        
        if (isScheduledTime && !alreadySynced) {
          logAutoSync('info', 'Scheduled sync time reached - performing sync');
          await this.syncWithRetry();
        }
      }
    }, checkInterval);

    const nextSync = this.getNextScheduledTime();
    logAutoSync('info', `Scheduled sync enabled - next sync: ${nextSync} (checking every 30min)`);
  }

  /**
   * Thực hiện sync với retry logic
   */
  private async syncWithRetry() {
    if (this.isRunning) {
      logAutoSync('warn', 'Sync already running, skipping...');
      return;
    }

    // Kiểm tra thời gian giữa các lần sync
    if (!this.shouldPerformSync()) {
      return;
    }

    this.isRunning = true;
    this.retryCount = 0;

    while (this.retryCount < AUTO_SYNC_CONFIG.maxRetries) {
      try {
        logAutoSync('info', `Sync attempt ${this.retryCount + 1}/${AUTO_SYNC_CONFIG.maxRetries}`);
        
        // Thực hiện sync với timeout
        const syncPromise = syncAttendanceData();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Sync timeout')), AUTO_SYNC_CONFIG.timeoutMs);
        });

        await Promise.race([syncPromise, timeoutPromise]);
        
        // Lưu thời gian sync thành công
        this.setLastSyncTime(Date.now());
        
        logAutoSync('success', 'Attendance data synced successfully');
        this.retryCount = 0; // Reset retry count on success
        break;

      } catch (error) {
        this.retryCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (this.retryCount >= AUTO_SYNC_CONFIG.maxRetries) {
          logAutoSync('error', `Sync failed after ${AUTO_SYNC_CONFIG.maxRetries} attempts: ${errorMessage}`);
        } else {
          logAutoSync('warn', `Sync attempt ${this.retryCount} failed: ${errorMessage}. Retrying...`);
          // Wait 2 seconds before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    this.isRunning = false;
  }

  /**
   * Dừng auto sync
   */
  public stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    logAutoSync('info', 'Auto sync stopped');
  }

  /**
   * Bật auto sync
   */
  public start() {
    if (AUTO_SYNC_CONFIG.enabled) {
      this.startScheduledSync();
      logAutoSync('info', 'Auto sync restarted with schedule');
    }
  }

  /**
   * Thực hiện sync thủ công
   */
  public async manualSync() {
    logAutoSync('info', 'Manual sync triggered - bypassing time checks');
    
    // Cho phép manual sync bỏ qua time checks
    this.isRunning = true;
    this.retryCount = 0;

    try {
      const syncPromise = syncAttendanceData();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sync timeout')), AUTO_SYNC_CONFIG.timeoutMs);
      });

      await Promise.race([syncPromise, timeoutPromise]);
      
      // Lưu thời gian sync thành công
      this.setLastSyncTime(Date.now());
      
      logAutoSync('success', 'Manual sync completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logAutoSync('error', `Manual sync failed: ${errorMessage}`);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Kiểm tra trạng thái
   */
  public getStatus() {
    return {
      enabled: AUTO_SYNC_CONFIG.enabled,
      running: this.isRunning,
      retryCount: this.retryCount,
      hasInterval: this.syncInterval !== null,
      lastSyncTime: this.lastSyncTime || this.getLastSyncTime(),
      timeSinceLastSync: Date.now() - (this.lastSyncTime || this.getLastSyncTime()),
    };
  }
}

// 🚀 Export singleton instance
export const autoSyncManager = new AutoSyncManager();

// 🔧 Utility functions để control từ bên ngoài
export const toggleAutoSync = (enabled: boolean) => {
  AUTO_SYNC_CONFIG.enabled = enabled;
  if (enabled) {
    autoSyncManager.start();
  } else {
    autoSyncManager.stop();
  }
  logAutoSync('info', `Auto sync ${enabled ? 'enabled' : 'disabled'}`);
};

export const manualSync = () => autoSyncManager.manualSync();
export const getAutoSyncStatus = () => autoSyncManager.getStatus();
