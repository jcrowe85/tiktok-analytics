import axios, { AxiosError } from 'axios';
import { refreshAccessToken } from './oauth.js';
import type { TikTokVideo, TikTokListVideosResponse, TikTokQueryVideosResponse } from './types.js';

const TIKTOK_API_BASE = 'https://open.tiktokapis.com';
const LIST_VIDEOS_ENDPOINT = '/v2/video/list/';
const QUERY_VIDEOS_ENDPOINT = '/v2/video/query/';

export class TikTokClient {
  private accessToken: string;
  private refreshToken: string;
  private username?: string;
  private userId?: number;

  constructor(accessToken: string, refreshToken: string, userId?: number) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.userId = userId;
  }

  /**
   * Get authenticated user info (including username)
   */
  async getUserInfo(): Promise<{ username: string; display_name: string }> {
    try {
      const response = await this.makeRequest<any>(
        '/v2/user/info/',
        {},
        { fields: 'open_id,union_id,avatar_url,display_name' }
      );

      if (response.error && response.error.code !== 'ok') {
        throw new Error(`User info failed: ${response.error.message}`);
      }

      const user = response.data?.user || {};
      // TikTok API doesn't expose username via Display API
      // Hardcode for @tryfleur account
      this.username = 'tryfleur';
      
      return {
        username: this.username,
        display_name: user.display_name || 'TryFleur',
      };
    } catch (error) {
      console.warn('⚠️  Could not fetch user info');
      // Fallback to hardcoded username
      this.username = 'tryfleur';
      return { username: 'tryfleur', display_name: 'TryFleur' };
    }
  }

  /**
   * Handle token refresh on 401 errors
   */
  private async handleAuthError(error: AxiosError): Promise<void> {
    if (error.response?.status === 401) {
      console.log('🔄 Access token expired, refreshing...');
      const tokens = await refreshAccessToken(this.refreshToken, this.userId);
      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token;
    } else {
      throw error;
    }
  }

  /**
   * Make authenticated API request with retry on auth failure
   */
  private async makeRequest<T>(
    endpoint: string,
    data: object,
    queryParams?: Record<string, string>,
    retryCount = 0
  ): Promise<T> {
    try {
      let url = `${TIKTOK_API_BASE}${endpoint}`;
      
      // Add query parameters if provided
      if (queryParams) {
        const params = new URLSearchParams(queryParams);
        url += `?${params.toString()}`;
      }

      const response = await axios.post<T>(
        url,
        data,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      if (retryCount === 0 && error instanceof AxiosError && error.response?.status === 401) {
        await this.handleAuthError(error);
        // Retry once with new token
        return this.makeRequest<T>(endpoint, data, queryParams, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * List all video IDs (paginated)
   * TikTok API: POST /v2/video/list/
   */
  async listAllVideoIds(): Promise<string[]> {
    console.log('🚩 Step 4: List all videos (paginated)');
    
    const allVideoIds: string[] = [];
    let cursor = 0;
    let hasMore = true;
    let pageCount = 0;

    while (hasMore) {
      try {
        const response = await this.makeRequest<TikTokListVideosResponse>(
          LIST_VIDEOS_ENDPOINT,
          {
            max_count: 20,
            cursor,
          },
          {
            fields: 'id,create_time,duration,video_description,view_count,like_count,comment_count,share_count,cover_image_url,embed_link,share_url',
          }
        );

        if (response.error && response.error.code !== 'ok') {
          throw new Error(`API Error: ${response.error.message}`);
        }

        const videos = response.data?.videos || [];
        const videoIds = videos.map(v => v.id);
        allVideoIds.push(...videoIds);

        pageCount++;
        console.log(`   📄 Page ${pageCount}: Found ${videoIds.length} videos (total: ${allVideoIds.length})`);

        hasMore = response.data?.has_more || false;
        cursor = response.data?.cursor || 0;

        // Rate limiting: small delay between requests
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          console.error(`❌ API Error: ${error.response?.data?.error?.message || error.message}`);
        }
        throw error;
      }
    }

    console.log(`✅ Retrieved ${allVideoIds.length} total video IDs`);
    return allVideoIds;
  }

  /**
   * Query video details and metrics in batches of 20
   * TikTok API: POST /v2/video/query/
   */
  async queryVideos(videoIds: string[]): Promise<TikTokVideo[]> {
    console.log('🚩 Step 5: Query video metrics in 20-ID batches');

    const allVideos: TikTokVideo[] = [];
    const batchSize = 20;
    const batches = Math.ceil(videoIds.length / batchSize);

    for (let i = 0; i < batches; i++) {
      const batchIds = videoIds.slice(i * batchSize, (i + 1) * batchSize);
      
      try {
        const response = await this.makeRequest<TikTokQueryVideosResponse>(
          QUERY_VIDEOS_ENDPOINT,
          {
            filters: {
              video_ids: batchIds,
            },
          },
          {
            fields: 'id,create_time,duration,video_description,view_count,like_count,comment_count,share_count,cover_image_url,embed_link,share_url',
          }
        );

        if (response.error && response.error.code !== 'ok') {
          console.warn(`⚠️  Batch ${i + 1} warning: ${response.error.message}`);
        }

        const videos = response.data?.videos || [];
        allVideos.push(...videos);

        console.log(`   📦 Batch ${i + 1}/${batches}: Retrieved ${videos.length} videos`);

        // Rate limiting: small delay between batches
        if (i < batches - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          console.error(`❌ Batch ${i + 1} failed: ${error.response?.data?.error?.message || error.message}`);
        }
        // Continue with other batches
      }
    }

    console.log(`✅ Retrieved details for ${allVideos.length} videos`);
    return allVideos;
  }

  /**
   * Convenience method: list + query all videos
   */
  async getAllVideos(): Promise<TikTokVideo[]> {
    const videoIds = await this.listAllVideoIds();
    
    if (videoIds.length === 0) {
      console.log('ℹ️  No videos found in account');
      return [];
    }

    const videos = await this.queryVideos(videoIds);
    
    // Add username to all videos
    if (this.username) {
      videos.forEach(v => (v as any).username = this.username);
    }

    return videos;
  }

  /**
   * Get username for the authenticated user
   */
  getUsername(): string | undefined {
    return this.username;
  }
}

