# Phase 2: Creative Intelligence - Complete Overview

> **One-stop reference for Phase 2 implementation. Combines spec details, improvements, and team benefits.**

---

## 🎯 What Phase 2 Does (For Non-Technical Teams)

### **The Problem Phase 1 Solves:**
You can see **WHAT** performed well (views, likes, engagement), but you don't know **WHY**.

### **What Phase 2 Adds:**
**Video Report Cards** - AI-powered creative intelligence that tells you exactly what works and how to improve.

### **Every Video Gets:**

#### **1. Scores (0-100 Report Card)**
- **Hook** (0-10): First 3 seconds strength
- **Depth** (0-10): Proof, explanation, demo quality
- **Clarity** (0-10): Easy to follow vs confusing
- **Pacing** (0-10): Rhythm and timing
- **CTA** (0-10): Call-to-action clarity
- **Brand Fit** (0-10): Matches brand voice
- **Overall** (0-100): Weighted composite score
  - **80-100 = Pass** ✅ "Publish more like this!"
  - **60-79 = Revise** ⚠️ "Good, needs tweaks"
  - **0-59 = Reshoot** ❌ "Major issues"

#### **2. Findings (What the AI Noticed)**
- ✅ "Strong question in first 2 seconds - great thumb-stop!"
- ⚠️ "Mentioned results but didn't explain HOW it works"
- ❌ "Risk: 'Cure hair loss' is a medical claim - could get flagged"

#### **3. Fix Suggestions (Prioritized Actions)**
- **HIGH**: "Rewrite hook: Start with 'What if...' instead of product name"
- **MEDIUM**: "Add before/after at 5-second mark"
- **LOW**: "Add trending sound"

---

## 🔬 Technical Overview

### **What Gets Analyzed (All Sources Combined):**

1. **Speech Transcription (ASR)** - Everything creator says with timestamps
2. **On-Screen Text (OCR)** - Text overlays, titles, product callouts
3. **Caption/Description** - Hook reinforcement, CTAs, brand keywords
4. **Hashtags** - Trend alignment, relevance, spam detection
5. **Visual Elements** - Composition, aesthetics, subjects, emotion
6. **Audio Features** - Music detection, BPM, speech ratio
7. **Scene Analysis** - Cuts, motion, shot types

### **Processing Pipeline:**

```
Video URL
    ↓
Download → Extract (audio + keyframes)
    ↓
Parallel Processing:
  ├─ ASR: Speech-to-text with Whisper
  ├─ OCR: On-screen text with Google Vision/Tesseract
  ├─ Audio: Music/speech/BPM detection
  ├─ Scenes: Cut detection, motion analysis
  ├─ Visual: CLIP/BLIP tagging (composition, subjects, emotion)
  └─ Metadata: Caption + hashtag analysis
    ↓
Deterministic Scoring (rule-based 0-10 per metric)
    ↓
Optional LLM Enhancement (GPT-4/5 with ±2 clamping)
    ↓
Generate Findings + Prioritized Fixes
    ↓
Save to Database + S3
    ↓
Display in Enhanced UI
```

### **Output Schema (25+ Fields per Video):**

```typescript
{
  // Core Scores (ALL INTEGERS)
  scores: {
    hook_strength: 0-10,
    depth: 0-10,
    clarity: 0-10,
    pacing: 0-10,
    cta: 0-10,
    brand_fit: 0-10,
    overall_100: 0-100
  },
  
  // Pillar Rollups (for fast UI sorting)
  pillars: {
    attention: 0-10,      // First impression
    visual_craft: 0-10,   // Production quality
    message_cta: 0-10     // Communication
  },
  
  // Quality Band
  quality_band: 'Pass' | 'Revise' | 'Reshoot',
  
  // Visual Scores (16 metrics, 0-10 each)
  visual_scores: { thumbstop_prob, first_frame_strength, silent_comprehension, ... },
  
  // Silent-Friendly Flag
  is_silent_friendly: true/false, // Works without sound
  
  // Classifications
  classifiers: {
    angle: "transformation",
    hook_type: ["question", "curiosity"],
    content_types: ["demo", "before_after"],
    shot_types: ["close_up", "wide"],
    emotion_tags: ["awe", "joy"]
  },
  
  // Compliance & Risk
  policy_flags: ["medical_claim"], // Specific risks
  platform_blockers: ["tiktok_pharma"],
  comms_safe_cta: "Support hair health naturally 👆", // Safe alternative
  
  // Findings
  findings: {
    hook_verdict: "Strong opening...",
    depth_verdict: "Good explanation...",
    retention_ops: ["Add before/after", "Show mechanism"],
    llm_reasoning_notes: "Adjusted Hook +1 due to strong visual opener"
  },
  
  // Prioritized Fixes
  fix_suggestions: [
    { priority: "high", suggestion: "...", category: "hook" }
  ],
  
  // Artifacts
  artifacts: {
    transcript: [...],
    ocr_text: [...],
    first_frame_thumbnail_url: "...",
    hook_strip_urls: ["...", "...", "..."], // 0-3s frames
    keyframes: [...],
    audio_features: {...},
    scene_cuts: [...]
  }
}
```

