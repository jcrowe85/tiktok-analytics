#!/bin/bash

# TikTok Analytics VPS Deployment Script
# Run this script on your VPS to deploy the latest changes

set -e  # Exit on any error

echo "🚀 Starting VPS Deployment..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}🚩 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Handle local changes and pull latest code
print_status "Step 1: Preparing for code update"

# Backup any local changes to critical production files
print_status "Backing up production-specific files..."

# Critical production files
for file in ".env" "docker-compose.yml" "nginx.conf" "nginx-simple.conf" "cron-setup.sh"; do
    if [ -f "$file" ]; then
        cp "$file" "${file}.backup"
        print_status "Backed up $file"
    fi
done

# Backup directories with production data
if [ -d "data" ]; then
    cp -r data data.backup
    print_status "Backed up data directory"
fi

if [ -d "logs" ]; then
    cp -r logs logs.backup  
    print_status "Backed up logs directory"
fi

# Move ai_analysis_data.sql if it exists (to avoid overwrite conflict)
if [ -f "ai_analysis_data.sql" ]; then
    mv ai_analysis_data.sql ai_analysis_data.sql.temp
    print_status "Temporarily moved ai_analysis_data.sql"
fi

# Handle existing deploy.sh vs new deploy-to-vps.sh
if [ -f "deploy.sh" ]; then
    cp deploy.sh deploy.sh.backup
    print_status "Backed up existing deploy.sh"
fi

# Stash any local changes
git add -A
git stash push -m "VPS deployment backup $(date)"
print_status "Stashed local changes"

# Pull latest code
print_status "Pulling latest code from GitHub"
git pull origin main
print_success "Code updated from GitHub"

# Restore production-specific files
print_status "Restoring production configurations..."

# Restore critical production files
for file in ".env" "docker-compose.yml" "nginx.conf" "nginx-simple.conf" "cron-setup.sh"; do
    if [ -f "${file}.backup" ]; then
        if [ ! -f "$file" ] || ! cmp -s "$file" "${file}.backup"; then
            cp "${file}.backup" "$file"
            print_status "Restored $file from backup"
        else
            print_status "$file unchanged, removing backup"
        fi
        rm "${file}.backup"
    fi
done

# Restore production directories
if [ -d "data.backup" ]; then
    if [ ! -d "data" ] || [ "$(find data -type f | wc -l)" -lt "$(find data.backup -type f | wc -l)" ]; then
        rm -rf data
        mv data.backup data
        print_status "Restored data directory from backup"
    else
        rm -rf data.backup
        print_status "Data directory preserved, removed backup"
    fi
fi

if [ -d "logs.backup" ]; then
    if [ ! -d "logs" ] || [ "$(find logs -type f | wc -l)" -lt "$(find logs.backup -type f | wc -l)" ]; then
        rm -rf logs
        mv logs.backup logs
        print_status "Restored logs directory from backup"
    else
        rm -rf logs.backup
        print_status "Logs directory preserved, removed backup"
    fi
fi

# Restore ai_analysis_data.sql
if [ -f "ai_analysis_data.sql.temp" ]; then
    mv ai_analysis_data.sql.temp ai_analysis_data.sql
    print_status "Restored ai_analysis_data.sql"
fi

# Handle deploy.sh conflict
if [ -f "deploy.sh.backup" ]; then
    print_status "Found existing deploy.sh - keeping backup as deploy.sh.old"
    mv deploy.sh.backup deploy.sh.old
    print_warning "Your original deploy.sh saved as deploy.sh.old"
    print_warning "Review differences and merge if needed"
fi

# Step 2: Backup current database (optional safety measure)
print_status "Step 2: Creating database backup"
docker exec $(docker ps -q --filter "name=postgres") pg_dump -U tiktok_user -d tiktok_analytics > backup_$(date +%Y%m%d_%H%M%S).sql
print_success "Database backup created"

# Step 3: Stop services
print_status "Step 3: Stopping Docker services"
docker-compose down
print_success "Services stopped"

# Step 4: Rebuild and start services
print_status "Step 4: Rebuilding and starting services"
docker-compose up -d --build
print_success "Services restarted"

# Step 5: Wait for database to be ready
print_status "Step 5: Waiting for database to be ready"
sleep 10

# Step 6: Import AI analysis data (if ai_analysis_data.sql exists)
if [ -f "ai_analysis_data.sql" ]; then
    print_status "Step 6: Importing AI analysis data"
    docker exec -i $(docker ps -q --filter "name=postgres") psql -U tiktok_user -d tiktok_analytics < ai_analysis_data.sql
    print_success "AI analysis data imported"
else
    print_warning "Step 6: No AI analysis data file found (ai_analysis_data.sql)"
    echo "You'll need to transfer this file from your local machine"
fi

# Step 7: Verify services are running
print_status "Step 7: Verifying services"
docker ps --filter "name=tiktok"
print_success "Deployment completed!"

echo ""
echo "🎯 Next Steps:"
echo "1. If ai_analysis_data.sql wasn't found, transfer it from local:"
echo "   scp ai_analysis_data.sql user@your-vps:/path/to/tiktok-analytics/"
echo "2. Then run: docker exec -i \$(docker ps -q --filter \"name=postgres\") psql -U tiktok_user -d tiktok_analytics < ai_analysis_data.sql"
echo "3. Check your app at: https://your-domain.com"
echo ""
