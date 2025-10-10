# Phase 2: Creative Intelligence Layer

## 🎯 Objective

Enhance the TikTok analytics dashboard with AI-powered creative quality insights for each video. This phase adds structured scoring, visual analysis, and actionable recommendations to help identify what creative elements work and why.

## 📊 Core Capabilities

### 1. Video Quality Scoring (0-10 per metric)
**Messaging Metrics:**
- **Hook Strength** (weight ×3): Strength of first 3 seconds (speech/overlay/visual impact)
- **Depth** (weight ×3): Proof, mechanism, demo, or narrative depth
- **Clarity** (weight ×2): Logical flow, connectives, clear story arc
- **Pacing** (weight ×2): Shot cadence (1.5-4 cuts/10s), subtitle rhythm
- **CTA** (weight ×1): Presence, clarity, timing of call-to-action
- **Brand Fit** (weight ×1): Alignment with brand values (peptide/hormone-free messaging)

**Overall Score (0-100):**
```
((hook*3 + depth*3 + clarity*2 + pacing*2 + cta + brand_fit) * 2)
```

**Quality Bands:**
- ≥80 = Pass (publish as-is)
- 60-79 = Revise (minor fixes needed)
- <60 = Kill/Reshoot (major issues)

### 2. Visual-Only Metrics (for non-talking videos)
- **Thumb-Stop Probability**: First-frame salience (faces, color, spectacle)
- **First Frame Strength**: Composition & contrast at t=0
- **Silent Comprehension**: Message readable without sound
- **Visual Aesthetics**: Lighting, composition, color harmony
- **Composition**: Framing, symmetry, leading lines
- **Motion Dynamics**: Camera movement smoothness/reveals
- **Pattern Interrupt**: Feed-breaking visual novelty
- **Text Legibility**: Contrast, font size, padding
- **Text Timing Fit**: On-screen duration vs WPM
- **Emotion Score**: Degree of awe/joy/intrigue
- **Save/Share Trigger**: Beauty, utility, insider value
- **Loopability**: Seamless loop/cliffhanger potential
- **Trend Alignment**: Current format/sound usage
- **Cultural Resonance**: Recognizable place/icon tie-in
- **Brand Safety**: Policy compliance check
- **Claims Risk**: Health claims assessment

### 3. Classification System
- **Angle**: comparison | transformation | science | empowerment
- **Hook Type**: question | contrarian | curiosity | awe | shock
- **Content Types**: demo | story | before_after | lifestyle | tutorial
- **Visual Subjects**: Auto-detected (e.g., "cathedral, architecture, stained glass")
- **Composition Tags**: symmetry | leading_lines | central_focus | rule_of_thirds
- **Emotion Tags**: awe | serenity | joy | intrigue | surprise
- **Pattern Interrupt**: grand_scale | color_contrast | unexpected_angle

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  1. INGEST                                                   │
│  Input: TikTok video URL + metadata                         │
│  Process: Download video, store to CDN/S3                   │
│  Output: Local/S3 MP4 file                                  │
│  Tools: FFmpeg, AWS S3/CloudFront                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. MEDIA PREP                                               │
│  Input: MP4 video file                                      │
│  Process: Extract audio + keyframes at strategic points     │
│  Output: audio.wav, frames at {0,1,2,3,5,10,25,50,75}%     │
│  Tools: FFmpeg                                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. SPEECH (ASR)                                             │
│  Input: audio.wav                                           │
│  Process: Speech-to-text with timestamps                    │
│  Output: Transcript segments with timing                    │
│  Tools: OpenAI Whisper API or local whisper.cpp            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. ON-SCREEN TEXT (OCR)                                     │
│  Input: Keyframes                                           │
│  Process: Extract overlay text, especially first 5s         │
│  Output: OCR strings with positions                         │
│  Tools: Google Vision API / Tesseract                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  5. AUDIO FEATURES                                           │
│  Input: audio.wav                                           │
│  Process: Detect music/speech/BPM                           │
│  Output: {music_present, speech_present, bpm_rough}         │
│  Tools: librosa (Python) / Node audio libraries             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  6. SCENE CUTS & MOTION                                      │
│  Input: MP4 video                                           │
│  Process: Detect shot boundaries                            │
│  Output: {cuts_total, cuts_per_10s, motion_score}           │
│  Tools: PySceneDetect / FFmpeg histogram diff               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  7. VISUAL DESCRIPTORS                                       │
│  Input: Keyframes                                           │
│  Process: Caption scenes, detect composition & emotion      │
│  Output: {subjects, shot_type, composition_tags, emotion}   │
│  Tools: CLIP / BLIP / OpenAI Vision API                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  8. DETERMINISTIC SCORING                                    │
│  Input: All extracted features                              │
│  Process: Rule-based scoring 0-10 for each category         │
│  Output: base_scores object                                 │
│  Tools: Application logic (TypeScript)                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  9. LLM CRITIQUE (Optional Enhancement)                      │
│  Input: Compact JSON payload with all features              │
│  Process: Adjust scores ±2 points, generate insights        │
│  Output: Refined scores + findings + fix suggestions        │
│  Tools: GPT-4/5 with structured JSON output                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  10. PERSISTENCE                                             │
│  Input: Final scores + all artifacts                        │
│  Process: Save to database + S3                             │
│  Output: video_ai_analysis row in Postgres                  │
│  Tools: Postgres, S3                                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  11. UI DISPLAY                                              │
│  Input: Scores + artifacts from database                    │
│  Process: Render in video list and detail modal             │
│  Output: Interactive dashboard with scores and insights     │
│  Tools: React frontend                                      │
└─────────────────────────────────────────────────────────────┘
```

## 📏 Scoring Rules & Rounding

### **All Scores are Integers**
- **Component scores**: 0-10 integers, rounded with `Math.round()`
- **Overall score**: 0-100 integer, computed from weighted components
- **Pillar rollups**: 0-10 integers, rounded **after** averaging sub-metrics

### **LLM Adjustments are Clamped**
- LLM can adjust component scores by **±2 maximum**
- Adjustments are clamped: `clampedDelta = Math.max(-2, Math.min(2, delta))`
- Final overall_100 is **recomputed** from adjusted components (not directly adjusted by LLM)
- Example:
  ```
  Base Hook: 6
  LLM suggests: 9 (delta = +3)
  Clamped delta: +2 (max allowed)
  Final Hook: 8
  ```

### **Quality Bands**
- **Pass** (≥80): Publish as-is
- **Revise** (60-79): Minor fixes needed
- **Reshoot** (<60): Major issues, reshoot recommended

---

## 📐 Output Schema

```typescript
interface VideoAIAnalysis {
  video_id: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  analysis_schema_version: number; // Schema version for future changes (default: 1)
  