---

## 🔧 Key Technical Improvements

### **1. All Scores are Integers**
- Component scores: 0-10 (rounded with `Math.round()`)
- Overall score: 0-100 (weighted composite)
- Pillar rollups: 0-10 (rounded **after** averaging)
- **Why**: No floating-point issues, faster queries, simpler UI

### **2. LLM Guardrails**
- **±2 Delta Clamping**: LLM can only adjust scores by maximum 2 points
- **Strict JSON Mode**: Schema validation on all LLM responses
- **Fail-Open**: Falls back to deterministic scores if LLM fails
- **Reasoning Notes**: Captures why LLM adjusted scores
- **Example**:
  ```
  Base Hook: 6
  LLM suggests: 9 (delta = +3)
  Clamped: +2 (max allowed)
  Final: 8
  ```

### **3. Compliance Detection**
- **Policy Flags**: Specific risks (e.g., "medical_claim", "before_after_sensitive")
- **Platform Blockers**: Platform-specific violations (e.g., "tiktok_pharma", "meta_personal_attributes")
- **Safe CTA Suggestions**: Auto-generated compliant alternatives when risk detected

### **4. Provenance Tracking**
- **Models Used**: ASR engine, OCR engine, vision model, LLM model
- **Rules Version**: Track scoring algorithm version
- **Content Hash**: SHA-256 of video for caching
- **Job ID**: SHA-256(video_id + content_hash + rules_version) for idempotency

### **5. Performance SLOs**
- **Per-video P95**: ≤ 120 seconds end-to-end
- **Stage Budgets**:
  - Download + Extract: ≤ 20s
  - ASR: ≤ 30s
  - OCR: ≤ 20s
  - Scene/Audio/Visual: ≤ 20s
  - Scoring: ≤ 5s
  - LLM: ≤ 25s
  - Persist: ≤ 5s
- **Retry Policy**: 3 attempts, exponential backoff

### **6. Quality Assurance**
- **Golden Set**: 20 hand-scored videos for calibration
- **Acceptance Criteria**: MAE ≤ 1.0 on Hook/Depth vs human judgment
- **6 Functional Tests**: Silent videos, weak hooks, formula validation, LLM fallback, batch processing, quality bands

---

## 💼 Business Value

### **For Creators:**
- ✅ **Know what to fix** before posting (not after it flops)
- ✅ **Learn from winners** - see exactly what worked
- ✅ **Stop guessing** - data-driven creative decisions
- ✅ **Save time** - AI watches every video, you focus on creating

### **For Marketing:**
- ✅ **Predict performance** before spending on ads
- ✅ **Identify patterns**: "Videos with questions in first 3s get 2x engagement"
- ✅ **Scale winners**: "Make 5 more like this 93/100 video"
- ✅ **Reduce waste**: Don't promote low-scoring content

### **For Compliance:**
- ✅ **Auto-detect risky claims** ("cure", "FDA-approved", medical terms)
- ✅ **Get safe alternatives**: "Don't say X, say Y instead"
- ✅ **Platform-specific warnings**: "This won't pass TikTok pharma rules"
- ✅ **Prevent takedowns**: Catch issues before posting

---

## 🎬 Real-World Examples

### **Example 1: "3 Hair Growth Ingredients" (Talking Head)**

**Phase 1 Data:**
- 15K views, 450 likes, 3% engagement
- Posted 3 days ago, 200 views/day velocity

**Phase 2 Adds:**

**Scores:**
- Hook: 9/10 ✅ (numbered list format)
- Depth: 6/10 ⚠️ (named ingredients but no mechanism explanation)
- Clarity: 10/10 ✅ (clear structure)
- Pacing: 9/10 ✅ (smooth overlay timing)
- CTA: 10/10 ✅ (clear "link in bio")
- Brand Fit: 10/10 ✅ (mentions "hormone-free")
- **Overall: 88/100 = Pass** ✅

**Findings:**
- ✅ "List format hooks viewers immediately - strong opener"
- ⚠️ "Named GHK-Cu but didn't explain WHAT it does (mechanism gap)"
- ✅ "Caption reinforces video message perfectly with urgency"

