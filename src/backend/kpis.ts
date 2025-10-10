import type { TikTokVideo, VideoMetrics, VideoSnapshot } from './types.js';

/**
 * Extract hashtags from caption
 */
export function extractHashtags(caption: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const matches = caption.matchAll(hashtagRegex);
  return Array.from(matches, m => m[1].toLowerCase());
}

/**
 * Calculate engagement rate: (likes + comments + shares) / views
 */
export function calculateEngagementRate(
  likes: number,
  comments: number,
  shares: number,
  views: number
): number {
  if (views === 0) return 0;
  return (likes + comments + shares) / views;
}

/**
 * Calculate individual metric rates
 */
export function calculateRates(
  likes: number,
  comments: number,
  shares: number,
  views: number
): { like_rate: number; comment_rate: number; share_rate: number } {
  if (views === 0) {
    return { like_rate: 0, comment_rate: 0, share_rate: 0 };
  }

  return {
    like_rate: likes / views,
    comment_rate: comments / views,
    share_rate: shares / views,
  };
}

/**
 * Calculate view velocity based on historical snapshots
 */
export function calculateVelocity(
  currentViews: number,
  videoId: string,
  previousSnapshots: VideoSnapshot[]
): { views_24h?: number; views_48h?: number; velocity_24h?: number; velocity_48h?: number } {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const twoDays = 48 * 60 * 60 * 1000;

  // Find snapshots for this video
  const videoSnapshots = previousSnapshots
    .filter(s => s.id === videoId)
    .sort((a, b) => b.timestamp - a.timestamp);

  // Find closest snapshot to 24h ago
  const snapshot24h = videoSnapshots.find(s => now - s.timestamp >= oneDay);
  
  // Find closest snapshot to 48h ago
  const snapshot48h = videoSnapshots.find(s => now - s.timestamp >= twoDays);

  const result: {
    views_24h?: number;
    views_48h?: number;
    velocity_24h?: number;
    velocity_48h?: number;
  } = {};

  if (snapshot24h) {
    result.views_24h = snapshot24h.views;
    const hoursSince = (now - snapshot24h.timestamp) / (60 * 60 * 1000);
    result.velocity_24h = (currentViews - snapshot24h.views) / hoursSince;
  }

  if (snapshot48h) {
    result.views_48h = snapshot48h.views;
    const hoursSince = (now - snapshot48h.timestamp) / (60 * 60 * 1000);
    result.velocity_48h = (currentViews - snapshot48h.views) / hoursSince;
  }

  return result;
}

/**
 * Transform TikTok video data into enriched metrics
 */
export function enrichVideoWithKPIs(
  video: TikTokVideo,
  previousSnapshots: VideoSnapshot[] = []
): VideoMetrics {
  const caption = video.video_description || '';
  const hashtags = extractHashtags(caption);
  
  const rates = calculateRates(
    video.like_count,
    video.comment_count,
    video.share_count,
    video.view_count
  );

  const velocity = calculateVelocity(
    video.view_count,
    video.id,
    previousSnapshots
  );

  return {
    ...video,
    posted_at_iso: new Date(video.create_time * 1000).toISOString(),
    caption,
    hashtags,
    engagement_rate: calculateEngagementRate(
      video.like_count,
      video.comment_count,
      video.share_count,
      video.view_count
    ),
    ...rates,
    ...velocity,
  };
}

/**
 * Create snapshot from current video data
 */
export function createSnapshot(video: TikTokVideo): VideoSnapshot {
  return {
    id: video.id,
    timestamp: Date.now(),
    views: video.view_count,
    likes: video.like_count,
    comments: video.comment_count,
    shares: video.share_count,
  };
}

