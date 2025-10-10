# TikTok Organic Video Analytics Dashboard

A comprehensive analytics tool for TikTok organic video performance. Pull data via TikTok's Display API, compute key metrics, and visualize everything in a beautiful dashboard.

## 🎯 Features

### Phase 1: Analytics Foundation ✅ (Complete)
- **Zero Manual Tapping**: Automated data pulling via TikTok Display API
- **OAuth Authentication**: One-time authentication with automatic token refresh
- **Comprehensive Metrics**: Views, likes, comments, shares, engagement rates
- **View Velocity Tracking**: 24h/48h growth rates
- **Interactive Dashboard**: 
  - Performance overview tiles
  - Sortable/filterable video table
  - Top movers detection
  - Hashtag analysis
- **Data Export**: CSV and JSON formats for further analysis
- **Production Deployment**: Docker containerization with automatic daily refresh

### Phase 2: Creative Intelligence Layer 🚧 (Next)

**Objective**: Understand *what creative elements work and why* with AI-powered video analysis.

#### **Core Features:**

**1. Video Quality Scoring (ALL INTEGERS)**
- **Hook Strength** (0-10): First 3 seconds impact (visual + spoken + overlay + caption)
- **Depth** (0-10): Proof points, mechanism explanation, demo quality
- **Clarity** (0-10): Logical flow, connectives, story structure
- **Pacing** (0-10): Shot cadence (1.5-4 cuts/10s), subtitle rhythm
- **CTA** (0-10): Call-to-action presence, clarity, and urgency
- **Brand Fit** (0-10): Alignment with brand values (peptide/hormone-free messaging)
- **Overall Score (0-100)**: Weighted composite with quality bands:
  - **≥80 = Pass** (publish as-is)
  - **60-79 = Revise** (minor fixes)
  - **<60 = Reshoot** (major issues)
- **Pillar Rollups** (for faster UI sorting):
  - **Attention** (0-10): First impression strength
  - **Visual Craft** (0-10): Production quality
  - **Message & CTA** (0-10): Communication effectiveness

**2. Visual-Only Metrics** (16 scores, ALL INTEGERS 0-10)
- Thumb-stop probability & first frame strength
- Silent comprehension (message clear without sound)
- **Silent-Friendly Flag**: Auto-computed when silent_comprehension ≥7 AND text_legibility ≥7
- Visual aesthetics & composition quality
- Motion dynamics & camera work
- Pattern interrupt (feed-breaking novelty)
- Text legibility & timing
- Emotion scoring (awe, joy, intrigue)
- Save/share trigger potential
- Loopability & trend alignment
- Cultural resonance & brand safety

**3. Multi-Source Content Analysis**

Phase 2 analyzes ALL content sources for complete creative intelligence:

- ✅ **Speech Transcription (ASR)**: Everything creator says with timestamps (OpenAI Whisper)
- ✅ **On-Screen Text (OCR)**: Text overlays, titles, product callouts (Google Vision/Tesseract)
- ✅ **Caption/Description**: Hook reinforcement, added context, CTAs, brand keywords
- ✅ **Hashtags**: Trend alignment, relevance scoring, spam detection, niche specificity
- ✅ **Visual Tagging**: Subjects, composition, emotion via CLIP/BLIP
- ✅ **Audio Features**: Music detection, BPM, speech vs music ratio
- ✅ **Scene Analysis**: Cut detection, motion tracking, shot types

> **Note**: Caption and hashtag analysis is crucial because CTAs are usually in captions, and hashtags drive discoverability. Phase 2 combines all sources (spoken words, text overlays, captions, and hashtags) for the most comprehensive creative analysis.

**4. Media Processing Pipeline**
- Automatic video download and CDN storage
- Frame extraction at key points (0, 1, 2, 3, 5, 10, 25, 50, 75%)
- Speech-to-text with OpenAI Whisper or local alternatives
- On-screen text detection with Google Vision API or Tesseract
- Scene cut detection with PySceneDetect/FFmpeg
- Visual tagging with CLIP/BLIP for composition and aesthetics

