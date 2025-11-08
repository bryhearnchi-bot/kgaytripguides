-- Create user_notification_reads table to track when users last read notifications
-- This enables syncing read status across devices for logged-in users

CREATE TABLE IF NOT EXISTS public.user_notification_reads (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Ensure one row per user
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_notification_reads_user_id
  ON public.user_notification_reads(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_user_notification_reads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_notification_reads_updated_at
  BEFORE UPDATE ON public.user_notification_reads
  FOR EACH ROW
  EXECUTE FUNCTION update_user_notification_reads_updated_at();

-- Enable Row Level Security
ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only read their own notification read status
CREATE POLICY "Users can view own notification read status"
  ON public.user_notification_reads
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own notification read status
CREATE POLICY "Users can insert own notification read status"
  ON public.user_notification_reads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own notification read status
CREATE POLICY "Users can update own notification read status"
  ON public.user_notification_reads
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notification read status
CREATE POLICY "Users can delete own notification read status"
  ON public.user_notification_reads
  FOR DELETE
  USING (auth.uid() = user_id);
