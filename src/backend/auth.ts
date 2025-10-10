#!/usr/bin/env node

/**
 * TikTok OAuth Authentication Script
 * 
 * This script handles the initial OAuth flow for TikTok Display API.
 * Run once to authenticate and save tokens.
 * 
 * Usage: npm run auth
 */

import { startOAuthFlow } from './oauth.js';

startOAuthFlow();

