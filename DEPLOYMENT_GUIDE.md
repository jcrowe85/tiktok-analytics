# Deployment Guide

## Architecture

**Simple, Reliable Setup:**
- Nginx acts as SSL terminator and reverse proxy
- Backend serves **everything**: HTML, JS, CSS, and API
- No file synchronization between containers needed

## Why This Works

### Previous Problems:
1. ❌ Nginx served static assets → had to sync files to nginx container
2. ❌ Backend served HTML → files got out of sync
3. ❌ Every deployment broke something

### Current Solution:
1. ✅ Nginx proxies **all** requests to backend
2. ✅ Backend serves static files from `/app/dist/`
3. ✅ Only **one** place to update files
4. ✅ No sync issues, no 404s, no nginx home page

## Deployment Process

### Option 1: Simple Script (Recommended)

```bash
./deploy-simple.sh
```

This script:
1. Builds frontend locally (`npm run build`)
2. Copies entire `dist/` folder to VPS
3. Updates backend container with new files
4. Restarts backend to serve new files

### Option 2: Manual Deployment

```bash
# 1. Build locally
npm run build

# 2. Copy to VPS
rsync -avz --delete dist/ jcrowe85@164.92.66.82:/tmp/dist/

# 3. Update backend container
ssh jcrowe85@164.92.66.82
cd /home/jcrowe85/tiktok-analytics
docker exec tiktok-analytics rm -rf /app/dist
docker cp /tmp/dist tiktok-analytics:/app/
docker-compose restart tiktok-analytics
```

## File Serving

All requests flow through nginx → backend:

```
https://tiktokinsights.ai/
  └─→ Nginx (SSL termination)
      └─→ Backend (serves everything)
          ├─→ /api/* (Express routes)
          ├─→ /assets/* (static files from /app/dist/assets/)
          └─→ /* (index.html from /app/dist/)
```

## Cache Control

The backend serves static files with proper cache headers:

```javascript
app.use(express.static(path.join(__dirname, '../dist'), {
  maxAge: '1d',
  etag: true
}));
```

## Troubleshooting

### Site shows nginx welcome page
**Cause**: Backend's `/app/dist/index.html` is missing or corrupted  
**Fix**: Run `./deploy-simple.sh` to restore files

### 404 on JS/CSS files
**Cause**: Vite created new bundle hashes, but files weren't updated  
**Fix**: Run `./deploy-simple.sh` to sync new bundles

### Updates not showing
**Cause**: Browser cache  
**Fix**: Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

## Key Files

- `nginx-simple.conf` - Nginx config (proxy all to backend)
- `deploy-simple.sh` - Automated deployment script
- `src/backend/server.ts` - Backend serves static files
- `dist/` - Built frontend assets (created by `npm run build`)

## Best Practices

1. ✅ Always deploy via script: `./deploy-simple.sh`
2. ✅ Test locally before deploying: `npm run dev`
3. ✅ Build locally (not on VPS) - VPS has old Node.js
4. ✅ Keep nginx config simple - just proxy to backend
5. ✅ Let backend handle all file serving

## What Changed

We simplified from a complex "nginx serves static assets" approach to a simple "backend serves everything" approach. This eliminates:
- File synchronization issues
- Nginx container file updates
- 404 errors from mismatched filenames
- Nginx home page appearing when files corrupt
- Need to update multiple containers

**Result**: Reliable, simple, single-source-of-truth deployment! 🎯

