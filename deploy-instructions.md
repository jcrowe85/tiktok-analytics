# VPS Deployment Instructions

## ⚠️ IMPORTANT: Deploy Script Safety

The `deploy-to-vps.sh` script should **ONLY** be run on the VPS server, never locally!

## Deployment Steps

### 1. Ensure All Changes Are Pushed
```bash
# Check status
git status

# If you have changes, commit and push them
git add .
git commit -m "Your commit message"
git push origin main
```

### 2. SSH into Your VPS
```bash
ssh user@your-vps-ip
```

### 3. Navigate to Project Directory
```bash
cd /path/to/tiktok-analytics
```

### 4. Run the Deploy Script
```bash
./deploy-to-vps.sh
```

## What the Deploy Script Does

1. **Backs up** production files (.env, docker-compose.yml, etc.)
2. **Stashes** any local VPS changes
3. **Pulls** latest code from GitHub
4. **Restores** production configurations
5. **Creates** database backup
6. **Stops** current Docker services
7. **Rebuilds** and restarts services
8. **Runs** database migrations
9. **Imports** AI analysis data (if available)
10. **Verifies** services are running

## AI Data Transfer (If Needed)

If the AI analysis data file isn't on the VPS:

```bash
# From your local machine
scp ai_analysis_data.sql user@vps:/path/to/tiktok-analytics/

# Then on VPS, import manually
docker exec -i $(docker ps -q --filter "name=postgres") psql -U tiktok_user -d tiktok_analytics < ai_analysis_data.sql
```

## Troubleshooting

### If Deploy Script Won't Run Locally
This is intentional! The script has safety checks to prevent local execution.

### If Services Don't Start
```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs tiktok-analytics
```

### If Database Import Fails
```bash
# Check PostgreSQL container
docker ps --filter "name=postgres"

# Test database connection
docker exec -it $(docker ps -q --filter "name=postgres") psql -U tiktok_user -d tiktok_analytics
```

## Current Status

✅ All local changes have been committed and pushed to GitHub
✅ Deploy script updated with safety checks and improved error handling
✅ Ready for VPS deployment

The app is ready to deploy! SSH into your VPS and run the deploy script.
