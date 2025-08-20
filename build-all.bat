@echo off
echo ===============================================
echo      LEE HOMES ATTENDANCE SYSTEM BUILDER
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

echo 🔧 Building all projects...
echo.

REM Build core (Next.js frontend)
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
echo   INSTALLING ZKTCEO BACKEND DEPS
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

echo 🎉 BUILD COMPLETED SUCCESSFULLY!
echo.
echo 📋 Ready to run:
echo   - Use 'start-all.bat' to start both services
echo   - Or manually run:
echo     * Backend: cd zktceo-backend && node server.js
echo     * Frontend: cd core && npm start
echo.
pause
