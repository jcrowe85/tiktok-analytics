#!/bin/bash

# TikTok Analytics - Sync from VPS to Local Development
# This script pulls the latest application files from your VPS to your local dev environment

set -e

VPS_HOST="jcrowe85@164.92.66.82"
VPS_PATH="/home/jcrowe85/tiktok-analytics"
LOCAL_PATH="."

echo "🚀 Syncing TikTok Analytics files from VPS to local development..."

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

# Create backup of current local files
print_status "Creating backup of current local files..."
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup critical files
cp -r src/ "$BACKUP_DIR/" 2>/dev/null || true
cp package.json "$BACKUP_DIR/" 2>/dev/null || true
cp tsconfig.json "$BACKUP_DIR/" 2>/dev/null || true
cp vite.config.ts "$BACKUP_DIR/" 2>/dev/null || true
cp tailwind.config.js "$BACKUP_DIR/" 2>/dev/null || true
cp postcss.config.js "$BACKUP_DIR/" 2>/dev/null || true

print_success "Backup created in $BACKUP_DIR"

# Sync source code files
print_status "Syncing source code files..."
rsync -avz --delete \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='data' \
    --exclude='temp' \
    --exclude='*.log' \
    --exclude='.env' \
    "$VPS_HOST:$VPS_PATH/src/" "./src/"

print_success "Source code synced"

# Sync configuration files
print_status "Syncing configuration files..."
rsync -avz \
    --exclude='.env' \
    "$VPS_HOST:$VPS_PATH/package.json" "./package.json"
rsync -avz \
    "$VPS_HOST:$VPS_PATH/tsconfig.json" "./tsconfig.json"
rsync -avz \
    "$VPS_HOST:$VPS_PATH/vite.config.ts" "./vite.config.ts"
rsync -avz \
    "$VPS_HOST:$VPS_PATH/tailwind.config.js" "./tailwind.config.js"
rsync -avz \
    "$VPS_HOST:$VPS_PATH/postcss.config.js" "./postcss.config.js"

print_success "Configuration files synced"

# Sync database schema and migrations
print_status "Syncing database files..."
rsync -avz \
    "$VPS_HOST:$VPS_PATH/database/" "./database/"

print_success "Database files synced"

# Sync public assets
print_status "Syncing public assets..."
rsync -avz \
    "$VPS_HOST:$VPS_PATH/public/" "./public/"

print_success "Public assets synced"

# Check for .env differences
print_status "Checking environment configuration..."
if [ -f ".env" ]; then
    print_warning "Local .env file exists. Please manually compare with VPS .env if needed."
    print_warning "VPS .env location: $VPS_HOST:$VPS_PATH/.env"
else
    print_warning "No local .env file found. You may need to create one for local development."
fi

# Install dependencies if package.json changed
print_status "Checking if dependencies need updating..."
if [ "package.json" -nt "node_modules" ] || [ ! -d "node_modules" ]; then
    print_status "Installing/updating dependencies..."
    npm install
    print_success "Dependencies updated"
else
    print_success "Dependencies are up to date"
fi

# Build frontend for local development
print_status "Building frontend for local development..."
npm run build
print_success "Frontend built successfully"

# Show summary
echo ""
echo "🎉 Sync completed successfully!"
echo ""
echo "📋 Summary:"
echo "  • Source code synced from VPS"
echo "  • Configuration files updated"
echo "  • Database schema synced"
echo "  • Public assets synced"
echo "  • Dependencies installed/updated"
echo "  • Frontend built for local development"
echo ""
echo "📁 Backup of previous files: $BACKUP_DIR"
echo ""
echo "🚀 Next steps:"
echo "  1. Review any changes in the synced files"
echo "  2. Update your local .env if needed"
echo "  3. Start your local development server: npm run dev"
echo "  4. Ensure your local PostgreSQL/Redis containers are running"
echo ""
echo "💡 To sync again in the future, just run: ./sync-from-vps.sh"
