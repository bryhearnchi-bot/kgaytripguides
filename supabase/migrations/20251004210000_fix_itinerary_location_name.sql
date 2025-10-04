-- Make location_name nullable in itinerary table
-- This allows cruise itineraries to have days at sea or unspecified locations
ALTER TABLE itinerary
ALTER COLUMN location_name DROP NOT NULL;

-- Also add a comment to clarify usage
COMMENT ON COLUMN itinerary.location_name IS 'Port or location name - nullable for days at sea or when location is not yet specified';