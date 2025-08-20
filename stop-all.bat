@echo off
echo ===============================================
echo     LEE HOMES ATTENDANCE SYSTEM STOPPER
echo ===============================================
echo.

echo 🛑 Stopping all Lee Homes services...
echo.

REM Kill Node.js processes running on specific ports
echo 🔄 Stopping ZKTeco Backend (Port 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing process ID: %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo 🔄 Stopping Core Frontend (Port 3001)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo Killing process ID: %%a
    taskkill /f /pid %%a >nul 2>&1
)

REM Close specific command windows by title
echo 🔄 Closing service windows...
taskkill /f /fi "WindowTitle eq ZKTeco Backend (Port 3000)*" >nul 2>&1
taskkill /f /fi "WindowTitle eq Core Frontend (Port 3001)*" >nul 2>&1

echo.
echo ✅ All services stopped!
echo.
echo 📋 Ports released:
echo   - Port 3000 (ZKTeco Backend)
echo   - Port 3001 (Core Frontend)
echo.
pause
