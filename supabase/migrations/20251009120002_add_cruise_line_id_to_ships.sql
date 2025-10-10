-- Migration: Add cruise_line_id foreign key to ships table
-- Description: Adds cruise_line_id FK and migrates data from cruise_line string column
-- Date: 2025-10-09

-- Add cruise_line_id column (nullable to allow gradual migration)
ALTER TABLE public.ships
ADD COLUMN IF NOT EXISTS cruise_line_id INTEGER;

-- Add foreign key constraint
ALTER TABLE public.ships
ADD CONSTRAINT fk_ships_cruise_line_id
FOREIGN KEY (cruise_line_id)
REFERENCES public.cruise_lines(id)
ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_ships_cruise_line_id ON public.ships(cruise_line_id);

-- Migrate existing valid cruise_line data to cruise_line_id
UPDATE public.ships s
SET cruise_line_id = cl.id
FROM public.cruise_lines cl
WHERE s.cruise_line = cl.name
  AND s.cruise_line IS NOT NULL
  AND s.cruise_line != '';

-- Handle "Virgin" → "Virgin Voyages" mapping
UPDATE public.ships s
SET cruise_line_id = cl.id
FROM public.cruise_lines cl
WHERE s.cruise_line = 'Virgin'
  AND cl.name = 'Virgin Voyages'
  AND s.cruise_line_id IS NULL;

-- Add comment to column
COMMENT ON COLUMN public.ships.cruise_line_id IS 'Foreign key to cruise_lines lookup table. Replaces the deprecated cruise_line text column.';

COMMENT ON COLUMN public.ships.cruise_line IS 'DEPRECATED: Use cruise_line_id instead. Kept for backward compatibility.';

-- Note: We keep the cruise_line column for backward compatibility
-- It will be removed in a future migration after all code is updated
