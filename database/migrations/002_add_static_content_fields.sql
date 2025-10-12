-- Migration: Add static content fields from RapidAPI
-- These fields store one-time content metadata (title, author, music) that doesn't change

-- Add new columns for static content data (if they don't exist)
DO $$
BEGIN
    -- Add video_title
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='videos' AND column_name='video_title') THEN
        ALTER TABLE videos ADD COLUMN video_title TEXT;
    END IF;

    -- Add author_username
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='videos' AND column_name='author_username') THEN
        ALTER TABLE videos ADD COLUMN author_username VARCHAR(255);
    END IF;

    -- Add author_nickname
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='videos' AND column_name='author_nickname') THEN
        ALTER TABLE videos ADD COLUMN author_nickname VARCHAR(255);
    END IF;

    -- Add author_avatar_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='videos' AND column_name='author_avatar_url') THEN
        ALTER TABLE videos ADD COLUMN author_avatar_url TEXT;
    END IF;

    -- Add music_title
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='videos' AND column_name='music_title') THEN
        ALTER TABLE videos ADD COLUMN music_title VARCHAR(255);
    END IF;

    -- Add music_artist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='videos' AND column_name='music_artist') THEN
        ALTER TABLE videos ADD COLUMN music_artist VARCHAR(255);
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_videos_author_username ON videos(author_username);
CREATE INDEX IF NOT EXISTS idx_videos_music_title ON videos(music_title);
CREATE INDEX IF NOT EXISTS idx_videos_video_title ON videos(video_title);
