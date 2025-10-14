-- Create table to store temporary OAuth state parameters for security
-- This prevents CSRF attacks during the OAuth flow

CREATE TABLE user_oauth_states (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  state VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for efficient lookups and cleanup
CREATE INDEX idx_user_oauth_states_state ON user_oauth_states(state);
CREATE INDEX idx_user_oauth_states_expires_at ON user_oauth_states(expires_at);

-- Clean up expired states (can be run periodically)
-- DELETE FROM user_oauth_states WHERE expires_at < NOW();

COMMENT ON TABLE user_oauth_states IS 'Temporary storage for OAuth state parameters during TikTok authentication';
COMMENT ON COLUMN user_oauth_states.user_id IS 'User initiating the OAuth flow';
COMMENT ON COLUMN user_oauth_states.state IS 'Unique state parameter for CSRF protection';
COMMENT ON COLUMN user_oauth_states.expires_at IS 'When this state expires (typically 10 minutes)';
