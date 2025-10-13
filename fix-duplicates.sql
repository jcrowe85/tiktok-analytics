-- Comprehensive fix for video_ai_analysis duplicate key issues
-- This script handles both duplicate entries and sequence synchronization

-- Step 1: Remove duplicate entries (keep the most recent)
DELETE FROM video_ai_analysis
WHERE id IN (
    SELECT id
    FROM (
        SELECT
            id,
            video_id,
            ROW_NUMBER() OVER (PARTITION BY video_id ORDER BY updated_at DESC, id DESC) as rn
        FROM video_ai_analysis
    ) t
    WHERE t.rn > 1
);

-- Step 2: Reset sequence to max ID + 1
SELECT setval('video_ai_analysis_id_seq', COALESCE(MAX(id), 1), false) FROM video_ai_analysis;

-- Step 3: Verify the fix
SELECT 
    'Current sequence value: ' || currval('video_ai_analysis_id_seq') as info
UNION ALL
SELECT 
    'Max ID in table: ' || MAX(id)::text FROM video_ai_analysis;