  // Core Messaging Scores (0-10, ALL INTEGERS, rounded with Math.round)
  scores: {
    hook_strength: number; // 0-10 integer
    depth: number; // 0-10 integer
    clarity: number; // 0-10 integer
    pacing: number; // 0-10 integer
    cta: number; // 0-10 integer
    brand_fit: number; // 0-10 integer
    overall_100: number; // 0-100 integer (weighted composite, recomputed from adjusted components)
  };
  
  // Pillar Rollups (0-10, ALL INTEGERS, rounded after averaging) - for faster UI sorting/filtering
  pillars: {
    attention: number; // Math.round(avg(thumbstop_prob, first_frame_strength, pattern_interrupt, silent_comprehension))
    visual_craft: number; // Math.round(avg(visual_aesthetics, composition, motion_dynamics, text_legibility, text_timing_fit))
    message_cta: number; // Math.round(avg(hook, depth, clarity, pacing, cta, brand_fit))
  };
  
  // Quality Band (computed string for server-side filtering/sorting)
  quality_band: 'Pass' | 'Revise' | 'Reshoot'; // Pass ≥80, Revise 60-79, Reshoot <60
  
  // Language Detection
  detected_language: string; // BCP-47 format (e.g., "en-US", "es-ES") - used for ASR model selection and legibility thresholds
  
  // Visual-Only Scores (0-10, ALL INTEGERS)
  visual_scores: {
    thumbstop_prob: number; // 0-10 integer
    first_frame_strength: number; // 0-10 integer
    silent_comprehension: number; // 0-10 integer
    visual_aesthetics: number; // 0-10 integer
    composition: number; // 0-10 integer
    motion_dynamics: number; // 0-10 integer (from scene analysis motion_score)
    pattern_interrupt: number; // 0-10 integer
    text_legibility: number; // 0-10 integer
    text_timing_fit: number; // 0-10 integer
    emotion_score: number; // 0-10 integer
    save_share_trigger: number; // 0-10 integer
    loopability: number; // 0-10 integer
    trend_alignment: number; // 0-10 integer
    cultural_resonance: number; // 0-10 integer
    // NOTE: brand_safety and claims_risk REMOVED - replaced by policy_flags and platform_blockers
  };
  
  // Silent-Friendly Flag (computed)
  is_silent_friendly: boolean; // true if silent_comprehension ≥7 AND text_legibility ≥7
  
  // Classification
  classifiers: {
    angle: string; // e.g., "comparison", "transformation", "science", "empowerment"
    hook_type: string[]; // e.g., ["question", "contrarian", "curiosity"]
    content_types: string[]; // e.g., ["demo", "story", "before_after"]
    shot_types: string[]; // e.g., ["wide", "close_up", "top_down", "establishing"]
    visual_subjects: string[]; // e.g., ["product", "hands", "face", "nature"]
    composition_tags: string[]; // e.g., ["symmetry", "leading_lines", "rule_of_thirds"]
    emotion_tags: string[]; // e.g., ["awe", "joy", "intrigue"] - shown with emoji in UI
    pattern_interrupt: string[]; // e.g., ["grand_scale", "color_contrast", "unexpected_angle"]
    // NOTE: risk REMOVED - see policy_flags
  };
  
  // Compliance & Risk (NEW - replaces brand_safety/claims_risk scores)
  policy_flags: string[]; // e.g., ["medical_claim", "before_after_sensitive", "restricted_keyword"]
  platform_blockers: string[]; // e.g., ["tiktok_pharma", "meta_personal_attributes"]
  comms_safe_cta: string | null; // Suggested CTA when risk > 7
  
  // LLM Findings
  findings: {
    hook_verdict: string;
    depth_verdict: string;
    retention_ops: string[];
    cta_notes: string;
    llm_reasoning_notes: string | null; // Why scores were adjusted (if LLM used)
  };
  
  // Actionable Suggestions (prioritized)
  fix_suggestions: {
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
    category: 'hook' | 'depth' | 'clarity' | 'pacing' | 'cta' | 'visual' | 'compliance';
  }[];
  
