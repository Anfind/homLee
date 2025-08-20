@echo off
echo ===============================================
echo    LEE HOMES ATTENDANCE SYSTEM DEV STARTER
echo ===============================================
echo.

echo 🚀 Starting development servers (no build)...
echo.

REM Check if dependencies are installed
if not exist "core\node_modules" (
    echo ❌ Core dependencies not found. Run 'build-all.bat' first.
    pause
    exit /b 1
)

if not exist "zktceo-backend\node_modules" (
    echo ❌ Backend dependencies not found. Run 'build-all.bat' first.
    pause
    exit /b 1
)

echo ✅ Dependencies found!
echo.

echo 📋 Starting services:
echo   - ZKTeco Backend: http://localhost:3000 (Production)
echo   - Core Frontend:  http://localhost:3001 (Development)
echo.

REM Start backend in production mode
echo 🔄 Starting ZKTeco Backend (Production)...
start "ZKTeco Backend (Port 3000)" cmd /k "cd /d \"%~dp0zktceo-backend\" && node server.js"

timeout /t 3 >nul

REM Start frontend in development mode
echo 🔄 Starting Core Frontend (Development)...
start "Core Frontend DEV (Port 3001)" cmd /k "cd /d \"%~dp0core\" && npm run dev"

echo.
echo ✅ Development servers are starting!
echo.
echo 🎯 Open http://localhost:3001 in your browser
echo.
echo 💡 Frontend runs in development mode (hot reload enabled)
echo 💡 Backend runs in production mode
echo.
echo Press any key to exit this window (services will keep running)
pause >nul
