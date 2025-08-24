'use client';

import { useEffect, useState } from 'react';
import { 
  autoSyncManager, 
  toggleAutoSync, 
  getAutoSyncStatus,
  AUTO_SYNC_CONFIG 
} from '@/lib/auto-sync';
import { syncLogger } from '@/lib/auto-sync/sync-logger';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { 
  Wifi, 
  WifiOff, 
  Settings, 
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

/**
 * Auto Sync Control Component
 * Hiển thị trạng thái và điều khiển auto sync
 */
export function AutoSyncControl() {
  const [status, setStatus] = useState(getAutoSyncStatus());
  const [logs, setLogs] = useState(syncLogger.getLogs().slice(0, 10));
  const [isOpen, setIsOpen] = useState(false);

  // Update status mỗi giây
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getAutoSyncStatus());
      setLogs(syncLogger.getLogs().slice(0, 10));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleAutoSync = (enabled: boolean) => {
    toggleAutoSync(enabled);
    setStatus(getAutoSyncStatus());
  };

  const getStatusIcon = () => {
    if (!status.enabled) return <WifiOff className="w-4 h-4 text-gray-400" />;
    if (status.running) return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
    return <Wifi className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!status.enabled) return 'Tắt';
    if (status.running) return 'Đang sync...';
    
    // Hiển thị thời gian sync cuối nếu có
    if (status.lastSyncTime && status.lastSyncTime > 0) {
      const timeSince = Math.round(status.timeSinceLastSync / 1000 / 60); // minutes
      if (timeSince < 1) return 'Vừa sync';
      if (timeSince < 60) return `${timeSince}p trước`;
      const hours = Math.round(timeSince / 60);
      return `${hours}h trước`;
    }
    
    return 'Chưa sync';
  };

  const getStatusColor = () => {
    if (!status.enabled) return 'gray';
    if (status.running) return 'blue';
    return 'green';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                {getStatusIcon()}
                <Badge variant={getStatusColor() as any} className="text-xs">
                  Auto Sync
                </Badge>
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Auto Sync - Đồng bộ tự động
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status & Controls */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon()}
                    <div>
                      <div className="font-medium">Trạng thái: {getStatusText()}</div>
                      <div className="text-sm text-gray-500">
                        {status.enabled ? 
                          `Schedule: ${AUTO_SYNC_CONFIG.dailySchedule.join(', ')} hàng ngày` : 
                          'Auto sync đã tắt'
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={status.enabled}
                      onCheckedChange={handleToggleAutoSync}
                    />
                    <span className="text-sm">{status.enabled ? 'Bật' : 'Tắt'}</span>
                  </div>
                </div>

                {/* Config Info */}
                {status.enabled && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="font-medium">Cấu hình</div>
                      <div className="text-gray-600 mt-1">
                        <div>• Daily schedule: {AUTO_SYNC_CONFIG.dailySchedule.join(', ')}</div>
                        <div>• Smart load: {AUTO_SYNC_CONFIG.syncOnLoad ? 'Có' : 'Không'}</div>
                        <div>• Min gap: {AUTO_SYNC_CONFIG.minTimeBetweenSyncs / 1000 / 60 / 60}h</div>
                        <div>• Timeout: {AUTO_SYNC_CONFIG.timeoutMs / 1000}s</div>
                        <div>• Max retries: {AUTO_SYNC_CONFIG.maxRetries}</div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="font-medium">Trạng thái hiện tại</div>
                      <div className="text-gray-600 mt-1">
                        <div>• Running: {status.running ? 'Có' : 'Không'}</div>
                        <div>• Interval active: {status.hasInterval ? 'Có' : 'Không'}</div>
                        <div>• Retry count: {status.retryCount}</div>
                        {status.lastSyncTime > 0 && (
                          <div>• Last sync: {new Date(status.lastSyncTime).toLocaleTimeString()}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Logs */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Log gần đây</h4>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => syncLogger.clearLogs()}
                    >
                      Xóa logs
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {logs.length === 0 ? (
                      <div className="text-gray-500 text-center py-4">
                        Chưa có logs
                      </div>
                    ) : (
                      logs.map((log, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 text-sm border rounded">
                          <div className="mt-0.5">
                            {log.level === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {log.level === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                            {log.level === 'warn' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                            {log.level === 'info' && <Clock className="w-4 h-4 text-blue-500" />}
                          </div>
                          <div className="flex-1">
                            <div className="text-gray-600">
                              {log.timestamp.toLocaleTimeString()}
                            </div>
                            <div>{log.message}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Manual Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => autoSyncManager.manualSync()}
                    disabled={status.running}
                  >
                    Sync thủ công
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('/api/sync-stats', '_blank')}
                  >
                    Xem thống kê
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TooltipTrigger>
        
        <TooltipContent>
          <p>Auto Sync: {getStatusText()}</p>
          <p className="text-xs text-gray-400">Click để xem chi tiết</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