**Fix Suggestions:**
- **HIGH**: "Add 1 sentence explaining what each peptide does (0:05-0:08 mark)"
- **MEDIUM**: "Show close-up of serum texture when mentioning 'water-based'"
- **LOW**: "Consider adding trending sound for broader reach"

**Team Action**: Creator adds 5 seconds explaining peptide mechanisms → Next video scores 94/100

---

### **Example 2: Cathedral Video (Silent/Visual)**

**Phase 1 Data:**
- 85K views, 4.2K likes, 8% engagement (top performer!)

**Phase 2 Explains WHY:**

**Scores:**
- Hook: 10/10 ✅ (immediate spectacle + intriguing text overlay)
- Visual Aesthetics: 10/10 ✅ (stunning light through stained glass)
- Composition: 10/10 ✅ (symmetry, leading lines)
- Motion: 9/10 ✅ (smooth gimbal work)
- Pattern Interrupt: 10/10 ✅ (architecture vs typical beauty content)
- Emotion: 10/10 ✅ (awe trigger)
- Silent Comprehension: 9/10 ✅ (message clear via overlay)
- **Overall: 93/100 = Pass** ✅
- **is_silent_friendly: true** 🔇

**Findings:**
- ✅ "Immediate visual awe paired with philosophical intrigue = off-the-charts thumb-stop"
- ✅ "Universal emotion (awe) drives high save/share rates"
- ✅ "High production value signals premium brand quality"

**Why It Worked:**
- Visual spectacle stops scroll instantly
- Works without sound (perfect for silent scrolling)
- Pattern interrupt (architecture breaks beauty feed norms)
- Universal emotion (awe) = high shareability

**Team Insight**: "Make more aesthetic/architectural content with philosophical overlays" → New content pillar identified

---

### **Example 3: Low-Scoring Video (Learning Opportunity)**

**Phase 1 Data:**
- 800 views, 12 likes, 0.8% engagement (underperformer)

**Phase 2 Reveals:**

**Scores:**
- Hook: 3/10 ❌ (starts with product name, no intrigue)
- Depth: 4/10 ❌ (generic claims, no proof)
- Clarity: 7/10 ⚠️ (okay flow)
- CTA: 2/10 ❌ (vague "check us out")
- **Overall: 48/100 = Reshoot** ❌

**Findings:**
- ❌ "Hook is weak - product name doesn't stop scrollers"
- ❌ "Claims 'amazing results' but shows no proof or before/after"
- ⚠️ "Risk: Uses 'stops hair loss' - medical claim"

**Fix Suggestions:**
- **HIGH**: "Rewrite hook: Start with question 'Tired of hair falling out?' instead of 'Bloom Hair Serum'"
- **HIGH**: "Add before/after photo at 0:04 to prove claims"
- **HIGH**: "Replace 'stops hair loss' with 'supports healthy hair growth'"
- **MEDIUM**: "Strengthen CTA: 'Shop now - link in bio 👇' instead of 'check us out'"

**Team Action**: Don't promote this video, reshoot with fixes → Next attempt scores 76/100 (Revise tier)

---

## 🛠️ Technical Architecture

### **Technology Stack:**
- **Database**: PostgreSQL (33 fields per video)
- **Job Queue**: BullMQ + Redis (background processing)
- **Storage**: AWS S3 (keyframes, transcripts)
- **ASR**: OpenAI Whisper ($0.006/minute)
- **OCR**: Google Vision API or Tesseract
- **Visual AI**: CLIP/BLIP (composition, subjects, emotion)
- **LLM**: GPT-4/5 (optional enhancement)
- **Video**: FFmpeg (extraction, scene detection)

### **Cost Estimate:**
- Infrastructure: ~$20-30/month (Postgres + Redis)
- Storage: ~$5-10/month (S3 keyframes)
- API Costs: ~$50-100/month (Whisper + Vision + GPT-4/5)
- **Total: ~$75-140/month** for 100+ videos

---

## 📐 Key Technical Improvements

### **1. All Scores are Integers**
- No floating-point issues
- Faster database queries
- Simpler UI rendering

### **2. Pillar Rollups**
- 3 derived scores for faster UI:
  - **Attention**: First impression strength
  - **Visual Craft**: Production quality
  - **Message & CTA**: Communication effectiveness

### **3. LLM Guardrails**
- ±2 delta clamping (prevents hallucinations)
- Strict JSON mode (schema validation)
- Fail-open strategy (falls back to deterministic)
- Reasoning notes (transparency)

