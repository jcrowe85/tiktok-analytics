-- TikTok Analytics Phase 2 Database Schema
-- Creative Intelligence Layer Tables

-- Videos table (extends existing video data)
CREATE TABLE IF NOT EXISTS videos (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255),
    caption TEXT,
    video_description TEXT,
    hashtags TEXT[],
    posted_at_iso TIMESTAMP,
    create_time BIGINT,
    duration INTEGER,
    view_count INTEGER,
    like_count INTEGER,
    comment_count INTEGER,
    share_count INTEGER,
    engagement_rate DECIMAL(10,8),
    like_rate DECIMAL(10,8),
    comment_rate DECIMAL(10,8),
    share_rate DECIMAL(10,8),
    views_24h INTEGER,
    velocity_24h DECIMAL(10,8),
    share_url TEXT,
    embed_link TEXT,
    cover_image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Analysis Results
CREATE TABLE IF NOT EXISTS video_ai_analysis (
    id SERIAL PRIMARY KEY,
    video_id VARCHAR(255) REFERENCES videos(id) ON DELETE CASCADE,
    
    -- Processing Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processed_at TIMESTAMP,
    processing_time_ms INTEGER,
    
    -- Version & Provenance
    rules_version INTEGER DEFAULT 1,
    asr_engine VARCHAR(50),
    ocr_engine VARCHAR(50),
    vision_model VARCHAR(50),
    llm_model VARCHAR(50),
    content_hash VARCHAR(64),
    
    -- Language Detection
    detected_language VARCHAR(10),
    
    -- Core Scores (0-10 integers)
    scores JSONB NOT NULL DEFAULT '{}',
    
    -- Visual-Only Scores (0-10 integers)
    visual_scores JSONB NOT NULL DEFAULT '{}',
    
    -- Classifiers & Tags
    classifiers JSONB NOT NULL DEFAULT '{}',
    
    -- LLM Analysis
    findings JSONB DEFAULT '{}',
    fix_suggestions TEXT[],
    
    -- Artifacts (references to stored files)
    artifacts JSONB DEFAULT '{}',
    
    -- Quality Bands
    quality_band VARCHAR(20) CHECK (quality_band IN ('Pass', 'Revise', 'Reshoot')),
    
    -- Compliance & Risk
    policy_flags TEXT[],
    platform_blockers TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job Queue Status (for BullMQ)
CREATE TABLE IF NOT EXISTS job_status (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(255) UNIQUE NOT NULL,
    video_id VARCHAR(255),
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('waiting', 'active', 'completed', 'failed', 'delayed')),
    progress INTEGER DEFAULT 0,
    data JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_video_ai_analysis_video_id ON video_ai_analysis(video_id);
CREATE INDEX IF NOT EXISTS idx_video_ai_analysis_status ON video_ai_analysis(status);
CREATE INDEX IF NOT EXISTS idx_video_ai_analysis_processed_at ON video_ai_analysis(processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_ai_analysis_classifiers ON video_ai_analysis USING GIN (classifiers);
CREATE INDEX IF NOT EXISTS idx_video_ai_analysis_scores ON video_ai_analysis USING GIN (scores);
CREATE INDEX IF NOT EXISTS idx_video_ai_analysis_visual_scores ON video_ai_analysis USING GIN (visual_scores);
CREATE INDEX IF NOT EXISTS idx_video_ai_analysis_policy_flags ON video_ai_analysis USING GIN (policy_flags);

CREATE INDEX IF NOT EXISTS idx_job_status_job_id ON job_status(job_id);
CREATE INDEX IF NOT EXISTS idx_job_status_video_id ON job_status(video_id);
CREATE INDEX IF NOT EXISTS idx_job_status_status ON job_status(status);
CREATE INDEX IF NOT EXISTS idx_job_status_created_at ON job_status(created_at DESC);

-- Update triggers for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_ai_analysis_updated_at BEFORE UPDATE ON video_ai_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data structure for scores JSONB
-- This is just documentation - actual data will be inserted via application
/*
scores: {
  "hook_strength": 7,
  "depth": 6,
  "clarity": 8,
  "pacing": 7,
  "cta": 5,
  "brand_fit": 9,
  "overall_100": 78
}

visual_scores: {
  "thumbstop_prob": 8,
  "first_frame_strength": 7,
  "silent_comprehension": 6,
  "visual_aesthetics": 8,
  "composition": 7,
  "motion_dynamics": 6,
  "pattern_interrupt": 8,
  "text_legibility": 7,
  "text_timing_fit": 6,
  "emotion_score": 8,
  "save_share_trigger": 7,
  "loopability": 6,
  "trend_alignment": 7,
  "cultural_resonance": 8
}

classifiers: {
  "angle": "transformation",
  "hook_type": ["question", "curiosity"],
  "content_types": ["demo", "story"],
  "visual_subjects": ["product", "hands", "close_up"],
  "composition_tags": ["symmetry", "central_focus"],
  "emotion_tags": ["confidence", "satisfaction"],
  "pattern_interrupt": ["product_focus", "close_up"],
  "shot_types": ["close_up", "medium_shot"],
  "risk": []
}
*/
