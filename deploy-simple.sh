#!/bin/bash

# Simple Deployment Script
# Backend serves everything - no file sync issues

set -e

echo "🚀 Starting deployment..."

# 1. Build frontend locally
echo "📦 Building frontend..."
npm run build

# 2. Copy entire dist folder to VPS
echo "📤 Copying dist folder to VPS..."
rsync -avz --delete dist/ jcrowe85@164.92.66.82:/tmp/dist/

# 3. Copy to backend container
echo "🐳 Deploying to backend container..."
ssh jcrowe85@164.92.66.82 << 'EOF'
    # Remove old dist folder
    docker exec tiktok-analytics rm -rf /app/dist
    
    # Copy new dist folder
    docker cp /tmp/dist tiktok-analytics:/app/
    
    # Verify files
    echo "✅ Verifying deployment..."
    docker exec tiktok-analytics ls -la /app/dist/
    
    # Restart backend to pick up changes
    cd /home/jcrowe85/tiktok-analytics
    docker-compose restart tiktok-analytics
    
    echo "✅ Backend restarted!"
EOF

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "The backend now serves:"
echo "  - HTML from /app/dist/index.html"
echo "  - JS/CSS from /app/dist/assets/"
echo "  - API from /api/*"
echo ""
echo "No more file sync issues! 🎯"