  // Extracted Artifacts
  artifacts: {
    transcript: TranscriptSegment[]; // See TranscriptSegment interface below
    ocr_text: OCRResult[]; // See OCRResult interface below
    keyframes: string[]; // S3 URLs (full set)
    first_frame_thumbnail_url: string; // S3 URL for first frame (for immediate UI render)
    hook_strip_urls: string[]; // S3 URLs for 0-3s frames (for hook analysis UI)
    audio_features: AudioFeatures; // See AudioFeatures interface below
    scene_cuts: SceneCut[]; // See SceneCut interface below
  };
  
  // Processing Metadata & Provenance
  processed_at: string;
  processing_time_ms: number;
  llm_used: boolean;
  rules_version: number; // Scoring rules version for calibration/comparison
  asr_engine: string; // e.g., "whisper-1", "whisper-large-v3"
  ocr_engine: string; // e.g., "google-vision-v1", "tesseract-5.0"
  vision_model: string; // e.g., "clip-vit-large-patch14", "blip-2"
  llm_model: string | null; // e.g., "gpt-4-turbo", "gpt-4o" (null if LLM not used)
  content_hash: string; // SHA-256 hash of video file for idempotency/caching
  job_id: string; // SHA-256(video_id + content_hash + rules_version) for queue idempotency
}

// Supporting Interfaces

interface TranscriptSegment {
  t0: number; // Start time in seconds
  t1: number; // End time in seconds
  text: string; // Transcribed text
  conf?: number; // Confidence score 0-1 (optional)
  lang?: string; // Language code (optional, if multi-language)
}

interface OCRResult {
  text: string; // Detected text
  ts: number; // Timestamp in seconds
  frame_url: string; // S3 URL of the source frame
  bbox: [number, number, number, number]; // [x, y, width, height] in pixels
  conf?: number; // Confidence score 0-1 (optional)
}

interface AudioFeatures {
  music_present: boolean;
  speech_present: boolean;
  bpm_rough: number | null; // Beats per minute (null if no music detected)
  speech_ratio: number; // 0-1, percentage of audio that is speech
}

