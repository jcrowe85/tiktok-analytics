# Phase 2: Cost & Timeline Analysis
**TikTok Creative Intelligence Implementation**

---

## 📊 Executive Summary

**Implementation Time**: 3-4 weeks (part-time) or 2 weeks (full-time)  
**Initial Setup Cost**: ~$35 (one-time)  
**Monthly Operating Cost**: ~$75-140/month  
**Development Effort**: ~34 hours with Cursor assistance  
**ROI**: Replaces $150K/year creative director role

---

## ⏱️ Time Estimates

### **Total Development Time:**

| Scenario | Hours/Week | Duration | Total Hours |
|----------|------------|----------|-------------|
| **Full-Time Focus** | 40 hrs/week | 2 weeks | 80 hours |
| **Part-Time** | 10-15 hrs/week | 4-6 weeks | 40-60 hours |
| **Nights/Weekends** | 5-10 hrs/week | 6-10 weeks | 30-50 hours |

**With Cursor Assistance**: **~34 hours** (vs 113 hours traditional)  
**Speed Multiplier**: **3.3x faster**

---

## 📅 Week-by-Week Breakdown

### **Week 1: Infrastructure Setup**
**Total Time**: 5-8 hours

#### Human Tasks (3-4 hours):
| Task | Time | Details |
|------|------|---------|
| AWS account setup | 30 min | Sign up, create S3 bucket, get credentials |
| OpenAI API setup | 5 min | Get API key, add $20 credits |
| Google Cloud Vision | 30 min | Enable API, create service account, download JSON key |
| PostgreSQL setup | 30 min | Docker Compose or managed service (RDS/DigitalOcean) |
| Redis installation | 5 min | Docker Compose |
| Configure `.env` | 10 min | Copy all API keys |
| **Subtotal** | **2-3 hrs** | Mostly clicking through dashboards |

#### Cursor-Assisted Development (2-5 hours):
| Task | Time | Your Prompts |
|------|------|--------------|
| Database migrations | 30 min | "Create Postgres migration from PHASE2_SPEC schema" |
| S3 utilities | 30 min | "Build S3 upload service for keyframes with AWS SDK" |
| BullMQ queue setup | 30 min | "Set up BullMQ job queue with Redis connection" |
| Docker Compose updates | 15 min | "Add Postgres and Redis to docker-compose.yml" |
| Test infrastructure | 30 min | Manual verification all services connect |
| **Subtotal** | **2-3 hrs** | Cursor generates, you test |

---

### **Week 2: Media Processing Pipeline**
**Total Time**: 12-16 hours

#### Human Tasks (2-3 hours):
| Task | Time | Details |
|------|------|---------|
| Install FFmpeg locally | 30 min | `brew install ffmpeg` + test |
| Test Whisper API | 30 min | Send sample audio, verify transcript |
| Test Vision API | 30 min | Send sample frame, verify OCR |
| Configure rate limits | 30 min | Review API quotas, set concurrency |
| **Subtotal** | **2 hrs** | Verify APIs work |

#### Cursor-Assisted Development (10-13 hours):
| Task | Time | Your Prompts |
|------|------|--------------|
| Video download service | 45 min | "Create video download service from TikTok URL" |
| FFmpeg keyframe extraction | 1 hr | "Extract keyframes at 0,1,2,3,5,10,25,50,75% using FFmpeg" |
| Audio extraction | 30 min | "Extract audio from video as WAV using FFmpeg" |
| Whisper integration | 1 hr | "Integrate OpenAI Whisper for speech-to-text transcription" |
| Vision OCR integration | 1 hr | "Integrate Google Vision OCR to extract text from keyframes" |
| Scene cut detection | 1.5 hrs | "Implement scene cut detection using FFmpeg histogram diff" |
| Audio analysis | 1 hr | "Detect music vs speech and estimate BPM from audio" |
| CLIP/BLIP integration | 1.5 hrs | "Integrate CLIP for visual tagging of composition and subjects" |
| Pipeline orchestrator | 1 hr | "Orchestrate all processing steps in parallel with error handling" |
| Test full pipeline | 1 hr | Run on 5 test videos, verify all artifacts |
| **Subtotal** | **10-11 hrs** | Cursor handles API SDKs, you verify outputs |

---

### **Week 3: Scoring Engine + LLM**
**Total Time**: 10-14 hours

