-- Change deck_plans from JSONB to single URL field
-- Migration: Convert deck_plans to deck_plans_url

-- Drop the JSONB deck_plans column
ALTER TABLE ships DROP COLUMN IF EXISTS deck_plans;

-- Add the new deck_plans_url text column
ALTER TABLE ships ADD COLUMN deck_plans_url TEXT;