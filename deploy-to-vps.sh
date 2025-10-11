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

# Backup any local changes to critical files
if [ -f "docker-compose.yml" ]; then
    cp docker-compose.yml docker-compose.yml.backup
    print_status "Backed up docker-compose.yml"
fi

if [ -f ".env" ]; then
    cp .env .env.backup
    print_status "Backed up .env"
fi

# Move ai_analysis_data.sql if it exists (to avoid overwrite conflict)
if [ -f "ai_analysis_data.sql" ]; then
    mv ai_analysis_data.sql ai_analysis_data.sql.temp
    print_status "Temporarily moved ai_analysis_data.sql"
fi

# Stash any local changes
git add -A
git stash push -m "VPS deployment backup $(date)"
print_status "Stashed local changes"

# Pull latest code
print_status "Pulling latest code from GitHub"
git pull origin main
print_success "Code updated from GitHub"

# Restore critical files if they were backed up
if [ -f "docker-compose.yml.backup" ]; then
    print_status "Checking if docker-compose.yml needs restoration"
    if ! cmp -s "docker-compose.yml" "docker-compose.yml.backup"; then
        print_warning "docker-compose.yml differs from backup - you may need to merge changes manually"
        print_warning "Backup saved as docker-compose.yml.backup"
    else
        rm docker-compose.yml.backup
    fi
fi

if [ -f ".env.backup" ]; then
    print_status "Checking if .env needs restoration"
    if [ ! -f ".env" ] || ! cmp -s ".env" ".env.backup"; then
        cp .env.backup .env
        print_status "Restored .env from backup"
    fi
    rm .env.backup
fi

# Restore ai_analysis_data.sql
if [ -f "ai_analysis_data.sql.temp" ]; then
    mv ai_analysis_data.sql.temp ai_analysis_data.sql
    print_status "Restored ai_analysis_data.sql"
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