#### Human Tasks (3-4 hours):
| Task | Time | Details |
|------|------|---------|
| Review scoring rubric | 2 hrs | Read PHASE2_SPEC rubric section thoroughly |
| Test LLM prompts | 1 hr | Manually test prompt with GPT-4 Playground |
| Tune prompt templates | 1 hr | Iterate on findings quality |
| **Subtotal** | **4 hrs** | Understanding + tuning |

#### Cursor-Assisted Development (6-10 hours):
| Task | Time | Your Prompts |
|------|------|--------------|
| Hook scoring function | 30 min | "Implement Hook scoring from PHASE2_SPEC rubric" |
| Depth scoring function | 30 min | "Implement Depth scoring from PHASE2_SPEC rubric" |
| Clarity/Pacing/CTA/Brand | 1.5 hrs | "Implement remaining 4 core scoring functions" |
| Visual scoring (16 metrics) | 2 hrs | "Implement all 16 visual scoring functions from spec" |
| Pillar rollups | 30 min | "Calculate 3 pillar rollups by averaging component scores" |
| Quality band logic | 15 min | "Compute quality_band: Pass ≥80, Revise 60-79, Reshoot <60" |
| Silent-friendly flag | 15 min | "Compute is_silent_friendly from silent_comprehension and text_legibility" |
| LLM prompt builder | 30 min | "Build GPT-4 prompt from PHASE2_SPEC template" |
| LLM parser + clamping | 45 min | "Parse LLM response with ±2 delta clamping" |
| Fail-open fallback | 30 min | "Add try/catch to fall back to deterministic if LLM fails" |
| Findings generator | 1 hr | "Generate hook_verdict, depth_verdict from scores + context" |
| Fix suggestions | 1 hr | "Generate 3-5 prioritized fix suggestions with categories" |
| Test scoring | 1 hr | Run on 10 videos, validate scores make sense |
| **Subtotal** | **10 hrs** | Cursor generates from rubric, you validate logic |

---

### **Week 4: Integration + UI + Testing**
**Total Time**: 12-16 hours

#### Human Tasks (4-5 hours):
| Task | Time | Details |
|------|------|---------|
| Review UI mockups | 1 hr | Check modal tabs, badge designs |
| Manual testing | 2 hrs | Click through all features, verify UX |
| Backfill monitoring | 1 hr | Watch first 10 videos process, check for errors |
| Golden set creation | 1 hr | Hand-score 20 videos for calibration |
| **Subtotal** | **5 hrs** | Quality assurance |

#### Cursor-Assisted Development (7-11 hours):
| Task | Time | Your Prompts |
|------|------|--------------|
| Job processor | 2 hrs | "Create BullMQ processor to orchestrate full analysis pipeline" |
| API endpoints | 2 hrs | "Add POST /videos/:id/analyze and GET /videos/:id/analysis" |
| Enhanced modal tabs | 3 hrs | "Build 6-tab modal: Overview, Hook, Story, Fixes, Visual, Artifacts" |
| Score badges in list | 1 hr | "Add Hook, Attention, Overall badges to video list rows" |
| Hook carousel | 1 hr | "Build horizontal carousel for 0-3s keyframes in Hook tab" |
| Emoji emotion tags | 30 min | "Map emotion tags to emoji icons in Visual tab" |
| Silent-friendly badge | 15 min | "Show 🔇 badge if is_silent_friendly true" |
| Quality band colors | 15 min | "Color-code badges: Pass=green, Revise=yellow, Reshoot=red" |
| Reprocess button | 30 min | "Add reprocess button in Artifacts tab to re-run analysis" |
| Backfill script | 1 hr | "Create script to enqueue all 105 existing videos for analysis" |
| Functional tests | 2 hrs | "Write 6 functional tests from PHASE2_SPEC acceptance criteria" |
| Integration testing | 2 hrs | Run full pipeline on diverse videos |
| **Subtotal** | **15 hrs** | Cursor generates, you review/test |

---

## 💰 Cost Breakdown

### **One-Time Setup Costs:**

| Item | Cost | Notes |
|------|------|-------|
| AWS account | Free | Free tier: 5GB S3, 1M Lambda requests |
| OpenAI credits | $20 | Initial credits for testing |
| Google Cloud credits | $300 | Free trial credits (last ~3 months) |
| Development time | $0 | Your time (or ~$2,500 at $75/hr × 34 hrs) |
| **Total One-Time** | **$20-35** | Plus your time |

