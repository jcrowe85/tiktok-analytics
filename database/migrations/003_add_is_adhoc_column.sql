-- Migration: Add is_adhoc column to videos table
-- This column distinguishes between regular TikTok videos and ad-hoc competitor analysis videos

-- Add is_adhoc column (if it doesn't exist)
DO $$
BEGIN
    -- Add is_adhoc
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='videos' AND column_name='is_adhoc') THEN
        ALTER TABLE videos ADD COLUMN is_adhoc BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create index for better query performance on ad-hoc videos
CREATE INDEX IF NOT EXISTS idx_videos_is_adhoc ON videos(is_adhoc);

-- Update existing videos to have is_adhoc = false (they're regular TikTok videos)
UPDATE videos SET is_adhoc = FALSE WHERE is_adhoc IS NULL;
