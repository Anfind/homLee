'use client';

import { useEffect } from 'react';

/**
 * Auto Sync Initializer
 * Khởi động auto-sync module khi app load
 * Component này được đặt trong layout để chạy mỗi khi load trang
 */
export function AutoSyncInitializer() {
  useEffect(() => {
    // Import và khởi động auto-sync module
    import('@/lib/auto-sync').then(({ autoSyncManager }) => {
      // Module sẽ tự khởi động theo config
      console.log('🔄 Auto-sync module initialized');
    }).catch((error) => {
      console.warn('⚠️ Auto-sync module failed to initialize:', error);
    });
  }, []);

  // Component này không render gì
  return null;
}
