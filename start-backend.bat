@echo off
echo ===============================================
echo        START ZKTCEO BACKEND
echo ===============================================
echo.

cd /d "D:\HomeLeeApp\homLee\zktceo-backend"
echo 📦 Installing dependencies...
call npm install

echo 🚀 Starting ZKTeco Backend on http://localhost:3000
echo.
node server.js
