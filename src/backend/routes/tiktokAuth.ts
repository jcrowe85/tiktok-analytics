import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { executeQuery } from '../database/connection.js';
import { refreshAccessToken } from '../oauth.js';
import type { TikTokAuthTokens } from '../types.js';

const router = express.Router();

// TikTok OAuth configuration
const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const SCOPES = ['user.info.basic', 'video.list'];

/**
 * Generate TikTok OAuth authorization URL for user
 */
router.post('/connect-url', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    // Generate state parameter for security
    const state = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Build authorization URL
    const authUrl = new URL(TIKTOK_AUTH_URL);
    authUrl.searchParams.append('client_key', process.env.TIKTOK_CLIENT_KEY!);
    authUrl.searchParams.append('scope', SCOPES.join(','));
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/auth/tiktok/callback`);
    authUrl.searchParams.append('state', state);

    // Store state in database temporarily (expires in 10 minutes)
    await executeQuery(
      'INSERT INTO user_oauth_states (user_id, state, expires_at) VALUES ($1, $2, $3)',
      [userId, state, new Date(Date.now() + 10 * 60 * 1000)]
    );

    res.json({ 
      authUrl: authUrl.toString(),
      state 
    });
  } catch (error) {
    console.error('❌ Error generating TikTok auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

/**
 * Handle TikTok OAuth callback
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send('Missing authorization code or state');
    }

    // Verify state and get user ID
    const stateResult = await executeQuery(
      'SELECT user_id FROM user_oauth_states WHERE state = $1 AND expires_at > NOW()',
      [state as string]
    );

    if (stateResult.rows.length === 0) {
      return res.status(400).send('Invalid or expired state parameter');
    }

    const userId = stateResult.rows[0].user_id;

    // Clean up state
    await executeQuery('DELETE FROM user_oauth_states WHERE state = $1', [state as string]);

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code as string);

    // Get user info from TikTok
    const userInfo = await getTikTokUserInfo(tokens.access_token);

    // Store tokens in database
    await executeQuery(`
      UPDATE users 
      SET 
        tiktok_access_token = $1,
        tiktok_refresh_token = $2,
        tiktok_open_id = $3,
        tiktok_username = $4,
        tiktok_display_name = $5,
        tiktok_connected_at = NOW(),
        tiktok_token_expires_at = $6
      WHERE id = $7
    `, [
      tokens.access_token,
      tokens.refresh_token,
      userInfo.open_id,
      userInfo.username,
      userInfo.display_name,
      new Date(Date.now() + (tokens.expires_in * 1000)),
      userId
    ]);

    // Redirect to success page
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?tiktok_connected=true`);

  } catch (error) {
    console.error('❌ TikTok OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?tiktok_error=true`);
  }
});

/**
 * Get user's TikTok connection status
 */
router.get('/status', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    const result = await executeQuery(`
      SELECT 
        tiktok_username,
        tiktok_display_name,
        tiktok_connected_at,
        tiktok_token_expires_at,
        plan_type,
        videos_allowed
      FROM users 
      WHERE id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const isConnected = !!user.tiktok_username;
    const tokenExpired = user.tiktok_token_expires_at && new Date(user.tiktok_token_expires_at) < new Date();

    res.json({
      connected: isConnected && !tokenExpired,
      username: user.tiktok_username,
      displayName: user.tiktok_display_name,
      connectedAt: user.tiktok_connected_at,
      planType: user.plan_type,
      videosAllowed: user.videos_allowed,
      tokenExpired
    });
  } catch (error) {
    console.error('❌ Error getting TikTok status:', error);
    res.status(500).json({ error: 'Failed to get TikTok connection status' });
  }
});

/**
 * Disconnect TikTok account
 */
router.post('/disconnect', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    await executeQuery(`
      UPDATE users 
      SET 
        tiktok_access_token = NULL,
        tiktok_refresh_token = NULL,
        tiktok_open_id = NULL,
        tiktok_username = NULL,
        tiktok_display_name = NULL,
        tiktok_connected_at = NULL,
        tiktok_token_expires_at = NULL
      WHERE id = $1
    `, [userId]);

    res.json({ success: true, message: 'TikTok account disconnected successfully' });
  } catch (error) {
    console.error('❌ Error disconnecting TikTok account:', error);
    res.status(500).json({ error: 'Failed to disconnect TikTok account' });
  }
});

/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForTokens(code: string): Promise<TikTokAuthTokens> {
  const response = await axios.post(
    TIKTOK_TOKEN_URL,
    new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/auth/tiktok/callback`,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  if (response.data.error || response.data.error_description) {
    const errorMsg = response.data.error_description || response.data.error?.message || 'Unknown error';
    throw new Error(`Token exchange failed: ${errorMsg}`);
  }

  const tokens = response.data.data || response.data;
  
  if (!tokens.access_token) {
    throw new Error('No access token in response');
  }

  return tokens;
}

/**
 * Get TikTok user info
 */
async function getTikTokUserInfo(accessToken: string): Promise<{
  open_id: string;
  username: string;
  display_name: string;
}> {
  try {
    const response = await axios.get(
      'https://open.tiktokapis.com/v2/user/info/',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        params: {
          fields: 'open_id,union_id,avatar_url,display_name'
        }
      }
    );

    const user = response.data.data?.user || {};
    
    // TikTok API doesn't expose username via Display API
    // We'll use display_name as fallback and let user set username manually
    return {
      open_id: user.open_id || '',
      username: user.display_name?.toLowerCase().replace(/\s+/g, '') || '',
      display_name: user.display_name || 'TikTok User'
    };
  } catch (error) {
    console.warn('⚠️ Could not fetch TikTok user info:', error);
    return {
      open_id: '',
      username: 'tiktok_user',
      display_name: 'TikTok User'
    };
  }
}

export default router;
