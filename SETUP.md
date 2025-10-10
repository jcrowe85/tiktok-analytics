# Setup Guide

Follow these steps to get your TikTok Analytics Dashboard up and running.

> **Note**: This guide covers Phase 1 (Analytics Foundation). For Phase 2 (Creative Intelligence) setup, see [PHASE2_SPEC.md](PHASE2_SPEC.md) after completing Phase 1.

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

This installs all required packages for both backend and frontend.

### 2. Get TikTok Developer Credentials

#### Create a TikTok App

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Sign in with your TikTok account
3. Click **"Manage apps"** → **"Create App"**
4. Fill in app details:
   - **App name**: TikTok Analytics
   - **Description**: Personal analytics dashboard
   - **Category**: Analytics

#### Configure OAuth

1. In your app settings, go to **"OAuth"**
2. Add redirect URI: `http://localhost:3000/callback`
3. Request these scopes:
   - `user.info.basic`
   - `video.list`
4. Save changes

#### Get Your Credentials

1. Copy your **Client Key** (also called App ID)
2. Copy your **Client Secret**

### 3. Configure Environment

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
TIKTOK_CLIENT_KEY=your_actual_client_key
TIKTOK_CLIENT_SECRET=your_actual_client_secret
TIKTOK_REDIRECT_URI=http://localhost:3000/callback
PORT=3000
```

> **Important**: Never commit `.env` to git. It's already in `.gitignore`.

### 4. Authenticate

```bash
npm run auth
```

**What happens:**
1. Local server starts on port 3000
2. Console shows a URL like: `http://localhost:3000/auth`
3. Open that URL in your browser
4. TikTok asks you to authorize the app
5. Click **"Authorize"**
6. Tokens are saved to `.env` automatically

**Expected output:**
```
🚩 Step 1: Start OAuth server
📍 Server running at http://localhost:3000

🌐 Open this URL in your browser:
   http://localhost:3000/auth

🚩 Step 2: Request user consent (scopes: user.info.basic, video.list)
🚩 Step 3: Exchange code for tokens

✅ Authentication successful!
📝 Tokens saved to .env file
```

### 5. Pull Your Data

```bash
npm run fetch
```

**What happens:**
1. Connects to TikTok API using your tokens
2. Lists all your videos (paginated)
3. Fetches metrics for each video
4. Computes engagement rates and velocities
5. Saves to `data/tiktok_video_metrics.csv` and `data/data.json`

**Expected output:**
```
🎯 TikTok Analytics Fetch Job
════════════════════════════════════════

🚩 Step 4: List all videos (paginated)
   📄 Page 1: Found 20 videos (total: 20)
   📄 Page 2: Found 15 videos (total: 35)
✅ Retrieved 35 total video IDs

🚩 Step 5: Query video metrics in 20-ID batches
   📦 Batch 1/2: Retrieved 20 videos
   📦 Batch 2/2: Retrieved 15 videos
✅ Retrieved details for 35 videos

🚩 Step 6: Compute KPIs & velocities
   📊 Loaded 0 previous snapshots

🚩 Step 7: Write CSV and data.json
   ✅ CSV written: data/tiktok_video_metrics.csv (35 videos)
   ✅ JSON written: data/data.json (35 videos)
   ✅ Snapshots saved: 35 entries

📊 Summary Statistics
════════════════════════════════════════
   Videos: 35
   Total Views: 1,234,567
   Total Likes: 45,678
   Total Comments: 2,345
   Total Shares: 890
   Median Engagement Rate: 4.23%

✅ Fetch job complete!
   Run "npm run dev" to view the dashboard
```

### 6. View Dashboard

```bash
npm run dev
```

This starts both:
- **Backend API**: http://localhost:3000/api/data
- **Frontend UI**: http://localhost:5173

Open http://localhost:5173 in your browser.

## Troubleshooting

### "Missing access tokens" error

Run `npm run auth` first to authenticate.

### "Failed to fetch data" in dashboard

Make sure:
1. You've run `npm run fetch` at least once
2. The file `data/data.json` existsWe
3. Backend server is running (`npm run dev`)

### OAuth errors

Check:
- Client Key and Secret are correct in `.env`
- Redirect URI matches exactly: `http://localhost:3000/callback`
- Your app has the correct scopes enabled

### Port already in use

If port 3000 is taken, change `PORT=3001` in `.env` and update the redirect URI accordingly.

### Token expired errors

Tokens auto-refresh. If you still get errors:
1. Run `npm run auth` again to get fresh tokens
2. Check that your app is still active in TikTok Developer portal

## Daily Workflow

Once set up:

```bash
# Pull latest data (do this daily or schedule with cron)
npm run fetch

# View dashboard
npm run dev
```

## Scheduling Automated Fetches

### macOS/Linux (crontab)

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 9 AM)
0 9 * * * cd /Users/yourusername/path/to/tiktok-analytics && npm run fetch
```

### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 9:00 AM
4. Action: Start a program
5. Program: `npm`
6. Arguments: `run fetch`
7. Start in: `C:\path\to\tiktok-analytics`

## Next Steps

### Phase 1 Complete! ✅

Your analytics foundation is now running. Consider:
- Customizing dashboard styling to match your brand
- Adding more filters or metrics
- Exporting data to Google Sheets / BigQuery
- Setting up Slack/Discord notifications for top movers

### Ready for Phase 2?

Once you're comfortable with Phase 1, you can add Creative Intelligence:

**What Phase 2 Adds:**
- AI-powered video quality scoring (Hook, Depth, Clarity, Pacing, CTA, Brand Fit)
- Visual analysis for silent videos (composition, aesthetics, emotion)
- Speech-to-text transcripts with timestamps
- On-screen text detection (OCR)
- Scene cut and motion analysis
- LLM-powered critique with actionable fix suggestions
- Enhanced UI with detailed analysis tabs

**Phase 2 Requirements:**
- PostgreSQL database
- Redis (for job queue)
- FFmpeg (video processing)
- OpenAI API key (for Whisper ASR + Vision + GPT-4/5) OR local alternatives
- AWS S3 / GCS (for artifact storage)
- Additional ~$50-100/month for API costs (depends on video volume)

**Getting Started:**
1. Read [PHASE2_SPEC.md](PHASE2_SPEC.md) for complete technical specifications
2. Set up infrastructure (Postgres, Redis, S3)
3. Configure Phase 2 environment variables
4. Run database migrations
5. Enable feature flag: `FEATURE_CREATIVE_INTELLIGENCE=true`
6. Backfill existing videos for analysis

### Phase 3 (Future)

After Phase 2, you can add:
- Pattern clustering and creative archetypes
- Automated creative briefs
- Content calendar with AI recommendations
- Competitive analysis
- Trend forecasting

---

Need help? Check the main [README.md](README.md), [PHASE2_SPEC.md](PHASE2_SPEC.md), or TikTok's [Display API docs](https://developers.tiktok.com/doc/display-api-get-started).

