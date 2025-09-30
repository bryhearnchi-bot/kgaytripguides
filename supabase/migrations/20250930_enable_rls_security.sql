-- Migration: Enable Row Level Security on all tables
-- Created: 2025-09-30
-- Purpose: Fix critical security issue - enable RLS on lookup tables

-- Enable RLS on venue_types
ALTER TABLE venue_types ENABLE ROW LEVEL SECURITY;

-- Enable RLS on amenities
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;

-- Enable RLS on venues
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- Enable RLS on resorts
ALTER TABLE resorts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on ship_amenities
ALTER TABLE ship_amenities ENABLE ROW LEVEL SECURITY;

-- Enable RLS on ship_venues
ALTER TABLE ship_venues ENABLE ROW LEVEL SECURITY;

-- Enable RLS on resort_amenities
ALTER TABLE resort_amenities ENABLE ROW LEVEL SECURITY;

-- Enable RLS on resort_venues
ALTER TABLE resort_venues ENABLE ROW LEVEL SECURITY;

-- Enable RLS on trip_section_assignments
ALTER TABLE trip_section_assignments ENABLE ROW LEVEL SECURITY;

-- Create SELECT policies for public read access to lookup tables
-- These are lookup/reference tables that should be readable by all authenticated users

-- venue_types policies
CREATE POLICY "venue_types_select_all" ON venue_types
  FOR SELECT USING (true);

CREATE POLICY "venue_types_admin_all" ON venue_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- amenities policies
CREATE POLICY "amenities_select_all" ON amenities
  FOR SELECT USING (true);

CREATE POLICY "amenities_admin_all" ON amenities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- venues policies
CREATE POLICY "venues_select_all" ON venues
  FOR SELECT USING (true);

CREATE POLICY "venues_admin_all" ON venues
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- resorts policies
CREATE POLICY "resorts_select_all" ON resorts
  FOR SELECT USING (true);

CREATE POLICY "resorts_admin_all" ON resorts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ship_amenities policies (join table)
CREATE POLICY "ship_amenities_select_all" ON ship_amenities
  FOR SELECT USING (true);

CREATE POLICY "ship_amenities_admin_all" ON ship_amenities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ship_venues policies (join table)
CREATE POLICY "ship_venues_select_all" ON ship_venues
  FOR SELECT USING (true);

CREATE POLICY "ship_venues_admin_all" ON ship_venues
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- resort_amenities policies (join table)
CREATE POLICY "resort_amenities_select_all" ON resort_amenities
  FOR SELECT USING (true);

CREATE POLICY "resort_amenities_admin_all" ON resort_amenities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- resort_venues policies (join table)
CREATE POLICY "resort_venues_select_all" ON resort_venues
  FOR SELECT USING (true);

CREATE POLICY "resort_venues_admin_all" ON resort_venues
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- trip_section_assignments policies
CREATE POLICY "trip_section_assignments_select_all" ON trip_section_assignments
  FOR SELECT USING (true);

CREATE POLICY "trip_section_assignments_admin_all" ON trip_section_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'content_manager')
    )
  );