**5. AI-Powered Critique** (with strict guardrails)
- **Deterministic base scoring**: Rule-based 0-10 per metric (always runs)
- **Optional LLM enhancement**: GPT-4/5 adjustments with strict guardrails:
  - ±2 delta clamping (prevents hallucinations)
  - Strict JSON mode with schema validation
  - Fail-open strategy (falls back to deterministic if LLM unavailable)
  - Reasoning notes (transparency on why scores adjusted)
- **Structured findings**: Hook verdict, depth analysis, retention opportunities
- **Prioritized fix suggestions**: High/medium/low priority with actionable steps
- **Compliance & risk detection**: 
  - Policy flags (e.g., "medical_claim", "before_after_sensitive")
  - Platform blockers (TikTok/Meta-specific)
  - Comms-safe CTA suggestions when risk detected

**6. Classification System**
- **Angle**: comparison | transformation | science | empowerment
- **Hook Type**: question | contrarian | curiosity | awe | shock
- **Content Types**: demo | story | before_after | lifestyle | tutorial
- **Visual Subjects**: Auto-detected (e.g., "product, hands, close-up")
- **Composition Tags**: symmetry | leading_lines | central_focus | rule_of_thirds
- **Emotion Tags**: awe | serenity | joy | intrigue | surprise
- **Pattern Interrupt**: grand_scale | color_contrast | unexpected_angle

**7. Enhanced UI**
- Creative score badges in video list (Hook, Depth, Overall)
- Status indicators (pending/processing/done/error)
- Detailed video modal with 6 tabs:
  - **Overview**: All scores at a glance with progress bars
  - **Hook**: 0-3s keyframes, OCR text, spoken hook, caption alignment, verdict
  - **Story**: Full transcript with timestamps, depth analysis, retention opportunities
  - **Fixes**: Prioritized actionable suggestions (high/medium/low)
  - **Visual**: First frame analysis, composition breakdown, aesthetics rating, emotion tags
  - **Artifacts**: Keyframe gallery, audio features, scene cuts, raw JSON, reprocess button

#### **Technical Stack:**
- **Database**: PostgreSQL (structured data + JSONB for flexibility)
- **Job Queue**: BullMQ + Redis (background processing)
- **Storage**: AWS S3 / GCS (video files, keyframes, artifacts)
- **ASR**: OpenAI Whisper API or local whisper.cpp
- **OCR**: Google Vision API or Tesseract
- **Visual AI**: CLIP/BLIP for scene understanding
- **LLM**: GPT-4/5 for critique (optional enhancement)
- **Video Processing**: FFmpeg, PySceneDetect

#### **Data Flow:**
```
Video URL → Download → Extract (audio + frames) → Parallel Processing:
  ├─ ASR: Speech-to-text with timestamps
  ├─ OCR: On-screen text extraction
  ├─ Audio: Music/speech/BPM detection
  ├─ Scenes: Cut detection, motion analysis
  ├─ Visual: CLIP/BLIP tagging, composition analysis
  └─ Metadata: Caption + hashtag analysis
→ Deterministic Scoring (rule-based 0-10 per metric)
→ LLM Enhancement (optional ±2 adjustments + findings)
→ Generate Fix Suggestions
→ Save to Database + S3
→ Display in Enhanced UI
```

#### **Example Analysis:**

**Video**: "3 Ingredients for Hair Growth"
- **Visual (OCR)**: "3 Ingredients" (t=0s), numbered list of peptides
- **Audio (ASR)**: "These three peptides changed my hair growth game"
- **Caption**: "I was skeptical about peptide serums until I tried these 3 ingredients 🤯 Bloom has all three + it's hormone-free! Shop the link in my bio 👇"
- **Hashtags**: #hairgrowth #peptides #bloompeptidehairserum (trending + relevant)

**Scores**:
- Hook: 9/10 (number list + visual + caption reinforcement)
- Depth: 7/10 (ingredients named + caption adds context)
- Clarity: 10/10 (numbered structure, perfect flow)
- Pacing: 9/10 (smooth overlay timing)
- CTA: 10/10 (clear "shop link in bio" in caption)
- Brand Fit: 10/10 (mentions "hormone-free")
- Overall: **88/100 (PASS)**

