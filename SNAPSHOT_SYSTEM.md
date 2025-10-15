# Snapshot System for Accurate Growth Tracking

## 🎯 **Problem Solved**

**Before**: TikTok API only provides cumulative totals (total views, total likes, etc.) without timestamps for individual engagement events. We were mistakenly comparing videos posted in different time periods, which gave misleading "growth" percentages.

**After**: Daily snapshot system that captures current metrics and compares them against historical snapshots to show **real growth**.

---

## 📊 **How It Works**

### **Daily Snapshots**
Every day at midnight (via cron job), we capture a snapshot of all video metrics:
- Video ID
- User ID
- Snapshot Date
- View Count (at that moment)
- Like Count (at that moment)
- Comment Count (at that moment)
- Share Count (at that moment)

### **Growth Calculation**
When you select a time period (24h, 7d, 30d):
1. **Current Total**: Sum of all metrics from `videos` table (right now)
2. **Previous Total**: Sum of all metrics from `video_snapshots` table (X days ago)
3. **Growth**: Current - Previous
4. **Percentage**: (Growth / Previous) × 100

---

## 📁 **New Files Created**

### **Database**
- `database/migrations/003_add_video_snapshots.sql` - Creates `video_snapshots` table

### **Backend Services**
- `src/backend/services/snapshotService.ts` - Core snapshot functionality
  - `takeAllSnapshots()` - Takes snapshots for all users
  - `takeUserSnapshots(userId)` - Takes snapshots for specific user
  - `calculateMetricGrowth()` - Calculates growth for a metric
  - `getAllMetricsGrowth()` - Gets growth for all metrics
  - `backfillInitialSnapshot()` - Creates initial baseline

### **Backend Jobs**
- `src/backend/jobs/dailySnapshot.ts` - Daily cron job to take snapshots

### **Backend Routes**
- `src/backend/routes/growth.ts` - API endpoints for growth data
  - `GET /api/growth/:period` - Get growth metrics (period: 1, 7, or 30 days)
  - `POST /api/growth/snapshot` - Manually trigger snapshot for current user

### **Setup Script**
- `setup-snapshots.ts` - One-time setup to create table and initial baseline

### **Frontend**
- Updated `src/frontend/components/Overview.tsx` - Now fetches real growth data from API

---

## 🚀 **Deployment Steps**

### **1. Run Setup (One-Time)**
```bash
# On VPS
cd ~/tiktok-analytics
tsx setup-snapshots.ts
```

This will:
- Create `video_snapshots` table
- Create initial baseline snapshot (yesterday's data)

### **2. Set Up Daily Cron Job**
```bash
# On VPS
crontab -e

# Add this line (runs daily at midnight):
0 0 * * * cd ~/tiktok-analytics && /usr/bin/npm run snapshot >> ~/snapshot-cron.log 2>&1
```

### **3. Deploy Code**
```bash
# Use deployment script
./deploy-updates.sh
```

---

## 📈 **Real-World Example**

### **Before (Misleading)**
```
24h Comparison at 3 PM:
Current: Videos posted today (0 videos) = 0 views
Previous: Videos posted yesterday (5 videos) = 10,000 views  
Result: No data or -100% ❌
```

### **After (Accurate)**
```
24h Comparison at 3 PM:
Current: All videos right now = 150,000 views
Previous: All videos yesterday at midnight = 148,500 views
Growth: +1,500 views (+1.0%) ✅
```

---

## 🔄 **How the Timeline Works**

### **Day 0 (Today - Setup)**
- Run `tsx setup-snapshots.ts`
- Creates baseline snapshot (uses yesterday's date)
- **From this point forward, you can see growth!**

### **Day 1 (Tomorrow)**
- Midnight: Cron job runs, takes snapshot of today's metrics
- Now you have: Baseline (yesterday) and Day 1 snapshot
- **24h growth**: Day 1 vs Baseline
- **7d growth**: Day 1 vs 7 days ago (if available, else null)
- **30d growth**: Day 1 vs 30 days ago (if available, else null)

### **Day 7**
- You now have 7 days of snapshots
- **7d growth** starts working accurately

### **Day 30**
- You now have 30 days of snapshots
- **30d growth** starts working accurately

---

## 🎛️ **API Endpoints**

### **Get Growth Metrics**
```typescript
GET /api/growth/:period
Authorization: Bearer <token>

// period: 1 (24h), 7 (7d), or 30 (30d)

Response:
{
  "period": 7,
  "growth": {
    "views": {
      "current": 150000,
      "previous": 142000,
      "growth": 8000,
      "percentage": 5.63,
      "isIncrease": true
    },
    "likes": { ... },
    "comments": { ... },
    "shares": { ... }
  },
  "timestamp": "2025-10-14T..."
}
```

### **Manual Snapshot**
```typescript
POST /api/growth/snapshot
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Snapshot taken successfully",
  "timestamp": "2025-10-14T..."
}
```

---

## 🛠️ **Maintenance**

### **View Snapshots**
```sql
-- See all snapshots
SELECT * FROM video_snapshots ORDER BY snapshot_date DESC LIMIT 50;

-- See snapshots for a specific user
SELECT * FROM video_snapshots WHERE user_id = 5 ORDER BY snapshot_date DESC;

-- See growth for a specific video
SELECT 
  video_id,
  snapshot_date,
  view_count,
  like_count
FROM video_snapshots 
WHERE video_id = '7560820578072923406'
ORDER BY snapshot_date DESC;
```

### **Manual Snapshot**
```bash
# Take snapshot now
npm run snapshot

# Or via API
curl -X POST https://tiktokinsights.ai/api/growth/snapshot \
  -H "Authorization: Bearer <your-token>"
```

### **Backfill Missing Snapshots**
```typescript
// In node/tsx console
import { backfillInitialSnapshot } from './src/backend/services/snapshotService.js'
await backfillInitialSnapshot()
```

---

## ⚠️ **Important Notes**

1. **First 24 Hours**: After setup, 24h growth will work immediately (comparing to baseline)
2. **First 7 Days**: 7d growth needs 7 days of snapshots to be accurate
3. **First 30 Days**: 30d growth needs 30 days of snapshots to be accurate
4. **Cron Job is Critical**: Without daily cron job, growth tracking stops working
5. **Storage**: Snapshots use minimal space (~100 bytes per video per day)

---

## 🔮 **Future Enhancements**

Possible improvements:
- **Hourly snapshots** for more granular growth tracking
- **Snapshot retention policy** (delete snapshots older than 1 year)
- **Growth alerts** (notify when growth exceeds threshold)
- **Trend analysis** (predict future growth based on historical data)
- **Video-level growth** (show growth per individual video)

---

## ✅ **Testing Checklist**

After deployment:
- [ ] Run `tsx setup-snapshots.ts` on VPS
- [ ] Verify `video_snapshots` table exists
- [ ] Verify baseline snapshot was created
- [ ] Set up cron job for daily snapshots
- [ ] Test growth API: `curl /api/growth/1`
- [ ] Check frontend shows growth percentages
- [ ] Wait 24 hours and verify new snapshot is created
- [ ] Verify growth percentages update correctly

---

**The snapshot system is now the foundation for all accurate growth tracking in the application!** 🎉

