# 🚀 Manual VPS Deployment (Current Issue Fix)

## 🚨 **Current Issue:**
Your VPS has local changes that conflict with the GitHub pull. Here's how to fix it:

## **Option 1: Quick Fix (Recommended)**

```bash
# SSH to your VPS
ssh user@your-vps-ip
cd /path/to/tiktok-analytics

# 1. Backup ALL production-specific files
cp .env .env.backup
cp docker-compose.yml docker-compose.yml.backup
cp nginx.conf nginx.conf.backup
cp nginx-simple.conf nginx-simple.conf.backup
cp cron-setup.sh cron-setup.sh.backup
cp deploy.sh deploy.sh.backup

# 2. Backup production directories
if [ -d "data" ]; then cp -r data data.backup; fi
if [ -d "logs" ]; then cp -r logs logs.backup; fi

# 3. Move the AI data file (if it exists)
if [ -f "ai_analysis_data.sql" ]; then
    mv ai_analysis_data.sql ai_analysis_data.sql.temp
fi

# 3. Stash local changes
git add -A
git stash push -m "VPS deployment backup $(date)"

# 4. Pull latest code
git pull origin main

# 5. Restore ALL production files
cp .env.backup .env
cp docker-compose.yml.backup docker-compose.yml
cp nginx.conf.backup nginx.conf
cp nginx-simple.conf.backup nginx-simple.conf
cp cron-setup.sh.backup cron-setup.sh

# 6. Restore production directories
if [ -d "data.backup" ]; then rm -rf data; mv data.backup data; fi
if [ -d "logs.backup" ]; then rm -rf logs; mv logs.backup logs; fi

# 7. Restore AI data
if [ -f "ai_analysis_data.sql.temp" ]; then
    mv ai_analysis_data.sql.temp ai_analysis_data.sql
fi

# 8. Handle deploy.sh conflict (save your original)
mv deploy.sh.backup deploy.sh.old
echo "Your original deploy.sh saved as deploy.sh.old"

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

## **🔍 Your VPS-Specific Files (Protected):**

1. **`.env`** - Production API keys, database URLs, secrets
2. **`docker-compose.yml`** - Production ports (80/443), SSL volumes, domain config
3. **`nginx.conf`** & **`nginx-simple.conf`** - SSL certificates, domain routing
4. **`cron-setup.sh`** - Server automation scripts
5. **`ai_analysis_data.sql`** - Your expensive AI analysis data (348KB)
6. **`data/`** - Application data and logs
7. **`logs/`** - Server logs
8. **`deploy.sh`** - Your existing deployment script (saved as `deploy.sh.old`)

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
