/**
 * Snapshot Service
 * 
 * Captures daily snapshots of video metrics to enable accurate growth tracking.
 * Since TikTok API only provides cumulative totals (not time-stamped events),
 * we need to store periodic snapshots to calculate changes over time.
 */

import { executeQuery } from '../database/connection.js';

export interface VideoSnapshot {
  video_id: string;
  user_id: number;
  snapshot_date: string; // YYYY-MM-DD format
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
}

export interface MetricGrowth {
  current: number;
  previous: number;
  growth: number;
  percentage: number;
  isIncrease: boolean;
}

/**
 * Take a snapshot of all videos for all users
 * This should be called daily (via cron job)
 */
export async function takeAllSnapshots(): Promise<void> {
  console.log('📸 Taking daily snapshots of all videos...');
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  try {
    // Get all videos with their current metrics
    const videos = await executeQuery(`
      SELECT 
        v.id as video_id,
        v.user_id,
        v.view_count,
        v.like_count,
        v.comment_count,
        v.share_count
      FROM videos v
      WHERE v.user_id IS NOT NULL
    `) as any[];
    
    console.log(`📊 Found ${videos.length} videos to snapshot`);
    
    // Insert snapshots (on conflict, update to latest values)
    for (const video of videos) {
      await executeQuery(`
        INSERT INTO video_snapshots (
          video_id, user_id, snapshot_date, 
          view_count, like_count, comment_count, share_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (video_id, snapshot_date) 
        DO UPDATE SET
          view_count = EXCLUDED.view_count,
          like_count = EXCLUDED.like_count,
          comment_count = EXCLUDED.comment_count,
          share_count = EXCLUDED.share_count,
          created_at = NOW()
      `, [
        video.video_id,
        video.user_id,
        today,
        video.view_count || 0,
        video.like_count || 0,
        video.comment_count || 0,
        video.share_count || 0
      ]);
    }
    
    console.log(`✅ Completed daily snapshot for ${videos.length} videos`);
  } catch (error) {
    console.error('❌ Error taking snapshots:', error);
    throw error;
  }
}

/**
 * Take snapshots for a specific user's videos
 */
export async function takeUserSnapshots(userId: number): Promise<void> {
  console.log(`📸 Taking snapshot for user ${userId}...`);
  
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const videos = await executeQuery(`
      SELECT 
        id as video_id,
        user_id,
        view_count,
        like_count,
        comment_count,
        share_count
      FROM videos
      WHERE user_id = $1
    `, [userId]) as any[];
    
    for (const video of videos) {
      await executeQuery(`
        INSERT INTO video_snapshots (
          video_id, user_id, snapshot_date, 
          view_count, like_count, comment_count, share_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (video_id, snapshot_date) 
        DO UPDATE SET
          view_count = EXCLUDED.view_count,
          like_count = EXCLUDED.like_count,
          comment_count = EXCLUDED.comment_count,
          share_count = EXCLUDED.share_count,
          created_at = NOW()
      `, [
        video.video_id,
        video.user_id,
        today,
        video.view_count || 0,
        video.like_count || 0,
        video.comment_count || 0,
        video.share_count || 0
      ]);
    }
    
    console.log(`✅ Snapshot completed for ${videos.length} videos`);
  } catch (error) {
    console.error(`❌ Error taking user snapshots:`, error);
    throw error;
  }
}

/**
 * Calculate growth for a specific metric over a time period
 */
export async function calculateMetricGrowth(
  userId: number,
  metric: 'view_count' | 'like_count' | 'comment_count' | 'share_count',
  daysAgo: number
): Promise<MetricGrowth | null> {
  try {
    const compareDate = new Date();
    compareDate.setDate(compareDate.getDate() - daysAgo);
    const compareDateStr = compareDate.toISOString().split('T')[0];
    
    // Get current total (from videos table)
    const currentResult = await executeQuery(`
      SELECT COALESCE(SUM(${metric}), 0) as total
      FROM videos
      WHERE user_id = $1
    `, [userId]) as any[];
    
    const current = Number(currentResult[0]?.total || 0);
    
    // Get previous total (from snapshots)
    const previousResult = await executeQuery(`
      SELECT COALESCE(SUM(${metric}), 0) as total
      FROM video_snapshots
      WHERE user_id = $1 AND snapshot_date = $2
    `, [userId, compareDateStr]) as any[];
    
    const previous = Number(previousResult[0]?.total || 0);
    
    // If no previous snapshot, return null
    if (previous === 0 && current === 0) {
      return null;
    }
    
    const growth = current - previous;
    const percentage = previous > 0 ? ((growth / previous) * 100) : 100;
    
    return {
      current,
      previous,
      growth,
      percentage: Math.abs(percentage),
      isIncrease: growth >= 0
    };
  } catch (error) {
    console.error(`❌ Error calculating growth:`, error);
    return null;
  }
}

/**
 * Get growth for all metrics over a time period
 */
export async function getAllMetricsGrowth(userId: number, daysAgo: number) {
  const views = await calculateMetricGrowth(userId, 'view_count', daysAgo);
  const likes = await calculateMetricGrowth(userId, 'like_count', daysAgo);
  const comments = await calculateMetricGrowth(userId, 'comment_count', daysAgo);
  const shares = await calculateMetricGrowth(userId, 'share_count', daysAgo);
  
  return {
    views,
    likes,
    comments,
    shares
  };
}

/**
 * Backfill snapshots for existing videos
 * Creates an initial snapshot to establish a baseline
 */
export async function backfillInitialSnapshot(): Promise<void> {
  console.log('🔄 Backfilling initial snapshots...');
  
  // Create snapshot for yesterday as baseline
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  try {
    const videos = await executeQuery(`
      SELECT 
        id as video_id,
        user_id,
        view_count,
        like_count,
        comment_count,
        share_count
      FROM videos
      WHERE user_id IS NOT NULL
    `) as any[];
    
    console.log(`📊 Backfilling ${videos.length} videos for ${yesterdayStr}`);
    
    for (const video of videos) {
      await executeQuery(`
        INSERT INTO video_snapshots (
          video_id, user_id, snapshot_date, 
          view_count, like_count, comment_count, share_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (video_id, snapshot_date) DO NOTHING
      `, [
        video.video_id,
        video.user_id,
        yesterdayStr,
        video.view_count || 0,
        video.like_count || 0,
        video.comment_count || 0,
        video.share_count || 0
      ]);
    }
    
    console.log(`✅ Backfill completed`);
  } catch (error) {
    console.error('❌ Error backfilling snapshots:', error);
    throw error;
  }
}

