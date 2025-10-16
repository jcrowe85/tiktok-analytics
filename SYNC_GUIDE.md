# TikTok Analytics - Development Sync Guide

This guide explains how to keep your local development environment in sync with your VPS deployment.

## 🏗️ Architecture Overview

- **VPS**: Full containerized application (frontend + backend + database + redis)
- **Local**: Frontend runs locally, PostgreSQL/Redis in containers, backend can run locally or in container

## 📁 File Structure

```
tiktok-analytics/
├── src/
│   ├── frontend/          # React frontend (runs locally)
│   └── backend/           # Node.js backend (VPS or local)
├── database/              # Database schema and migrations
├── public/                # Static assets
├── sync-from-vps.sh       # Pull latest files from VPS
├── sync-to-vps.sh         # Push local changes to VPS
├── setup-local-dev.sh     # Setup local development environment
└── SYNC_GUIDE.md          # This guide
```

## 🚀 Quick Start

### 1. Initial Setup
```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd tiktok-analytics

# Setup local development environment
./setup-local-dev.sh
```

### 2. Sync from VPS (Get Latest Changes)
```bash
# Pull the latest files from your VPS
./sync-from-vps.sh
```

### 3. Sync to VPS (Deploy Changes)
```bash
# Push your local changes to VPS
./sync-to-vps.sh
```

## 📋 Detailed Workflows

### 🔄 Daily Development Workflow

1. **Start your day** - Pull latest changes from VPS:
   ```bash
   ./sync-from-vps.sh
   ```

2. **Make your changes** locally

3. **Test locally**:
   ```bash
   npm run dev          # Frontend development server
   npm run start:backend # Backend server (if needed)
   ```

4. **Deploy to VPS** when ready:
   ```bash
   ./sync-to-vps.sh
   ```

### 🛠️ Local Development Setup

The `setup-local-dev.sh` script will:
- ✅ Install dependencies
- ✅ Start PostgreSQL and Redis containers
- ✅ Build the frontend
- ✅ Create .env file from example (if needed)

### 📥 Syncing FROM VPS

The `sync-from-vps.sh` script will:
- ✅ Create backup of current local files
- ✅ Pull latest source code from VPS
- ✅ Update configuration files
- ✅ Sync database schema and migrations
- ✅ Update public assets
- ✅ Install/update dependencies
- ✅ Build frontend for local development

### 📤 Syncing TO VPS

The `sync-to-vps.sh` script will:
- ✅ Build application locally
- ✅ Create backup on VPS
- ✅ Push local changes to VPS
- ✅ Rebuild and restart application on VPS
- ✅ Verify application health

## 🔧 Configuration

### Environment Variables

**Local Development (.env)**:
```env
# Database
DATABASE_URL=postgresql://tiktok_user:tiktok_secure_password@localhost:5432/tiktok_analytics
REDIS_URL=redis://localhost:6379

# API Keys (same as VPS)
OPENAI_API_KEY=your_openai_key
RAPIDAPI_KEY=your_rapidapi_key

# Development settings
NODE_ENV=development
PORT=3000
```

**VPS (.env)**:
```env
# Database (containerized)
DATABASE_URL=postgresql://tiktok_user:tiktok_secure_password@postgres:5432/tiktok_analytics
REDIS_URL=redis://redis:6379

# API Keys
OPENAI_API_KEY=your_openai_key
RAPIDAPI_KEY=your_rapidapi_key

# Production settings
NODE_ENV=production
PORT=3000
```

### Docker Compose (Local)

Your local `docker-compose.yml` should only include:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: tiktok-analytics-postgres
    environment:
      POSTGRES_DB: tiktok_analytics
      POSTGRES_USER: tiktok_user
      POSTGRES_PASSWORD: tiktok_secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql:ro

  redis:
    image: redis:7-alpine
    container_name: tiktok-analytics-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 🐛 Troubleshooting

### Common Issues

1. **Sync fails with permission errors**:
   ```bash
   # Make sure scripts are executable
   chmod +x *.sh
   ```

2. **Database connection issues**:
   ```bash
   # Check if containers are running
   docker ps
   
   # Restart containers
   docker-compose restart postgres redis
   ```

3. **Frontend build fails**:
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

4. **VPS deployment fails**:
   ```bash
   # Check VPS logs
   ssh jcrowe85@164.92.66.82 "docker logs tiktok-analytics"
   
   # Restart VPS application
   ssh jcrowe85@164.92.66.82 "cd /home/jcrowe85/tiktok-analytics && docker-compose restart tiktok-analytics"
   ```

### Useful Commands

```bash
# Check VPS status
ssh jcrowe85@164.92.66.82 "docker ps"

# View VPS logs
ssh jcrowe85@164.92.66.82 "docker logs tiktok-analytics -f"

# Connect to VPS database
ssh jcrowe85@164.92.66.82 "docker exec -it tiktok-analytics-postgres psql -U tiktok_user -d tiktok_analytics"

# Connect to local database
docker exec -it tiktok-analytics-postgres psql -U tiktok_user -d tiktok_analytics
```

## 📝 Best Practices

1. **Always sync from VPS** before starting work
2. **Test locally** before deploying to VPS
3. **Keep .env files** in sync (manually)
4. **Use git** for version control of your local changes
5. **Backup before major changes** (scripts do this automatically)

## 🔄 Automated Sync (Optional)

You can set up automated syncing using a cron job:

```bash
# Add to crontab to sync every hour
0 * * * * cd /path/to/tiktok-analytics && ./sync-from-vps.sh >> sync.log 2>&1
```

## 📞 Support

If you encounter issues:
1. Check the logs: `docker logs tiktok-analytics`
2. Verify containers are running: `docker ps`
3. Check network connectivity to VPS
4. Review the sync scripts for any custom modifications needed
