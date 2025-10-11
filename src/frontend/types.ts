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
  // AI Analysis fields (Phase 2)
  ai_status?: 'pending' | 'processing' | 'completed' | 'failed';
  ai_scores?: {
    hook_strength: number;
    depth: number;
    clarity: number;
    pacing: number;
    cta: number;
    brand_fit: number;
    overall_100: number;
  };
  ai_visual_scores?: {
    thumbstop_prob: number;
    first_frame_strength: number;
    silent_comprehension: number;
    visual_aesthetics: number;
    composition: number;
    motion_dynamics: number;
    pattern_interrupt: number;
    text_legibility: number;
    text_timing_fit: number;
    emotion_score: number;
    save_share_trigger: number;
    loopability: number;
    trend_alignment: number;
    cultural_resonance: number;
  };
  ai_findings?: {
    hook_strength: string;
    depth: string;
    clarity: string;
    pacing: string;
    cta: string;
    brand_fit: string;
  };
  ai_fix_suggestions?: string[];
  ai_processed_at?: string;
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
  aiQualityBand: 'all' | 'pass' | 'revise' | 'reshoot'; // Pass (80+), Revise (60-79), Reshoot (<60)
}

