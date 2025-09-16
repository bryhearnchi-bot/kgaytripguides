-- Migration 003: Migrate data to new structure
-- This migration populates the new tables and updates foreign keys

BEGIN;

-- Create savepoint for potential rollback
SAVEPOINT before_data_migration;

-- Step 1: Insert ports from our mapping
INSERT INTO ports (name, country, region, port_type, coordinates, description, image_url)
VALUES
    ('Athens (Piraeus)', 'Greece', 'Mediterranean', 'port', '{"lat": 37.9475, "lng": 23.6329}', 'Gateway to Athens, the cradle of Western civilization', 'https://res.cloudinary.com/dgfkkcfvb/image/upload/v1709123456/athens-port.jpg'),
    ('Santorini', 'Greece', 'Mediterranean', 'port', '{"lat": 36.3932, "lng": 25.4615}', 'Iconic Greek island with stunning caldera views', 'https://res.cloudinary.com/dgfkkcfvb/image/upload/v1709123456/santorini-port.jpg'),
    ('Kuşadası', 'Turkey', 'Mediterranean', 'port', '{"lat": 37.8579, "lng": 27.2614}', 'Gateway to ancient Ephesus', 'https://res.cloudinary.com/dgfkkcfvb/image/upload/v1709123456/kusadasi-port.jpg'),
    ('Istanbul', 'Turkey', 'Mediterranean', 'port', '{"lat": 41.0082, "lng": 28.9784}', 'Where East meets West', 'https://res.cloudinary.com/dgfkkcfvb/image/upload/v1709123456/istanbul-port.jpg'),
    ('Alexandria', 'Egypt', 'Mediterranean', 'port', '{"lat": 31.2001, "lng": 29.9187}', 'Ancient Egyptian port city', 'https://res.cloudinary.com/dgfkkcfvb/image/upload/v1709123456/alexandria-port.jpg'),
    ('Mykonos', 'Greece', 'Mediterranean', 'port', '{"lat": 37.4467, "lng": 25.3289}', 'Cosmopolitan Greek island paradise', 'https://res.cloudinary.com/dgfkkcfvb/image/upload/v1709123456/mykonos-port.jpg'),
    ('Iraklion (Heraklion)', 'Greece', 'Mediterranean', 'port', '{"lat": 35.3387, "lng": 25.1442}', 'Gateway to Crete and Knossos Palace', 'https://res.cloudinary.com/dgfkkcfvb/image/upload/v1709123456/iraklion-port.jpg'),
    ('At Sea', 'N/A', 'International Waters', 'sea_day', NULL, 'Day at sea enjoying ship amenities', NULL),
    ('Rome (Civitavecchia)', 'Italy', 'Mediterranean', 'embark', '{"lat": 42.0921, "lng": 11.7973}', 'Port of Rome - embarkation point', 'https://res.cloudinary.com/dgfkkcfvb/image/upload/v1709123456/civitavecchia-port.jpg'),
    ('Barcelona', 'Spain', 'Mediterranean', 'disembark', '{"lat": 41.3784, "lng": 2.1750}', 'Vibrant Catalan capital - disembarkation', 'https://res.cloudinary.com/dgfkkcfvb/image/upload/v1709123456/barcelona-port.jpg')
ON CONFLICT (name) DO NOTHING;

-- Step 2: Insert party templates
INSERT INTO parties (name, theme, venue_type, capacity, duration_hours, requirements, image_url)
VALUES
    ('White Party', 'All White Attire - Classic circuit party', 'pool', 500, 4, '["DJ", "Sound System", "Lighting", "Bar Setup", "Pool Access"]', 'https://res.cloudinary.com/dgfkkcfvb/image/upload/v1709123456/white-party.jpg'),
    ('Glow Party', 'UV/Neon Party with glow sticks and black lights', 'club', 300, 5, '["DJ", "UV Lights", "Glow Accessories", "Bar Setup"]', 'https://res.cloudinary.com/dgfkkcfvb/image/upload/v1709123456/glow-party.jpg'),
    ('Drag Spectacular', 'Premium drag show with multiple performers', 'theater', 400, 2, '["Stage", "Lighting", "Sound System", "Dressing Rooms", "Host"]', 'https://res.cloudinary.com/dgfkkcfvb/image/upload/v1709123456/drag-show.jpg'),
    ('Welcome Aboard Party', 'Meet and greet cocktail party', 'deck', 600, 2, '["Bar Setup", "Light Music", "Appetizers"]', 'https://res.cloudinary.com/dgfkkcfvb/image/upload/v1709123456/welcome-party.jpg'),
    ('Farewell Gala', 'Elegant farewell dinner and show', 'theater', 400, 3, '["Dinner Service", "Stage", "Formal Dress Code"]', 'https://res.cloudinary.com/dgfkkcfvb/image/upload/v1709123456/farewell-gala.jpg'),
    ('Pool Party', 'Daytime pool party with DJ', 'pool', 400, 3, '["DJ", "Pool Access", "Bar Setup", "Lifeguards"]', 'https://res.cloudinary.com/dgfkkcfvb/image/upload/v1709123456/pool-party.jpg'),
    ('Tea Dance', 'Classic afternoon dance party', 'deck', 300, 2, '["DJ", "Dance Floor", "Bar Setup"]', 'https://res.cloudinary.com/dgfkkcfvb/image/upload/v1709123456/tea-dance.jpg'),
    ('Piano Bar', 'Intimate piano bar experience', 'lounge', 100, 2, '["Piano", "Bar Setup", "Intimate Seating"]', 'https://res.cloudinary.com/dgfkkcfvb/image/upload/v1709123456/piano-bar.jpg'),
    ('Costume Party', 'Themed costume party', 'club', 350, 4, '["DJ", "Costume Contest", "Prizes", "Bar Setup"]', 'https://res.cloudinary.com/dgfkkcfvb/image/upload/v1709123456/costume-party.jpg'),
    ('Karaoke Night', 'Interactive karaoke party', 'lounge', 150, 3, '["Karaoke System", "Song Library", "Bar Setup", "Host"]', 'https://res.cloudinary.com/dgfkkcfvb/image/upload/v1709123456/karaoke-night.jpg'),
    ('Circuit Party', 'High-energy dance party', 'club', 400, 6, '["Multiple DJs", "Light Show", "Bar Setup", "Go-Go Dancers"]', 'https://res.cloudinary.com/dgfkkcfvb/image/upload/v1709123456/circuit-party.jpg'),
    ('Game Show Night', 'Interactive game show with prizes', 'theater', 300, 2, '["Stage", "Game Props", "Host", "Prizes", "Sound System"]', 'https://res.cloudinary.com/dgfkkcfvb/image/upload/v1709123456/game-show.jpg')
