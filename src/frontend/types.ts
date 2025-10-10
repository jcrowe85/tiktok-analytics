export interface VideoMetrics {
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

export interface Filters {
  searchText: string;
  dateRange: {
    start: string;
    end: string;
  };
  durationBucket: 'all' | 'short' | 'medium' | 'long'; // <10s, 10-20s, >20s
  hashtag: string;
  showTopMovers: boolean;
}

