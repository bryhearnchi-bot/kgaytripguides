-- Supabase Backup Script
-- This will be used to export data from production and import to backup project
-- Generated: 2025-09-29

-- This script exports all data in a format that can be imported to the backup project
-- Run this against PRODUCTION database to generate backup data

\echo 'Starting backup export...'

-- Export all table data
COPY (SELECT * FROM profiles) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM trips) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM locations) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM events) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM talent) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM ships) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM resorts) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM itinerary) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM trip_talent) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM trip_info_sections) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM trip_section_assignments) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM party_themes) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM charter_companies) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM location_types) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM venue_types) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM venues) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM amenities) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM resort_amenities) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM resort_venues) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM ship_amenities) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM ship_venues) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM talent_categories) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM trip_types) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM trip_status) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM invitations) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM security_audit_log) TO STDOUT WITH CSV HEADER;

\echo 'Backup export complete!'