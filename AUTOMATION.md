# 🤖 TikTok Analytics Automation Guide

This guide covers all the ways to automatically refresh your TikTok analytics data.

## 🕐 Option 1: Cron Job (Recommended for Production)

### Setup
```bash
# Run the setup script
./cron-setup.sh
```

This will:
- ✅ Add a daily cron job at 9:00 AM
- ✅ Create a logs directory
- ✅ Log all output to `logs/cron.log`

### Manual Cron Setup
```bash
# Edit crontab
crontab -e

# Add this line (adjust path to your project):
0 9 * * * cd /path/to/tiktok-analytics && npm run fetch >> logs/cron.log 2>&1
```

### Cron Schedule Examples
```bash
# Daily at 9:00 AM
0 9 * * * cd /path/to/tiktok-analytics && npm run fetch

# Every 6 hours
0 */6 * * * cd /path/to/tiktok-analytics && npm run fetch

# Weekdays only at 8:00 AM
0 8 * * 1-5 cd /path/to/tiktok-analytics && npm run fetch

# Twice daily (9 AM and 6 PM)
0 9,18 * * * cd /path/to/tiktok-analytics && npm run fetch
```

### View Cron Logs
```bash
# View recent logs
tail -f logs/cron.log

# View all logs
cat logs/cron.log
```

---

## 🚀 Option 2: Node.js Scheduler (For Development/Testing)

### Install Dependencies
```bash
npm install  # Already done if you followed the setup
```

### Start Daily Scheduler
```bash
npm run scheduler start-daily
```

### Start Hourly Scheduler (Testing)
```bash
npm run scheduler start-hourly
```

### Manage Scheduler
```bash
# List active jobs
npm run scheduler list

# Stop specific job
npm run scheduler stop daily-fetch

# Stop all jobs
npm run scheduler stop
```

### Run Scheduler in Background
```bash
# Using nohup (Linux/Mac)
nohup npm run scheduler start-daily > scheduler.log 2>&1 &

# Using PM2 (if installed)
pm2 start "npm run scheduler start-daily" --name tiktok-scheduler
```

---

## ☁️ Option 3: Cloud Services

### GitHub Actions (Free)
Create `.github/workflows/tiktok-analytics.yml`:
```yaml
name: TikTok Analytics Fetch
on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run fetch
        env:
          TIKTOK_ACCESS_TOKEN: ${{ secrets.TIKTOK_ACCESS_TOKEN }}
          TIKTOK_REFRESH_TOKEN: ${{ secrets.TIKTOK_REFRESH_TOKEN }}
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add data/
          git commit -m "Update TikTok analytics data" || exit 0
          git push
```

### Vercel Cron Jobs
```javascript
// api/cron.js
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Run fetch job
  const { exec } = require('child_process');
  exec('npm run fetch', (error, stdout, stderr) => {
    if (error) {
      console.error('Cron job failed:', error);
      return res.status(500).json({ error: 'Cron job failed' });
    }
    res.status(200).json({ success: true, output: stdout });
  });
}
```

### Railway/Render Cron
```bash
# Add to your deployment platform's cron settings:
0 9 * * * npm run fetch
```

---

## 🔧 Option 4: Systemd Service (Linux)

### Create Service File
```bash
sudo nano /etc/systemd/system/tiktok-analytics.service
```

```ini
[Unit]
Description=TikTok Analytics Scheduler
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/tiktok-analytics
ExecStart=/usr/bin/node /path/to/tiktok-analytics/src/backend/scheduler.js start-daily
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Enable and Start
```bash
sudo systemctl daemon-reload
sudo systemctl enable tiktok-analytics
sudo systemctl start tiktok-analytics

# Check status
sudo systemctl status tiktok-analytics

# View logs
sudo journalctl -u tiktok-analytics -f
```

---

## 📊 Monitoring & Alerts

### Health Check Endpoint
Your server already has a health endpoint:
```bash
curl http://localhost:3000/api/health
```

### Email Alerts (Optional)
Add to your fetch job:
```javascript
// In fetchJob.ts, add after error handling:
if (error) {
  // Send email alert
  const nodemailer = require('nodemailer');
  // ... email logic
}
```

### Slack Notifications
```javascript
// Add to fetchJob.ts
const webhook = process.env.SLACK_WEBHOOK_URL;
if (webhook && error) {
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `❌ TikTok Analytics fetch failed: ${error.message}`
    })
  });
}
```

---

## 🎯 Recommended Setup

### For Development
```bash
# Use Node.js scheduler for testing
npm run scheduler start-hourly
```

### For Production
```bash
# Use cron job for reliability
./cron-setup.sh
```

### For Cloud Deployment
- Use GitHub Actions for free automation
- Or your hosting platform's cron features

---

## 🚨 Troubleshooting

### Common Issues

1. **Tokens Expired**
   ```bash
   npm run auth  # Re-authenticate
   ```

2. **Permission Denied (Cron)**
   ```bash
   chmod +x cron-setup.sh
   ```

3. **Scheduler Not Working**
   ```bash
   npm run scheduler list  # Check active jobs
   ```

4. **Logs Not Appearing**
   ```bash
   mkdir -p logs
   touch logs/cron.log
   ```

### Test Your Setup
```bash
# Test fetch job manually
npm run fetch

# Test scheduler
npm run scheduler start-hourly
# Wait an hour, then check if it ran
```

---

## 📈 Data Retention

Your data is stored in:
- `data/videos.csv` - All video metrics
- `data/videos.json` - JSON format
- `data/snapshots.json` - Historical snapshots for velocity

The system automatically:
- ✅ Appends new data (doesn't overwrite)
- ✅ Calculates velocity metrics
- ✅ Maintains historical snapshots
- ✅ Updates the dashboard in real-time

---

## 🔄 Next Steps

1. **Choose your automation method** (cron recommended)
2. **Set up monitoring** (optional but recommended)
3. **Test the setup** with a manual run
4. **Monitor logs** for the first few days
5. **Enjoy automated analytics!** 🎉

Your TikTok analytics will now update automatically, giving you fresh insights every day without any manual work!
