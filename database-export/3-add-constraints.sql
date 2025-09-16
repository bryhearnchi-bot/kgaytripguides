-- STEP 3: Add Constraints and Indexes
-- Run this third in SQL Editor

-- Primary Keys
ALTER TABLE cruises ADD CONSTRAINT cruises_pkey PRIMARY KEY (id);
ALTER TABLE talent ADD CONSTRAINT talent_pkey PRIMARY KEY (id);
ALTER TABLE ports ADD CONSTRAINT ports_pkey PRIMARY KEY (id);
ALTER TABLE parties ADD CONSTRAINT parties_pkey PRIMARY KEY (id);
ALTER TABLE itinerary ADD CONSTRAINT itinerary_pkey PRIMARY KEY (id);
ALTER TABLE events ADD CONSTRAINT events_pkey PRIMARY KEY (id);
ALTER TABLE event_talent ADD CONSTRAINT event_talent_pkey PRIMARY KEY (id);
ALTER TABLE trip_info_sections ADD CONSTRAINT trip_info_sections_pkey PRIMARY KEY (id);
ALTER TABLE cruise_talent ADD CONSTRAINT cruise_talent_pkey PRIMARY KEY (cruise_id, talent_id);

-- Unique Constraints
ALTER TABLE cruises ADD CONSTRAINT cruises_slug_unique UNIQUE (slug);
ALTER TABLE ports ADD CONSTRAINT ports_name_key UNIQUE (name);
ALTER TABLE parties ADD CONSTRAINT parties_name_key UNIQUE (name);

-- Foreign Keys (only the ones that don't reference missing tables)
ALTER TABLE itinerary ADD CONSTRAINT itinerary_cruise_id_fkey FOREIGN KEY (cruise_id) REFERENCES cruises(id);
ALTER TABLE itinerary ADD CONSTRAINT itinerary_port_id_fkey FOREIGN KEY (port_id) REFERENCES ports(id);
ALTER TABLE events ADD CONSTRAINT events_cruise_id_fkey FOREIGN KEY (cruise_id) REFERENCES cruises(id);
ALTER TABLE events ADD CONSTRAINT events_party_id_fkey FOREIGN KEY (party_id) REFERENCES parties(id);
ALTER TABLE event_talent ADD CONSTRAINT event_talent_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id);
ALTER TABLE event_talent ADD CONSTRAINT event_talent_talent_id_fkey FOREIGN KEY (talent_id) REFERENCES talent(id);
ALTER TABLE trip_info_sections ADD CONSTRAINT trip_info_sections_cruise_id_fkey FOREIGN KEY (cruise_id) REFERENCES cruises(id);
ALTER TABLE cruise_talent ADD CONSTRAINT cruise_talent_cruise_id_fkey FOREIGN KEY (cruise_id) REFERENCES cruises(id);
ALTER TABLE cruise_talent ADD CONSTRAINT cruise_talent_talent_id_fkey FOREIGN KEY (talent_id) REFERENCES talent(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cruises_slug ON cruises(slug);
CREATE INDEX IF NOT EXISTS idx_cruises_status ON cruises(status);
CREATE INDEX IF NOT EXISTS idx_itinerary_cruise_id ON itinerary(cruise_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_date ON itinerary(date);
CREATE INDEX IF NOT EXISTS idx_events_cruise_id ON events(cruise_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_event_talent_event_id ON event_talent(event_id);
CREATE INDEX IF NOT EXISTS idx_event_talent_talent_id ON event_talent(talent_id);
CREATE INDEX IF NOT EXISTS idx_cruise_talent_cruise_id ON cruise_talent(cruise_id);
CREATE INDEX IF NOT EXISTS idx_cruise_talent_talent_id ON cruise_talent(talent_id);
CREATE INDEX IF NOT EXISTS idx_talent_category ON talent(category);
CREATE INDEX IF NOT EXISTS idx_trip_info_sections_cruise_id ON trip_info_sections(cruise_id);