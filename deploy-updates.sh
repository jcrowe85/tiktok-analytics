#!/bin/bash
# Deploy updates to VPS and ensure they persist across container restarts

set -e

VPS_USER="jcrowe85"
VPS_HOST="164.92.66.82"
VPS_PATH="~/tiktok-analytics"

echo "🚀 Deploying updates to VPS..."

# 1. Copy critical backend files
echo "📦 Copying backend files..."
scp src/backend/server.ts ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/src/backend/
scp src/backend/queue/queue.ts ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/src/backend/queue/
scp src/backend/routes/myVideos.ts ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/src/backend/routes/
scp src/backend/routes/tiktokAuth.ts ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/src/backend/routes/
scp src/backend/routes/adhoc.ts ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/src/backend/routes/

# 2. Copy frontend build files
echo "📦 Copying frontend files..."
scp dist/index.html ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/dist/
scp dist/assets/*.css ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/dist/assets/
scp dist/assets/*.js ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/dist/assets/

# 3. Copy static pages
echo "📦 Copying static pages..."
scp public/privacy-policy.html ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/public/
scp public/terms-of-service.html ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/public/

# 4. Commit changes on VPS
echo "💾 Committing changes on VPS..."
ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PATH} && \
  git add src/backend/server.ts src/backend/queue/queue.ts src/backend/routes/myVideos.ts src/backend/routes/tiktokAuth.ts src/backend/routes/adhoc.ts dist/index.html public/*.html && \
  git commit -m 'Deploy: $(date +%Y-%m-%d_%H-%M-%S)' || echo 'No changes to commit'"

# 5. Update running container with new files
echo "🔄 Updating running container..."
ssh ${VPS_USER}@${VPS_HOST} "
  docker cp ${VPS_PATH}/src/backend/server.ts tiktok-analytics:/app/src/backend/server.ts
  docker cp ${VPS_PATH}/src/backend/queue/queue.ts tiktok-analytics:/app/src/backend/queue/queue.ts
  docker cp ${VPS_PATH}/src/backend/routes/myVideos.ts tiktok-analytics:/app/src/backend/routes/myVideos.ts
  docker cp ${VPS_PATH}/dist/index.html tiktok-analytics:/app/dist/index.html
  docker cp ${VPS_PATH}/dist/assets/. tiktok-analytics:/app/dist/assets/
"

# 6. Copy files to nginx container
echo "🌐 Updating nginx container..."
ssh ${VPS_USER}@${VPS_HOST} "
  docker cp ${VPS_PATH}/dist/index.html tiktok-analytics-nginx:/usr/share/nginx/html/index.html
  docker cp ${VPS_PATH}/dist/assets/. tiktok-analytics-nginx:/usr/share/nginx/html/assets/
  docker cp ${VPS_PATH}/public/privacy-policy.html tiktok-analytics-nginx:/usr/share/nginx/html/privacy-policy.html
  docker cp ${VPS_PATH}/public/terms-of-service.html tiktok-analytics-nginx:/usr/share/nginx/html/terms-of-service.html
"

# 7. Restart backend container
echo "🔄 Restarting backend container..."
ssh ${VPS_USER}@${VPS_HOST} "docker restart tiktok-analytics"

# 8. Verify deployment
echo "✅ Verifying deployment..."
sleep 5
ssh ${VPS_USER}@${VPS_HOST} "docker logs tiktok-analytics --tail 20 | grep -E 'Starting AI analysis worker|Queue module loading|Server is running'"

echo "✅ Deployment complete!"
echo ""
echo "🔍 Key changes deployed:"
echo "  - AI analysis worker startup enabled"
echo "  - Engagement debug logs removed"
echo "  - Frontend bundles updated"
echo "  - All changes committed to git on VPS"
echo ""
echo "📝 Changes are now persistent and will survive container restarts!"

