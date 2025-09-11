# HomeLee Core - Cloud Deployment Guide

## Deployment Platform Setup

### Vercel Deployment (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from core directory**:
   ```bash
   cd core
   vercel
   ```

4. **Set Environment Variables** in Vercel Dashboard:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `NODE_ENV`: `production`

### Railway Deployment (Alternative)

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Deploy**:
   ```bash
   cd core
   railway deploy
   ```

## Environment Variables

### Required for Cloud Deployment:
- `MONGODB_URI`: MongoDB Atlas connection string
- `NODE_ENV`: Set to `production`

### Not Required in Cloud:
- `ZKTECO_BACKEND_URL`: Only needed for local development
- Local ZKTeco device configurations

## Features in Cloud Environment

✅ **Available Features:**
- Employee management
- Attendance record viewing/editing
- Manual attendance entry
- Department management
- Database operations (MongoDB Atlas)
- Check-in settings management

❌ **Unavailable Features (Local Only):**
- Automatic device sync from ZKTeco machines
- Auto-sync scheduling
- Device connection status
- Real-time device data import

## Hybrid Architecture

- **Cloud (Vercel/Railway)**: Web interface + API + MongoDB Atlas
- **Local (Company Machine)**: ZKTeco backend service for device sync
- **Database**: MongoDB Atlas (shared between cloud and local)

## Deployment Checklist

- [ ] MongoDB Atlas cluster configured and accessible
- [ ] Environment variables set in deployment platform
- [ ] `vercel.json` configuration file present
- [ ] No hardcoded localhost URLs in production code
- [ ] ZKTeco device sync gracefully disabled in cloud
- [ ] All UI components work without device features

## Testing Cloud Deployment

1. Verify database connectivity
2. Test all CRUD operations
3. Confirm device sync features show appropriate messages
4. Check all navigation and UI components
5. Validate environment detection works correctly
