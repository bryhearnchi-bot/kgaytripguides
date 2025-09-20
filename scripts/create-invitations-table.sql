-- Migration: Create Invitations Table
-- Description: Add secure invitation system with token-based authentication
-- Date: 2025-01-09

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'content_editor', 'media_manager', 'viewer')),
    invited_by VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cruise_id INTEGER REFERENCES cruises(id) ON DELETE SET NULL,
    metadata JSONB,
    token_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    used_by VARCHAR REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS invitation_email_idx ON invitations(email);
CREATE INDEX IF NOT EXISTS invitation_inviter_idx ON invitations(invited_by);
CREATE INDEX IF NOT EXISTS invitation_expires_idx ON invitations(expires_at);
CREATE INDEX IF NOT EXISTS invitation_used_idx ON invitations(used);
CREATE INDEX IF NOT EXISTS invitation_token_hash_idx ON invitations(token_hash);

-- Create compound index for finding active invitations efficiently
CREATE INDEX IF NOT EXISTS invitation_active_idx ON invitations(email, used, expires_at);

-- Create index for cleanup queries (finding expired invitations)
CREATE INDEX IF NOT EXISTS invitation_cleanup_idx ON invitations(used, expires_at) WHERE used = false;

-- Add comments for documentation
COMMENT ON TABLE invitations IS 'Secure invitation system for user onboarding';
COMMENT ON COLUMN invitations.id IS 'Unique invitation identifier';
COMMENT ON COLUMN invitations.email IS 'Email address of the invitee';
COMMENT ON COLUMN invitations.role IS 'Role to be assigned to the user upon acceptance';
COMMENT ON COLUMN invitations.invited_by IS 'ID of the user who created the invitation';
COMMENT ON COLUMN invitations.cruise_id IS 'Optional cruise-specific invitation';
COMMENT ON COLUMN invitations.metadata IS 'Additional invitation data (JSON)';
COMMENT ON COLUMN invitations.token_hash IS 'SHA-256 hash of the invitation token';
COMMENT ON COLUMN invitations.salt IS 'Salt used for token hashing';
COMMENT ON COLUMN invitations.expires_at IS 'When the invitation expires';
COMMENT ON COLUMN invitations.created_at IS 'When the invitation was created';
COMMENT ON COLUMN invitations.used IS 'Whether the invitation has been accepted';
COMMENT ON COLUMN invitations.used_at IS 'When the invitation was accepted';
COMMENT ON COLUMN invitations.used_by IS 'ID of the user who accepted the invitation';

-- Create function to automatically clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM invitations
    WHERE used = false
    AND expires_at < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_invitations() IS 'Removes expired invitations older than 30 days';

-- Create function to get invitation statistics
CREATE OR REPLACE FUNCTION get_invitation_stats() RETURNS TABLE (
    total_invitations BIGINT,
    active_invitations BIGINT,
    expired_invitations BIGINT,
    used_invitations BIGINT,
    conversion_rate NUMERIC(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_invitations,
        COUNT(*) FILTER (WHERE used = false AND expires_at > NOW()) as active_invitations,
        COUNT(*) FILTER (WHERE used = false AND expires_at <= NOW()) as expired_invitations,
        COUNT(*) FILTER (WHERE used = true) as used_invitations,
        CASE
            WHEN COUNT(*) > 0 THEN
                ROUND((COUNT(*) FILTER (WHERE used = true) * 100.0 / COUNT(*)), 2)
            ELSE 0
        END as conversion_rate
    FROM invitations;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_invitation_stats() IS 'Returns comprehensive invitation system statistics';

-- Create security function to validate invitation tokens
CREATE OR REPLACE FUNCTION validate_invitation_token(
    p_email TEXT,
    p_token_hash TEXT,
    p_salt TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    invitation_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invitation_count
    FROM invitations
    WHERE email = LOWER(p_email)
    AND token_hash = p_token_hash
    AND salt = p_salt
    AND used = false
    AND expires_at > NOW();

    RETURN invitation_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_invitation_token(TEXT, TEXT, TEXT) IS 'Securely validates invitation tokens';

-- Verification queries
SELECT 'Invitations table created successfully' as status;
SELECT COUNT(*) as invitation_count FROM invitations;
SELECT * FROM get_invitation_stats();