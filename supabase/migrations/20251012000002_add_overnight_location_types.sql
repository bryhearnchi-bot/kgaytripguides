-- Add overnight location types
INSERT INTO location_types (type) VALUES
    ('Overnight Arrival'),
    ('Overnight Departure'),
    ('Overnight Full Day')
ON CONFLICT (type) DO NOTHING;
