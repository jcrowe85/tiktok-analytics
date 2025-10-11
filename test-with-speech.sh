#!/bin/bash

# Test AI analysis with a video that has speech

echo ""
echo "🎤 Testing AI Analysis with Speech Video"
echo "========================================"
echo ""

# Find a video with a long caption (likely has speech)
VIDEO=$(cat data/data.json | jq '[.[] | select(.caption | length > 200)] | .[0]')
VIDEO_ID=$(echo "$VIDEO" | jq -r '.id')
SHARE_URL=$(echo "$VIDEO" | jq -r '.share_url')
CAPTION=$(echo "$VIDEO" | jq -r '.caption' | cut -c1-100)

echo "📹 Selected video:"
echo "   ID: $VIDEO_ID"
echo "   Caption: $CAPTION..."
echo "   Share URL: $SHARE_URL"
echo ""

# Delete old analysis if exists
echo "🗑️  Clearing old analysis..."
psql "postgresql://tiktok_user:local_dev_password@localhost:5432/tiktok_analytics" \
  -c "DELETE FROM video_ai_analysis WHERE video_id = '$VIDEO_ID';" > /dev/null 2>&1
echo ""

# Trigger analysis
echo "🚀 Triggering AI analysis..."
curl -X POST http://localhost:3000/api/ai/analyze/$VIDEO_ID \
  -H "Content-Type: application/json" \
  -d "{\"videoUrl\": \"$SHARE_URL\"}" | jq .
echo ""

# Monitor progress
echo "⏳ Monitoring progress (this takes 30-60 seconds)..."
echo ""

for i in {1..12}; do
  STATUS=$(curl -s http://localhost:3000/api/ai/queue/stats | jq -r '.active')
  if [ "$STATUS" = "0" ]; then
    echo "✅ Processing complete!"
    break
  fi
  echo "   Check $i/12: Processing... (active jobs: $STATUS)"
  sleep 5
done

echo ""

# Check results
echo "📊 Analysis Results:"
echo "==================="
curl -s http://localhost:3000/api/ai/analysis/$VIDEO_ID | jq '{
  status,
  overall_score: .scores.overall_100,
  scores: .scores,
  transcript_length: (.artifacts.transcript | length),
  ocr_items: (.artifacts.ocr_text | length),
  sample_ocr: .artifacts.ocr_text[0],
  suggestions: .fix_suggestions
}'

echo ""
echo "💡 Full details:"
echo "   curl -s http://localhost:3000/api/ai/analysis/$VIDEO_ID | jq ."
echo ""