---

### **Monthly Operating Costs (100 videos/month):**

| Service | Usage | Unit Cost | Monthly Cost |
|---------|-------|-----------|--------------|
| **OpenAI Whisper** | 100 videos × 30s avg × $0.006/min | 50 minutes | **$0.30** |
| **Google Vision OCR** | 100 videos × 9 frames × $0.001/frame | 900 images | **$0.90** |
| **OpenAI GPT-4 (optional)** | 100 videos × 500 tokens avg × $0.01/1K | 50K tokens | **$0.50** |
| **AWS S3 Storage** | 100 videos × 9 frames × 50KB | ~45MB/month | **$0.01** |
| **S3 Bandwidth** | 100 videos × download/upload | Minimal | **$0.50** |
| **PostgreSQL** | DigitalOcean managed or Docker | Database | **$15-25** |
| **Redis** | DigitalOcean managed or Docker | Queue | **$10-15** |
| **VPS Upgrade** | More RAM for processing | +2GB RAM | **$10** |
| **CloudFront CDN** | Keyframe delivery (optional) | Minimal | **$5** |
| **SUBTOTAL (Managed)** | | | **$42-57/month** |

**Conservative Estimate with Buffer**: **$75-100/month**  
**High-Volume Estimate** (500 videos/month): **$100-140/month**

---

### **Cost Comparison:**

| Solution | Monthly Cost | Capabilities |
|----------|--------------|--------------|
| **Human Creative Director** | $12,500/month ($150K/year) | Reviews ~50 videos/month, subjective |
| **Phase 2 AI** | $75-140/month | Reviews unlimited videos, objective + consistent |
| **Savings** | **$12,360/month** | **99.4% cost reduction** |

---

## 📈 Scaling Costs

### **As Video Volume Grows:**

| Videos/Month | Whisper | Vision OCR | GPT-4 | Storage | Total/Month |
|--------------|---------|------------|-------|---------|-------------|
| **100** | $0.30 | $0.90 | $0.50 | $1 | **~$75** |
| **500** | $1.50 | $4.50 | $2.50 | $3 | **~$90** |
| **1,000** | $3.00 | $9.00 | $5.00 | $5 | **~$105** |
| **2,000** | $6.00 | $18.00 | $10.00 | $8 | **~$125** |

**Conclusion**: Scales linearly, stays under $150/month even at 2,000 videos/month.

---

## 🎯 ROI Analysis

### **Scenario 1: Prevent Bad Ad Spend**
- Bad video (score <60): Promoted with $500 ad spend
- Result: 0.5% CTR, $2.50 CPA, 200 clicks, 10 conversions
- **Loss**: $500 spent on poor creative

**With Phase 2**:
- Identify score <60 BEFORE promoting
- Reshoot with fixes → score 82
- Result: 2.1% CTR, $0.60 CPA, same 200 clicks, 42 conversions
- **Saved**: $500 wasted spend + 32 additional conversions

**Break-even**: Phase 2 pays for itself by preventing **1 bad ad campaign per year**.

---

### **Scenario 2: Scale Winners**
- Top video (score 93): 85K views organic
- Team doesn't know WHY it worked

**Without Phase 2**:
- Create 10 more videos, 2 hit, 8 flop (20% hit rate)
- Wasted effort on 8 videos

**With Phase 2**:
- AI identifies: "Silent aesthetic + philosophical overlay + awe emotion = winning pattern"
- Create 10 more following pattern, 7 hit, 3 flop (70% hit rate)
- **3.5x improvement** in hit rate

**ROI**: Saved ~50 hours of creator time (8 flops → 3 flops) = **$2,500 value**

---

### **Scenario 3: Compliance Prevention**
- Video uses "cures hair loss" (medical claim)
- Gets flagged by TikTok → account warning

**With Phase 2**:
- AI flags: `policy_flags: ["medical_claim"]`
- Suggests: `comms_safe_cta: "Support healthy hair growth naturally"`
- **Prevented**: Account warning, potential ban, reputational risk

**Value**: Priceless (account protection)

---

## 💼 Development Time Breakdown

### **Traditional Development (without Cursor):**

