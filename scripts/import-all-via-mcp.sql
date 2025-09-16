-- Complete Data Import for Supabase
-- Run this in SQL Editor: https://supabase.com/dashboard/project/bxiiodeyqvqqcgzzqzvt/sql/new

-- Clear existing data first (in case of partial imports)
TRUNCATE TABLE cruise_talent, trip_info_sections, event_talent, events, itinerary, parties, ports, talent, cruises RESTART IDENTITY CASCADE;

-- Now insert all data from Railway export
-- Copy the contents of database-export/data.sql here
-- Or run both files in sequence in the SQL Editor