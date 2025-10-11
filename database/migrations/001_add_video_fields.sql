-- Migration: Add missing fields to videos table
-- This adds all the fields from TikTok API that were previously only stored in JSON files

-- Add new columns (if they don't exist)
DO $$ 
BEGIN
    -- Add username
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='videos' AND column_name='username') THEN
        ALTER TABLE videos ADD COLUMN username VARCHAR(255);
    END IF;
    
    -- Add video_description
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='videos' AND column_name='video_description') THEN
        ALTER TABLE videos ADD COLUMN video_description TEXT;
    END IF;
    
    -- Add create_time
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='videos' AND column_name='create_time') THEN
        ALTER TABLE videos ADD COLUMN create_time BIGINT;
    END IF;
    
    -- Add like_rate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='videos' AND column_name='like_rate') THEN
        ALTER TABLE videos ADD COLUMN like_rate DECIMAL(10,8);
    END IF;
    
    -- Add comment_rate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='videos' AND column_name='comment_rate') THEN
        ALTER TABLE videos ADD COLUMN comment_rate DECIMAL(10,8);
    END IF;
    
    -- Add share_rate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='videos' AND column_name='share_rate') THEN
        ALTER TABLE videos ADD COLUMN share_rate DECIMAL(10,8);
    END IF;
    
    -- Add views_24h
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='videos' AND column_name='views_24h') THEN
        ALTER TABLE videos ADD COLUMN views_24h INTEGER;
    END IF;
    
    -- Add share_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='videos' AND column_name='share_url') THEN
        ALTER TABLE videos ADD COLUMN share_url TEXT;
    END IF;
    
    -- Add embed_link
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='videos' AND column_name='embed_link') THEN
        ALTER TABLE videos ADD COLUMN embed_link TEXT;
    END IF;
    
    -- Add cover_image_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='videos' AND column_name='cover_image_url') THEN
        ALTER TABLE videos ADD COLUMN cover_image_url TEXT;
    END IF;
    
    -- Modify engagement_rate precision (if needed)
    ALTER TABLE videos ALTER COLUMN engagement_rate TYPE DECIMAL(10,8);
    
    -- Modify velocity_24h to DECIMAL (was INTEGER)
    ALTER TABLE videos ALTER COLUMN velocity_24h TYPE DECIMAL(10,8);
    
END $$;

-- Create index on share_url for AI analysis queries
CREATE INDEX IF NOT EXISTS idx_videos_share_url ON videos(share_url);

-- Create index on username for filtering
CREATE INDEX IF NOT EXISTS idx_videos_username ON videos(username);

-- Add unique constraint on video_ai_analysis.video_id (if not exists)
-- This is required for ON CONFLICT (video_id) in upserts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'video_ai_analysis_video_id_key'
    ) THEN
        ALTER TABLE video_ai_analysis 
        ADD CONSTRAINT video_ai_analysis_video_id_key UNIQUE (video_id);
    END IF;
END $$;