interface SceneCut {
  timestamp: number; // Time in seconds
  type: 'cut' | 'fade' | 'dissolve'; // Transition type
  motion_intensity: number; // 0-10 scale
}
```

## 🗄️ Database Schema

```sql
CREATE TABLE video_ai_analysis (
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(255) UNIQUE NOT NULL,
  job_id VARCHAR(64) UNIQUE NOT NULL, -- SHA-256(video_id + content_hash + rules_version) for idempotency
  status VARCHAR(50) DEFAULT 'pending',
  analysis_schema_version INT NOT NULL DEFAULT 1,
  
  -- Core scores (ALL INTEGERS 0-10, rounded with Math.round)
  hook_strength INT CHECK (hook_strength BETWEEN 0 AND 10),
  depth INT CHECK (depth BETWEEN 0 AND 10),
  clarity INT CHECK (clarity BETWEEN 0 AND 10),
  pacing INT CHECK (pacing BETWEEN 0 AND 10),
  cta INT CHECK (cta BETWEEN 0 AND 10),
  brand_fit INT CHECK (brand_fit BETWEEN 0 AND 10),
  overall_100 INT CHECK (overall_100 BETWEEN 0 AND 100), -- RENAMED from overall_score for consistency
  
  -- Quality band (computed string for server-side filtering)
  quality_band VARCHAR(10) CHECK (quality_band IN ('Pass', 'Revise', 'Reshoot')), -- Pass ≥80, Revise 60-79, Reshoot <60
  
  -- Language detection
  detected_language VARCHAR(10), -- BCP-47 format (e.g., "en-US")
  
  -- Pillar rollups (ALL INTEGERS 0-10) for faster UI sorting
  pillars JSONB, -- { attention: INT, visual_craft: INT, message_cta: INT }
  
  -- Visual scores (ALL INTEGERS 0-10, stored as JSONB)
  visual_scores JSONB,
  
  -- Silent-friendly flag
  is_silent_friendly INT CHECK (is_silent_friendly IN (0, 1)), -- Boolean as 0/1
  
  -- Classifications
  classifiers JSONB,
  
  -- Compliance & Risk (NEW)
  policy_flags TEXT[], -- e.g., ["medical_claim", "before_after_sensitive"]
  platform_blockers TEXT[], -- e.g., ["tiktok_pharma", "meta_personal_attributes"]
  comms_safe_cta TEXT, -- Suggested CTA when risk > 7
  
  -- Findings
  findings JSONB, -- Includes llm_reasoning_notes
  fix_suggestions JSONB, -- Array of { priority, suggestion, category }
  
  -- Artifacts (references to S3)
  artifacts JSONB, -- Includes first_frame_thumbnail_url, hook_strip_urls
  first_frame_thumbnail_url TEXT, -- Denormalized for fast list rendering
  hook_strip_urls TEXT[], -- Denormalized for fast hook tab rendering
  
  -- Processing Metadata & Provenance
  processed_at TIMESTAMP,
  processing_time_ms INTEGER,
  llm_used BOOLEAN DEFAULT false,
  rules_version INT NOT NULL DEFAULT 1, -- Scoring rules version
  asr_engine VARCHAR(50), -- e.g., "whisper-1"
  ocr_engine VARCHAR(50), -- e.g., "google-vision-v1"
  vision_model VARCHAR(50), -- e.g., "clip-vit-large-patch14"
  llm_model VARCHAR(50), -- e.g., "gpt-4-turbo" (NULL if LLM not used)
  content_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of video file
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_video_id ON video_ai_analysis(video_id);
CREATE INDEX idx_job_id ON video_ai_analysis(job_id); -- For idempotency checks
CREATE INDEX idx_status ON video_ai_analysis(status);
CREATE INDEX idx_overall_100 ON video_ai_analysis(overall_100); -- RENAMED from overall_score
CREATE INDEX idx_quality_band ON video_ai_analysis(quality_band); -- For server-side filtering
CREATE INDEX idx_hook_strength ON video_ai_analysis(hook_strength);
CREATE INDEX idx_is_silent_friendly ON video_ai_analysis(is_silent_friendly);
CREATE INDEX idx_processed_at ON video_ai_analysis(processed_at DESC); -- For time-based queries
CREATE INDEX idx_policy_flags ON video_ai_analysis USING GIN (policy_flags); -- GIN for array searches
CREATE INDEX idx_classifiers ON video_ai_analysis USING GIN (classifiers); -- GIN for JSONB searches
```

## 🛠️ Technology Stack

### Video Processing
- **Managed**: AWS MediaConvert, Google Video Intelligence
- **Self-hosted**: FFmpeg (recommended for cost + control)

### Speech Recognition (ASR)
- **Managed**: OpenAI Whisper API (accurate, $0.006/min)
- **Self-hosted**: whisper.cpp, faster-whisper (free, GPU-accelerated)

### OCR
- **Managed**: Google Vision API, AWS Textract
- **Self-hosted**: Tesseract (free, decent accuracy)

### Scene Detection & Motion
- **Managed**: AWS Rekognition Video
- **Self-hosted**: PySceneDetect, FFmpeg histogram diff

### Audio Analysis
- **Node.js**: node-audio-lib, music-tempo
- **Python**: librosa (recommended for BPM/music detection)

### Visual Tagging & Aesthetics
- **Managed**: OpenAI Vision API, CLIP API
- **Self-hosted**: LAION CLIP (local inference)

### LLM Critique
- **Managed**: OpenAI GPT-4/5 with structured outputs
- **Self-hosted**: Local LLM with JSON mode (fallback)

### Job Queue
- **BullMQ** (Node.js + Redis) - recommended
- **Celery** (Python + Redis)
- **RQ** (Python + Redis)

### Storage
- **Video/Audio**: AWS S3 + CloudFront CDN
- **Keyframes**: S3 or local filesystem
- **Database**: PostgreSQL (structured data + JSONB)

## 🎨 UI Integration

### Video List View
Add columns to the existing table:
```
| Thumbnail | Caption | Hook | Depth | Overall | Views | Engagement | Status |
|-----------|---------|------|-------|---------|-------|------------|--------|
```

- **Hook**: Badge (0-10) with color coding (≥8 green, 5-7 yellow, <5 red)
- **Depth**: Badge (0-10)
- **Overall**: Badge (0-100) with Pass/Revise/Kill label
- **Status**: Chip (pending/processing/done/error)

### Video Modal Detail View
Add tabs to the existing modal:

**1. Overview Tab** (default)
- Score bars for all 6 core metrics
- Overall score badge prominent at top
- Quick stats: Duration, posted date, performance metrics

**2. Hook Tab**
- Keyframes from 0-3 seconds
- OCR text overlays (if present)
- Hook verdict from LLM
- Specific improvement suggestions

**3. Story Tab**
- Full transcript with timestamps
- Depth verdict
- Retention opportunities
- Narrative arc visualization

**4. Fixes Tab**
- Actionable fix suggestions (bulleted)
- Priority ranking (high/medium/low)
- Example rewrites for captions/hooks

**5. Visual Tab**
- First frame analysis
- Composition score breakdown
- Emotion tags
- Aesthetics rating
- Pattern interrupt elements

**6. Artifacts Tab**
- Keyframe gallery (0, 25, 50, 75, 100%)
- Audio features visualization
- Scene cut timeline
- Raw data (JSON view)
- Reprocess button

## ⚙️ API Endpoints

### GET /api/videos/:id/analysis
Get AI analysis for a specific video.

**Response:**
```json
{
  "success": true,
  "data": {
    "video_id": "...",
    "status": "done",
    "scores": { ... },
    "visual_scores": { ... },
    "classifiers": { ... },
    "findings": { ... },
    "fix_suggestions": [ ... ],
    "artifacts": { ... }
  }
}
```

### POST /api/videos/:id/analyze
Trigger analysis for a video (or re-process).

**Request:**
```json
{
  "force_reprocess": false,
  "use_llm": true
}
```

**Response:**
```json
{
  "success": true,
  "job_id": "abc123",
  "status": "processing"
}
```

### GET /api/videos/analysis/summary
Get summary stats across all analyzed videos.

**Response:**
```json
{
  "total_analyzed": 105,
  "avg_overall_score": 72.5,
  "top_hooks": [...],
  "needs_improvement": [...],
  "processing_stats": {
    "pending": 5,
    "processing": 2,
    "done": 98,
    "error": 0
  }
}
```

## 🔄 Processing Pipeline

### 1. Job Queue Setup
```typescript
import Queue from 'bull';

const videoAnalysisQueue = new Queue('video-analysis', {
  redis: { host: 'localhost', port: 6379 }
});

videoAnalysisQueue.process(async (job) => {
  const { video_id, video_url } = job.data;
  
  // Update status
  await updateAnalysisStatus(video_id, 'processing');
  
  try {
    // Run pipeline
    const result = await analyzeVideo(video_id, video_url);
    
    // Save results
    await saveAnalysis(video_id, result);
    
    // Update status
    await updateAnalysisStatus(video_id, 'done');
    
    return result;
  } catch (error) {
    await updateAnalysisStatus(video_id, 'error');
    throw error;
  }
});
```

### 2. Video Analysis Function
```typescript
async function analyzeVideo(video_id: string, video_url: string) {
  const startTime = Date.now();
  
  // 1. Download video
  const videoPath = await downloadVideo(video_url, video_id);
  
  // 2. Extract media
  const { audioPath, keyframes } = await extractMedia(videoPath);
  
  // 3. Parallel processing
  const [transcript, ocrResults, audioFeatures, sceneCuts, visualTags] = 
    await Promise.all([
      transcribeAudio(audioPath),
      extractOCR(keyframes),
      analyzeAudio(audioPath),
      detectSceneCuts(videoPath),
      analyzeVisuals(keyframes)
    ]);
  
  // 4. Deterministic scoring
  const baseScores = calculateBaseScores({
    transcript,
    ocrResults,
    audioFeatures,
    sceneCuts,
    visualTags
  });
  
  // 5. LLM enhancement (optional)
  const finalScores = await enhanceWithLLM(baseScores, {
    transcript,
    ocrResults,
    visualTags
  });
  
  // 6. Generate findings
  const findings = generateFindings(finalScores, transcript, visualTags);
  
  // 7. Upload artifacts to S3
  const artifactUrls = await uploadArtifacts(video_id, {
    keyframes,
    audioPath,
    transcript
  });
  
  const processingTime = Date.now() - startTime;
  
  return {
    scores: finalScores,
    findings,
    artifacts: artifactUrls,
    processing_time_ms: processingTime
  };
}
```

### 3. Backfill Existing Videos
```typescript
async function backfillAnalysis() {
  const videos = await fetchAllVideos();
  
  for (const video of videos) {
    // Check if already analyzed
    const existing = await getAnalysis(video.id);
    if (existing && existing.status === 'done') continue;
    
    // Queue for analysis
    await videoAnalysisQueue.add({
      video_id: video.id,
      video_url: constructVideoUrl(video)
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    });
  }
}
```

## 🚦 Operational Considerations

### Fail-Open Strategy
If LLM or any component fails, fall back to deterministic scores:
```typescript
try {
  scores = await enhanceWithLLM(baseScores, context);
} catch (error) {
  console.warn('LLM enhancement failed, using base scores');
  scores = baseScores;
}
```

### Caching by Video Hash
Avoid re-processing identical videos:
```typescript
const videoHash = await hashVideo(videoPath);
const cached = await getCachedAnalysis(videoHash);
if (cached) return cached;
```

### Timeouts
Set aggressive timeouts to prevent job stalls:
- **ASR**: ≤ 60 seconds
- **OCR**: ≤ 30 seconds per frame
- **LLM**: ≤ 30 seconds
- **Total job**: ≤ 5 minutes

### Feature Flag
Roll out gradually:
```typescript
const FEATURE_CREATIVE_INTELLIGENCE = 
  process.env.FEATURE_CREATIVE_INTELLIGENCE === 'true';

if (FEATURE_CREATIVE_INTELLIGENCE) {
  // Show AI scores in UI
}
```

### Privacy
Store only thumbnails, not full frames:
```typescript
const thumbnailFrames = keyframes.filter((_, i) => 
  [0, 25, 50, 75, 100].includes(i * 100 / keyframes.length)
);
```

## 📏 Scoring Rubric Details

### Hook Strength (0-10)
**10**: Immediate visual spectacle OR provocative question OR shocking claim in first 2s
**7-9**: Strong opener with clear hook element but not immediately gripping
**4-6**: Soft intro, takes 3-5s to establish interest
**1-3**: Slow burn, no clear hook
**0**: Generic intro, no hook detected

**Detection:**
- Check OCR text in first 3s for questions/claims
- Check transcript for "Did you know..." / "What if..." patterns
- Check visual tags for faces, spectacle, contrast
- Check motion score for immediate action

### Depth (0-10)
**10**: Multiple proof points, mechanism explained, demo shown, references cited
**7-9**: Good explanation with some proof/demo
**4-6**: Surface-level, assertion without much backing
**1-3**: Vague claims, no substance
**0**: No depth, purely surface-level

**Detection:**
- Count unique concepts in transcript
- Detect demo/before-after via visual tags
- Identify mechanism keywords ("because", "the reason", "how it works")
- Check for data/stats in OCR or transcript

### Clarity (0-10)
**10**: Crystal clear arc, logical connectives, easy to follow
**7-9**: Mostly clear, minor tangents
**4-6**: Somewhat confusing, missing connectives
**1-3**: Jumbled, hard to follow
**0**: Incoherent

**Detection:**
- Count connective words ("so", "because", "then", "that's why")
- Check transcript for topic drift (semantic similarity between chunks)
- Check scene cuts for logical progression

### Pacing (0-10)
**10**: 2-3 cuts per 10s, smooth subtitle rhythm, no dead air
**7-9**: Good pace, minor lulls
**4-6**: Too slow or too frenetic
**1-3**: Drags or overwhelming
**0**: Static or chaotic

**Detection:**
- Calculate cuts_per_10s from scene detection
- Check subtitle duration (60-90 chars = 3-4.5s ideal)
- Detect dead air (silence >2s)

### CTA (0-10)
**10**: Clear, specific CTA with urgency ("Shop now", "Comment below")
**7-9**: CTA present but generic
**4-6**: Weak or vague CTA
**1-3**: Implied CTA only
**0**: No CTA

**Detection:**
- Search transcript for CTA keywords ("shop", "link", "comment", "follow")
- Check OCR for CTA text overlays
- Check if CTA appears in last 25% of video

### Brand Fit (0-10)
**10**: Perfect alignment with peptide/hormone-free/efficacy messaging
**7-9**: Good alignment, minor off-brand elements
**4-6**: Neutral, not harmful but not on-brand
**1-3**: Off-brand messaging
**0**: Contradicts brand values

**Detection:**
- Check transcript for brand keywords ("peptide", "hormone-free", "natural", "science")
- Check for competitor mentions (negative signal)
- Check for claims risk keywords ("cure", "treat", "FDA")

## 🛡️ LLM Guardrails & Contract

### **Strict JSON Mode**
- All LLM requests MUST use structured JSON output mode
- Provide explicit schema with required fields and types
- Reject responses that don't match schema

### **Score Delta Clamping**
```typescript
function applyLLMEnhancement(baseScores: Scores, llmAdjustments: Scores): Scores {
  const finalScores = { ...baseScores };
  
  for (const [key, baseValue] of Object.entries(baseScores)) {
    const llmValue = llmAdjustments[key];
    const delta = llmValue - baseValue;
    
    // Clamp delta to ±2
    const clampedDelta = Math.max(-2, Math.min(2, delta));
    finalScores[key] = Math.max(0, Math.min(10, baseValue + clampedDelta));
  }
  
  return finalScores;
}
```

### **LLM Prompt Template**
```typescript
const prompt = `
You are a creative analyst reviewing TikTok videos.

BASE SCORES (deterministic, 0-10 each):
Hook: ${baseScores.hook}
Depth: ${baseScores.depth}
Clarity: ${baseScores.clarity}
Pacing: ${baseScores.pacing}
CTA: ${baseScores.cta}
Brand Fit: ${baseScores.brand_fit}

CONTEXT:
- Transcript: ${transcript}
- OCR Text: ${ocrText}
- Caption: ${caption}
- Visual Tags: ${visualTags}

INSTRUCTIONS:
1. Review the base scores
2. Adjust each score by -2, -1, 0, +1, or +2 based on nuanced creative judgment
3. Provide SHORT reasoning for each adjustment (1 sentence max)
4. Generate 3 specific, actionable fix suggestions

Respond in STRICT JSON:
{
  "scores": {
    "hook": <0-10 integer>,
    "depth": <0-10 integer>,
    "clarity": <0-10 integer>,
    "pacing": <0-10 integer>,
    "cta": <0-10 integer>,
    "brand_fit": <0-10 integer>
  },
  "reasoning": {
    "hook": "<why adjusted>",
    "depth": "<why adjusted>",
    ...
  },
  "findings": {
    "hook_verdict": "<1-2 sentences>",
    "depth_verdict": "<1-2 sentences>",
    "retention_ops": ["<op1>", "<op2>"],
    "cta_notes": "<1 sentence>"
  },
  "fix_suggestions": [
    { "priority": "high|medium|low", "suggestion": "<specific action>", "category": "hook|depth|..." },
    ...
  ]
}
`;
```

### **Fail-Open Strategy**
```typescript
async function enhanceWithLLM(baseScores, context) {
  try {
    const response = await llm.complete(prompt, { 
      json_mode: true, 
      timeout: 30000 // 30s
    });
    
    // Validate response schema
    const validated = validateLLMResponse(response);
    
    // Apply clamped deltas
    return applyLLMEnhancement(baseScores, validated.scores);
  } catch (error) {
    console.warn('LLM enhancement failed, using deterministic scores');
    return {
      scores: baseScores,
      findings: generateDeterministicFindings(baseScores, context),
      llm_used: false
    };
  }
}
```

## 🎯 Operational SLOs

### **Per-Video Processing Budget**
- **Target P95**: ≤ 120 seconds end-to-end
- **Breakdown**:
  - Download + Extract: ≤ 20s
  - ASR (Whisper): ≤ 30s
  - OCR (all frames): ≤ 20s
  - Scene/Audio/Visual: ≤ 20s
  - Scoring: ≤ 5s
  - LLM (optional): ≤ 25s
  - Persist: ≤ 5s

### **Retry Policy**
```typescript
const retryConfig = {
  attempts: 3,
  backoff: 'exponential', // 5s, 10s, 20s
  retryableErrors: ['ETIMEDOUT', 'ECONNRESET', 'RATE_LIMIT'],
  onFinalFailure: (videoId, error) => {
    updateStatus(videoId, 'error');
    createHumanActionNote(videoId, 'Manual review required: ' + error.message);
  }
};
```

### **Backfill Throughput**
- **Parallel Jobs**: Configurable (default: 5 concurrent)
- **Rate Limit Awareness**: 
  - OpenAI Whisper: 50 requests/minute
  - Google Vision: 600 requests/minute
  - Adjust concurrency dynamically based on rate limit headers
- **Backfill Script**:
```typescript
async function backfillVideos(options = { concurrency: 5, batchSize: 100 }) {
  const videos = await getUn analyzedVideos(options.batchSize);
  
  for (const batch of chunk(videos, options.concurrency)) {
    await Promise.all(batch.map(video => 
      queue.add('video-analysis', { video_id: video.id })
    ));
    
    // Check rate limits
    await checkRateLimits();
  }
}
```

## ✅ Acceptance Criteria

### **Golden Set Calibration**
Define a golden set of ~20 hand-scored videos covering:
- Talking head (strong hook)
- Talking head (weak hook)
- Silent aesthetic (cathedral-style)
- Product demo
- Before/after transformation
- Tutorial/educational
- UGC testimonial
- Scenic B-roll with text overlay

**Requirements**:
- **MAE (Mean Absolute Error) ≤ 1.0** on Hook and Depth scores vs golden set
- **Rank correlation ≥ 0.6** with actual retention metrics (when available)

### **Functional Tests**

**Test 1: Silent Video (Cathedral)**
```typescript
test('Silent aesthetic video scores correctly', async () => {
  const result = await analyzeVideo(cathedralVideo);
  
  expect(result.scores.hook_strength).toBeGreaterThanOrEqual(8);
  expect(result.visual_scores.silent_comprehension).toBeGreaterThanOrEqual(8);
  expect(result.visual_scores.pattern_interrupt).toBeGreaterThanOrEqual(8);
  expect(result.is_silent_friendly).toBe(true);
  expect(result.overall_score).toBeGreaterThanOrEqual(80); // Pass
});
```

**Test 2: Weak Hook Gets Fix Suggestion**
```typescript
test('Weak hook video gets specific fix', async () => {
  const result = await analyzeVideo(weakHookVideo);
  
  expect(result.scores.hook_strength).toBeLessThanOrEqual(4);
  expect(result.fix_suggestions).toContainEqual({
    priority: 'high',
    category: 'hook',
    suggestion: expect.stringContaining('0-3s')
  });
});
```

**Test 3: Overall Score Matches Formula**
```typescript
test('Overall score matches weighted formula', async () => {
  const result = await analyzeVideo(testVideo);
  
  const expected = (
    result.scores.hook_strength * 3 +
    result.scores.depth * 3 +
    result.scores.clarity * 2 +
    result.scores.pacing * 2 +
    result.scores.cta * 1 +
    result.scores.brand_fit * 1
  ) * 2;
  
  expect(result.scores.overall_100).toBe(expected);
});
```

**Test 4: LLM Unavailable Fallback**
```typescript
test('Falls back to deterministic when LLM fails', async () => {
  mockLLM.mockRejectedValueOnce(new Error('Timeout'));
  
  const result = await analyzeVideo(testVideo);
  
  expect(result.llm_used).toBe(false);
  expect(result.scores.hook_strength).toBeGreaterThanOrEqual(0);
  expect(result.findings.llm_reasoning_notes).toBeNull();
});
```

**Test 5: Batch Processing Under SLO**
```typescript
test('Batch of 50 videos processes under P95 target', async () => {
  const videos = generateTestVideos(50);
  const start = Date.now();
  
  const results = await Promise.all(
    videos.map(v => analyzeVideo(v))
  );
  
  const processingTimes = results.map(r => r.processing_time_ms);
  const p95 = percentile(processingTimes, 0.95);
  
  expect(p95).toBeLessThanOrEqual(120000); // 120s
  expect(results.every(r => r.status === 'done')).toBe(true);
});
```

**Test 6: Quality Band Labels**
```typescript
test('Quality bands map correctly', async () => {
  const passVideo = await analyzeVideo(highQualityVideo);
  const reviseVideo = await analyzeVideo(mediumQualityVideo);
  const killVideo = await analyzeVideo(lowQualityVideo);
  
  expect(passVideo.overall_score).toBeGreaterThanOrEqual(80);
  expect(getBand(passVideo.overall_score)).toBe('Pass');
  
  expect(reviseVideo.overall_score).toBeGreaterThanOrEqual(60);
  expect(reviseVideo.overall_score).toBeLessThan(80);
  expect(getBand(reviseVideo.overall_score)).toBe('Revise');
  
  expect(killVideo.overall_score).toBeLessThan(60);
  expect(getBand(killVideo.overall_score)).toBe('Reshoot');
});
```

## 🎨 UI Enhancements

### **Video List**
- Show **Silent-Friendly badge** 🔇 if `is_silent_friendly = true`
- Display **3 pillar rollups** (Attention, Visual Craft, Message & CTA) as mini-bars
- Show **quality_band** as color-coded badge (Pass=green, Revise=yellow, Reshoot=red)
- Filter by **quality_band** server-side for fast queries

### **Video Modal**
- **Emotion tags** shown with emoji icons for fast scanning:
  - awe → 😮, joy → 😊, intrigue → 🤔, serenity → 😌, surprise → 😲
- **Hook tab**: Display `hook_strip_urls` (0-3s frames) in horizontal carousel
- **Fixes tab**: Show high-priority suggestions as red chips at top

---

## 📊 Analytics & Insights (Post-MVP)

### **Lift Chart**
```sql
-- Quartile analysis: Overall score vs engagement rate (NOTE: Scores are integers)
SELECT 
  quality_band, -- Use precomputed quality_band column
  COUNT(*) as video_count,
  ROUND(AVG(overall_100)) as avg_score, -- Integer average
  ROUND(AVG(engagement_rate)::numeric, 4) as avg_engagement, -- Float from TikTok OK
  ROUND(AVG(retention_rate)::numeric, 4) as avg_retention -- Float from TikTok OK
FROM video_ai_analysis
JOIN tiktok_videos ON video_ai_analysis.video_id = tiktok_videos.id
WHERE status = 'done'
GROUP BY quality_band
ORDER BY 
  CASE quality_band
    WHEN 'Pass' THEN 1
    WHEN 'Revise' THEN 2
    WHEN 'Reshoot' THEN 3
  END;
```

### **Pattern Table**
```sql
-- Hook type × Angle performance (NOTE: Scores are integers)
SELECT 
  classifiers->>'angle' as angle,
  jsonb_array_elements_text(classifiers->'hook_type') as hook_type,
  COUNT(*) as count,
  ROUND(AVG(overall_100)) as avg_score, -- Integer average
  ROUND(AVG(retention_rate)::numeric, 2) as avg_retention -- Float from TikTok OK
FROM video_ai_analysis
JOIN tiktok_videos ON video_ai_analysis.video_id = tiktok_videos.id
WHERE status = 'done'
GROUP BY angle, hook_type
HAVING COUNT(*) >= 3
ORDER BY avg_score DESC;
```

### **Creator Coaching Report**
```sql
-- 7-day rolling improvement tracking
SELECT 
  DATE_TRUNC('day', processed_at) as date,
  AVG(hook_strength) as avg_hook,
  AVG(depth) as avg_depth,
  LAG(AVG(hook_strength)) OVER (ORDER BY DATE_TRUNC('day', processed_at)) as prev_hook,
  LAG(AVG(depth)) OVER (ORDER BY DATE_TRUNC('day', processed_at)) as prev_depth
FROM video_ai_analysis
WHERE processed_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', processed_at)
ORDER BY date DESC;
```

## 🔐 Privacy & Storage

### **Keyframes Only Policy**
- Store only keyframes (0, 1, 2, 3, 5, 10, 25, 50, 75%)
- Delete full frames after processing
- Exception: Flag specific frames for human review if needed

### **PII Redaction**
```typescript
function redactPII(ocrResults: OCRResult[]): OCRResult[] {
  const patterns = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g
  };
  
  return ocrResults.map(result => ({
    ...result,
    text: result.text
      .replace(patterns.email, '[EMAIL]')
      .replace(patterns.phone, '[PHONE]')
      .replace(patterns.ssn, '[SSN]')
  }));
}
```

### **Data Retention**
- Keyframes: 90 days (then delete from S3)
- Transcripts: 1 year
- Scores & findings: Indefinite (small data footprint)
- Full videos: Never stored (only download temporarily for processing)

## 🎬 Example: Cathedral Video Analysis

**Video**: Silent architectural footage with OCR overlay "What Rome taught me about confidence"

### Extracted Features
- **Visual Tags**: cathedral, architecture, stained glass, symmetry, grand scale
- **Composition**: Central focus, leading lines, symmetrical framing
- **Emotion**: Awe, serenity
- **OCR**: "What Rome taught me about confidence" (t=0-5s)
- **Motion**: Smooth gimbal pan, tilt up
- **Audio**: Ambient music, no speech
- **Scene Cuts**: 2 cuts (smooth transitions)

### Scores
- **Hook Strength**: 10 (spectacle + intriguing overlay in first frame)
- **Visual Aesthetics**: 10 (stunning light through glass, color richness)
- **Composition**: 10 (textbook symmetry, leading lines)
- **Motion Dynamics**: 9 (smooth gimbal work)
- **Pattern Interrupt**: 10 (architecture vs typical feed content)
- **Emotion Score**: 10 (immediate awe trigger)
- **Silent Comprehension**: 9 (message clear via overlay)
- **Text Legibility**: 8 (good contrast, readable duration)
- **Overall**: 93/100 (Pass)

### Findings
- **Hook Verdict**: "Immediate visual awe paired with philosophical intrigue. Thumb-stop probability is off the charts."
- **Depth Verdict**: "Limited depth as video is purely visual, but message is universally resonant."
- **Retention Ops**: ["Consider adding voiceover for deeper storytelling", "Could extend to show more architectural details"]

### Why It Performed
- ✅ Visual awe = instant thumb-stop
- ✅ Clear message via overlay (no sound needed)
- ✅ Universal emotion = high save/share
- ✅ High production value signals quality
- ✅ Pattern interrupt (architecture breaks beauty/lifestyle feed norm)

## 📦 Deliverables for Implementation

### 1. Background Pipeline
- [ ] Video download service
- [ ] FFmpeg extraction (audio, keyframes)
- [ ] ASR integration (Whisper)
- [ ] OCR integration (Vision API / Tesseract)
- [ ] Audio analysis (music/speech/BPM)
- [ ] Scene cut detection (PySceneDetect)
- [ ] Visual tagging (CLIP/BLIP)

### 2. Scoring Engine
- [ ] Deterministic scoring functions for each metric
- [ ] Weighted overall score calculation
- [ ] LLM enhancement layer (optional)
- [ ] Findings generator
- [ ] Fix suggestions generator

### 3. Database & Storage
- [ ] Postgres schema migration
- [ ] S3 bucket setup for artifacts
- [ ] Caching layer (Redis)

### 4. API Layer
- [ ] GET /api/videos/:id/analysis
- [ ] POST /api/videos/:id/analyze
- [ ] GET /api/videos/analysis/summary
- [ ] WebSocket for real-time status updates

### 5. Job Queue
- [ ] BullMQ setup with Redis
- [ ] Job processors for each pipeline stage
- [ ] Retry logic and error handling
- [ ] Backfill script for existing videos

### 6. UI Components
- [ ] Score badges in video list
- [ ] Enhanced video modal with tabs
- [ ] Hook/Story/Fixes/Visual/Artifacts views
- [ ] Keyframe gallery
- [ ] Reprocess button

### 7. Configuration & Monitoring
- [ ] Feature flag system
- [ ] Job monitoring dashboard
- [ ] Performance metrics (processing time, success rate)
- [ ] Error tracking and alerts

---

**Ready for Cursor Implementation**: This spec provides complete input/output definitions, tool choices, scoring logic, and UI integration points for Phase 2 development.


