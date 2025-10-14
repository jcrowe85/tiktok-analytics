#!/bin/bash
# VPS Pre-Restart Hook - Ensures critical files are in place before container restart
# This script should be copied to the VPS and run before any container restart

set -e

APP_PATH=~/tiktok-analytics

echo "🔒 Pre-Restart Hook: Ensuring critical files are in place..."

# Ensure backend files are in the source directory
echo "📂 Checking backend files..."
[ -f ${APP_PATH}/src/backend/server.ts ] && echo "✅ server.ts exists" || echo "❌ server.ts missing!"
[ -f ${APP_PATH}/src/backend/queue/queue.ts ] && echo "✅ queue.ts exists" || echo "❌ queue.ts missing!"
[ -f ${APP_PATH}/src/backend/routes/myVideos.ts ] && echo "✅ myVideos.ts exists" || echo "❌ myVideos.ts missing!"

# Ensure frontend files are in place
echo "📂 Checking frontend files..."
[ -f ${APP_PATH}/dist/index.html ] && echo "✅ index.html exists" || echo "❌ index.html missing!"
[ -d ${APP_PATH}/dist/assets ] && echo "✅ assets directory exists" || echo "❌ assets directory missing!"

# Ensure static pages exist
echo "📂 Checking static pages..."
[ -f ${APP_PATH}/public/privacy-policy.html ] && echo "✅ privacy-policy.html exists" || echo "❌ privacy-policy.html missing!"
[ -f ${APP_PATH}/public/terms-of-service.html ] && echo "✅ terms-of-service.html exists" || echo "❌ terms-of-service.html missing!"

# Check git status
echo "📝 Git status:"
cd ${APP_PATH}
git status --short

echo "✅ Pre-restart check complete!"

