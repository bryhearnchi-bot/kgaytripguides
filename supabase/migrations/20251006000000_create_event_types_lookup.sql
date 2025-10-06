-- ============================================
-- Migration: Create event_types lookup table
-- Date: 2025-10-06
-- Purpose: Replace hardcoded event type CHECK constraint with lookup table
-- ============================================

-- ============================================
-- CREATE event_types LOOKUP TABLE
-- ============================================

CREATE TABLE event_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),  -- Optional: Lucide icon name for UI
  color VARCHAR(50), -- Optional: Hex color or Tailwind class
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_event_types_name ON event_types(name);
CREATE INDEX idx_event_types_active ON event_types(is_active) WHERE is_active = true;
CREATE INDEX idx_event_types_display_order ON event_types(display_order);

-- ============================================
-- SEED EXISTING EVENT TYPES
-- ============================================
-- Map current hardcoded types: 'party', 'show', 'dining', 'lounge', 'fun', 'club', 'after', 'social'

INSERT INTO event_types (name, description, icon, color, display_order) VALUES
  ('party', 'Dance parties and themed events', 'PartyPopper', '#ec4899', 1),
  ('show', 'Live performances and entertainment', 'Theater', '#8b5cf6', 2),
  ('dining', 'Dining events and special meals', 'UtensilsCrossed', '#f59e0b', 3),
  ('lounge', 'Lounge and bar events', 'Wine', '#06b6d4', 4),
  ('fun', 'Fun activities and games', 'Sparkles', '#10b981', 5),
  ('club', 'Club nights and DJ sets', 'Music', '#6366f1', 6),
  ('after', 'After parties and late-night events', 'MoonStar', '#a855f7', 7),
  ('social', 'Social gatherings and meet-ups', 'Users', '#14b8a6', 8);

-- ============================================
-- MIGRATE events TABLE
-- ============================================

-- Step 1: Add new event_type_id column (nullable initially)
ALTER TABLE events ADD COLUMN event_type_id INTEGER;

-- Step 2: Add foreign key constraint (not enforced yet, deferred)
ALTER TABLE events 
  ADD CONSTRAINT events_event_type_id_fkey 
  FOREIGN KEY (event_type_id) 
  REFERENCES event_types(id) 
  ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;

-- Step 3: Migrate existing data (map type text to event_type_id)
UPDATE events e
SET event_type_id = et.id
FROM event_types et
WHERE e.type = et.name;

-- Step 4: Verify all events have been migrated
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM events WHERE event_type_id IS NULL) THEN
    RAISE EXCEPTION 'Migration failed: Some events have NULL event_type_id. Check for unmapped event types.';
  END IF;
END $$;

-- Step 5: Make event_type_id NOT NULL
ALTER TABLE events ALTER COLUMN event_type_id SET NOT NULL;

-- Step 6: Drop old type column and CHECK constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_type_check;
ALTER TABLE events DROP COLUMN type;

-- Step 7: Add index for performance
CREATE INDEX idx_events_event_type_id ON events(event_type_id);

-- ============================================
-- ADD TRIGGER FOR updated_at
-- ============================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to event_types table
CREATE TRIGGER update_event_types_updated_at
  BEFORE UPDATE ON event_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ADD RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active event types
CREATE POLICY "Public read access to active event types"
  ON event_types
  FOR SELECT
  USING (is_active = true);

-- Allow admin full access
CREATE POLICY "Admin full access to event types"
  ON event_types
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE event_types IS 'Lookup table for event type classifications';
COMMENT ON COLUMN event_types.name IS 'Unique event type name (e.g., party, show, dining)';
COMMENT ON COLUMN event_types.description IS 'Human-readable description of event type';
COMMENT ON COLUMN event_types.icon IS 'Lucide icon name for UI display';
COMMENT ON COLUMN event_types.color IS 'Hex color code for UI theming (e.g., #ec4899)';
COMMENT ON COLUMN event_types.display_order IS 'Order for displaying in dropdowns and lists';
COMMENT ON COLUMN event_types.is_active IS 'Whether this event type is currently active and available';

COMMENT ON COLUMN events.event_type_id IS 'Foreign key to event_types lookup table';

-- ============================================
-- VERIFY MIGRATION
-- ============================================

-- Verification queries (uncomment to run manually):
-- SELECT * FROM event_types ORDER BY display_order;
-- SELECT e.id, e.title, et.name as event_type, et.icon, et.color 
-- FROM events e 
-- JOIN event_types et ON e.event_type_id = et.id 
-- LIMIT 10;

-- Check for any NULL event_type_id values (should be empty)
-- SELECT COUNT(*) as null_count FROM events WHERE event_type_id IS NULL;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Migration summary:
-- ✓ Created event_types lookup table with 8 default types
-- ✓ Migrated all events from text 'type' to integer 'event_type_id'
-- ✓ Dropped old type column and CHECK constraint
-- ✓ Added indexes for performance
-- ✓ Added RLS policies for security
-- ✓ Added updated_at trigger
