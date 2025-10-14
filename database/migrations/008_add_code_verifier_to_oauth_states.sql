-- Add code_verifier column for PKCE support in TikTok OAuth
-- This is required for TikTok's OAuth 2.0 PKCE flow

ALTER TABLE user_oauth_states ADD COLUMN code_verifier TEXT;

-- Update comment to reflect PKCE usage
COMMENT ON TABLE user_oauth_states IS 'Temporary storage for OAuth state parameters and PKCE code verifiers during TikTok authentication';
COMMENT ON COLUMN user_oauth_states.code_verifier IS 'PKCE code verifier for secure OAuth flow';