| Phase | Hours | Breakdown |
|-------|-------|-----------|
| Research & Planning | 16 | API docs, architecture design, schema design |
| Infrastructure Setup | 8 | AWS, GCP, Postgres, Redis setup |
| Boilerplate Code | 20 | API wrappers, database models, types |
| Media Processing | 20 | FFmpeg, download service, extraction |
| API Integrations | 16 | Whisper, Vision, CLIP/BLIP wrappers |
| Scoring Logic | 16 | 22 scoring functions, manual coding |
| LLM Layer | 8 | Prompt engineering, response parsing |
| Job Queue | 6 | BullMQ setup, processors, retry logic |
| UI Components | 20 | 6 modal tabs, badges, carousels |
| Testing | 12 | Unit + integration tests |
| Bug Fixes | 15 | Debugging, edge cases |
| **TOTAL** | **157 hrs** | **~4 weeks full-time** |

---

### **With Cursor Assistance:**

| Phase | Hours | What Cursor Does | What You Do |
|-------|-------|------------------|-------------|
| Research & Planning | 0 | N/A | Spec already complete ✅ |
| Infrastructure Setup | 3 | Generates Docker configs, migrations | Copy API keys, run commands |
| Boilerplate Code | 2 | Auto-generates all wrappers, types | Review, approve |
| Media Processing | 5 | Writes FFmpeg commands, download logic | Test with sample videos |
| API Integrations | 4 | Generates SDK code from docs | Add API keys, verify |
| Scoring Logic | 4 | Generates functions from rubric | Validate outputs |
| LLM Layer | 2 | Builds prompt + parser | Tune prompt quality |
| Job Queue | 1 | Sets up BullMQ from examples | Configure Redis URL |
| UI Components | 6 | Scaffolds React components | Polish styling |
| Testing | 3 | Writes tests from acceptance criteria | Run, validate |
| Bug Fixes | 4 | Suggests fixes for errors | Iterate on prompts |
| **TOTAL** | **34 hrs** | **~1 week full-time** |

**Cursor Saves**: 123 hours (78% time reduction)

---

## 💵 Detailed Cost Analysis

### **One-Time Setup Costs:**

| Item | Provider | Cost | Commitment |
|------|----------|------|------------|
| AWS Account | Amazon | Free | Credit card required |
| AWS S3 Bucket | Amazon | Free tier | 5GB free/month year 1 |
| OpenAI API Key | OpenAI | Free | No minimum |
| OpenAI Initial Credits | OpenAI | $20 | Prepaid credits |
| Google Cloud Account | Google | Free | Credit card required |
| GCP Free Credits | Google | $300 credit | 90 days free trial |
| Vision API Enabling | Google | Free | Part of GCP |
| PostgreSQL (DigitalOcean) | DigitalOcean | $15/month | Can cancel anytime |
| Redis (DigitalOcean) | DigitalOcean | $15/month | Can cancel anytime |
| **Total Setup** | | **$20-50** | Most is prepaid credits |

---

### **Monthly Operating Costs (Detailed):**

#### **Scenario A: 100 Videos/Month (Conservative)**

| Service | Calculation | Monthly Cost |
|---------|-------------|--------------|
| **OpenAI Whisper** | 100 videos × 30s avg ÷ 60 = 50 mins × $0.006/min | $0.30 |
| **Google Vision OCR** | 100 videos × 9 keyframes = 900 images × $0.001/image | $0.90 |
| **OpenAI GPT-4** | 100 videos × (500 input + 300 output tokens) × $0.03/1K input + $0.06/1K output | $3.30 |
| **AWS S3 Storage** | 100 videos × 9 frames × 50KB = 45MB × $0.023/GB | $0.001 |
| **S3 Requests** | 900 PUTs + 5000 GETs × $0.005/1K | $0.03 |
| **S3 Data Transfer** | 45MB out × $0.09/GB | $0.004 |
| **PostgreSQL** | DigitalOcean Managed 1GB | $15.00 |
| **Redis** | DigitalOcean Managed 25MB | $10.00 |
| **VPS RAM Upgrade** | +2GB for processing | $10.00 |
| **CloudFront (optional)** | Keyframe CDN delivery | $5.00 |
| **Buffer (20%)** | Unexpected overages | $8.00 |
| **TOTAL** | | **$52.50/month** |

#### **Scenario B: 500 Videos/Month (High Volume)**

