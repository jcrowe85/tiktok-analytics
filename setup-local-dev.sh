#!/bin/bash

# TikTok Analytics - Local Development Setup
# This script sets up your local development environment

set -e

echo "🚀 Setting up TikTok Analytics local development environment..."

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

# Check if .env exists
if [ ! -f ".env" ]; then
    print_warning "No .env file found. Creating from example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success ".env file created from example"
        print_warning "Please update .env with your local development settings"
    else
        print_error "No .env.example file found. Please create a .env file manually."
        exit 1
    fi
fi

# Install dependencies
print_status "Installing dependencies..."
npm install
print_success "Dependencies installed"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Start PostgreSQL and Redis containers
print_status "Starting PostgreSQL and Redis containers..."
docker-compose up -d postgres redis
print_success "Database containers started"

# Wait for containers to be healthy
print_status "Waiting for containers to be healthy..."
sleep 10

# Check if containers are running
if docker ps | grep -q "tiktok-analytics-postgres"; then
    print_success "PostgreSQL container is running"
else
    print_error "PostgreSQL container failed to start"
    exit 1
fi

if docker ps | grep -q "tiktok-analytics-redis"; then
    print_success "Redis container is running"
else
    print_error "Redis container failed to start"
    exit 1
fi

# Build the frontend
print_status "Building frontend..."
npm run build
print_success "Frontend built"

# Show summary
echo ""
echo "🎉 Local development environment setup completed!"
echo ""
echo "📋 What's running:"
echo "  • PostgreSQL: localhost:5432"
echo "  • Redis: localhost:6379"
echo "  • Frontend: Built and ready"
echo ""
echo "🚀 Next steps:"
echo "  1. Update your .env file with local database settings:"
echo "     DATABASE_URL=postgresql://tiktok_user:tiktok_secure_password@localhost:5432/tiktok_analytics"
echo "     REDIS_URL=redis://localhost:6379"
echo ""
echo "  2. Start the development server:"
echo "     npm run dev"
echo ""
echo "  3. Or start the backend server:"
echo "     npm run start:backend"
echo ""
echo "💡 Useful commands:"
echo "  • View logs: docker logs tiktok-analytics-postgres"
echo "  • Connect to DB: docker exec -it tiktok-analytics-postgres psql -U tiktok_user -d tiktok_analytics"
echo "  • Sync from VPS: ./sync-from-vps.sh"
echo "  • Sync to VPS: ./sync-to-vps.sh"
