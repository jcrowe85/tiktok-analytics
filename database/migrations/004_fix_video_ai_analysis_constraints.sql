-- Migration: Fix video_ai_analysis table constraints and sequences
-- This ensures proper unique constraints and sequence synchronization

-- Ensure the unique constraint exists on video_id
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

-- Fix sequence if it's out of sync (common issue after data imports)
-- This ensures the SERIAL id column doesn't conflict with existing data
DO $$
DECLARE
    max_id INTEGER;
    sequence_name TEXT;
BEGIN
    -- Get the sequence name for the id column
    SELECT pg_get_serial_sequence('video_ai_analysis', 'id') INTO sequence_name;
    
    IF sequence_name IS NOT NULL THEN
        -- Get the maximum id from the table
        SELECT COALESCE(MAX(id), 0) INTO max_id FROM video_ai_analysis;
        
        -- Set the sequence to start after the maximum id
        EXECUTE 'SELECT setval(''' || sequence_name || ''', ' || (max_id + 1) || ', false)';
        
        RAISE NOTICE 'Reset sequence % to start at %', sequence_name, max_id + 1;
    END IF;
END $$;

-- Clean up any duplicate video_id entries (keep the latest one)
WITH duplicates AS (
    SELECT video_id, MAX(id) as keep_id
    FROM video_ai_analysis 
    GROUP BY video_id 
    HAVING COUNT(*) > 1
)
DELETE FROM video_ai_analysis 
WHERE video_id IN (SELECT video_id FROM duplicates)
  AND id NOT IN (SELECT keep_id FROM duplicates);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_video_ai_analysis_video_id ON video_ai_analysis(video_id);
CREATE INDEX IF NOT EXISTS idx_video_ai_analysis_status ON video_ai_analysis(status);
CREATE INDEX IF NOT EXISTS idx_video_ai_analysis_processed_at ON video_ai_analysis(processed_at);
