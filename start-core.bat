@echo off
echo ===============================================
echo         START CORE FRONTEND
echo ===============================================
echo.

cd /d "D:\HomeLeeApp\homLee\core"
echo 🚀 Starting Core Frontend on http://localhost:3001
echo.

echo ⏳ Starting server and opening browser...
start "Core Frontend" cmd /c "npm start"

timeout /t 8 >nul

echo 🌐 Opening Lee Homes Attendance System...
start http://localhost:3001

echo.
echo ✅ Frontend started and browser opened!
echo 💡 Frontend is running in the background
echo.
pause