**Findings**:
- ✅ Hook: "Strong list format reinforced across video and caption"
- ✅ Depth: "Caption adds 'skeptical' angle and 'hormone-free' value prop"
- ✅ CTA: "Clear actionable CTA with urgency"
- ⚠️ Improvement: "Consider mentioning 'hormone-free' in narration for non-caption readers"

#### **Performance & Quality:**
- **Processing SLO**: ≤ 120 seconds per video at P95
- **Golden Set Calibration**: MAE ≤ 1.0 on Hook/Depth scores vs hand-scored videos
- **Acceptance Tests**: 6 functional tests covering silent videos, weak hooks, scoring formula, LLM fallback, batch processing, quality bands
- **Privacy**: Keyframes only (not full frames), PII redaction, 90-day retention

#### **Requirements:**
- PostgreSQL database (structured data + JSONB)
- Redis (job queue with BullMQ)
- FFmpeg (video processing)
- OpenAI API keys (Whisper + Vision + GPT-4/5) OR local alternatives
- AWS S3 / GCS (artifact storage)
- ~$50-100/month API costs (varies with video volume)

#### **See Also:**
- **Quick Overview**: [PHASE2_OVERVIEW.md](PHASE2_OVERVIEW.md) - Team-friendly explanation + technical highlights
- **Full Specification**: [PHASE2_SPEC.md](PHASE2_SPEC.md) - 1,247 lines with complete implementation details
  - Complete scoring rubric and detection logic
  - Database schema with integer constraints and GIN indexes
  - LLM guardrails (±2 clamping, strict JSON, fail-open)
  - Operational SLOs (120s P95, retry policies)
  - Privacy policies (PII redaction, keyframes only)
  - 6 functional tests for acceptance criteria
  - Analytics queries for post-MVP insights
  - 4 artifact interface definitions (TranscriptSegment, OCRResult, AudioFeatures, SceneCut)

### Phase 3: LLM Insights & Automation (Future)
- Pattern clustering and archetype detection
- Automated creative briefs from top performers
- Content calendar recommendations with AI suggestions
- Competitive analysis (public videos in your niche)
- Trend alignment and cultural resonance scoring
- Guardrails for brand safety and claims compliance

## 📊 Available Metrics

Via TikTok Display API:
- Video ID, creation time, duration
- Caption/description with hashtag extraction
- View count, like count, comment count, share count
- Cover image thumbnails

Computed KPIs:
- **Engagement Rate**: (likes + comments + shares) / views
- **Individual Rates**: Like rate, comment rate, share rate
- **View Velocity**: Views per hour (24h and 48h windows)
- **Post Cadence**: Videos per day

> **Note**: TikTok Display API does not expose per-video watch time or saves for organic content. We use engagement rates and velocity as quality proxies.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- TikTok Developer Account
- TikTok App credentials (Client Key & Secret)

### 1. Get TikTok API Credentials

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Create a new app
3. Add the following redirect URI: `http://localhost:3000/callback`
4. Request these scopes: `user.info.basic`, `video.list`
5. Copy your Client Key and Client Secret

### 2. Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 3. Configure Environment

Edit `.env` and add your credentials:

```env
TIKTOK_CLIENT_KEY=your_client_key_here
TIKTOK_CLIENT_SECRET=your_client_secret_here
TIKTOK_REDIRECT_URI=http://localhost:3000/callback
PORT=3000
```

### 4. Authenticate with TikTok

```bash
npm run auth
```

This will:
1. Start a local OAuth server
2. Open your browser to authorize the app
3. Save access and refresh tokens to `.env`
4. Automatically refresh tokens when they expire

### 5. Fetch Your Analytics

```bash
npm run fetch
```

This runs the ETL job:
- 🚩 Lists all your videos
- 🚩 Queries metrics in batches
- 🚩 Computes KPIs and velocities
- 🚩 Saves data to CSV and JSON

### 6. View the Dashboard

```bash
npm run dev
```

