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

# Step 1: Pull latest code from GitHub
print_status "Step 1: Pulling latest code from GitHub"
git pull origin main
print_success "Code updated from GitHub"

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
