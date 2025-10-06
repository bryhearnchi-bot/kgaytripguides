-- ============================================
-- Migration: Add venue_id to events table
-- Date: 2025-10-05
-- Purpose: Replace text venue column with foreign key to venues table
-- ============================================

-- ============================================
-- STEP 1: Add venue_id column (nullable initially)
-- ============================================

ALTER TABLE events ADD COLUMN venue_id INTEGER;

-- Add foreign key constraint
ALTER TABLE events 
  ADD CONSTRAINT events_venue_id_fkey 
  FOREIGN KEY (venue_id) 
  REFERENCES venues(id) 
  ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_events_venue_id ON events(venue_id);

-- ============================================
-- STEP 2: Create missing venues from existing event data
-- ============================================

-- First, insert any unique venue names from events that don't exist in venues table
-- We'll assign them a default venue_type_id (entertainment = 2)
INSERT INTO venues (name, venue_type_id, description)
SELECT DISTINCT 
  e.venue as name,
  2 as venue_type_id, -- Default to 'entertainment' type
  'Migrated from events table' as description
FROM events e
WHERE e.venue IS NOT NULL 
  AND e.venue != ''
  AND NOT EXISTS (
    SELECT 1 FROM venues v 
    WHERE LOWER(TRIM(v.name)) = LOWER(TRIM(e.venue))
  )
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- STEP 3: Map existing venue text to venue_id
-- ============================================

-- Update events with matching venue_id based on venue name
UPDATE events e
SET venue_id = v.id
FROM venues v
WHERE LOWER(TRIM(e.venue)) = LOWER(TRIM(v.name))
  AND e.venue IS NOT NULL
  AND e.venue != '';

-- ============================================
-- STEP 4: Handle migration validation
-- ============================================

-- Log any events that couldn't be mapped (for manual review)
DO $$
DECLARE
  unmapped_count INTEGER;
  unmapped_venues TEXT;
BEGIN
  -- Count events with venue text but no venue_id
  SELECT COUNT(*)
  INTO unmapped_count
  FROM events 
  WHERE venue IS NOT NULL 
    AND venue != ''
    AND venue_id IS NULL;

  IF unmapped_count > 0 THEN
    -- Get list of unmapped venue names
    SELECT string_agg(DISTINCT venue, ', ')
    INTO unmapped_venues
    FROM events 
    WHERE venue IS NOT NULL 
      AND venue != ''
      AND venue_id IS NULL;
    
    RAISE WARNING 'Found % events with unmapped venues: %', unmapped_count, unmapped_venues;
    -- Note: We're using WARNING instead of EXCEPTION to allow migration to proceed
    -- These can be manually reviewed and fixed later
  END IF;
END $$;

-- ============================================
-- STEP 5: Make venue column nullable (transition period)
-- ============================================

-- First, drop the NOT NULL constraint on venue column
ALTER TABLE events ALTER COLUMN venue DROP NOT NULL;

-- We'll keep both columns for now to allow gradual migration
-- The venue text column can be dropped in a future migration after verification

-- ============================================
-- STEP 6: Add comments for documentation
-- ============================================

COMMENT ON COLUMN events.venue_id IS 'Foreign key to venues table (replaces text venue column)';
COMMENT ON COLUMN events.venue IS 'DEPRECATED: Legacy text venue name - use venue_id instead';

-- ============================================
-- STEP 7: Create helper function for venue migration
-- ============================================

-- Function to help identify and fix remaining unmapped venues
CREATE OR REPLACE FUNCTION get_unmapped_event_venues()
RETURNS TABLE (
  event_id INTEGER,
  trip_id INTEGER,
  event_title TEXT,
  venue_text TEXT,
  event_date TIMESTAMP
) AS $$
BEGIN
  SET search_path = public, extensions;
  
  RETURN QUERY
  SELECT 
    e.id as event_id,
    e.trip_id,
    e.title as event_title,
    e.venue as venue_text,
    e.date as event_date
  FROM events e
  WHERE e.venue IS NOT NULL 
    AND e.venue != ''
    AND e.venue_id IS NULL
  ORDER BY e.trip_id, e.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to admin users
GRANT EXECUTE ON FUNCTION get_unmapped_event_venues() TO authenticated;

-- ============================================
-- VERIFICATION QUERIES (can be run manually)
-- ============================================

-- Check migration success:
-- SELECT COUNT(*) as total_events FROM events;
-- SELECT COUNT(*) as events_with_venue_id FROM events WHERE venue_id IS NOT NULL;
-- SELECT COUNT(*) as events_with_text_venue FROM events WHERE venue IS NOT NULL AND venue != '';
-- SELECT COUNT(*) as events_with_both FROM events WHERE venue_id IS NOT NULL AND venue IS NOT NULL;

-- Find any unmapped venues:
-- SELECT * FROM get_unmapped_event_venues();

-- View venue distribution:
-- SELECT v.name, vt.name as venue_type, COUNT(e.id) as event_count
-- FROM events e
-- JOIN venues v ON e.venue_id = v.id
-- JOIN venue_types vt ON v.venue_type_id = vt.id
-- GROUP BY v.name, vt.name
-- ORDER BY event_count DESC;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Migration summary:
-- ✓ Added venue_id column to events table with foreign key to venues
-- ✓ Created missing venues from existing event venue text
-- ✓ Mapped existing venue text to venue_id where possible
-- ✓ Made venue column nullable for transition period
-- ✓ Added helper function to identify unmapped venues
-- ✓ Added indexes for performance
-- ✓ Added documentation comments

-- Next steps:
-- 1. Update application code to use venue_id instead of venue text
-- 2. Run get_unmapped_event_venues() to review any unmapped venues
-- 3. After verification, create follow-up migration to drop venue column