import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { TikTokAuthTokens } from './types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || 'http://localhost:3000/callback';
const PORT = parseInt(process.env.PORT || '3000');

const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';

// Required scopes for Display API
const SCOPES = ['user.info.basic', 'video.list'];

/**
 * Generate a random state parameter for OAuth security
 */
function generateState(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Update .env file with tokens
 */
function updateEnvFile(accessToken: string, refreshToken: string): void {
  const envPath = path.join(__dirname, '../../.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  // Update or add tokens
  const updateOrAdd = (content: string, key: string, value: string): string => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      return content.replace(regex, `${key}=${value}`);
    } else {
      return content + `\n${key}=${value}`;
    }
  };

  envContent = updateOrAdd(envContent, 'TIKTOK_ACCESS_TOKEN', accessToken);
  envContent = updateOrAdd(envContent, 'TIKTOK_REFRESH_TOKEN', refreshToken);

  try {
    fs.writeFileSync(envPath, envContent.trim() + '\n');
    console.log('✅ Updated .env file with new tokens');
  } catch (error) {
    console.warn('⚠️  Could not write to .env file (permission denied)');
    console.warn('   Tokens are still valid in memory for this session');
    console.warn('   To persist tokens, manually update .env on the host');
  }
}

/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForTokens(code: string): Promise<TikTokAuthTokens> {
  console.log('🚩 Step 3: Exchange code for tokens');

  const response = await axios.post(
    TIKTOK_TOKEN_URL,
    new URLSearchParams({
      client_key: CLIENT_KEY!,
      client_secret: CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  // Debug: Log the full response
  console.log('📋 Token response:', JSON.stringify(response.data, null, 2));

  // Handle error responses
  if (response.data.error || response.data.error_description) {
    const errorMsg = response.data.error_description || response.data.error?.message || 'Unknown error';
    throw new Error(`Token exchange failed: ${errorMsg}`);
  }

  // TikTok may return tokens directly in data, or nested in data.data
  const tokens = response.data.data || response.data;
  
  if (!tokens.access_token) {
    throw new Error('No access token in response. Full response: ' + JSON.stringify(response.data));
  }

  return tokens;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TikTokAuthTokens> {
  console.log('🔄 Refreshing access token...');

  const response = await axios.post(
    TIKTOK_TOKEN_URL,
    new URLSearchParams({
      client_key: CLIENT_KEY!,
      client_secret: CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  // Handle error responses
  if (response.data.error || response.data.error_description) {
    const errorMsg = response.data.error_description || response.data.error?.message || 'Unknown error';
    throw new Error(`Token refresh failed: ${errorMsg}`);
  }

  // TikTok may return tokens directly in data, or nested in data.data
  const tokens = response.data.data || response.data;
  
  if (!tokens.access_token) {
    throw new Error('No access token in refresh response');
  }
  
  // Update .env with new tokens
  updateEnvFile(tokens.access_token, tokens.refresh_token);
  
  return tokens;
}

/**
 * Start OAuth flow
 */
export async function startOAuthFlow(): Promise<void> {
  if (!CLIENT_KEY || !CLIENT_SECRET) {
    console.error('❌ Error: TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET must be set in .env');
    process.exit(1);
  }

  const app = express();
  const state = generateState();

  console.log('🚩 Step 1: Start OAuth server');
  console.log(`📍 Server running at http://localhost:${PORT}`);

  // Authorization endpoint
  app.get('/auth', (_req, res) => {
    console.log('🚩 Step 2: Request user consent (scopes: user.info.basic, video.list)');
    
    const authUrl = new URL(TIKTOK_AUTH_URL);
    authUrl.searchParams.append('client_key', CLIENT_KEY!);
    authUrl.searchParams.append('scope', SCOPES.join(','));
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('state', state);

    console.log(`\n🔗 Visit this URL to authorize:\n${authUrl.toString()}\n`);
    res.redirect(authUrl.toString());
  });

  // Callback endpoint
  app.get('/callback', async (req, res) => {
    const { code, state: returnedState } = req.query;

    if (!code) {
      res.send('❌ Error: No authorization code received');
      return;
    }

    if (returnedState !== state) {
      res.send('❌ Error: State mismatch - possible CSRF attack');
      return;
    }

    try {
      const tokens = await exchangeCodeForTokens(code as string);
      
      // Save tokens to .env
      updateEnvFile(tokens.access_token, tokens.refresh_token);

      console.log('\n✅ Authentication successful!');
      console.log('📝 Tokens saved to .env file');
      console.log(`\n🔑 Access Token: ${tokens.access_token.substring(0, 20)}...`);
      console.log(`🔑 Refresh Token: ${tokens.refresh_token.substring(0, 20)}...`);
      console.log(`⏱️  Expires in: ${tokens.expires_in} seconds (~24 hours)`);
      console.log('\n✨ You can now run: npm run fetch');

      res.send(`
        <html>
          <head><title>TikTok Auth Success</title></head>
          <body style="font-family: system-ui; padding: 40px; max-width: 600px; margin: 0 auto;">
            <h1>✅ Authentication Successful!</h1>
            <p>Tokens have been saved to your <code>.env</code> file.</p>
            <p>You can close this window and run <code>npm run fetch</code> to pull your analytics.</p>
            <hr/>
            <p style="font-size: 12px; color: #666;">
              Access tokens expire in ~24 hours but will be automatically refreshed.
            </p>
          </body>
        </html>
      `);

      // Shutdown server after successful auth
      setTimeout(() => {
        console.log('\n👋 Shutting down auth server...');
        process.exit(0);
      }, 2000);
    } catch (error) {
      console.error('❌ Error exchanging code for tokens:', error);
      res.send(`<h1>❌ Error</h1><pre>${error}</pre>`);
    }
  });

  const server = app.listen(PORT, () => {
    console.log(`\n🌐 Open this URL in your browser:\n`);
    console.log(`   http://localhost:${PORT}/auth\n`);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down...');
    server.close();
    process.exit(0);
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startOAuthFlow();
}