| Service | Calculation | Monthly Cost |
|---------|-------------|--------------|
| **OpenAI Whisper** | 500 × 30s ÷ 60 = 250 mins × $0.006 | $1.50 |
| **Google Vision OCR** | 500 × 9 = 4,500 images × $0.001 | $4.50 |
| **OpenAI GPT-4** | 500 × 800 tokens avg × $0.03/1K | $12.00 |
| **S3 Storage** | 225MB × $0.023/GB | $0.01 |
| **S3 Requests** | 4,500 PUTs + 25K GETs | $0.15 |
| **PostgreSQL** | DigitalOcean 2GB | $25.00 |
| **Redis** | DigitalOcean 100MB | $15.00 |
| **VPS RAM** | +4GB | $20.00 |
| **CloudFront** | Higher traffic | $10.00 |
| **Buffer (20%)** | Overages | $17.00 |
| **TOTAL** | | **$105.16/month** |

---

### **Cost Optimization Strategies:**

| Strategy | Savings | Trade-off |
|----------|---------|-----------|
| **Use local Whisper** (whisper.cpp) | -$1.50/month | Need GPU, slower processing |
| **Use Tesseract OCR** (local) | -$4.50/month | Lower accuracy (~85% vs 98%) |
| **Skip LLM enhancement** | -$12.00/month | No refined critique, just deterministic |
| **Self-host Postgres/Redis** | -$40.00/month | More DevOps work, less reliable |
| **Use DigitalOcean Spaces** (vs S3) | -$0.50/month | Minimal difference |
| **Process only new videos** | -50% | No backfill of old content |

**Recommended**: Use managed services for reliability, optimize later if needed.

---

## 🕐 Timeline Scenarios

### **Scenario 1: Aggressive (Full-Time)**
**Target**: 2 weeks, 40 hrs/week

| Week | Focus | Hours | Deliverable |
|------|-------|-------|-------------|
| Week 1 | Infrastructure + Pipeline | 40 | All APIs integrated, first video analyzed |
| Week 2 | Scoring + UI + Testing | 40 | Full UI, 105 videos backfilled, launched |
| **Total** | | **80 hrs** | **Production-ready in 14 days** |

**Feasibility**: High if dedicated full-time, all APIs work smoothly

---

### **Scenario 2: Realistic (Part-Time)**
**Target**: 4 weeks, 10-15 hrs/week

| Week | Focus | Hours | Deliverable |
|------|-------|-------|-------------|
| Week 1 | Infrastructure + Accounts | 8 | Postgres, Redis, S3, all keys configured |
| Week 2 | Media Pipeline | 12 | Video download, FFmpeg, ASR, OCR working |
| Week 3 | Scoring + LLM | 10 | All scores computed, LLM integrated |
| Week 4 | UI + Backfill | 12 | Enhanced modal, 105 videos analyzed |
| **Total** | | **42 hrs** | **Production-ready in 4 weeks** |

**Feasibility**: Very high, most realistic for working professionals

---

### **Scenario 3: Relaxed (Nights/Weekends)**
**Target**: 8 weeks, 5-10 hrs/week

| Week | Focus | Hours | Deliverable |
|------|-------|-------|-------------|
| Weeks 1-2 | Infrastructure | 10 | All services set up |
| Weeks 3-4 | Media Pipeline | 12 | Processing working end-to-end |
| Weeks 5-6 | Scoring + LLM | 10 | Scoring complete, LLM integrated |
| Weeks 7-8 | UI + Testing | 12 | Full UI, tested, launched |
| **Total** | | **44 hrs** | **Production-ready in 8 weeks** |

**Feasibility**: High, good for side project pace

---

## 🚦 Risk Factors & Mitigation

### **Potential Blockers:**

| Risk | Probability | Impact | Mitigation | Time Cost |
|------|-------------|--------|------------|-----------|
| **API rate limits** | Medium | High | Start with low concurrency (5 jobs), adjust | +1-2 days |
| **FFmpeg complexity** | Low | Medium | Use Cursor to generate commands, test locally | +4 hours |
| **LLM prompt tuning** | High | Low | Start with deterministic only, add LLM later | +8 hours |
| **CLIP/BLIP hosting** | Medium | Medium | Use OpenAI Vision API instead of local CLIP | +4 hours |
| **Postgres performance** | Low | Medium | Proper indexes (already in spec) | +2 hours |
| **S3 upload failures** | Low | Low | Retry logic (already in spec) | +2 hours |
| **Backfill taking too long** | High | Low | Run overnight, process 5 concurrent | 0 (overnight) |