Then open: **http://localhost:5173**

The dashboard includes:
- **Overview tiles**: Totals, medians, trends
- **Filters**: Date range, duration buckets, hashtags, top movers
- **Video table**: Sortable, searchable, with detailed view

## 📁 Project Structure

```
tiktok-analytics/
├── src/
│   ├── backend/
│   │   ├── types.ts           # TypeScript interfaces
│   │   ├── oauth.ts           # OAuth flow & token refresh
│   │   ├── tiktokClient.ts    # API client (list/query videos)
│   │   ├── kpis.ts            # KPI calculations
│   │   ├── persist.ts         # CSV/JSON export
│   │   ├── fetchJob.ts        # Main ETL job
│   │   └── server.ts          # Express API server
│   └── frontend/
│       ├── components/
│       │   ├── Overview.tsx   # Performance tiles
│       │   ├── Filters.tsx    # Filter controls
│       │   └── VideoTable.tsx # Video data table
│       ├── App.tsx            # Main app
│       ├── main.tsx           # Entry point
│       └── types.ts           # Frontend types
├── data/
│   ├── tiktok_video_metrics.csv  # Exported metrics
│   ├── data.json                 # Frontend data
│   └── snapshots.json            # Historical snapshots
├── package.json
├── vite.config.ts
└── README.md
```

## 🔄 Workflow

### Daily Usage
1. **Morning**: Run `npm run fetch` to pull latest data
2. **Analysis**: View dashboard to spot patterns
3. **Action**: Identify top performers and underperformers

### Setting Up Automated Pulls
Add to your crontab (runs daily at 9 AM):
```bash
0 9 * * * cd /path/to/tiktok-analytics && npm run fetch
```

Or use a GitHub Action, Zapier, or any scheduler.

## 📈 Understanding the Metrics

### Engagement Rate
Measures overall interaction quality:
```
(likes + comments + shares) / views
```
Higher = more engaging content

### View Velocity
Measures how fast views are growing:
```
(current_views - views_24h_ago) / 24 hours
```
High velocity = content is trending

### Top Movers
Videos with the highest 24h velocity. These are your current trending videos.

### Duration Buckets
- **Short** (<10s): Quick hooks
- **Medium** (10-20s): Standard format
- **Long** (>20s): Deep dives

## 🎨 Dashboard Features

### Overview Tiles
- Total views, likes, comments, shares
- Median engagement rate
- Average velocity (24h)
- Posts per day (30-day rolling)

### Filters
- **Search**: Find videos by caption text
- **Date Range**: Focus on specific time periods
- **Duration**: Filter by video length
- **Hashtag**: Find videos with specific tags
- **Top Movers**: Show fastest-growing videos

### Video Table
- Click any row to see full details
- Sort by: Posted date, views, engagement, velocity
- Visual thumbnails (when available)
- Hashtag chips for quick reference

## 🛠️ Commands

| Command | Description |
|---------|-------------|
| `npm run auth` | Authenticate with TikTok (one-time) |
| `npm run fetch` | Pull latest analytics data |
| `npm run dev` | Start dashboard (backend + frontend) |
| `npm run server` | Start backend API only |
| `npm run build` | Build frontend for production |

## 🔐 Security Notes

- `.env` file is gitignored (never commit credentials)
- Access tokens expire in ~24 hours but auto-refresh
- Refresh tokens last much longer but can be revoked
- If tokens are revoked, run `npm run auth` again

## 📊 Data Export

Data is saved in multiple formats:

### CSV (`data/tiktok_video_metrics.csv`)
Columns:
```
id, posted_at_iso, duration_s, caption, hashtags,
views, likes, comments, shares,
engagement_rate, like_rate, comment_rate, share_rate,
views_24h, views_48h, velocity_24h, velocity_48h
```

### JSON (`data/data.json`)
Used by the frontend dashboard. Full video objects with all metrics.

### Snapshots (`data/snapshots.json`)
Historical data points for velocity calculation. Auto-cleans to keep last 7 days.

## 🚧 Limitations

