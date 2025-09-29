-- Trip Info Sections Redesign - Phase 1: Database Migration
-- Date: 2025-09-28
-- Description: Convert trip_info_sections from one-to-many to many-to-many relationship
-- Preserves all existing data while adding flexibility for reusable sections

-- Step 1: Add section_type column to trip_info_sections
ALTER TABLE trip_info_sections
ADD COLUMN section_type VARCHAR(20) DEFAULT 'trip_specific'
  CHECK (section_type IN ('general', 'trip_specific'));

-- Create index for section_type for performance
CREATE INDEX trip_info_sections_section_type_idx ON trip_info_sections(section_type);

-- Step 2: Create junction table for many-to-many relationship
CREATE TABLE trip_section_assignments (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  section_id INTEGER NOT NULL REFERENCES trip_info_sections(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(trip_id, section_id)
);

-- Create indexes for the junction table
CREATE INDEX trip_section_assignments_trip_id_idx ON trip_section_assignments(trip_id);
CREATE INDEX trip_section_assignments_section_id_idx ON trip_section_assignments(section_id);
CREATE INDEX trip_section_assignments_order_idx ON trip_section_assignments(trip_id, order_index);

-- Step 3: Migrate existing relationships to junction table
-- This preserves all current data and maintains existing order
INSERT INTO trip_section_assignments (trip_id, section_id, order_index)
SELECT trip_id, id, order_index
FROM trip_info_sections
WHERE trip_id IS NOT NULL;

-- Step 4: Update trip_info_sections table constraints
-- Remove the foreign key constraint to trips table
ALTER TABLE trip_info_sections
  DROP CONSTRAINT IF EXISTS trip_info_sections_trip_id_fkey;

-- Make trip_id nullable (existing sections will keep their trip_id for reference)
ALTER TABLE trip_info_sections
  ALTER COLUMN trip_id DROP NOT NULL;

-- Remove order_index from trip_info_sections (now handled by junction table)
ALTER TABLE trip_info_sections
  DROP COLUMN order_index;

-- Add updated_at trigger for trip_section_assignments
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trip_section_assignments_updated_at
    BEFORE UPDATE ON trip_section_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to document the migration
COMMENT ON TABLE trip_section_assignments IS 'Junction table for many-to-many relationship between trips and info sections. Created during Phase 1 of trip info sections redesign.';
COMMENT ON COLUMN trip_info_sections.section_type IS 'Type of section: general (reusable across trips) or trip_specific (tied to one trip). Added during Phase 1 of redesign.';