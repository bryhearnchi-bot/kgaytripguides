-- Relax constraints to allow draft trips with incomplete data
-- Drafts can have NULL ship_id/resort_id, NULL dates, etc.
-- Draft status ID is 4 (from trip_status table)

-- 1. Drop the existing CHECK constraint that requires exactly one of ship_id OR resort_id
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_property_check;

-- 2. Add a new conditional CHECK constraint that:
--    - For draft trips (trip_status_id = 4): allow both ship_id AND resort_id to be NULL
--    - For non-draft trips: require exactly one of ship_id OR resort_id
ALTER TABLE trips ADD CONSTRAINT trips_property_check CHECK (
  -- Allow both NULL for draft trips (trip_status_id = 4)
  (trip_status_id = 4)
  OR
  -- For non-draft trips, require exactly one of ship_id OR resort_id
  (trip_status_id != 4 AND
   ((ship_id IS NOT NULL AND resort_id IS NULL) OR (ship_id IS NULL AND resort_id IS NOT NULL)))
);

-- 3. Make start_date and end_date nullable to support drafts
ALTER TABLE trips ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE trips ALTER COLUMN end_date DROP NOT NULL;

-- 4. Make trip_type_id nullable to support drafts
ALTER TABLE trips ALTER COLUMN trip_type_id DROP NOT NULL;

-- Add comments
COMMENT ON CONSTRAINT trips_property_check ON trips IS 'Draft trips (status=4) can have NULL ship_id/resort_id; published trips must have exactly one';
COMMENT ON COLUMN trips.start_date IS 'Start date of trip (NULL allowed for drafts)';
COMMENT ON COLUMN trips.end_date IS 'End date of trip (NULL allowed for drafts)';
COMMENT ON COLUMN trips.trip_type_id IS 'Trip type ID (NULL allowed for drafts)';
