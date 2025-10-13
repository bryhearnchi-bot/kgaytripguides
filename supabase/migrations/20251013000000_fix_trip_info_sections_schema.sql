-- Trip Info Sections Schema Fix
-- Date: 2025-10-13
-- Description: Fix section_type inconsistency (hyphen vs underscore) and ensure "always" type is supported

-- Step 1: Drop old constraint FIRST (before updating data)
ALTER TABLE trip_info_sections
DROP CONSTRAINT IF EXISTS trip_info_sections_section_type_check;

-- Step 2: Update existing data to use underscores instead of hyphens
UPDATE trip_info_sections
SET section_type = 'trip_specific'
WHERE section_type = 'trip-specific';

UPDATE trip_info_sections
SET section_type = 'general'
WHERE section_type = 'general'; -- No change needed but explicit for clarity

-- Step 3: Add updated constraint with proper values
ALTER TABLE trip_info_sections
ADD CONSTRAINT trip_info_sections_section_type_check
CHECK (section_type IN ('general', 'trip_specific', 'always'));

-- Step 4: Update the default value to use underscore
ALTER TABLE trip_info_sections
ALTER COLUMN section_type SET DEFAULT 'trip_specific';

-- Step 5: Add index for section_type if not exists (for "always" queries)
CREATE INDEX IF NOT EXISTS trip_info_sections_section_type_idx
ON trip_info_sections(section_type);

-- Add comment documenting the schema
COMMENT ON COLUMN trip_info_sections.section_type IS
'Type of section: "general" (reusable, must be assigned), "trip_specific" (tied to one trip), "always" (appears on all trips automatically). Uses underscores, not hyphens.';
