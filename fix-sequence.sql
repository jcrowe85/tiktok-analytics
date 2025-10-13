-- Fix video_ai_analysis sequence to prevent duplicate key errors
-- This will reset the sequence to the maximum existing ID + 1

-- Check current sequence value
SELECT currval('video_ai_analysis_id_seq') as current_sequence_value;

-- Check max ID in table
SELECT MAX(id) as max_id FROM video_ai_analysis;

-- Reset sequence to max ID + 1
SELECT setval('video_ai_analysis_id_seq', COALESCE(MAX(id), 1), false) FROM video_ai_analysis;

-- Verify the fix
SELECT currval('video_ai_analysis_id_seq') as new_sequence_value;
