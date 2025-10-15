-- Migration 003: Add video snapshots table for tracking daily metrics
-- This enables accurate growth tracking over time

CREATE TABLE IF NOT EXISTS video_snapshots (
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(255) NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure one snapshot per video per day
  UNIQUE(video_id, snapshot_date)
);

-- Index for fast lookups by video and date
CREATE INDEX IF NOT EXISTS idx_video_snapshots_video_date ON video_snapshots(video_id, snapshot_date);

-- Index for fast lookups by user and date
CREATE INDEX IF NOT EXISTS idx_video_snapshots_user_date ON video_snapshots(user_id, snapshot_date);

-- Index for fast lookups by date only (for daily snapshot jobs)
CREATE INDEX IF NOT EXISTS idx_video_snapshots_date ON video_snapshots(snapshot_date);

COMMENT ON TABLE video_snapshots IS 'Daily snapshots of video metrics for tracking growth over time';
COMMENT ON COLUMN video_snapshots.snapshot_date IS 'The date this snapshot was taken (without time)';
COMMENT ON COLUMN video_snapshots.view_count IS 'Total view count at the time of snapshot';
COMMENT ON COLUMN video_snapshots.like_count IS 'Total like count at the time of snapshot';
COMMENT ON COLUMN video_snapshots.comment_count IS 'Total comment count at the time of snapshot';
COMMENT ON COLUMN video_snapshots.share_count IS 'Total share count at the time of snapshot';

