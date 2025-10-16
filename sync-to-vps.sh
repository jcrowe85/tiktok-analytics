#!/bin/bash

# TikTok Analytics - Sync Local Changes to VPS
# This script pushes your local development changes to the VPS

set -e

VPS_HOST="jcrowe85@164.92.66.82"
VPS_PATH="/home/jcrowe85/tiktok-analytics"
LOCAL_PATH="."

echo "🚀 Syncing local changes to VPS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}📁${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in the tiktok-analytics project directory. Please run this from the project root."
    exit 1
fi

# Confirm before proceeding
echo ""
print_warning "This will push your local changes to the VPS and restart the application."
echo "Are you sure you want to continue? (y/N)"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    print_status "Sync cancelled."
    exit 0
fi

# Build the application locally first
print_status "Building application locally..."
npm run build
print_success "Local build completed"

# Create backup on VPS
print_status "Creating backup on VPS..."
ssh "$VPS_HOST" "cd $VPS_PATH && mkdir -p backups && cp -r src backups/src-backup-\$(date +%Y%m%d-%H%M%S) 2>/dev/null || true"
print_success "VPS backup created"

# Sync source code files
print_status "Syncing source code to VPS..."
rsync -avz --delete \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='data' \
    --exclude='temp' \
    --exclude='*.log' \
    --exclude='.env' \
    "./src/" "$VPS_HOST:$VPS_PATH/src/"

print_success "Source code synced to VPS"

# Sync configuration files
print_status "Syncing configuration files to VPS..."
rsync -avz \
    --exclude='.env' \
    "./package.json" "$VPS_HOST:$VPS_PATH/package.json"
rsync -avz \
    "./tsconfig.json" "$VPS_HOST:$VPS_PATH/tsconfig.json"
rsync -avz \
    "./vite.config.ts" "$VPS_HOST:$VPS_PATH/vite.config.ts"
rsync -avz \
    "./tailwind.config.js" "$VPS_HOST:$VPS_PATH/tailwind.config.js"
rsync -avz \
    "./postcss.config.js" "$VPS_HOST:$VPS_PATH/postcss.config.js"

print_success "Configuration files synced to VPS"

# Sync database schema and migrations
print_status "Syncing database files to VPS..."
rsync -avz \
    "./database/" "$VPS_HOST:$VPS_PATH/database/"

print_success "Database files synced to VPS"

# Sync public assets
print_status "Syncing public assets to VPS..."
rsync -avz \
    "./public/" "$VPS_HOST:$VPS_PATH/public/"

print_success "Public assets synced to VPS"

# Rebuild and restart the application on VPS
print_status "Rebuilding application on VPS..."
ssh "$VPS_HOST" "cd $VPS_PATH && docker-compose down tiktok-analytics && docker-compose up -d --build tiktok-analytics"

print_success "Application rebuilt and restarted on VPS"

# Wait for application to be healthy
print_status "Waiting for application to be healthy..."
sleep 10

# Check if application is running
if ssh "$VPS_HOST" "curl -s http://localhost:3000/api/health" | grep -q "ok"; then
    print_success "Application is healthy and running"
else
    print_warning "Application may not be fully ready yet. Check logs if needed."
fi

# Show summary
echo ""
echo "🎉 Sync to VPS completed successfully!"
echo ""
echo "📋 Summary:"
echo "  • Local changes pushed to VPS"
echo "  • Application rebuilt on VPS"
echo "  • Application restarted"
echo "  • Health check completed"
echo ""
echo "🌐 Your application is available at:"
echo "  • HTTP: http://164.92.66.82:8080"
echo "  • HTTPS: https://analytics.tryfleur.com:8443"
echo ""
echo "💡 To check logs: ssh $VPS_HOST 'docker logs tiktok-analytics -f'"
