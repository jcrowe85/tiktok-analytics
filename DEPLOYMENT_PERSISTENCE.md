# Deployment Persistence Guide

## Problem
Docker containers reset to their image state on restart, overwriting any manually copied files. This causes updates to be lost unless properly managed.

## Solution: Three-Tier Persistence Strategy

### 1. **Git Commits on VPS** (Primary Protection)
All critical files are committed to Git on the VPS. This is the source of truth.

```bash
# On VPS
cd ~/tiktok-analytics
git add src/backend/server.ts src/backend/queue/queue.ts ...
git commit -m "Update: description"
```

### 2. **Automated Deployment Script** (Recommended Method)
Use the `deploy-updates.sh` script for all deployments:

```bash
# On local machine
./deploy-updates.sh
```

This script automatically:
- Copies files to VPS
- Commits changes to Git
- Updates running containers
- Updates nginx container
- Restarts services
- Verifies deployment

### 3. **Docker Volume Mounts** (Backup Protection)
The `docker-compose.yml` uses volume mounts to preserve certain directories:

```yaml
volumes:
  - ./src:/app/src  # Source code persists
  - ./dist:/app/dist  # Build files persist
  - ./public:/app/public  # Static files persist
```

## Critical Files That Must Persist

### Backend (TypeScript)
- `src/backend/server.ts` - Worker import is here
- `src/backend/queue/queue.ts` - AI analysis worker
- `src/backend/routes/myVideos.ts` - My Videos API endpoints
- `src/backend/routes/tiktokAuth.ts` - TikTok OAuth flow
- `src/backend/routes/adhoc.ts` - Ad-hoc analysis

### Frontend (Built Assets)
- `dist/index.html` - Main HTML with correct asset refs
- `dist/assets/*.js` - JavaScript bundles
- `dist/assets/*.css` - CSS bundles

### Static Pages
- `public/privacy-policy.html`
- `public/terms-of-service.html`

## Manual Deployment Process (If Script Fails)

### Step 1: Copy Files to VPS
```bash
scp src/backend/server.ts jcrowe85@164.92.66.82:~/tiktok-analytics/src/backend/
scp src/backend/queue/queue.ts jcrowe85@164.92.66.82:~/tiktok-analytics/src/backend/queue/
scp dist/index.html jcrowe85@164.92.66.82:~/tiktok-analytics/dist/
# ... etc
```

### Step 2: Commit on VPS
```bash
ssh jcrowe85@164.92.66.82
cd ~/tiktok-analytics
git add <files>
git commit -m "Update: description"
```

### Step 3: Update Running Container
```bash
# Backend container
docker cp ~/tiktok-analytics/src/backend/server.ts tiktok-analytics:/app/src/backend/server.ts
docker cp ~/tiktok-analytics/src/backend/queue/queue.ts tiktok-analytics:/app/src/backend/queue/queue.ts

# Nginx container
docker cp ~/tiktok-analytics/dist/index.html tiktok-analytics-nginx:/usr/share/nginx/html/index.html
docker cp ~/tiktok-analytics/dist/assets/. tiktok-analytics-nginx:/usr/share/nginx/html/assets/
```

### Step 4: Restart
```bash
docker restart tiktok-analytics
```

## Verification After Deployment

### Check Worker Startup
```bash
docker logs tiktok-analytics --tail 50 | grep -E "Queue module loading|Starting AI analysis worker"
```

Expected output:
```
🔧 Queue module loading...
🔧 Starting AI analysis worker...
```

### Check File Integrity
```bash
cd ~/tiktok-analytics
./vps-pre-restart.sh
```

### Verify Frontend Assets
```bash
curl -I https://tiktokinsights.ai/assets/index-CN9fA9mC.js
# Should return 200 OK
```

## Rebuilding Docker Image (Advanced)

Only needed for major changes or dependency updates.

### Fix Package Issues First
```bash
cd ~/tiktok-analytics
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Then Rebuild
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Common Issues & Solutions

### Issue: Changes lost after restart
**Cause**: Files only copied to container, not committed to VPS source
**Solution**: Always commit to Git on VPS

### Issue: Worker not starting
**Cause**: `server.ts` missing worker import
**Solution**: Verify import exists: `grep "queue/queue" ~/tiktok-analytics/src/backend/server.ts`

### Issue: Old frontend assets served
**Cause**: Nginx container not updated or browser cache
**Solution**: 
1. Update nginx container
2. Clear browser cache
3. Check nginx logs

### Issue: Docker build fails
**Cause**: TypeScript compilation errors or missing dependencies
**Solution**: Build locally first, then deploy compiled assets

## Best Practices

1. **Always use the deployment script** for consistency
2. **Commit immediately** after copying files to VPS
3. **Verify after every deployment** using the checklist
4. **Keep local and VPS in sync** - pull VPS commits to local periodically
5. **Document changes** in commit messages for rollback capability

## Rollback Procedure

If deployment breaks something:

```bash
ssh jcrowe85@164.92.66.82
cd ~/tiktok-analytics

# Find the last working commit
git log --oneline -10

# Rollback to specific commit
git checkout <commit-hash> -- src/backend/server.ts
git checkout <commit-hash> -- src/backend/queue/queue.ts

# Update container
docker cp ~/tiktok-analytics/src/backend/server.ts tiktok-analytics:/app/src/backend/server.ts
docker cp ~/tiktok-analytics/src/backend/queue/queue.ts tiktok-analytics:/app/src/backend/queue/queue.ts
docker restart tiktok-analytics
```

## Emergency Recovery

If everything is broken:

```bash
# Stop containers
docker-compose down

# Reset to last known good commit
git reset --hard <commit-hash>

# Start fresh
docker-compose up -d

# Verify
docker logs tiktok-analytics --tail 50
```

## Monitoring & Health Checks

### Check Worker Health
```bash
docker exec tiktok-analytics-redis redis-cli LLEN bull:ai-analysis:waiting
docker exec tiktok-analytics-redis redis-cli LLEN bull:ai-analysis:active
docker exec tiktok-analytics-redis redis-cli ZCARD bull:ai-analysis:failed
```

### Check Container Health
```bash
docker ps
docker stats tiktok-analytics --no-stream
```

### Check Logs
```bash
# Real-time
docker logs -f tiktok-analytics

# Recent errors
docker logs tiktok-analytics --tail 100 | grep -i error
```

## Maintenance Schedule

- **Daily**: Check failed queue count
- **Weekly**: Review and clear completed jobs
- **Monthly**: Update dependencies and rebuild image
- **Quarterly**: Full backup and disaster recovery test

