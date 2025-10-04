-- Add unique constraint for itinerary (trip_id, day) to prevent duplicates
-- and allow upsert operations
ALTER TABLE itinerary
ADD CONSTRAINT itinerary_trip_id_day_unique UNIQUE (trip_id, day);

-- Also add unique constraint for resort_schedules (trip_id, day_number)
ALTER TABLE resort_schedules
ADD CONSTRAINT resort_schedules_trip_id_day_number_unique UNIQUE (trip_id, day_number);

-- Add comment to explain the constraints
COMMENT ON CONSTRAINT itinerary_trip_id_day_unique ON itinerary IS 'Ensures each trip can only have one itinerary entry per day';
COMMENT ON CONSTRAINT resort_schedules_trip_id_day_number_unique ON resort_schedules IS 'Ensures each trip can only have one schedule entry per day';