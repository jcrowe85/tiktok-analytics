#!/bin/bash

# TikTok Analytics VPS Deployment Script
# ⚠️  IMPORTANT: This script should ONLY be run on the VPS server!
# Do NOT run this script locally - it will overwrite local development setup

set -e  # Exit on any error

# Safety check to prevent local execution
if [ -f "package.json" ] && [ -d "node_modules" ] && [ ! -f "/etc/hostname" ]; then
    echo "❌ ERROR: This script appears to be running in a local development environment!"
    echo "This deploy script should ONLY be run on the VPS server."
    echo ""
    echo "To deploy from local machine:"
    echo "1. Ensure all changes are committed and pushed to GitHub"
    echo "2. SSH into your VPS: ssh user@your-vps-ip"
    echo "3. Navigate to project directory: cd /path/to/tiktok-analytics"
    echo "4. Run this script: ./deploy-to-vps.sh"
    echo ""
    exit 1
fi

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

# Find PostgreSQL container more robustly
POSTGRES_CONTAINER_ID=$(docker ps -q --filter "name=postgres" 2>/dev/null)
if [ -z "$POSTGRES_CONTAINER_ID" ]; then
    # Try alternative naming patterns
    POSTGRES_CONTAINER_ID=$(docker ps -q --filter "name=postgresql" 2>/dev/null)
fi
if [ -z "$POSTGRES_CONTAINER_ID" ]; then
    # Try finding by image
    POSTGRES_CONTAINER_ID=$(docker ps -q --filter "ancestor=postgres" 2>/dev/null | head -1)
fi

if [ -n "$POSTGRES_CONTAINER_ID" ]; then
    CONTAINER_NAME=$(docker ps --format "{{.Names}}" --filter "id=$POSTGRES_CONTAINER_ID")
    print_status "Found PostgreSQL container: $CONTAINER_NAME"
    if docker exec "$POSTGRES_CONTAINER_ID" pg_dump -U tiktok_user -d tiktok_analytics > backup_$(date +%Y%m%d_%H%M%S).sql 2>/dev/null; then
        print_success "Database backup created"
    else
        print_warning "Database backup failed - continuing anyway"
    fi
else
    print_warning "No PostgreSQL container found - skipping backup"
    print_status "Available containers:"
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
fi

# Step 3: Stop services
print_status "Step 3: Stopping Docker services"
docker-compose down
print_success "Services stopped"

# Step 4: Rebuild and start services
print_status "Step 4: Rebuilding and starting services"
docker-compose up -d --build
print_success "Services restarted"

# Step 4.5: Fix file permissions for container access
print_status "Step 4.5: Fixing file permissions for container access"
# Fix data directory permissions
if [ -d "data" ]; then
    sudo chown -R 1000:1000 data/
    sudo chmod -R 755 data/
    print_success "Fixed data directory permissions"
fi

# Fix .env file permissions
if [ -f ".env" ]; then
    sudo chown 1000:1000 .env
    sudo chmod 644 .env
    print_success "Fixed .env file permissions"
fi

# Step 5: Wait for database to be ready
print_status "Step 5: Waiting for database to be ready"
sleep 10

# Step 5.5: Run database migrations
print_status "Step 5.5: Running database migrations"

# Find PostgreSQL container
POSTGRES_CONTAINER_ID=$(docker ps -q --filter "name=postgres" 2>/dev/null)
if [ -z "$POSTGRES_CONTAINER_ID" ]; then
    POSTGRES_CONTAINER_ID=$(docker ps -q --filter "name=postgresql" 2>/dev/null)
fi
if [ -z "$POSTGRES_CONTAINER_ID" ]; then
    POSTGRES_CONTAINER_ID=$(docker ps -q --filter "ancestor=postgres" 2>/dev/null | head -1)
fi

if [ -n "$POSTGRES_CONTAINER_ID" ]; then
    # Run all migration files in order
    for migration in database/migrations/*.sql; do
        if [ -f "$migration" ]; then
            print_status "Running migration: $(basename $migration)"
            if docker exec -i "$POSTGRES_CONTAINER_ID" psql -U tiktok_user -d tiktok_analytics < "$migration" 2>/dev/null; then
                print_success "Migration completed: $(basename $migration)"
            else
                print_warning "Migration may have already been applied: $(basename $migration)"
            fi
        fi
    done
else
    print_warning "PostgreSQL container not found - skipping migrations"
fi

# Step 6: Import AI analysis data (if ai_analysis_data.sql exists)
if [ -f "ai_analysis_data.sql" ]; then
    print_status "Step 6: Importing AI analysis data"
    
    # Use the same container finding logic
    POSTGRES_CONTAINER_ID=$(docker ps -q --filter "name=postgres" 2>/dev/null)
    if [ -z "$POSTGRES_CONTAINER_ID" ]; then
        POSTGRES_CONTAINER_ID=$(docker ps -q --filter "name=postgresql" 2>/dev/null)
    fi
    if [ -z "$POSTGRES_CONTAINER_ID" ]; then
        POSTGRES_CONTAINER_ID=$(docker ps -q --filter "ancestor=postgres" 2>/dev/null | head -1)
    fi
    
    if [ -n "$POSTGRES_CONTAINER_ID" ]; then
        # Check if database is ready
        print_status "Waiting for database to be fully ready..."
        sleep 5
        
        # Test database connection first
        if docker exec "$POSTGRES_CONTAINER_ID" psql -U tiktok_user -d tiktok_analytics -c "SELECT 1;" > /dev/null 2>&1; then
            print_status "Database connection confirmed, checking existing data..."
            
            # Check if data already exists to prevent conflicts
            EXISTING_COUNT=$(docker exec "$POSTGRES_CONTAINER_ID" psql -U tiktok_user -d tiktok_analytics -t -c "SELECT COUNT(*) FROM video_ai_analysis;" 2>/dev/null | tr -d ' ')
            
            if [ "$EXISTING_COUNT" -gt 0 ]; then
                print_warning "Found $EXISTING_COUNT existing AI analysis records"
                print_warning "Skipping data import to prevent ID conflicts"
                print_status "To force import, manually delete existing data first"
            else
                print_status "No existing data found, importing AI analysis data..."
                if docker exec -i "$POSTGRES_CONTAINER_ID" psql -U tiktok_user -d tiktok_analytics < ai_analysis_data.sql; then
                    print_success "AI analysis data imported successfully"
                    
                    # Fix sequence after import to prevent future conflicts
                    print_status "Fixing sequence to prevent ID conflicts..."
                    docker exec "$POSTGRES_CONTAINER_ID" psql -U tiktok_user -d tiktok_analytics -c "SELECT setval('video_ai_analysis_id_seq', COALESCE(MAX(id), 1), true) FROM video_ai_analysis;" > /dev/null 2>&1
                    print_success "Sequence synchronized with imported data"
                else
                    print_warning "AI analysis data import failed - check logs above"
                fi
            fi
        else
            print_warning "Database not ready for import - try running import manually later"
        fi
    else
        print_warning "PostgreSQL container not found for data import"
    fi
else
    print_warning "Step 6: No AI analysis data file found (ai_analysis_data.sql)"
    echo "To import AI data later:"
    echo "1. Transfer file: scp ai_analysis_data.sql user@vps:/path/to/project/"
    echo "2. Import: docker exec -i \$(docker ps -q --filter \"name=postgres\") psql -U tiktok_user -d tiktok_analytics < ai_analysis_data.sql"
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