ON CONFLICT (name) DO NOTHING;

-- Step 3: Update itinerary with port_id
-- Since all location fields are empty, we'll assign ports based on a typical Mediterranean cruise pattern
-- This is a temporary mapping - should be updated with actual data

WITH port_assignments AS (
    SELECT
        i.id,
        i.day,
        i.trip_id,
        CASE
            WHEN i.day = 1 THEN (SELECT id FROM ports WHERE name = 'Rome (Civitavecchia)')
            WHEN i.day = 2 THEN (SELECT id FROM ports WHERE name = 'At Sea')
            WHEN i.day = 3 THEN (SELECT id FROM ports WHERE name = 'Santorini')
            WHEN i.day = 4 THEN (SELECT id FROM ports WHERE name = 'Athens (Piraeus)')
            WHEN i.day = 5 THEN (SELECT id FROM ports WHERE name = 'Mykonos')
            WHEN i.day = 6 THEN (SELECT id FROM ports WHERE name = 'Kuşadası')
            WHEN i.day = 7 THEN (SELECT id FROM ports WHERE name = 'Istanbul')
            WHEN i.day = 8 THEN (SELECT id FROM ports WHERE name = 'At Sea')
            WHEN i.day = 9 THEN (SELECT id FROM ports WHERE name = 'Barcelona')
            ELSE (SELECT id FROM ports WHERE name = 'At Sea')
        END as port_id
    FROM itinerary i
)
UPDATE itinerary
SET port_id = pa.port_id
FROM port_assignments pa
WHERE itinerary.id = pa.id;

-- Step 4: Create default party template for existing events
-- First, create a generic party template for talent shows
INSERT INTO parties (name, theme, venue_type, capacity, duration_hours)
VALUES ('Talent Show', 'Live performance by featured talent', 'theater', 350, 1.5)
ON CONFLICT (name) DO NOTHING;

-- Step 5: Update events with party_id
-- For now, assign the Talent Show template to all existing events
UPDATE events
SET party_id = (SELECT id FROM parties WHERE name = 'Talent Show')
WHERE party_id IS NULL;

-- Step 6: Migrate cruise_talent relationships to event_talent
-- This assumes each talent performs at their own event
INSERT INTO event_talent (event_id, talent_id, role, performance_order)
SELECT
    e.id as event_id,
    ct.talent_id,
    'headliner' as role,
    ROW_NUMBER() OVER (PARTITION BY e.id ORDER BY ct.id) as performance_order
FROM cruise_talent ct
JOIN events e ON e.trip_id = ct.cruise_id
WHERE EXISTS (
    SELECT 1 FROM talent t WHERE t.id = ct.talent_id
)
ON CONFLICT (event_id, talent_id) DO NOTHING;

-- Step 7: Verify data migration
DO $$
DECLARE
    port_count INTEGER;
    party_count INTEGER;
    event_talent_count INTEGER;
    itinerary_with_ports INTEGER;
    events_with_parties INTEGER;
BEGIN
    SELECT COUNT(*) INTO port_count FROM ports;
    SELECT COUNT(*) INTO party_count FROM parties;
    SELECT COUNT(*) INTO event_talent_count FROM event_talent;
    SELECT COUNT(*) INTO itinerary_with_ports FROM itinerary WHERE port_id IS NOT NULL;
    SELECT COUNT(*) INTO events_with_parties FROM events WHERE party_id IS NOT NULL;

    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '  Ports created: %', port_count;
    RAISE NOTICE '  Party templates created: %', party_count;
    RAISE NOTICE '  Event-talent relationships: %', event_talent_count;
    RAISE NOTICE '  Itineraries with ports: %', itinerary_with_ports;
    RAISE NOTICE '  Events with parties: %', events_with_parties;

    -- Check for any issues
    IF itinerary_with_ports = 0 THEN
        RAISE EXCEPTION 'No itinerary items were assigned ports';
    END IF;

    IF events_with_parties = 0 THEN
        RAISE EXCEPTION 'No events were assigned party templates';
    END IF;
END $$;

-- If we get here, migration was successful
COMMIT;