# 🌐 MongoDB Atlas Configuration Guide

## 📋 Overview
Lee Homes Attendance System đã được cấu hình để sử dụng MongoDB Atlas (Cloud Database) thay vì MongoDB local.

## 🔧 Configuration Changes

### Environment Variables
```bash
# Main configuration in core/.env.local
MONGODB_URI=mongodb+srv://leehomes_admin:W029yxWJtYf7z5IC@lee-homes-cluster.xmgrbjn.mongodb.net/homelee-attendance?retryWrites=true&w=majority&appName=lee-homes-cluster

# Backup local connection (commented out)
# MONGODB_URI_LOCAL=mongodb://localhost:27017/homelee-attendance
```

### Atlas Cluster Details
- **Cluster Name**: lee-homes-cluster
- **Database**: homelee-attendance  
- **Tier**: M0 (Free tier - 512MB storage)
- **Region**: Singapore (ap-southeast-1)
- **User**: leehomes_admin
- **Connection**: Secure SSL/TLS

## 📊 Data Migration Status

### Collections Migrated:
- ✅ employees
- ✅ users
- ✅ departments
- ✅ attendancerecords
- ✅ bonuspoints
- ✅ customdailyvalues
- ✅ checkinsettings

### Migration Method:
Data đã được migration sử dụng MongoDB Compass export/import process từ local database sang Atlas cluster.

## 🚀 Testing & Verification

### Test Atlas Connection:
```bash
cd core
node test-atlas-connection.js
```

### Verify Migration:
```bash
cd core
node verify-atlas-migration.js
```

### Create Optimal Indexes:
```bash
cd core
node create-atlas-indexes.js
```

### Check Existing Indexes:
```bash
cd core
node create-atlas-indexes.js check
```

## 🔍 Updated Files

### Core Application Files:
- `core/.env.local` - Environment variables
- `core/lib/mongodb/connection.ts` - Main connection with Atlas optimizations

### Script Files Updated:
- `core/seed-employees.js`
- `core/seed-employees-with-departments.js`
- `core/seed-department-users.js`
- `core/verify-department-users.js`
- `core/fix-department-manager-names.js`
- `core/debug-users.js`
- `core/check-database.js`
- `core/seed-data.js`
- `core/seed-30-departments.js`
- `core/debug-current-settings.js`
- `core/test-save-settings.js`

### New Utility Files:
- `core/test-atlas-connection.js` - Test Atlas connectivity
- `core/verify-atlas-migration.js` - Verify data migration
- `core/create-atlas-indexes.js` - Create performance indexes

## ⚙️ Connection Optimizations

### Mongoose Configuration:
```javascript
const opts = {
  bufferCommands: false,
  maxPoolSize: 10,           // Connection pooling
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4                  // IPv4 only
}
```

### Indexes Created:
- **Employees**: _id (unique), name, department, text search
- **Users**: username (unique), role, department, isActive
- **Attendance**: employeeId+date, date, timestamp
- **Departments**: name (unique), isActive

## 🚨 Important Notes

### Local Connection Preserved:
- Local MongoDB connection strings được comment out, KHÔNG bị xóa
- Có thể dễ dàng switch back nếu cần
- All scripts maintain backward compatibility

### No Functional Changes:
- ❌ Không có thay đổi nào về chức năng
- ❌ Không có thay đổi database schema
- ❌ Không có thay đổi API endpoints
- ✅ Chỉ thay đổi connection target

### Security:
- Connection string có embedded credentials
- SSL/TLS encryption enabled
- Network access configured for global access

## 🎯 Next Steps

### 1. Start Application:
```bash
cd core
npm run dev
```

### 2. Verify Functionality:
- Test login functionality
- Check employee management
- Verify attendance sync
- Test reports generation

### 3. Monitor Performance:
- Check Atlas dashboard for connection metrics
- Monitor query performance
- Review storage usage

## 🔄 Rollback Plan (If Needed)

### To Switch Back to Local:
1. Uncomment local connection in `.env.local`
2. Comment out Atlas connection
3. Restart application
4. Verify local MongoDB is running

```bash
# In .env.local
# MONGODB_URI=mongodb+srv://...  # Comment this
MONGODB_URI=mongodb://localhost:27017/homelee-attendance  # Uncomment this
```

## 📞 Support & Troubleshooting

### Common Issues:

**Connection Timeout:**
- Check internet connection
- Verify Atlas cluster is running
- Check network access whitelist

**Authentication Error:**
- Verify username/password in connection string
- Check database user permissions

**Database Not Found:**
- Ensure database name is correct: `homelee-attendance`
- Verify data migration completed

### Test Commands:
```bash
# Quick connection test
node -e "const {MongoClient} = require('mongodb'); new MongoClient(process.env.MONGODB_URI).connect().then(() => console.log('✅ Connected')).catch(err => console.error('❌', err.message))"

# Check environment variable
echo $MONGODB_URI
```

---

**✅ MongoDB Atlas setup completed successfully!**  
**🚀 Application ready for cloud deployment!**
