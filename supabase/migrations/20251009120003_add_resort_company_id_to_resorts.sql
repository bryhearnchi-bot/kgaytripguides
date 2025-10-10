-- Migration: Add resort_company_id foreign key to resorts table
-- Description: Adds resort_company_id FK to categorize resorts by parent company
-- Date: 2025-10-09

-- Add resort_company_id column (nullable - optional field)
ALTER TABLE public.resorts
ADD COLUMN IF NOT EXISTS resort_company_id INTEGER;

-- Add foreign key constraint
ALTER TABLE public.resorts
ADD CONSTRAINT fk_resorts_resort_company_id
FOREIGN KEY (resort_company_id)
REFERENCES public.resort_companies(id)
ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_resorts_resort_company_id ON public.resorts(resort_company_id);

-- Add comment to column
COMMENT ON COLUMN public.resorts.resort_company_id IS 'Foreign key to resort_companies lookup table. Optional field to categorize resorts by parent company/brand.';
