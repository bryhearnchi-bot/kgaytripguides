-- Make ship_name nullable to support resort trips and draft trips
-- This is a legacy column from before we had proper foreign key relationships

ALTER TABLE trips
ALTER COLUMN ship_name DROP NOT NULL;

-- Add comment explaining the column is deprecated
COMMENT ON COLUMN trips.ship_name IS 'DEPRECATED: Legacy column, use ship_id foreign key instead. Kept for backward compatibility only.';
