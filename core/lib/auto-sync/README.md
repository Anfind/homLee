# Auto Sync Module - Hệ thống đồng bộ tự động

## 📋 Tổng quan

Module auto-sync được thiết kế để tự động đồng bộ dữ liệu chấm công từ máy ZKTeco mỗi khi người dùng mở website. Module này có thể dễ dàng bật/tắt và cấu hình theo nhu cầu.

## 🚀 Cách hoạt động

1. **Khởi động tự động**: Khi load trang, module sẽ tự động bắt đầu sync dữ liệu
2. **Sync định kỳ**: Sau đó sync mỗi 5 phút (có thể cấu hình)
3. **Retry logic**: Tự động retry khi sync fail (tối đa 3 lần)
4. **Logging**: Ghi log chi tiết các hoạt động sync

## ⚙️ Cấu hình

File: `/lib/auto-sync/index.ts`

```typescript
export const AUTO_SYNC_CONFIG = {
  enabled: true,           // Bật/tắt auto sync
  syncOnLoad: true,        // Sync khi load trang
  syncInterval: 5 * 60 * 1000,  // Sync mỗi 5 phút
  maxRetries: 3,           // Số lần retry
  timeoutMs: 30000,        // Timeout (30s)
};
```

## 🎛️ Điều khiển

### 1. Bật/Tắt auto sync
```typescript
import { toggleAutoSync } from '@/lib/auto-sync';

// Tắt auto sync
toggleAutoSync(false);

// Bật auto sync
toggleAutoSync(true);
```

### 2. Sync thủ công
```typescript
import { manualSync } from '@/lib/auto-sync';

// Thực hiện sync ngay lập tức
await manualSync();
```

### 3. Kiểm tra trạng thái
```typescript
import { getAutoSyncStatus } from '@/lib/auto-sync';

const status = getAutoSyncStatus();
console.log(status);
// {
//   enabled: true,
//   running: false,
//   retryCount: 0,
//   hasInterval: true
// }
```

## 🔍 Monitoring

### 1. Auto Sync Control UI
- Hiển thị trong header (chỉ admin mới thấy)
- Click để mở dialog điều khiển
- Xem logs, cấu hình, và điều khiển manual

### 2. API Endpoints

#### `/api/auto-sync` (POST)
- Endpoint chính để thực hiện sync
- Sử dụng bởi auto-sync module

#### `/api/zk-status` (GET)
- Kiểm tra trạng thái kết nối ZKTeco backend
- Response: `{ connected: boolean, backend: string }`

#### `/api/sync-stats` (GET)
- Thống kê sync trong 24h qua
- Response: `{ totalLast24h: number, latestRecord: object }`

### 3. Logs
```typescript
import { syncLogger } from '@/lib/auto-sync/sync-logger';

// Xem logs
const logs = syncLogger.getLogs();

// Xem chỉ errors
const errors = syncLogger.getLogs('error');

// Clear logs
syncLogger.clearLogs();

// Export logs
const logText = syncLogger.exportLogs();
```

## 📁 Cấu trúc files

```
lib/auto-sync/
├── index.ts              # Module chính
├── attendance-sync.ts    # Logic sync dữ liệu
└── sync-logger.ts        # Logging system

components/
├── auto-sync-control.tsx    # UI điều khiển
└── auto-sync-initializer.tsx # Khởi động module

app/api/
├── auto-sync/route.ts    # API endpoint chính
├── zk-status/route.ts    # Kiểm tra status
└── sync-stats/route.ts   # Thống kê sync
```

## 🔧 Tắt/Gỡ bỏ Auto Sync

### Tắt tạm thời
```typescript
// Trong file /lib/auto-sync/index.ts
export const AUTO_SYNC_CONFIG = {
  enabled: false,  // <- Set thành false
  // ... other configs
};
```

### Gỡ bỏ hoàn toàn
1. Xóa `<AutoSyncInitializer />` từ `layout.tsx`
2. Xóa `<AutoSyncControl />` từ `header.tsx`
3. Xóa folder `lib/auto-sync/`
4. Xóa các API routes: `auto-sync`, `zk-status`, `sync-stats`

## 🐛 Troubleshooting

### 1. Auto sync không chạy
- Kiểm tra `AUTO_SYNC_CONFIG.enabled = true`
- Kiểm tra console logs có lỗi không
- Kiểm tra ZKTeco backend có chạy không (port 3000)

### 2. Sync fails liên tục
- Kiểm tra `/api/zk-status` - backend có connect được không
- Kiểm tra logs để xem lỗi cụ thể
- Tăng `timeoutMs` nếu sync chậm

### 3. UI không hiển thị
- Đảm bảo user role = 'admin'
- Kiểm tra import components đúng chưa
- Kiểm tra console có error không

## 📝 Logs mẫu

```
🔄 [AUTO-SYNC 14:30:25] Auto sync module initialized
🔄 [AUTO-SYNC 14:30:25] Performing initial sync on page load...
🔄 [AUTO-SYNC 14:30:25] Sync attempt 1/3
✅ [AUTO-SYNC 14:30:27] Attendance data synced successfully
🔄 [AUTO-SYNC 14:30:27] Interval sync started (every 300s)
```

## ⚡ Performance Notes

- Module chỉ chạy ở client-side (browser)
- Không ảnh hưởng đến SSR performance
- Auto stop khi đóng tab/browser
- Logs được lưu trong localStorage (tối đa 20 entries)

---

**Lưu ý**: Module này được thiết kế để dễ dàng bật/tắt. Khi không cần thiết, chỉ cần set `enabled: false` trong config.
