# 🚀 MongoDB Migration Guide

## 📋 Tổng quan

Dự án homeLee đã được nâng cấp từ localStorage sang MongoDB để:
- ✅ Hiệu suất tốt hơn với dữ liệu lớn
- ✅ Đồng bộ hóa giữa nhiều thiết bị
- ✅ Backup và phục hồi dữ liệu
- ✅ Truy vấn phức tạp và báo cáo
- ✅ Khả năng mở rộng trong tương lai

## 🏗️ Kiến trúc mới

### Database Schema
```
MongoDB Collections:
├── employees          # Thông tin nhân viên
├── users             # Tài khoản hệ thống
├── departments       # Phòng ban
├── attendancerecords # Bản ghi chấm công
├── bonuspoints       # Điểm thưởng/phạt
├── customdailyvalues # Hoa hồng, overtime, etc.
└── checkinsettings   # Cấu hình ca làm việc
```

### API Endpoints
```
GET/POST/PUT/DELETE /api/employees
GET/POST/PUT/DELETE /api/users
GET/POST/PUT/DELETE /api/attendance
POST /api/auth (login)
POST /api/migrate (migration)
```

## 🚀 Cách chạy với MongoDB

### 1. **Cài đặt MongoDB**

#### Option A: MongoDB Local
```bash
# Windows (chocolatey)
choco install mongodb

# MacOS (homebrew)
brew install mongodb-community

# Linux (Ubuntu)
sudo apt install mongodb
```

#### Option B: MongoDB Atlas (Cloud) - Khuyến nghị
1. Đăng ký tại https://www.mongodb.com/atlas
2. Tạo cluster miễn phí
3. Lấy connection string

### 2. **Cấu hình Environment**

Tạo file `.env.local`:
```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/homelee-attendance

# Hoặc MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/homelee-attendance

NEXTAUTH_SECRET=homelee-secret-key
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

### 3. **Khởi động MongoDB Local** (nếu dùng local)
```bash
# Windows
mongod --dbpath="C:\data\db"

# MacOS/Linux
mongod --dbpath="/usr/local/var/mongodb"
```

### 4. **Chạy ứng dụng**
```bash
cd core
npm install
npm run dev
```

## 🔄 Migration Process

### Tự động Migration (Khuyến nghị)
1. Mở ứng dụng trong browser
2. Sẽ xuất hiện Migration Modal
3. Click "Start Migration"
4. Chờ hoàn thành

### Manual Migration
```javascript
// Trong browser console
const localData = {
  employees: JSON.parse(localStorage.getItem('employees') || '[]'),
  users: JSON.parse(localStorage.getItem('users') || '[]'),
  departments: JSON.parse(localStorage.getItem('departments') || '[]'),
  attendanceRecords: JSON.parse(localStorage.getItem('attendanceRecords') || '[]'),
  bonusPoints: JSON.parse(localStorage.getItem('bonusPoints') || '[]'),
  customDailyValues: JSON.parse(localStorage.getItem('customDailyValues') || '[]'),
  checkInSettings: JSON.parse(localStorage.getItem('checkInSettings') || '{}')
}

fetch('/api/migrate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ localStorageData: localData })
})
```

## 🛠️ API Usage Examples

### Authentication
```javascript
// Login
const response = await fetch('/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
})
const { data: user } = await response.json()
```

### Employees
```javascript
// Get all employees
const employees = await fetch('/api/employees').then(r => r.json())

// Get employees by department
const deptEmployees = await fetch('/api/employees?department=Phòng Kỹ thuật').then(r => r.json())

// Create employee
await fetch('/api/employees', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'EMP001',
    name: 'Nguyễn Văn A',
    title: 'Nhân viên',
    department: 'Phòng Kỹ thuật'
  })
})
```

### Attendance
```javascript
// Get attendance by month
const attendance = await fetch('/api/attendance?month=2025-08').then(r => r.json())

// Create/update attendance
await fetch('/api/attendance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employeeId: 'EMP001',
    date: '2025-08-11',
    morningCheckIn: '08:30',
    afternoonCheckIn: '13:30',
    points: 2
  })
})
```

## 🔧 Database Indexes

MongoDB tự động tạo các indexes sau để tối ưu performance:

```javascript
// Employees
db.employees.createIndex({ department: 1 })
db.employees.createIndex({ name: 1 })

// Attendance Records
db.attendancerecords.createIndex({ employeeId: 1, date: 1 }, { unique: true })
db.attendancerecords.createIndex({ date: 1 })

// Users
db.users.createIndex({ username: 1 }, { unique: true })
db.users.createIndex({ role: 1 })

// Bonus Points
db.bonuspoints.createIndex({ employeeId: 1, date: 1 })
db.bonuspoints.createIndex({ editedAt: -1 })
```

## 📊 Migration Results Example

Sau khi migration thành công:
```json
{
  "success": true,
  "results": {
    "employees": 583,
    "users": 4,
    "departments": 3,
    "attendanceRecords": 15420,
    "bonusPoints": 156,
    "customDailyValues": 342,
    "checkInSettings": 7
  }
}
```

## 🐛 Troubleshooting

### Lỗi kết nối MongoDB
```bash
# Kiểm tra MongoDB đang chạy
mongosh
# hoặc
mongo

# Kiểm tra port
netstat -an | findstr :27017
```

### Lỗi Environment Variables
```bash
# Kiểm tra .env.local tồn tại
ls -la .env.local

# Restart Next.js sau khi thay đổi .env
npm run dev
```

### Lỗi Migration
1. Kiểm tra console browser để xem localStorage data
2. Kiểm tra Network tab để xem API calls
3. Kiểm tra MongoDB connection trong terminal

## 📈 Performance Benefits

### Trước (localStorage):
- ❌ Giới hạn 5-10MB storage
- ❌ Blocking UI khi tải dữ liệu lớn
- ❌ Không sync giữa devices
- ❌ Mất dữ liệu khi clear browser

### Sau (MongoDB):
- ✅ Unlimited storage
- ✅ Non-blocking queries
- ✅ Multi-device sync
- ✅ Persistent data
- ✅ Advanced queries & aggregation
- ✅ Backup & restore capabilities

## 🔐 Security Notes

### Production Deployment:
1. **Hash passwords** - Sử dụng bcrypt
2. **Environment variables** - Secure MongoDB URI
3. **HTTPS** - SSL/TLS cho tất cả connections
4. **Input validation** - Validate tất cả API inputs
5. **Rate limiting** - Chống spam API calls

### Example Password Hashing:
```javascript
import bcrypt from 'bcrypt'

// Hash password
const hashedPassword = await bcrypt.hash(password, 10)

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword)
```

## 🚀 Next Steps

1. ✅ Complete migration
2. 🔄 Test all functionality
3. 🔐 Implement password hashing
4. 📊 Add advanced reporting
5. 🔄 Real-time sync với WebSockets
6. 📱 Mobile app development
7. 🔔 Notification system

---

**Migration hoàn thành! Dự án đã sẵn sàng cho production với MongoDB! 🎉**
