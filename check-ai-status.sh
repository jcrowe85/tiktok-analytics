#!/bin/bash

# TikTok Analytics - AI Analysis Status Checker

echo ""
echo "🔍 AI Analysis Status Check"
echo "============================"
echo ""

# Get video ID from argument or use first video from data
if [ -z "$1" ]; then
  VIDEO_ID=$(cat data/data.json | jq -r '.[0].id')
  echo "📹 Using first video: $VIDEO_ID"
else
  VIDEO_ID=$1
  echo "📹 Checking video: $VIDEO_ID"
fi

echo ""

# Check queue stats
echo "1️⃣ Queue Statistics:"
echo "-------------------"
curl -s http://localhost:3000/api/ai/queue/stats | jq '.'
echo ""

# Check specific video analysis
echo "2️⃣ Video Analysis Status:"
echo "-------------------------"
ANALYSIS=$(curl -s http://localhost:3000/api/ai/analysis/$VIDEO_ID)

if echo "$ANALYSIS" | jq -e '.error' > /dev/null 2>&1; then
  echo "❌ No analysis found for this video"
  echo "$ANALYSIS" | jq '.error'
else
  echo "✅ Analysis found!"
  echo ""
  echo "Status: $(echo "$ANALYSIS" | jq -r '.status')"
  echo "Processed: $(echo "$ANALYSIS" | jq -r '.processed_at // "Not yet"')"
  echo ""
  echo "Scores:"
  echo "$ANALYSIS" | jq '.scores'
  echo ""
  echo "Findings:"
  echo "$ANALYSIS" | jq '.findings'
fi

echo ""
echo "3️⃣ All Analyses Summary:"
echo "------------------------"
curl -s http://localhost:3000/api/ai/analysis | jq '{
  total: .total,
  analyses: [.analyses[] | {
    video_id,
    status,
    overall_score: .scores.overall_100,
    processed_at
  }]
}'

echo ""
echo "💡 Usage:"
echo "   ./check-ai-status.sh              # Check first video"
echo "   ./check-ai-status.sh VIDEO_ID     # Check specific video"
echo ""

