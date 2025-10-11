#!/bin/bash

# TikTok Analytics - AI Analysis Test Script
# This script demonstrates how to trigger AI analysis for videos

echo "🧪 Testing AI Analysis Pipeline"
echo "================================"
echo ""

# Get the first video from data file
VIDEO_ID=$(cat data/data.json | jq -r '.[0].id')
VIDEO_CAPTION=$(cat data/data.json | jq -r '.[0].caption' | cut -c1-80)

echo "📹 Test Video:"
echo "   ID: $VIDEO_ID"
echo "   Caption: $VIDEO_CAPTION..."
echo ""

# Note: TikTok API doesn't provide direct video URLs for download
# In production, you would need to:
# 1. Use TikTok's video download API (if available)
# 2. Use a third-party TikTok downloader service
# 3. Or process videos that are already stored locally

# For testing, we'll use a placeholder URL
VIDEO_URL="https://example.com/tiktok-video-${VIDEO_ID}.mp4"

echo "⚠️  Note: Using placeholder video URL for testing"
echo "   Real implementation requires actual video download capability"
echo ""

# Test 1: Check queue status
echo "1️⃣ Checking queue status..."
curl -s http://localhost:3000/api/ai/queue/stats | jq .
echo ""

# Test 2: Trigger AI analysis
echo "2️⃣ Triggering AI analysis..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/ai/analyze/${VIDEO_ID} \
  -H "Content-Type: application/json" \
  -d "{\"videoUrl\": \"${VIDEO_URL}\"}")

echo "$RESPONSE" | jq .
echo ""

# Test 3: Check analysis status
echo "3️⃣ Checking analysis status..."
sleep 2
curl -s http://localhost:3000/api/ai/analysis/${VIDEO_ID} | jq .
echo ""

# Test 4: List all analyses
echo "4️⃣ Listing all AI analyses..."
curl -s http://localhost:3000/api/ai/analysis | jq '.analyses | length'
echo ""

echo "✅ Test script completed!"
echo ""
echo "📝 Next steps:"
echo "   1. Implement actual video download capability"
echo "   2. Integrate with TikTok video URLs (when available)"
echo "   3. Process videos from your TikTok account"
echo ""

