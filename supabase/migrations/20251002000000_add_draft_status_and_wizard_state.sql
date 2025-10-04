-- Add Draft status to trip_status table
-- This allows trips to be saved as drafts and shown in the trips table with a "Draft" badge

-- First, check if "Draft" status already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM trip_status WHERE status = 'Draft') THEN
    INSERT INTO trip_status (status) VALUES ('Draft');
  END IF;
END $$;

-- Add wizard_state column to trips table to store incomplete wizard data for resumption
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS wizard_state JSONB,
ADD COLUMN IF NOT EXISTS wizard_current_page INTEGER;

-- Add comment to explain usage
COMMENT ON COLUMN trips.wizard_state IS 'Stores wizard state (context) for draft trips to enable resumption';
COMMENT ON COLUMN trips.wizard_current_page IS 'Current page number in wizard for draft trips';

-- Index for filtering draft trips
CREATE INDEX IF NOT EXISTS idx_trips_status_id ON trips(trip_status_id);
