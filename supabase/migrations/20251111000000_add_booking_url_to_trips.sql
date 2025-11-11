-- Add booking_url column to trips table
-- This will store the URL where users can book this trip

-- Add the column
ALTER TABLE public.trips
ADD COLUMN booking_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.trips.booking_url IS 'URL where users can book this trip';

-- Grant appropriate permissions (following existing RLS policies)
-- No need to modify RLS policies as existing policies cover all columns
