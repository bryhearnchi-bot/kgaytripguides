-- Create trip_amenities table for trip-specific amenities
CREATE TABLE IF NOT EXISTS trip_amenities (
  trip_id INT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  amenity_id INT NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (trip_id, amenity_id)
);

-- Create trip_venues table for trip-specific venues
CREATE TABLE IF NOT EXISTS trip_venues (
  trip_id INT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  venue_id INT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (trip_id, venue_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trip_amenities_trip_id ON trip_amenities(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_amenities_amenity_id ON trip_amenities(amenity_id);
CREATE INDEX IF NOT EXISTS idx_trip_venues_trip_id ON trip_venues(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_venues_venue_id ON trip_venues(venue_id);

-- Enable RLS
ALTER TABLE trip_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_venues ENABLE ROW LEVEL SECURITY;

-- RLS policies for trip_amenities
CREATE POLICY "Public can view trip amenities" ON trip_amenities
  FOR SELECT USING (true);

CREATE POLICY "Content editors can manage trip amenities" ON trip_amenities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' IN ('super_admin', 'admin', 'content_editor')
    )
  );

-- RLS policies for trip_venues
CREATE POLICY "Public can view trip venues" ON trip_venues
  FOR SELECT USING (true);

CREATE POLICY "Content editors can manage trip venues" ON trip_venues
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' IN ('super_admin', 'admin', 'content_editor')
    )
  );