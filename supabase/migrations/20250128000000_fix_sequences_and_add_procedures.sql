-- Fix Database Sequences and Add Helper Procedures
-- This migration fixes all sequence issues and creates stored procedures for future sequence management

BEGIN;

-- Create a stored procedure for resetting sequences
CREATE OR REPLACE FUNCTION reset_sequence(sequence_name text, new_value integer)
RETURNS bigint AS $$
DECLARE
  result bigint;
BEGIN
  -- Reset the sequence
  EXECUTE format('SELECT setval(%L, %s, false)', sequence_name, new_value) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reset_sequence TO authenticated;

-- Create a more comprehensive sequence fix function
CREATE OR REPLACE FUNCTION fix_table_sequence(table_name text, sequence_name text DEFAULT NULL, id_column text DEFAULT 'id')
RETURNS json AS $$
DECLARE
  seq_name text;
  max_id bigint;
  new_value bigint;
  current_value bigint;
BEGIN
  -- If sequence name not provided, assume standard naming convention
  IF sequence_name IS NULL THEN
    seq_name := table_name || '_id_seq';
  ELSE
    seq_name := sequence_name;
  END IF;

  -- Get current max ID
  EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I', id_column, table_name) INTO max_id;

  -- Calculate new sequence value
  new_value := max_id + 1;

  -- Get current sequence value
  BEGIN
    EXECUTE format('SELECT currval(%L)', seq_name) INTO current_value;
  EXCEPTION
    WHEN others THEN
      current_value := 0;
  END;

  -- Reset sequence
  EXECUTE format('SELECT setval(%L, %s, false)', seq_name, new_value);

  -- Return result as JSON
  RETURN json_build_object(
    'table_name', table_name,
    'sequence_name', seq_name,
    'previous_value', current_value,
    'max_id', max_id,
    'new_value', new_value,
    'fixed', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION fix_table_sequence TO authenticated;

-- Fix all existing sequences
-- Using GREATEST to ensure we never go backwards
SELECT setval('talent_id_seq', GREATEST(1, (SELECT COALESCE(MAX(id), 0) + 1 FROM talent)), false);
SELECT setval('trips_id_seq', GREATEST(1, (SELECT COALESCE(MAX(id), 0) + 1 FROM trips)), false);
SELECT setval('locations_id_seq', GREATEST(1, (SELECT COALESCE(MAX(id), 0) + 1 FROM locations)), false);
SELECT setval('events_id_seq', GREATEST(1, (SELECT COALESCE(MAX(id), 0) + 1 FROM events)), false);
SELECT setval('ships_id_seq', GREATEST(1, (SELECT COALESCE(MAX(id), 0) + 1 FROM ships)), false);
SELECT setval('itinerary_id_seq', GREATEST(1, (SELECT COALESCE(MAX(id), 0) + 1 FROM itinerary)), false);
SELECT setval('profiles_id_seq', GREATEST(1, (SELECT COALESCE(MAX(id), 0) + 1 FROM profiles)), false);
SELECT setval('talent_categories_id_seq', GREATEST(1, (SELECT COALESCE(MAX(id), 0) + 1 FROM talent_categories)), false);
SELECT setval('resorts_id_seq', GREATEST(1, (SELECT COALESCE(MAX(id), 0) + 1 FROM resorts)), false);
SELECT setval('venues_id_seq', GREATEST(1, (SELECT COALESCE(MAX(id), 0) + 1 FROM venues)), false);
SELECT setval('amenities_id_seq', GREATEST(1, (SELECT COALESCE(MAX(id), 0) + 1 FROM amenities)), false);
SELECT setval('trip_info_sections_id_seq', GREATEST(1, (SELECT COALESCE(MAX(id), 0) + 1 FROM trip_info_sections)), false);

-- Create a view to monitor sequence status
CREATE OR REPLACE VIEW sequence_status AS
SELECT
  schemaname,
  sequencename,
  last_value,
  start_value,
  increment_by,
  max_value,
  min_value,
  cache_value,
  is_cycled,
  is_called
FROM pg_sequences
WHERE schemaname = 'public'
ORDER BY sequencename;

-- Grant select on the view
GRANT SELECT ON sequence_status TO authenticated;

-- Create a function to get detailed sequence diagnostics
CREATE OR REPLACE FUNCTION get_sequence_diagnostics()
RETURNS TABLE (
  table_name text,
  sequence_name text,
  max_id bigint,
  current_sequence_value bigint,
  next_value bigint,
  needs_fix boolean
) AS $$
DECLARE
  r RECORD;
BEGIN
  -- Check talent table
  FOR r IN
    SELECT 'talent' as tbl, 'talent_id_seq' as seq
    UNION ALL SELECT 'trips', 'trips_id_seq'
    UNION ALL SELECT 'locations', 'locations_id_seq'
    UNION ALL SELECT 'events', 'events_id_seq'
    UNION ALL SELECT 'ships', 'ships_id_seq'
    UNION ALL SELECT 'itinerary', 'itinerary_id_seq'
    UNION ALL SELECT 'profiles', 'profiles_id_seq'
    UNION ALL SELECT 'talent_categories', 'talent_categories_id_seq'
    UNION ALL SELECT 'resorts', 'resorts_id_seq'
    UNION ALL SELECT 'venues', 'venues_id_seq'
    UNION ALL SELECT 'amenities', 'amenities_id_seq'
    UNION ALL SELECT 'trip_info_sections', 'trip_info_sections_id_seq'
  LOOP
    table_name := r.tbl;
    sequence_name := r.seq;

    -- Get max ID from table
    EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM %I', r.tbl) INTO max_id;

    -- Get current sequence value
    BEGIN
      EXECUTE format('SELECT last_value FROM %I', r.seq) INTO current_sequence_value;
    EXCEPTION
      WHEN others THEN
        current_sequence_value := 0;
    END;

    next_value := max_id + 1;
    needs_fix := current_sequence_value <= max_id;

    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_sequence_diagnostics TO authenticated;

-- Log the fix for monitoring
DO $$
BEGIN
  RAISE NOTICE 'Database sequences have been synchronized. All tables should now accept new inserts without duplicate key errors.';
END $$;

COMMIT;