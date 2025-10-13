# Batch Re-analyze Guide

## Overview

Two scripts are available for batch re-analyzing videos with GPT-4o:

1. **`batch-reanalyze-selective.ts`** - ✅ **RECOMMENDED** - Only re-analyzes videos that need it
2. **`batch-reanalyze-all.ts`** - ⚠️ **Use with caution** - Re-analyzes ALL videos

## Quick Start (Recommended)

### 1. Dry Run First (Test Mode)

Always run in dry-run mode first to see what will happen:

```bash
# On VPS
cd ~/tiktok-analytics
docker exec -it tiktok-analytics npx tsx batch-reanalyze-selective.ts
```

This will show you:
- How many videos need re-analysis
- Why they need it (failed, no analysis, old model)
- Estimated time
- **No actual re-analysis happens**

### 2. Run Live (Actual Re-analysis)

Once you're happy with the dry run results:

```bash
docker exec -it tiktok-analytics npx tsx batch-reanalyze-selective.ts --live
```

## Script Comparison

### Selective Re-analyze (Recommended)

**File**: `batch-reanalyze-selective.ts`

**Re-analyzes only videos that:**
- ❌ Have failed analysis
- ⚠️ Have no analysis
- ⏳ Are stuck in "pending" status
- 🔄 Were analyzed with old model (pre-GPT-4o)

**Safety Features:**
- Smaller batches (3 videos at a time)
- Longer delays (90s between batches, 15s between videos)
- Waits for each video to complete before moving to next
- Shows progress and estimates

**Typical Use Cases:**
- After upgrading AI model
- Fixing failed analyses
- Catching up on missed videos

### Full Re-analyze (Use with Caution)

**File**: `batch-reanalyze-all.ts`

**Re-analyzes:**
- ⚠️ **ALL videos** in the database

**Safety Features:**
- Larger batches (5 videos at a time)
- Moderate delays (60s between batches, 10s between videos)
- Dry run mode available

**Use Only When:**
- You've made major changes to analysis logic
- You want to completely refresh all analyses
- You have time to monitor the process

## Safety Features

Both scripts include:

✅ **Dry Run Mode** - Test without actually re-analyzing  
✅ **Rate Limiting** - Delays between videos and batches  
✅ **Progress Tracking** - See success/fail counts in real-time  
✅ **Error Handling** - Continues even if individual videos fail  
✅ **Completion Waiting** - Waits for each analysis to finish  

## Configuration

You can adjust these values in the scripts:

```typescript
const BATCH_SIZE = 3              // Videos per batch
const DELAY_BETWEEN_BATCHES = 90000  // 90 seconds
const DELAY_BETWEEN_VIDEOS = 15000   // 15 seconds
```

**Recommendations:**
- **VPS with 2GB RAM**: Use defaults
- **VPS with 4GB+ RAM**: Can increase BATCH_SIZE to 5
- **Peak hours**: Increase delays by 50%
- **Off-peak hours**: Can reduce delays by 25%

## Monitoring

### Watch Server Logs

In a separate terminal:

```bash
# Watch backend logs
docker logs tiktok-analytics -f

# Watch for errors
docker logs tiktok-analytics -f | grep -E "(Error|Failed|❌)"
```

### Check System Resources

```bash
# CPU and Memory usage
docker stats tiktok-analytics

# If CPU > 80% or Memory > 80%, pause the script
```

## Troubleshooting

### Script Hangs or Stalls

**Cause**: Video analysis taking too long  
**Solution**: Script will timeout after 2 minutes per video and move to next

### High CPU/Memory Usage

**Cause**: Too many videos processing at once  
**Solution**: 
1. Stop the script (Ctrl+C)
2. Reduce `BATCH_SIZE` to 2
3. Increase delays to 120s between batches

### Many Failures

**Cause**: OpenAI API rate limits or errors  
**Solution**:
1. Check OpenAI API key and credits
2. Increase delays between videos
3. Run in smaller batches

### Database Connection Errors

**Cause**: Too many concurrent connections  
**Solution**: Restart the script, it will resume from where it left off

## Best Practices

1. **Always dry run first** - See what will happen
2. **Run during off-peak hours** - Less load on VPS
3. **Monitor the first batch** - Make sure everything works
4. **Check a few completed videos** - Verify quality
5. **Keep terminal open** - Don't close SSH session
6. **Use `screen` or `tmux`** - For long-running processes

### Using Screen (Recommended)

```bash
# Start a screen session
screen -S reanalyze

# Run the script
docker exec -it tiktok-analytics npx tsx batch-reanalyze-selective.ts --live

# Detach: Press Ctrl+A then D

# Reattach later
screen -r reanalyze
```

## Example Output

```
🔍 Selective Batch Re-analysis
   Mode: LIVE

📊 Analysis Summary:
   No analysis: 5
   Failed: 2
   Stuck pending: 1
   Old model (pre-GPT-4o): 12
   Total to re-analyze: 20

⏱️  Estimated time: ~15 minutes

📦 Batch 1/7
   ✅ Queued: 7557516605626780983
   ✅ Queued: 7550024828439350558
   ✅ Queued: 7557044516658711821
   ⏸️  Progress: 3✅ 0❌ 17⏳
   Waiting 90s...

📦 Batch 2/7
   ✅ Queued: 7550019925847444766
   ...

==================================================
🎉 Complete!
   ✅ Succeeded: 18
   ❌ Failed: 2
==================================================
```

## Emergency Stop

If you need to stop the script:

1. **Press `Ctrl+C`** in the terminal
2. Script will stop gracefully
3. Already queued videos will complete
4. You can restart later - it will skip completed videos

## Post-Run Verification

Check that videos were re-analyzed:

```bash
# Count completed analyses
docker exec tiktok-analytics psql -U tiktok_user -d tiktok_analytics -c \
  "SELECT COUNT(*) FROM video_ai_analysis WHERE status = 'completed' AND llm_model = 'gpt-4o';"

# Check for failures
docker exec tiktok-analytics psql -U tiktok_user -d tiktok_analytics -c \
  "SELECT COUNT(*) FROM video_ai_analysis WHERE status = 'failed';"
```

## Cost Estimation

**GPT-4o Pricing** (as of Oct 2024):
- Input: $2.50 per 1M tokens
- Output: $10.00 per 1M tokens

**Typical Video Analysis**:
- ~2,000 input tokens (video data + prompt)
- ~500 output tokens (analysis results)
- **Cost per video: ~$0.01**

**For 100 videos**: ~$1.00  
**For 500 videos**: ~$5.00  
**For 1000 videos**: ~$10.00

## Support

If you encounter issues:

1. Check the logs: `docker logs tiktok-analytics --tail 100`
2. Verify OpenAI API key: `docker exec tiktok-analytics env | grep OPENAI`
3. Check database connection: `docker exec tiktok-analytics-postgres pg_isready`
4. Review this guide's troubleshooting section

## Summary

**For most use cases, use `batch-reanalyze-selective.ts`:**

```bash
# 1. Dry run to preview
docker exec -it tiktok-analytics npx tsx batch-reanalyze-selective.ts

# 2. If happy with preview, run live
docker exec -it tiktok-analytics npx tsx batch-reanalyze-selective.ts --live
```

**Safe, efficient, and won't break your VPS!** ✅

