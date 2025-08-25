# Lee Homes Attendance System - Quick Start Guide

## 🚀 Batch Files Usage

### 1. `build-all.bat` - Build Everything
- Installs all dependencies
- Builds the Next.js project
- Prepares for production

```bash
# Run this first time or after major updates
./build-all.bat
```

### 2. `start-all.bat` - Production Start
- Builds and starts both services
- Backend: Production mode
- Frontend: Production mode (optimized)
- Opens in separate command windows

```bash
# For production deployment
./start-all.bat
```

### 3. `dev-start.bat` - Development Start
- Starts without building
- Backend: Production mode
- Frontend: Development mode (hot reload)
- Faster startup for development

```bash
# For development (after build-all.bat)
./dev-start.bat
```

### 4. `stop-all.bat` - Stop Everything
- Kills all Node.js processes on ports 3000 & 3001
- Closes service windows
- Cleans up ports

```bash
# Stop all services
./stop-all.bat
```

## 📋 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| ZKTeco Backend | http://localhost:3000 | Node.js + Express API |
| Core Frontend | http://localhost:3001 | Next.js Web Application |

## 🔧 Manual Commands

If batch files don't work, use manual commands:

### Backend (ZKTeco):
```bash
cd zktceo-backend
npm install
node server.js
```

### Frontend (Core):
```bash
cd core
npm install
npm run build    # For production
npm start        # Production server
# OR
npm run dev      # Development server
```

## 🛠️ Troubleshooting

### Port Already in Use:
```bash
# Run stop-all.bat first
./stop-all.bat

# Then start again
./start-all.bat
```

### Dependencies Issues:
```bash
# Clean install
./stop-all.bat
rd /s /q core\node_modules
rd /s /q zktceo-backend\node_modules
./build-all.bat
```

### Permission Issues:
- Run Command Prompt as Administrator
- Or use PowerShell: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

## 🎯 Quick Development Workflow

1. **First time setup:**
   ```bash
   ./build-all.bat
   ```

2. **Daily development:**
   ```bash
   ./dev-start.bat
   ```

3. **Stop when done:**
   ```bash
   ./stop-all.bat
   ```

4. **Production deployment:**
   ```bash
   ./build-all.bat
   ./start-all.bat
   ```

## 📊 System Requirements

- Node.js 18+ (LTS recommended)
- npm 8+
- Windows 10/11
- MongoDB running locally or remote
- ZKTeco device configured (IP: 192.168.1.34:8818)

## 🔗 Access Points

After starting, access the system at:
- **Main Application:** http://localhost:3001
- **API Backend:** http://localhost:3000/api/info
- **Health Check:** http://localhost:3000/health
