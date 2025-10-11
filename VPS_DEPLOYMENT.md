# 🚀 VPS Deployment Guide

## Overview
This guide walks you through deploying your updated TikTok Analytics app to your VPS while preserving the expensive AI analysis data.

## 📋 Prerequisites
- VPS with Docker and Docker Compose installed
- GitHub repository access on VPS
- Existing TikTok Analytics container setup

## 🎯 Deployment Strategy

### **Option 1: Automated Deployment (Recommended)**

1. **Transfer AI Data to VPS:**
   ```bash
   # From your local machine
   scp ai_analysis_data.sql user@your-vps-ip:/path/to/tiktok-analytics/
   ```

2. **SSH to your VPS and run deployment script:**
   ```bash
   ssh user@your-vps-ip
   cd /path/to/tiktok-analytics
   ./deploy-to-vps.sh
   ```

### **Option 2: Manual Step-by-Step**

1. **SSH to VPS:**
   ```bash
   ssh user@your-vps-ip
   cd /path/to/tiktok-analytics
   ```

2. **Pull latest code:**
   ```bash
   git pull origin main
   ```

3. **Transfer AI data (from local machine):**
   ```bash
   scp ai_analysis_data.sql user@your-vps-ip:/path/to/tiktok-analytics/
   ```

4. **Stop services:**
   ```bash
   docker-compose down
   ```

5. **Rebuild and start:**
   ```bash
   docker-compose up -d --build
   ```

6. **Import AI data:**
   ```bash
   # Wait for database to be ready (10-15 seconds)
   docker exec -i $(docker ps -q --filter "name=postgres") psql -U tiktok_user -d tiktok_analytics < ai_analysis_data.sql
   ```

## 🔍 Verification Steps

1. **Check containers are running:**
   ```bash
   docker ps
   ```

2. **Check logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Verify AI data imported:**
   ```bash
   docker exec -it $(docker ps -q --filter "name=postgres") psql -U tiktok_user -d tiktok_analytics -c "SELECT COUNT(*) FROM video_ai_analysis;"
   ```

4. **Test the application:**
   - Visit your domain
   - Check that videos show AI scores
   - Verify the new integrated fetch workflow

## 🛡️ Backup & Safety

- The deployment script automatically creates a database backup
- Your original data is preserved
- If something goes wrong, you can restore from backup

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Check database container
docker logs $(docker ps -q --filter "name=postgres")

# Restart just the database
docker-compose restart postgres
```

### Import Errors
```bash
# Check if table exists
docker exec -it $(docker ps -q --filter "name=postgres") psql -U tiktok_user -d tiktok_analytics -c "\dt"

# Re-run import with verbose output
docker exec -i $(docker ps -q --filter "name=postgres") psql -U tiktok_user -d tiktok_analytics -v ON_ERROR_STOP=1 < ai_analysis_data.sql
```

### Container Build Issues
```bash
# Clean rebuild
docker-compose down
docker system prune -f
docker-compose up -d --build --force-recreate
```

## 📊 What's New in This Deployment

- **Integrated AI Analysis Workflow**: `npm run fetch` now automatically queues videos for AI analysis
- **Smart Duplicate Prevention**: Won't re-analyze already processed videos
- **Enhanced UI**: Better card layout, velocity metrics, improved alignment
- **Production Ready**: Seamless GitHub-based deployment workflow

## 🎉 Post-Deployment

1. **Test the new fetch workflow:**
   ```bash
   docker exec -it $(docker ps -q --filter "name=app") npm run fetch
   ```

2. **Monitor AI analysis queue:**
   - Check the dashboard for AI scores
   - Videos should show analysis results immediately

3. **Set up automated fetching** (if not already configured):
   ```bash
   # Add to crontab for daily fetches
   0 9 * * * cd /path/to/tiktok-analytics && docker exec $(docker ps -q --filter "name=app") npm run fetch
   ```

---

**🎯 Result**: Your VPS now has the latest code with all AI analysis data preserved, and new videos will be automatically analyzed during fetch operations!