### **4. Compliance Detection**
- Policy flags (specific risks like "medical_claim")
- Platform blockers (TikTok/Meta-specific)
- Safe CTA suggestions when risk detected

### **5. Provenance Tracking**
- Models used (ASR, OCR, vision, LLM)
- Rules version (for calibration)
- Content hash (for caching)
- Job ID (idempotency)

### **6. Performance SLOs**
- Per-video P95: ≤ 120 seconds
- Retry policy: 3 attempts, exponential backoff
- Rate-limit aware backfill

### **7. Quality Assurance**
- Golden set: 20 hand-scored videos
- MAE ≤ 1.0 on Hook/Depth
- 6 functional tests

---

## 🗄️ Database Schema Highlights

**33 Fields per Video:**
- 6 core scores (hook, depth, clarity, pacing, cta, brand_fit) - INT 0-10
- 1 overall score (overall_100) - INT 0-100
- 3 pillar rollups (attention, visual_craft, message_cta) - INT 0-10
- 1 quality band (Pass/Revise/Reshoot) - VARCHAR
- 1 silent-friendly flag - INT 0/1
- 1 detected language - VARCHAR BCP-47
- 16 visual scores - JSONB
- Classifications - JSONB
- Policy flags - TEXT[]
- Platform blockers - TEXT[]
- Findings - JSONB
- Fix suggestions - JSONB
- Artifacts - JSONB
- 6 provenance fields (rules_version, engines, models, hashes)
- 3 timestamps (processed_at, created_at, updated_at)

**10 Performance Indexes:**
- video_id, job_id, status, overall_100, quality_band
- hook_strength, is_silent_friendly, processed_at
- policy_flags (GIN), classifiers (GIN)

---

## 🎨 Enhanced UI Features

### **Video List:**
- 🔇 Silent-friendly badge (if works without sound)
- 3 pillar mini-bars (Attention, Visual Craft, Message & CTA)
- Color-coded quality badge (Pass=green, Revise=yellow, Reshoot=red)
- Filter by quality band server-side

### **Video Modal (6 Tabs):**

**1. Overview Tab**
- All scores with progress bars
- Overall badge prominent at top
- Performance metrics from Phase 1

**2. Hook Tab**
- Carousel of 0-3s keyframes
- OCR text overlays shown
- Spoken hook transcript
- Caption alignment analysis
- Hook verdict + suggestions

**3. Story Tab**
- Full transcript with timestamps
- Depth verdict
- Retention opportunities
- Narrative arc visualization

**4. Fixes Tab**
- **High-priority** (red chips) at top - "Do this next"
- **Medium-priority** (yellow chips)
- **Low-priority** (gray chips)
- Category filters (hook/depth/cta/visual/compliance)

**5. Visual Tab**
- First frame analysis
- Composition breakdown
- Aesthetics rating
- Emotion tags with emoji (😮😊🤔😌😲)
- Shot types, subjects, pattern interrupts

**6. Artifacts Tab**
- Keyframe gallery (all 9 frames)
- Audio features visualization
- Scene cut timeline
- Raw JSON data
- Reprocess button

---

## ✅ Acceptance Criteria

### **Functional Requirements:**

1. ✅ **Silent video** (cathedral) scores Hook ≥8, Silent Comprehension ≥8, Pattern Interrupt ≥8
2. ✅ **Weak hook** gets specific 0-3s rewrite suggestion
3. ✅ **Overall_100** matches weighted formula exactly
4. ✅ **LLM unavailable** → falls back to deterministic + "LLM skipped" note
5. ✅ **Batch of 50 videos** processes under 120s P95 with no rate-limit errors
6. ✅ **Quality bands** label correctly (Pass/Revise/Reshoot)

### **Golden Set Calibration:**
- 20 hand-scored videos covering all content types
- MAE ≤ 1.0 on Hook and Depth scores
- Rank correlation ≥ 0.6 with retention metrics

---

## 📊 Post-MVP Analytics

### **Lift Chart:**
"Do high-scoring videos actually perform better?"
- Compare Overall score quartiles vs engagement/retention
- Validate that creative intelligence predicts performance

### **Pattern Table:**
"What hook types + angles work best?"
- Hook type × Angle performance matrix
- Identify winning combinations (e.g., "question + transformation = 85 avg score")

### **Creator Coaching Report:**
"Is the team improving over time?"
- 7-day rolling averages for Hook and Depth
- Track improvement deltas week-over-week

---

## 🔐 Privacy & Compliance

### **What We Store:**
- ✅ Keyframes only (9 frames per video, ~50KB)
- ✅ Transcripts (text only, no audio files)
- ✅ Scores and findings (small JSON)

