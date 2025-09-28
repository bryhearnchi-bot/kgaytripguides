-- IMMEDIATE FIX FOR TALENT TABLE SEQUENCE ISSUE
-- Run this script in your Supabase SQL editor to fix the duplicate key error

-- Step 1: Check current state
SELECT
  'Current max ID in talent table' as description,
  MAX(id) as value
FROM talent
UNION ALL
SELECT
  'Current sequence value' as description,
  last_value as value
FROM talent_id_seq;

-- Step 2: Fix the sequence
-- This sets the sequence to the next available ID
DO $$
DECLARE
  max_id INTEGER;
  next_id INTEGER;
BEGIN
  -- Get the current maximum ID in the talent table
  SELECT COALESCE(MAX(id), 0) INTO max_id FROM talent;

  -- Calculate the next ID
  next_id := max_id + 1;

  -- Reset the sequence to the next available value
  PERFORM setval('talent_id_seq', next_id, false);

  RAISE NOTICE 'Talent sequence fixed! Max ID was %, sequence now set to %', max_id, next_id;
END $$;

-- Step 3: Verify the fix
SELECT
  'New sequence value after fix' as description,
  last_value as value
FROM talent_id_seq;

-- Step 4: Test that inserts will now work
-- This doesn't actually insert, just shows what the next ID would be
SELECT nextval('talent_id_seq') as next_id_that_would_be_used;

-- Reset the sequence after the test (since nextval incremented it)
SELECT setval('talent_id_seq', (SELECT MAX(id) + 1 FROM talent), false);

-- Final verification
SELECT
  'Talent table ready for new inserts' as status,
  'Next ID will be: ' || (SELECT MAX(id) + 1 FROM talent) as message;