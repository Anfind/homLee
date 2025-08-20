@echo off
echo ===============================================
echo     LEE HOMES ATTENDANCE SYSTEM STARTER
echo ===============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected: 
node --version

REM Check if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not available
    pause
    exit /b 1
)

echo ✅ npm detected:
npm --version
echo.

echo 🔧 Installing dependencies and building projects...
echo.

REM Build and start core (Next.js frontend)
echo ========================================
echo    BUILDING CORE (Next.js Frontend)
echo ========================================
cd /d "%~dp0core"
echo 📦 Installing core dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install core dependencies
    pause
    exit /b 1
)

echo 🏗️ Building core project...
call npm run build
if errorlevel 1 (
    echo ❌ Failed to build core project
    pause
    exit /b 1
)

echo ✅ Core build completed!
echo.

REM Install zktceo-backend dependencies
echo ========================================
echo   BUILDING ZKTCEO BACKEND (Node.js)
echo ========================================
cd /d "%~dp0zktceo-backend"
echo 📦 Installing backend dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

echo ✅ Backend dependencies installed!
echo.

echo 🚀 Starting services...
echo ========================================
echo    STARTING ALL SERVICES
echo ========================================
echo.
echo 🔥 ZKTeco Backend will start on: http://localhost:3000
echo 🌐 Core Frontend will start on: http://localhost:3001
echo.
echo Press Ctrl+C in any window to stop services
echo.

REM Start both services in new command windows
echo 🔄 Starting ZKTeco Backend...
start "ZKTeco Backend (Port 3000)" cmd /k "cd /d \"%~dp0zktceo-backend\" && node server.js"

timeout /t 3 >nul

echo 🔄 Starting Core Frontend...
start "Core Frontend (Port 3001)" cmd /k "cd /d \"%~dp0core\" && npm start"

echo.
echo ✅ All services are starting!
echo.
echo 📋 Service URLs:
echo   - ZKTeco Backend: http://localhost:3000
echo   - Core Frontend:  http://localhost:3001
echo.
echo 🎯 Open http://localhost:3001 in your browser
echo.
echo Press any key to exit this window (services will keep running)
pause >nul
