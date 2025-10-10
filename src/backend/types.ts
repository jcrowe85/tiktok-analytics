// TikTok API Response Types
export interface TikTokAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface TikTokVideo {
  id: string;
  create_time: number;
  duration: number;
  video_description: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  cover_image_url?: string;
  share_url?: string;
  embed_link?: string;
  username?: string;
}

export interface TikTokListVideosResponse {
  data: {
    videos: Array<{ id: string }>;
    cursor: number;
    has_more: boolean;
  };
  error: {
    code: string;
    message: string;
  };
}

export interface TikTokQueryVideosResponse {
  data: {
    videos: TikTokVideo[];
  };
  error: {
    code: string;
    message: string;
  };
}

// Internal data types
export interface VideoMetrics extends TikTokVideo {
  posted_at_iso: string;
  caption: string;
  hashtags: string[];
  engagement_rate: number;
  like_rate: number;
  comment_rate: number;
  share_rate: number;
  views_24h?: number;
  views_48h?: number;
  velocity_24h?: number;
  velocity_48h?: number;
}

export interface VideoSnapshot {
  id: string;
  timestamp: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

