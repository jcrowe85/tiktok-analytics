-- Add TikTok OAuth tokens and connection info to users table
-- This enables multi-user TikTok account connections for commercialization

ALTER TABLE users ADD COLUMN tiktok_access_token TEXT;
ALTER TABLE users ADD COLUMN tiktok_refresh_token TEXT;
ALTER TABLE users ADD COLUMN tiktok_open_id TEXT;
ALTER TABLE users ADD COLUMN tiktok_username TEXT;
ALTER TABLE users ADD COLUMN tiktok_display_name TEXT;
ALTER TABLE users ADD COLUMN tiktok_connected_at TIMESTAMP;
ALTER TABLE users ADD COLUMN tiktok_token_expires_at TIMESTAMP;

-- Add indexes for efficient lookups
CREATE INDEX idx_users_tiktok_open_id ON users(tiktok_open_id);
CREATE INDEX idx_users_tiktok_username ON users(tiktok_username);

-- Add subscription/plan information for freemium model
ALTER TABLE users ADD COLUMN plan_type VARCHAR(50) DEFAULT 'free'; -- free, paid, enterprise
ALTER TABLE users ADD COLUMN videos_allowed INTEGER DEFAULT 10; -- number of videos user can analyze
ALTER TABLE users ADD COLUMN subscription_ends_at TIMESTAMP; -- for paid plans

-- Add index for plan lookups
CREATE INDEX idx_users_plan_type ON users(plan_type);

-- Comments for documentation
COMMENT ON COLUMN users.tiktok_access_token IS 'TikTok OAuth access token for user';
COMMENT ON COLUMN users.tiktok_refresh_token IS 'TikTok OAuth refresh token for user';
COMMENT ON COLUMN users.tiktok_open_id IS 'TikTok unique user identifier';
COMMENT ON COLUMN users.tiktok_username IS 'TikTok username/handle (e.g., @username)';
COMMENT ON COLUMN users.tiktok_display_name IS 'TikTok display name';
COMMENT ON COLUMN users.tiktok_connected_at IS 'When user connected their TikTok account';
COMMENT ON COLUMN users.tiktok_token_expires_at IS 'When the access token expires';
COMMENT ON COLUMN users.plan_type IS 'User subscription plan (free/paid/enterprise)';
COMMENT ON COLUMN users.videos_allowed IS 'Number of videos user can analyze based on plan';
COMMENT ON COLUMN users.subscription_ends_at IS 'When paid subscription expires';
