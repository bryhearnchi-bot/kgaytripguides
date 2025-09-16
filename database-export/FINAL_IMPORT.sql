-- FINAL IMPORT SCRIPT FOR SUPABASE
-- Run this in SQL Editor: https://supabase.com/dashboard/project/bxiiodeyqvqqcgzzqzvt/sql/new

-- Step 1: Clear all existing data
TRUNCATE TABLE cruise_talent, trip_info_sections, event_talent, events, itinerary, parties, ports, talent, cruises RESTART IDENTITY CASCADE;

-- Step 2: Import all data
-- Copy all INSERT statements from database-export/data.sql below this line