**Most Likely Blocker**: LLM prompt quality (plan 4-8 hours of iteration)

---

## ✅ Readiness Checklist

### **Before Starting Phase 2:**

**Accounts & Access:**
- [ ] AWS account with S3 bucket created
- [ ] OpenAI API key with $20 credits
- [ ] Google Cloud project with Vision API enabled
- [ ] PostgreSQL accessible (Docker or managed)
- [ ] Redis accessible (Docker or managed)
- [ ] All credentials in `.env.phase2`

**Development Environment:**
- [ ] FFmpeg installed locally (`brew install ffmpeg`)
- [ ] Node.js 18+ and npm
- [ ] Docker Desktop running
- [ ] Cursor IDE set up
- [ ] Phase 1 working (http://analytics.tryfleur.com:8080)

**Documentation Reviewed:**
- [ ] Read PHASE2_OVERVIEW.md (this file)
- [ ] Skim PHASE2_SPEC.md (understand structure)
- [ ] Identify 20 videos for golden set calibration

**Budget Approved:**
- [ ] $20-50 one-time setup
- [ ] $75-140/month ongoing (varies with volume)

---

## 🚀 Getting Started (Day 1)

### **Morning (2 hours):**
1. Create AWS account → S3 bucket
2. Get OpenAI API key → add $20 credits
3. Enable Google Vision API → download service account JSON
4. Add all keys to `.env.phase2`

### **Afternoon (3 hours):**
1. Prompt Cursor: "Add Postgres and Redis to docker-compose.yml"
2. Prompt Cursor: "Create database migration from PHASE2_SPEC.md schema"
3. Run migrations: `npm run migrate`
4. Verify: `psql` shows `video_ai_analysis` table with 33 fields

### **End of Day 1:**
- ✅ All accounts created
- ✅ Infrastructure running locally
- ✅ Database schema deployed
- ✅ Ready to build pipeline tomorrow

**Day 1 Investment**: 5 hours + $35

---

## 📊 Effort by Role

| If You're A... | Your Time Investment | What You Focus On |
|----------------|----------------------|-------------------|
| **Full-Stack Developer** | 34 hours (prompt + review) | Cursor does heavy lifting, you guide + test |
| **Backend Developer** | 38 hours (+ learn React) | Cursor builds UI, you focus on pipeline |
| **Frontend Developer** | 40 hours (+ learn APIs) | Cursor builds backend, you polish UI |
| **Product Manager** | 50 hours (learn to code) | Cursor teaches you via prompts, slower but doable |

---

## 💡 Recommendations

### **Best Approach:**

**Week 1**: Infrastructure (Saturday 4 hours + Sunday 4 hours)
- Set up accounts, configure services, run migrations
- **Goal**: First video downloads and extracts successfully

**Week 2**: Pipeline (2 evenings × 3 hours + Saturday 6 hours)
- Integrate Whisper, Vision, FFmpeg
- **Goal**: Full pipeline works end-to-end for 1 test video

**Week 3**: Scoring (2 evenings × 3 hours + Sunday 4 hours)
- Build all scoring functions, LLM layer
- **Goal**: First video gets complete report card

**Week 4**: UI + Launch (Saturday 8 hours + Sunday 6 hours)
- Build modal tabs, badges, backfill videos
- **Goal**: All 105 videos analyzed, UI complete, team demo

**Total**: 42 hours over 4 weeks = **Very achievable** ✅

---

## 🎯 Bottom Line

**Time**: 3-4 weeks part-time (34-42 hours with Cursor)  
**Cost**: $35 setup + $75-140/month  
**ROI**: Saves $12,360/month vs human creative director  
**Payback**: First month (prevents 1 bad ad campaign)  

**With Cursor**: The spec is so detailed that 70-80% of code can be auto-generated. Your job is prompting, testing, and tuning - not typing boilerplate.

**Ready to start? The infrastructure setup takes just one Saturday.** 🚀

---

**Document Version**: 1.0  
**Last Updated**: October 9, 2025  
**For**: TikTok Analytics - Phase 2 Implementation Planning

