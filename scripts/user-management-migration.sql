-- User Management System Database Migration
-- K-GAY Travel Guides
-- This migration adds comprehensive user management features including
-- enhanced profiles, preferences, consent tracking, and activity logging

-- ============================================
-- Phase 1: Extend Profiles Table
-- ============================================

-- Add new columns to profiles table for enhanced user data
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS communication_preferences JSONB DEFAULT '{"email": true, "sms": false}'::jsonb,
ADD COLUMN IF NOT EXISTS cruise_updates_opt_in BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location JSONB,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP,
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deleted', 'pending_verification'));

-- Create index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active DESC) WHERE last_active IS NOT NULL;

-- ============================================
-- Phase 2: User Preferences Table
-- ============================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_updates BOOLEAN DEFAULT true,
  text_messages BOOLEAN DEFAULT false,
  cruise_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  partner_offers BOOLEAN DEFAULT false,
  privacy_settings JSONB DEFAULT '{"profile_visibility": "private", "show_email": false, "show_phone": false}'::jsonb,
  notification_settings JSONB DEFAULT '{"push": false, "in_app": true, "digest": "weekly"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_cruise_notifications ON user_preferences(cruise_notifications) WHERE cruise_notifications = true;

-- ============================================
-- Phase 3: User Consent Records
-- ============================================

CREATE TABLE IF NOT EXISTS user_consent_records (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consent_type VARCHAR(30) NOT NULL CHECK (consent_type IN ('privacy_policy', 'terms_of_service', 'marketing', 'data_processing', 'cookies', 'cruise_updates')),
  consent_given BOOLEAN NOT NULL,
  consent_version VARCHAR(10) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for consent records
CREATE INDEX IF NOT EXISTS idx_user_consent_user_id ON user_consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consent_type ON user_consent_records(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_consent_recorded_at ON user_consent_records(recorded_at DESC);

-- ============================================
-- Phase 4: User Activity Log
-- ============================================

CREATE TABLE IF NOT EXISTS user_activity_log (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  action_type VARCHAR(30) CHECK (action_type IN ('auth', 'profile', 'cruise', 'admin', 'security')),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create partitions for activity log (monthly partitions)
CREATE TABLE IF NOT EXISTS user_activity_log_2025_01 PARTITION OF user_activity_log
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE IF NOT EXISTS user_activity_log_2025_02 PARTITION OF user_activity_log
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE IF NOT EXISTS user_activity_log_2025_03 PARTITION OF user_activity_log
FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Create indexes for activity log
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_action ON user_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity_log(created_at DESC);

-- ============================================
-- Phase 5: User Sessions Tracking
-- ============================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at) WHERE expires_at > NOW();

-- ============================================
-- Phase 6: User Data Export Requests (GDPR)
-- ============================================

CREATE TABLE IF NOT EXISTS user_data_requests (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('export', 'deletion', 'correction')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  request_details JSONB,
  file_url TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for data requests
CREATE INDEX IF NOT EXISTS idx_user_data_requests_user_id ON user_data_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_requests_status ON user_data_requests(status);

-- ============================================
-- Phase 7: User Communication Log
-- ============================================

CREATE TABLE IF NOT EXISTS user_communication_log (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  communication_type VARCHAR(20) NOT NULL CHECK (communication_type IN ('email', 'sms', 'push', 'in_app')),
  subject TEXT,
  content TEXT,
  template_name VARCHAR(50),
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')),
  metadata JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE
) PARTITION BY RANGE (sent_at);

-- Create partitions for communication log (monthly)
CREATE TABLE IF NOT EXISTS user_communication_log_2025_01 PARTITION OF user_communication_log
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE IF NOT EXISTS user_communication_log_2025_02 PARTITION OF user_communication_log
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Create indexes for communication log
CREATE INDEX IF NOT EXISTS idx_user_comm_log_user_id ON user_communication_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_comm_log_type ON user_communication_log(communication_type);
CREATE INDEX IF NOT EXISTS idx_user_comm_log_sent_at ON user_communication_log(sent_at DESC);

-- ============================================
-- Phase 8: Helper Functions
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to log user activity automatically
CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_activity_log (user_id, action, action_type, details, created_at)
    VALUES (
        COALESCE(NEW.id, OLD.id),
        TG_OP || '_' || TG_TABLE_NAME,
        CASE
            WHEN TG_TABLE_NAME = 'profiles' THEN 'profile'
            WHEN TG_TABLE_NAME LIKE '%consent%' THEN 'security'
            ELSE 'profile'
        END,
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'timestamp', NOW()
        ),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to create monthly partitions automatically
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name TEXT, start_date DATE)
RETURNS void AS $$
DECLARE
    partition_name TEXT;
    end_date DATE;
BEGIN
    end_date := start_date + INTERVAL '1 month';
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');

    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
        partition_name, table_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Phase 9: Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_communication_log ENABLE ROW LEVEL SECURITY;

-- Profiles table policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND (role = OLD.role OR role IS NULL));

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all preferences" ON user_preferences
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Consent records policies (users can only read, system inserts)
CREATE POLICY "Users can view own consent records" ON user_consent_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert consent records" ON user_consent_records
    FOR INSERT WITH CHECK (true);

-- Activity log policies (read-only for users, admins can view all)
CREATE POLICY "Users can view own activity" ON user_activity_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity" ON user_activity_log
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Sessions policies
CREATE POLICY "Users can manage own sessions" ON user_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Data requests policies
CREATE POLICY "Users can manage own data requests" ON user_data_requests
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all data requests" ON user_data_requests
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Communication log policies
CREATE POLICY "Users can view own communications" ON user_communication_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all communications" ON user_communication_log
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- Phase 10: Initial Data and Defaults
-- ============================================

-- Create default preferences for existing users
INSERT INTO user_preferences (user_id, email_updates, cruise_notifications)
SELECT id, true, true
FROM profiles
WHERE NOT EXISTS (
    SELECT 1 FROM user_preferences WHERE user_preferences.user_id = profiles.id
);

-- Log this migration as an activity
INSERT INTO user_activity_log (user_id, action, action_type, details)
SELECT id, 'migration_user_management', 'admin',
    jsonb_build_object('migration', 'user_management_system', 'version', '1.0.0')
FROM profiles
WHERE role = 'admin'
LIMIT 1;

-- ============================================
-- Migration Complete
-- ============================================
-- This migration adds comprehensive user management capabilities
-- including enhanced profiles, preferences, consent tracking,
-- activity logging, and GDPR compliance features.