# 🚀 Manual VPS Deployment (Current Issue Fix)

## 🚨 **Current Issue:**
Your VPS has local changes that conflict with the GitHub pull. Here's how to fix it:

## **Option 1: Quick Fix (Recommended)**

```bash
# SSH to your VPS
ssh user@your-vps-ip
cd /path/to/tiktok-analytics

# 1. Backup critical files
cp docker-compose.yml docker-compose.yml.backup
cp .env .env.backup

# 2. Move the AI data file (if it exists)
if [ -f "ai_analysis_data.sql" ]; then
    mv ai_analysis_data.sql ai_analysis_data.sql.temp
fi

# 3. Stash local changes
git add -A
git stash push -m "VPS deployment backup $(date)"

# 4. Pull latest code
git pull origin main

# 5. Restore critical files
cp .env.backup .env
# Only restore docker-compose.yml if needed:
# cp docker-compose.yml.backup docker-compose.yml

# 6. Restore AI data
if [ -f "ai_analysis_data.sql.temp" ]; then
    mv ai_analysis_data.sql.temp ai_analysis_data.sql
fi

# 7. Continue with deployment
docker-compose down
docker-compose up -d --build
sleep 10
docker exec -i $(docker ps -q --filter "name=postgres") psql -U tiktok_user -d tiktok_analytics < ai_analysis_data.sql
```

## **Option 2: Use Updated Deployment Script**

Transfer the updated deployment script and run it:

```bash
# From local machine
scp deploy-to-vps.sh ai_analysis_data.sql user@your-vps-ip:/path/to/tiktok-analytics/

# SSH to VPS
ssh user@your-vps-ip
cd /path/to/tiktok-analytics
chmod +x deploy-to-vps.sh
./deploy-to-vps.sh
```

## **Option 3: Reset and Clean Pull**

⚠️ **WARNING: This will lose any VPS-specific changes**

```bash
# SSH to your VPS
ssh user@your-vps-ip
cd /path/to/tiktok-analytics

# Backup critical files first
cp .env .env.backup
cp docker-compose.yml docker-compose.yml.backup

# Hard reset to match GitHub
git fetch origin
git reset --hard origin/main

# Restore critical files
cp .env.backup .env
# Check if docker-compose.yml needs VPS-specific changes
```

## **🔍 What Files Typically Need VPS-Specific Changes:**

1. **`.env`** - Production environment variables
2. **`docker-compose.yml`** - Production ports, volumes, networks
3. **`nginx.conf`** - SSL certificates, domain names

## **📋 After Deployment:**

1. **Verify services:**
   ```bash
   docker ps
   docker-compose logs -f
   ```

2. **Test the application:**
   - Visit your domain
   - Check AI scores are visible
   - Verify new integrated workflow

3. **Check AI data imported:**
   ```bash
   docker exec -it $(docker ps -q --filter "name=postgres") psql -U tiktok_user -d tiktok_analytics -c "SELECT COUNT(*) FROM video_ai_analysis;"
   ```

## **🎯 Recommended Approach:**

Use **Option 1** for immediate deployment, then push the updated deployment script to GitHub for future deployments.
