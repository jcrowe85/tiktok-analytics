# Quick Status Check Commands

## Check if processing is stuck or working:

```bash
# 1. Check queue status
curl -s http://localhost:3000/api/ai/queue/stats | jq .

# 2. Check specific video
curl -s http://localhost:3000/api/ai/analysis/7559725318450334989 | jq .

# 3. Check failed jobs
npx tsx check-failed-jobs.ts

# 4. Check database
npx tsx check-db-status.ts

# 5. Manual loop to watch queue
while true; do clear; curl -s http://localhost:3000/api/ai/queue/stats | jq .; sleep 2; done
```

## Current Status:

**✅ WORKING:**
- Video URL extraction (free TikWM API)
- Video streaming (FFmpeg)
- Audio extraction (258KB WAV files)
- OpenAI Whisper transcription  

**⚠️  ISSUE:**
- Jobs getting stuck in "active" state
- Likely because content analysis (GPT-4) is slow or timing out

**🔧 FIX:**
The test script works fine, but the queue worker might be hitting timeouts.
The video being tested has no speech (music only), so Whisper returns empty transcript.
GPT-4 might be taking too long or erroring out with empty transcript.

## Next Steps:
1. Wait 30-60 seconds for current job to finish
2. Check failed jobs for error details  
3. May need to increase timeout or add better error handling for GPT-4

