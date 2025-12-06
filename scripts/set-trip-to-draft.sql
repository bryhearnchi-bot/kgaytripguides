-- Script to set a trip back to draft status
-- Run this in your Supabase SQL editor

-- First, find the trip (replace 'testing' with your trip name or use the trip ID)
-- This will show you the trip details
SELECT id, name, slug, trip_status_id 
FROM trips 
WHERE name ILIKE '%testing%';

-- Once you have the trip ID, update it to Draft status (status ID = 4)
-- Replace <TRIP_ID> with the actual trip ID from the query above
UPDATE trips 
SET trip_status_id = (
  SELECT id FROM trip_status WHERE status = 'Draft'
),
updated_at = NOW()
WHERE id = <TRIP_ID>;  -- Replace <TRIP_ID> with the actual trip ID

-- Or if you want to update by name directly:
UPDATE trips 
SET trip_status_id = (
  SELECT id FROM trip_status WHERE status = 'Draft'
),
updated_at = NOW()
WHERE name ILIKE '%testing%'
RETURNING id, name, trip_status_id;


