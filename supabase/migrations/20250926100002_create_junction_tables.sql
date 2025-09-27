-- Create junction tables for ships/resorts relationships with amenities/venues
-- Migration: Phase 1 - Junction tables for many-to-many relationships

-- Create ship_amenities junction table
CREATE TABLE ship_amenities (
  ship_id INTEGER NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
  amenity_id INTEGER NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (ship_id, amenity_id)
);

-- Create ship_venues junction table
CREATE TABLE ship_venues (
  ship_id INTEGER NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
  venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  PRIMARY KEY (ship_id, venue_id)
);

-- Create resort_amenities junction table
CREATE TABLE resort_amenities (
  resort_id INTEGER NOT NULL REFERENCES resorts(id) ON DELETE CASCADE,
  amenity_id INTEGER NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (resort_id, amenity_id)
);

-- Create resort_venues junction table
CREATE TABLE resort_venues (
  resort_id INTEGER NOT NULL REFERENCES resorts(id) ON DELETE CASCADE,
  venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  PRIMARY KEY (resort_id, venue_id)
);

-- Create indexes for better query performance
CREATE INDEX ship_amenities_ship_id_idx ON ship_amenities(ship_id);
CREATE INDEX ship_amenities_amenity_id_idx ON ship_amenities(amenity_id);
CREATE INDEX ship_venues_ship_id_idx ON ship_venues(ship_id);
CREATE INDEX ship_venues_venue_id_idx ON ship_venues(venue_id);
CREATE INDEX resort_amenities_resort_id_idx ON resort_amenities(resort_id);
CREATE INDEX resort_amenities_amenity_id_idx ON resort_amenities(amenity_id);
CREATE INDEX resort_venues_resort_id_idx ON resort_venues(resort_id);
CREATE INDEX resort_venues_venue_id_idx ON resort_venues(venue_id);