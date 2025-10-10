-- Migration: Create cruise_lines lookup table
-- Description: Creates a lookup table for cruise line companies to standardize ship data
-- Date: 2025-10-09

-- Create cruise_lines lookup table
CREATE TABLE IF NOT EXISTS public.cruise_lines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Add index on name for faster lookups
CREATE INDEX idx_cruise_lines_name ON public.cruise_lines(name);

-- Insert clean cruise line data from existing ships table
-- Only insert valid, non-junk cruise line names
INSERT INTO public.cruise_lines (name)
SELECT DISTINCT cruise_line
FROM public.ships
WHERE cruise_line IS NOT NULL
  AND cruise_line != ''
  AND cruise_line NOT IN ('test ship', 'daasdas', 'dsdsadsa', 'ewqeq')
  AND LENGTH(cruise_line) > 2
ON CONFLICT (name) DO NOTHING;

-- Consolidate "Virgin" → "Virgin Voyages"
UPDATE public.cruise_lines
SET name = 'Virgin Voyages'
WHERE name = 'Virgin';

-- Add comment to table
COMMENT ON TABLE public.cruise_lines IS 'Lookup table for cruise line companies. Used to standardize ship cruise line data.';

-- Enable RLS (Row Level Security)
ALTER TABLE public.cruise_lines ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view cruise lines"
  ON public.cruise_lines
  FOR SELECT
  USING (true);

CREATE POLICY "Only authenticated users can insert cruise lines"
  ON public.cruise_lines
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update cruise lines"
  ON public.cruise_lines
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only super_admin can delete cruise lines"
  ON public.cruise_lines
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
