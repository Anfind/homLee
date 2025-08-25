@echo off
echo ===============================================
echo           BUILD CORE (Next.js)
echo ===============================================
echo.

cd /d "D:\HomeLeeApp\homLee\core"
echo 📦 Installing dependencies...
call npm install --force

echo 🏗️ Building project...
call npm run build

echo.
echo ✅ Core build completed!
echo.
pause
