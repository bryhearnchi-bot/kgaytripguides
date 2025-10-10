-- Migration: Create resort_companies lookup table
-- Description: Creates a lookup table for resort companies/brands to standardize resort data
-- Date: 2025-10-09

-- Create resort_companies lookup table
CREATE TABLE IF NOT EXISTS public.resort_companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Add index on name for faster lookups
CREATE INDEX idx_resort_companies_name ON public.resort_companies(name);

-- Add comment to table
COMMENT ON TABLE public.resort_companies IS 'Lookup table for resort companies/brands. Used to categorize resorts by their parent company.';

-- Enable RLS (Row Level Security)
ALTER TABLE public.resort_companies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view resort companies"
  ON public.resort_companies
  FOR SELECT
  USING (true);

CREATE POLICY "Only authenticated users can insert resort companies"
  ON public.resort_companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update resort companies"
  ON public.resort_companies
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only super_admin can delete resort companies"
  ON public.resort_companies
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