1. **No Watch Time**: Display API doesn't expose average watch time for organic videos
2. **No Saves**: Favorite/save counts aren't available via API
3. **Rate Limits**: TikTok has rate limits; we add delays between batches
4. **Thumbnail Expiry**: Cover image URLs expire after 6 hours (refreshed on each fetch)

**Workaround**: Run best organic videos as Spark Ads to get watch time data in Ads Manager.

## 🎯 Roadmap

### Phase 2: Creative Intelligence (In Progress)

**Goal**: Add AI-powered video analysis to understand what creative elements work and why.

#### **Implementation Checklist:**
- [ ] Infrastructure setup (PostgreSQL, Redis, S3)
- [ ] Video ingestion pipeline (download, CDN storage)
- [ ] Frame extraction (keyframes at 0, 1, 2, 3, 5, 10, 25, 50, 75%)
- [ ] Speech-to-text (ASR) with OpenAI Whisper or whisper.cpp
- [ ] On-screen text detection (OCR) with Google Vision API or Tesseract
- [ ] Scene cut and motion analysis (PySceneDetect/FFmpeg)
- [ ] Audio feature extraction (music/speech/BPM detection)
- [ ] Visual tagging with CLIP/BLIP (composition, subjects, emotion)
- [ ] Caption and hashtag analysis (hook alignment, trend scoring)
- [ ] Deterministic scoring engine (6 core metrics: Hook, Depth, Clarity, Pacing, CTA, Brand Fit)
- [ ] Visual-only metrics (16 metrics for silent videos)
- [ ] LLM critique layer with GPT-4/5 (optional enhancement)
- [ ] Findings generator (verdicts, opportunities, suggestions)
- [ ] Database schema migration for `video_ai_analysis` table
- [ ] Background job queue with BullMQ/Redis
- [ ] API endpoints (analyze, get analysis, summary stats)
- [ ] Enhanced UI components (score badges, status indicators)
- [ ] Video modal tabs (Overview, Hook, Story, Fixes, Visual, Artifacts)
- [ ] Backfill script for existing 105 videos
- [ ] Monitoring dashboard for job queue
- [ ] Cost tracking and optimization

#### **Expected Outputs per Video:**
- **Overall score** 0-100 integer (Pass ≥80, Revise 60-79, Reshoot <60)
- **6 core messaging scores** (Hook, Depth, Clarity, Pacing, CTA, Brand Fit) - all 0-10 integers
- **3 pillar rollups** (Attention, Visual Craft, Message & CTA) - all 0-10 integers
- **16 visual-only scores** (for silent/aesthetic videos) - all 0-10 integers
- **Silent-friendly flag** (boolean: works without sound)
- **Classification tags** (angle, hook type, content type, composition, emotion)
- **Policy flags** (compliance risks: e.g., "medical_claim", "before_after_sensitive")
- **Platform blockers** (TikTok/Meta-specific restrictions)
- **Structured findings** (hook verdict, depth analysis, retention opportunities, LLM reasoning)
- **3-5 prioritized fix suggestions** (high/medium/low priority with category tags)
- **Artifacts**: First frame thumbnail, hook strip (0-3s frames), keyframe gallery, transcript, OCR text, audio features

#### **Key Benefits:**
- Know exactly what creative elements drive performance
- Get actionable suggestions to improve underperforming videos
- Identify winning patterns across your content library
- Score new videos before posting to predict performance
- Understand silent videos (no speech needed for analysis)

### Phase 3: LLM Insights & Automation (Future)
- [ ] Pattern clustering and archetype detection
- [ ] Auto-generate creative briefs from top performers
- [ ] Content calendar with AI recommendations
- [ ] Competitive analysis (public videos in your niche)
- [ ] Trend alignment detection
- [ ] Brand safety and claims compliance guardrails
- [ ] Export to Google Sheets / BigQuery
- [ ] Slack/Discord notifications for insights

## 🤝 Contributing

This is a personal tool but feel free to fork and customize for your needs.

## 📝 License

MIT

---

**Built with**: Node.js, TypeScript, Express, React, Vite, Tailwind CSS

