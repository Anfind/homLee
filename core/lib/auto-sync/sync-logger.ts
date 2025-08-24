/**
 * Sync Logger - Log các hoạt động auto sync
 */

type LogLevel = 'info' | 'warn' | 'error' | 'success';

interface SyncLog {
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: any;
}

class SyncLogger {
  private logs: SyncLog[] = [];
  private maxLogs = 100; // Giữ tối đa 100 logs

  /**
   * Ghi log với level
   */
  log(level: LogLevel, message: string, details?: any) {
    const timestamp = new Date();
    const logEntry: SyncLog = { timestamp, level, message, details };
    
    // Add to logs array
    this.logs.unshift(logEntry);
    
    // Trim logs if exceed max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console log với colors
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

    // Store in localStorage for debugging
    try {
      localStorage.setItem('autoSyncLogs', JSON.stringify(this.logs.slice(0, 20)));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Lấy logs
   */
  getLogs(level?: LogLevel): SyncLog[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem('autoSyncLogs');
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Export logs as text
   */
  exportLogs(): string {
    return this.logs
      .map(log => `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()}: ${log.message}`)
      .join('\n');
  }
}

// Singleton instance
export const syncLogger = new SyncLogger();

// Convenience function
export const logAutoSync = (level: LogLevel, message: string, details?: any) => {
  syncLogger.log(level, message, details);
};
