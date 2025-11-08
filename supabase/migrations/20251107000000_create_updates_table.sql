-- Create updates table for trip updates/announcements
CREATE TABLE updates (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  update_type VARCHAR(30) NOT NULL CHECK (
    update_type IN (
      'new_cruise',
      'party_themes_released',
      'guide_updated',
      'guide_live',
      'new_event',
      'new_artist',
      'schedule_updated',
      'ship_info_updated',
      'custom'
    )
  ),
  custom_title VARCHAR(200),
  link_section VARCHAR(30) DEFAULT 'none' CHECK (
    link_section IN (
      'overview',
      'events',
      'artists',
      'schedule',
      'faqs',
      'ship',
      'none'
    )
  ),
  show_on_homepage BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX idx_updates_trip_id ON updates(trip_id);
CREATE INDEX idx_updates_homepage ON updates(show_on_homepage) WHERE show_on_homepage = true;
CREATE INDEX idx_updates_order ON updates(trip_id, order_index);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_updates_updated_at
  BEFORE UPDATE ON updates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE updates IS 'Stores trip-specific updates and announcements that appear on trip guides and optionally on the homepage';
COMMENT ON COLUMN updates.update_type IS 'Type of update - determines badge color and default title';
COMMENT ON COLUMN updates.custom_title IS 'Custom title when update_type is "custom"';
COMMENT ON COLUMN updates.link_section IS 'Which section of the trip guide this update links to';
COMMENT ON COLUMN updates.show_on_homepage IS 'Whether this update appears in the Latest News section on the homepage';
COMMENT ON COLUMN updates.order_index IS 'Display order within the trip guide (lower = earlier)';
