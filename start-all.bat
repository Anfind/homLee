@echo off
echo ===============================================
echo     LEE HOMES ATTENDANCE SYSTEM STARTER
echo ===============================================
echo.

echo 🔧 Installing dependencies and building projects...
echo.

REM Build and start core (Next.js frontend)
echo ========================================
echo    BUILDING CORE (Next.js Frontend)
echo ========================================
cd /d "D:\HomeLeeApp\homLee\core"
echo 📦 Installing core dependencies...
@REM call npm install

echo 🏗️ Building core project...
call npm run build

echo ✅ Core build completed!
echo.

REM Install zktceo-backend dependencies
echo ========================================
echo   BUILDING ZKTCEO BACKEND (Node.js)
echo ========================================
cd /d "D:\HomeLeeApp\homLee\zktceo-backend"
echo 📦 Installing backend dependencies...
@REM call npm install

echo ✅ Backend dependencies installed!
echo.

echo 🚀 Starting services...
echo ========================================
echo    STARTING ALL SERVICES
echo ========================================
echo.

REM Start both services in new command windows
echo 🔄 Starting ZKTeco Backend...
start "ZKTeco Backend (Port 3000)" cmd /k "cd /d \"D:\HomeLeeApp\homLee\zktceo-backend\" && node server.js"

echo 🔄 Starting Core Frontend...
start "Core Frontend (Port 3001)" cmd /k "cd /d \"D:\HomeLeeApp\homLee\core\" && npm start"

echo.
echo ✅ Services started in 2 separate terminal windows!
echo.
echo 📋 Service URLs:
echo   - ZKTeco Backend: http://localhost:3000
echo   - Core Frontend:  http://localhost:3001
echo.

echo ⏳ Waiting for services to start...
timeout /t 8 >nul

echo 🌐 Opening Lee Homes Attendance System in browser...
start http://localhost:3001

echo.
echo 🎉 Done! Check the 2 terminal windows for service status.
echo.
echo Press any key to exit this window
pause >nul