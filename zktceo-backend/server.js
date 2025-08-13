// Import các thư viện cần thiết
const express = require('express');
const ZKTeco = require('node-zklib');

// Khởi tạo ứng dụng Express
const app = express();
const port = 3000;

// Middleware để xử lý CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Middleware để parse JSON
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'ZKTeco Backend Server is running',
        timestamp: new Date().toISOString(),
        server: 'zktceo-backend',
        port: port
    });
});

// Cấu hình thông tin máy chấm công
const deviceIP = '192.168.1.240'; // IP của máy chấm công
const devicePort = 8818;          // Port đã xác định từ phần mềm Wise Eye
const timeout = 10000;            // Tăng thời gian chờ lên 10 giây cho ổn định

// =======================================================================
// API 1: LẤY TẤT CẢ DỮ LIỆU CHẤM CÔNG (Giống phiên bản trước)
// =======================================================================
app.get('/api/attendance', async (req, res) => {
    console.log('✅ Nhận được yêu cầu lấy TẤT CẢ dữ liệu chấm công...');
    const zk = new ZKTeco(deviceIP, devicePort, timeout);
    try {
        await zk.createSocket();
        const logs = await zk.getAttendances();
        
        // 🔍 DEBUG: Phân tích dữ liệu trả về
        console.log(`📊 DEBUG: Tổng số records: ${logs.data.length}`);
        
        if (logs.data.length > 0) {
            // Tìm record cũ nhất và mới nhất
            const times = logs.data.map(record => new Date(record.recordTime).getTime());
            const oldestTime = new Date(Math.min(...times));
            const newestTime = new Date(Math.max(...times));
            
            console.log(`📅 Oldest record: ${oldestTime.toISOString()} (VN: ${new Date(oldestTime.getTime() + 7*60*60*1000).toISOString()})`);
            console.log(`📅 Newest record: ${newestTime.toISOString()} (VN: ${new Date(newestTime.getTime() + 7*60*60*1000).toISOString()})`);
            
            // Phân tích theo giờ
            const hourStats = {};
            logs.data.forEach(record => {
                const vnTime = new Date(new Date(record.recordTime).getTime() + 7*60*60*1000);
                const hour = vnTime.getHours();
                hourStats[hour] = (hourStats[hour] || 0) + 1;
            });
            
            console.log('⏰ Records per hour (VN time):');
            for (let h = 0; h < 24; h++) {
                if (hourStats[h]) {
                    console.log(`   ${h.toString().padStart(2, '0')}:xx - ${hourStats[h]} records`);
                }
            }
        }
        
        res.status(200).json({
            success: true,
            message: `Lấy thành công ${logs.data.length} bản ghi chấm công.`,
            data: logs.data,
            debug: {
                totalRecords: logs.data.length,
                oldestRecord: logs.data.length > 0 ? Math.min(...logs.data.map(r => new Date(r.recordTime).getTime())) : null,
                newestRecord: logs.data.length > 0 ? Math.max(...logs.data.map(r => new Date(r.recordTime).getTime())) : null
            }
        });
    } catch (error) {
        console.error('❌ Error details:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        
        let errorMessage = 'Lỗi xử lý dữ liệu chấm công';
        if (error.name === 'ZKError' || error.constructor.name === 'ZKError') {
            errorMessage = `Lỗi thiết bị ZKTeco: ${error.message}`;
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Không thể kết nối tới thiết bị ZKTeco. Kiểm tra IP và port.';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Timeout khi kết nối thiết bị ZKTeco.';
        }
        
        res.status(500).json({ 
            success: false, 
            message: errorMessage, 
            error: error.message,
            details: {
                name: error.name,
                code: error.code,
                deviceIP: deviceIP,
                devicePort: devicePort
            }
        });
    } finally {
        try {
            if (zk && typeof zk.disconnect === 'function') {
                await zk.disconnect();
                console.log('🔌 Đã ngắt kết nối thiết bị.');
            }
        } catch (disconnectError) {
            console.error('⚠️ Lỗi khi ngắt kết nối:', disconnectError.message);
        }
    }
});

// =======================================================================
// API 2: LẤY DỮ LIỆU CHẤM CÔNG THEO NGÀY (Chức năng mới)
// =======================================================================
app.get('/api/attendance/by-date', async (req, res) => {
    // Lấy ngày bắt đầu và kết thúc từ query parameters của URL
    const { start, end } = req.query;

    // --- 1. Kiểm tra đầu vào ---
    if (!start || !end) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đủ ngày bắt đầu (start) và ngày kết thúc (end) theo định dạng YYYY-MM-DD.' });
    }

    console.log(`✅ Nhận được yêu cầu lấy dữ liệu từ ngày ${start} đến ${end}`);

    // --- 2. Tạo đối tượng Date để so sánh (CHUYÊN GIA FIX: Đúng logic VN timezone) ---
    // User input "2025-03-03" means they want all records for 2025-03-03 in VN timezone
    // VN day 2025-03-03 = from 2025-03-02T17:00:00.000Z to 2025-03-03T16:59:59.999Z (UTC)
    
    const startVN = new Date(start + 'T00:00:00.000+07:00'); // Start of VN day
    const endVN = new Date(end + 'T23:59:59.999+07:00');     // End of VN day
    
    // Convert VN times to UTC for comparison with machine data (machine data is UTC)
    const startUTC = new Date(startVN.getTime());  // VN time already converted to UTC by JS
    const endUTC = new Date(endVN.getTime());      // VN time already converted to UTC by JS
    
    console.log(`📅 Filter VN day: ${start} 00:00 to ${end} 23:59 (VN timezone)`);
    console.log(`📅 Filter UTC range: ${startUTC.toISOString()} to ${endUTC.toISOString()}`);

    const zk = new ZKTeco(deviceIP, devicePort, timeout);
    try {
        // --- 3. Kết nối và lấy TẤT CẢ dữ liệu ---
        console.log('🔌 Đang kết nối thiết bị...');
        await zk.createSocket();
        console.log('✅ Kết nối thành công!');
        
        console.log('📥 Đang lấy toàn bộ dữ liệu để lọc...');
        const logs = await zk.getAttendances();
        console.log(`📊 Đã lấy về ${logs.data.length} bản ghi.`);

        // --- 4. Lọc dữ liệu trên server với UTC comparison (FIXED) ---
        console.log(`🔍 DEBUG: Filtering ${logs.data.length} records...`);
        
        const filteredLogs = logs.data.filter(log => {
            const recordDate = new Date(log.recordTime); // This is in UTC from machine
            const match = recordDate >= startUTC && recordDate <= endUTC;
            
            // Debug first few records
            if (logs.data.indexOf(log) < 5) {
                const vnTime = new Date(recordDate.getTime() + 7*60*60*1000);
                console.log(`   Record ${logs.data.indexOf(log)}: ${recordDate.toISOString()} (VN: ${vnTime.toISOString()}) → ${match ? 'MATCH' : 'SKIP'}`);
            }
            
            return match;
        });

        console.log(`✅ Lọc thành công! Tìm thấy ${filteredLogs.length} bản ghi phù hợp.`);
        
        // Debug: Show time distribution of filtered results
        if (filteredLogs.length > 0) {
            const hourStats = {};
            filteredLogs.forEach(record => {
                const vnTime = new Date(new Date(record.recordTime).getTime() + 7*60*60*1000);
                const hour = vnTime.getHours();
                hourStats[hour] = (hourStats[hour] || 0) + 1;
            });
            
            console.log('⏰ Filtered records per hour (VN time):');
            Object.keys(hourStats).sort((a,b) => a-b).forEach(hour => {
                console.log(`   ${hour.padStart(2, '0')}:xx - ${hourStats[hour]} records`);
            });
        }

        // --- 5. Trả về kết quả đã lọc ---
        res.status(200).json({
            success: true,
            message: `Tìm thấy ${filteredLogs.length} bản ghi chấm công từ ngày ${start} đến ${end}.`,
            data: filteredLogs
        });

    } catch (error) {
        console.error('❌ Chi tiết lỗi:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        
        // Handle specific ZK errors
        let errorMessage = 'Lỗi xử lý dữ liệu chấm công';
        if (error.name === 'ZKError' || error.constructor.name === 'ZKError') {
            errorMessage = `Lỗi thiết bị ZKTeco: ${error.message}`;
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Không thể kết nối tới thiết bị ZKTeco. Kiểm tra IP và port.';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Timeout khi kết nối thiết bị ZKTeco.';
        }
        
        res.status(500).json({ 
            success: false, 
            message: errorMessage,
            error: error.message,
            details: {
                name: error.name,
                code: error.code,
                deviceIP: deviceIP,
                devicePort: devicePort
            }
        });
    } finally {
        // Ensure disconnect even if error occurs
        try {
            if (zk && typeof zk.disconnect === 'function') {
                await zk.disconnect();
                console.log('🔌 Đã ngắt kết nối thiết bị.');
            }
        } catch (disconnectError) {
            console.error('⚠️ Lỗi khi ngắt kết nối:', disconnectError.message);
        }
    }
});

// =======================================================================
// API 3: LẤY TOÀN BỘ THÔNG TIN NHÂN VIÊN (Chức năng mới)
// =======================================================================
/**
 * API Endpoint: GET /api/users
 * Mục đích: Kết nối và lấy toàn bộ danh sách người dùng (nhân viên) trên máy chấm công.
 */
app.get('/api/users', async (req, res) => {
    console.log('✅ Nhận được yêu cầu lấy danh sách nhân viên...');
    
    const zk = new ZKTeco(deviceIP, devicePort, timeout);

    try {
        // 1. Kết nối đến thiết bị
        await zk.createSocket();
        console.log('✅ Kết nối thành công!');

        // 2. Lấy danh sách người dùng
        // Thư viện này tự động hóa quy trình: ReadAllUserID -> lặp qua SSR_GetAllUserInfo
        console.log('Đang lấy danh sách nhân viên...');
        const users = await zk.getUsers();
        console.log(`✅ Lấy dữ liệu thành công! Tổng số nhân viên: ${users.data.length}`);

        // 3. Trả về dữ liệu
        // Lưu ý: Dữ liệu này không chứa thông tin "phòng ban" vì nó không tồn tại trên thiết bị.
        res.status(200).json({
            success: true,
            message: `Lấy thành công ${users.data.length} nhân viên.`,
            data: users.data
        });

    } catch (error) {
        console.error('❌ Đã xảy ra lỗi:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        
        let errorMessage = 'Đã xảy ra lỗi trong quá trình xử lý';
        if (error.name === 'ZKError' || error.constructor.name === 'ZKError') {
            errorMessage = `Lỗi thiết bị ZKTeco: ${error.message}`;
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Không thể kết nối tới thiết bị ZKTeco. Kiểm tra IP và port.';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Timeout khi kết nối thiết bị ZKTeco.';
        }
        
        res.status(500).json({
            success: false,
            message: errorMessage,
            error: error.message,
            details: {
                name: error.name,
                code: error.code,
                deviceIP: deviceIP,
                devicePort: devicePort
            }
        });
    } finally {
        // 4. Ngắt kết nối
        try {
            if (zk && typeof zk.disconnect === 'function') {
                await zk.disconnect();
                console.log('✅ Đã ngắt kết nối.');
            }
        } catch (disconnectError) {
            console.error('⚠️ Lỗi khi ngắt kết nối:', disconnectError.message);
        }
    }
});

// =======================================================================
// API 4: KIỂM TRA THÔNG TIN THIẾT BỊ VÀ THỜI GIAN (Debug)
// =======================================================================
app.get('/api/device/info', async (req, res) => {
    console.log('🔍 Nhận được yêu cầu kiểm tra thông tin thiết bị...');
    
    const zk = new ZKTeco(deviceIP, devicePort, timeout);

    try {
        await zk.createSocket();
        console.log('✅ Kết nối thiết bị thành công!');

        // Lấy thông tin cơ bản
        const info = {
            deviceIP: deviceIP,
            devicePort: devicePort,
            connectionTime: new Date().toISOString(),
            serverTime: new Date().toISOString(),
            serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        // Thử lấy thêm thông tin từ device nếu có
        try {
            // Một số device có thể có method getInfo()
            const deviceInfo = await zk.getInfo();
            info.deviceInfo = deviceInfo;
        } catch (e) {
            console.log('ℹ️ Device không hỗ trợ getInfo()');
        }

        // Lấy số lượng users và attendance records
        try {
            const users = await zk.getUsers();
            info.totalUsers = users.data.length;
        } catch (e) {
            console.log('ℹ️ Không thể lấy số lượng users');
        }

        try {
            const attendance = await zk.getAttendances();
            info.totalAttendanceRecords = attendance.data.length;
            
            if (attendance.data.length > 0) {
                const times = attendance.data.map(r => new Date(r.recordTime).getTime());
                info.oldestRecord = new Date(Math.min(...times)).toISOString();
                info.newestRecord = new Date(Math.max(...times)).toISOString();
            }
        } catch (e) {
            console.log('ℹ️ Không thể lấy attendance info');
        }

        res.status(200).json({
            success: true,
            message: 'Lấy thông tin thiết bị thành công',
            data: info
        });

    } catch (error) {
        console.error('❌ Lỗi kết nối thiết bị:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        
        let errorMessage = 'Lỗi kết nối thiết bị';
        if (error.name === 'ZKError' || error.constructor.name === 'ZKError') {
            errorMessage = `Lỗi thiết bị ZKTeco: ${error.message}`;
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Không thể kết nối tới thiết bị ZKTeco. Kiểm tra IP và port.';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Timeout khi kết nối thiết bị ZKTeco.';
        }
        
        res.status(500).json({
            success: false,
            message: errorMessage,
            error: error.message,
            details: {
                name: error.name,
                code: error.code,
                deviceIP: deviceIP,
                devicePort: devicePort
            }
        });
    } finally {
        try {
            if (zk && typeof zk.disconnect === 'function') {
                await zk.disconnect();
                console.log('✅ Đã ngắt kết nối thiết bị.');
            }
        } catch (disconnectError) {
            console.error('⚠️ Lỗi khi ngắt kết nối:', disconnectError.message);
        }
    }
});

// Khởi chạy server
app.listen(port, () => {
    console.log(`Backend server đang chạy tại http://localhost:${port}`);
    console.log(`🚀 API Endpoints:`);
    console.log(`   • http://localhost:${port}/api/attendance - Lấy tất cả dữ liệu chấm công`);
    console.log(`   • http://localhost:${port}/api/attendance/by-date?start=YYYY-MM-DD&end=YYYY-MM-DD - Lấy dữ liệu theo ngày`);
    console.log(`   • http://localhost:${port}/api/users - Lấy danh sách nhân viên`);
    console.log(`   • http://localhost:${port}/api/device/info - Kiểm tra thông tin thiết bị (DEBUG)`);
    console.log(`   • http://localhost:${port}/api/health - Health check`);
    console.log('');
    console.log('🔍 DEBUG Mode: Enhanced logging enabled for troubleshooting');
});