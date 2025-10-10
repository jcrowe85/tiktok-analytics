# Quick Start Guide

Get up and running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- TikTok account with some videos
- TikTok Developer account (free)

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env
```

## Get TikTok Credentials

1. Go to https://developers.tiktok.com/
2. Create a new app
3. Add redirect URI: `http://localhost:3000/callback`
4. Enable scopes: `user.info.basic`, `video.list`
5. Copy Client Key and Client Secret to `.env`

## Run

```bash
# 3. Authenticate (one time)
npm run auth
# Opens browser → click "Authorize"

# 4. Fetch your data
npm run fetch
# Pulls all your videos + metrics

# 5. View dashboard
npm run dev
# Open http://localhost:5173
```

## That's it! 🎉

Your Phase 1 dashboard is now running with:
- Performance overview tiles
- Sortable video table  
- Filters (date, duration, hashtags)
- Top movers detection
- Engagement analytics

## Daily Usage

```bash
npm run fetch  # Pull latest data
npm run dev    # View dashboard
```

## What's Next?

### Phase 2: Creative Intelligence (Coming Soon)
Once Phase 1 is working, you can enable AI-powered video analysis:
- Video quality scoring (Hook, Depth, Clarity, Pacing, CTA, Brand Fit)
- Visual-only metrics (composition, aesthetics, emotion detection)
- Speech-to-text transcripts
- On-screen text detection (OCR)
- LLM-powered critique and fix suggestions
- Enhanced UI with detailed analysis tabs

See [PHASE2_SPEC.md](PHASE2_SPEC.md) for full specifications.

### Phase 3: LLM Insights & Automation (Future)
- Pattern clustering and creative archetypes
- Automated creative briefs
- Content calendar with AI recommendations
- Competitive analysis
- Brand safety and compliance guardrails

---

See [SETUP.md](SETUP.md) for detailed instructions and [README.md](README.md) for complete documentation.