### **What We DON'T Store:**
- ❌ Full video files (download temporarily, delete after processing)
- ❌ Full frames (only 9 keyframes)
- ❌ PII (emails, phones, SSNs auto-redacted from OCR)

### **Data Retention:**
- Keyframes: 90 days → delete from S3
- Transcripts: 1 year
- Scores/findings: Indefinite (tiny footprint)

---

## 🚀 Implementation Roadmap

### **Phase 2.1: Foundation** (Weeks 1-2)
- [ ] Set up PostgreSQL database
- [ ] Set up Redis + BullMQ
- [ ] Set up AWS S3 buckets
- [ ] Create database migrations
- [ ] Build video download service
- [ ] Implement FFmpeg extraction (audio + keyframes)

### **Phase 2.2: Processing Pipeline** (Weeks 3-4)
- [ ] Integrate OpenAI Whisper (ASR)
- [ ] Integrate Google Vision (OCR)
- [ ] Build scene cut detection (PySceneDetect)
- [ ] Build audio analysis (music/speech/BPM)
- [ ] Integrate CLIP/BLIP (visual tagging)

### **Phase 2.3: Scoring Engine** (Week 5)
- [ ] Build deterministic scoring functions (6 core metrics)
- [ ] Build visual scoring functions (16 metrics)
- [ ] Implement pillar rollups
- [ ] Calculate quality bands
- [ ] Compute is_silent_friendly flag

### **Phase 2.4: LLM Layer** (Week 6)
- [ ] Build LLM prompt templates
- [ ] Implement ±2 delta clamping
- [ ] Add strict JSON validation
- [ ] Build fail-open fallback
- [ ] Generate findings and fix suggestions

### **Phase 2.5: API & Queue** (Week 7)
- [ ] Build job queue processors
- [ ] Create API endpoints (analyze, get analysis, summary)
- [ ] Implement retry policy
- [ ] Add idempotency (job_id)
- [ ] Build backfill script

### **Phase 2.6: UI Integration** (Week 8)
- [ ] Add score badges to video list
- [ ] Build enhanced video modal with 6 tabs
- [ ] Add silent-friendly badge
- [ ] Add emoji emotion tags
- [ ] Build hook strip carousel
- [ ] Add reprocess button

### **Phase 2.7: Testing & Launch** (Week 9)
- [ ] Create golden set (20 hand-scored videos)
- [ ] Run 6 functional tests
- [ ] Validate MAE ≤ 1.0 calibration
- [ ] Backfill existing 105 videos
- [ ] Monitor performance (P95 under 120s)
- [ ] Launch to team

---

## 📈 Expected Outcomes

### **Week 1 After Launch:**
- All 105 videos scored
- Team can sort by Overall score
- Top 20 "Pass" videos identified for ad promotion
- Bottom 20 "Reshoot" videos flagged

### **Month 1 After Launch:**
- Patterns emerge: "Question hooks + before/after = 85 avg score"
- Creators improve: Team avg Hook score 5.2 → 6.8
- Fewer duds: % of Reshoot videos drops 40% → 15%

### **Quarter 1 After Launch:**
- Lift validated: Pass videos get 2.3x engagement vs Reshoot
- Creative archetypes identified for Phase 3 automation
- ROI proven: Spend only on 80+ scored videos

---

## 📚 Complete Documentation

1. **README.md** (488 lines) - Project overview with Phase 2 highlights
2. **PHASE2_SPEC.md** (1,247 lines) - Complete technical specification
3. **PHASE2_OVERVIEW.md** (this file) - One-stop reference combining all insights
4. **SETUP.md** (267 lines) - Installation and deployment
5. **QUICKSTART.md** (85 lines) - 5-minute getting started

---

## 🎯 Bottom Line

**Phase 1** = "Here's your stats" (views, likes, engagement)

**Phase 2** = "Here's WHY this worked and HOW to make it better" (creative intelligence)

**Phase 3** = "Here's what to post next week" (AI-generated briefs)

---

**Think of Phase 2 as hiring a creative director who:**
- ✅ Watches every video
- ✅ Grades every element (hook, story, visuals, CTA)
- ✅ Tells you exactly what to improve
- ✅ Flags compliance risks before posting
- ✅ Never sleeps, never costs $150K/year
- ✅ Learns from your top performers
- ✅ Provides instant feedback (120s per video)

**That's Phase 2.** 🎯

---

**Status**: Specification Complete ✅ | Ready for Implementation 🚀
**Last Updated**: October 9, 2025
**Version**: 2.1 (Production-Ready)

