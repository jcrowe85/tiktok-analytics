#!/bin/bash

# Trigger AI analysis for TikTok videos

echo ""
echo "🚀 Triggering AI Analysis"
echo "========================="
echo ""

# Get video from data file
VIDEO=$(cat data/data.json | jq '.[0]')
VIDEO_ID=$(echo "$VIDEO" | jq -r '.id')
SHARE_URL=$(echo "$VIDEO" | jq -r '.share_url')
CAPTION=$(echo "$VIDEO" | jq -r '.caption' | cut -c1-60)

echo "📹 Video Details:"
echo "   ID: $VIDEO_ID"
echo "   Caption: $CAPTION..."
echo "   Share URL: $SHARE_URL"
echo ""

# Trigger analysis
echo "🚩 Step 1: Queuing video for AI analysis..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/ai/analyze/$VIDEO_ID \
  -H "Content-Type: application/json" \
  -d "{\"videoUrl\": \"$SHARE_URL\"}")

echo "$RESPONSE" | jq '.'
echo ""

# Wait a moment
echo "⏳ Waiting 5 seconds for processing..."
sleep 5
echo ""

# Check queue status
echo "🚩 Step 2: Checking queue status..."
curl -s http://localhost:3000/api/ai/queue/stats | jq '.'
echo ""

# Check analysis status
echo "🚩 Step 3: Checking analysis result..."
curl -s http://localhost:3000/api/ai/analysis/$VIDEO_ID | jq '.'
echo ""

echo "💡 To monitor in real-time:"
echo "   watch -n 2 './check-ai-status.sh'"
echo ""

