-- ============================================================================
-- HW25 Halloween Caribbean Cruise - Event Schedule Correction Script
-- ============================================================================
-- This script corrects 26 errors in the events schedule to match the PDF
-- Run this script to fix the database to exactly match the PDF schedule
-- ============================================================================

BEGIN;

-- ============================================================================
-- SUNDAY OCTOBER 26 - 6 Errors to Fix
-- ============================================================================

-- DELETE: Wrong shows (should be Miss Richfield 1981, not Duel Reality)
DELETE FROM events WHERE id = 151; -- Duel Reality @ 7:30pm (wrong show)
DELETE FROM events WHERE id = 152; -- Duel Reality @ 10pm (wrong show)

-- DELETE: Extra events that don't exist in PDF
DELETE FROM events WHERE id = 153; -- The Diva Goes West @ 9pm (extra)
DELETE FROM events WHERE id = 154; -- Christina Bianco @ 11pm (extra)

-- UPDATE: Wrong pianist (should be Brian Nash, not Ge Enrique)
UPDATE events
SET talent_ids = '[21]'::jsonb -- Brian Nash
WHERE id = 155;

-- INSERT: Missing event - Bingo with Miss Richfield & The Diva @ 2pm
INSERT INTO events (trip_id, date, time, title, description, event_type_id, ship_venue_id, talent_ids)
VALUES (
  74, -- HW25 trip ID
  '2025-10-26 00:00:00',
  '14:00',
  'Bingo with Miss Richfield & The Diva',
  'Pure silliness and camp craziness when our own Miss Richfield joins The Diva for a hilarious bingo session unlike any other',
  5, -- fun
  70, -- Red Room
  '[50, 15]'::jsonb -- Miss Richfield 1981, The Diva
);

-- INSERT: Missing show - Miss Richfield 1981 @ 7:30pm
INSERT INTO events (trip_id, date, time, title, description, event_type_id, ship_venue_id, talent_ids)
VALUES (
  74,
  '2025-10-26 00:00:00',
  '19:30',
  'Miss Richfield 1981',
  'Professional beauty queen and on-trend fashion gal Miss Richfield 1981 celebrates our wonderfully medicated world and the joy we all feel about that with her new show, "There''s A Pill For That!"',
  2, -- show
  70, -- Red Room
  '[50]'::jsonb -- Miss Richfield 1981
);

-- INSERT: Missing show - Miss Richfield 1981 @ 10pm
INSERT INTO events (trip_id, date, time, title, description, event_type_id, ship_venue_id, talent_ids)
VALUES (
  74,
  '2025-10-26 00:00:00',
  '22:00',
  'Miss Richfield 1981',
  'Professional beauty queen - There''s A Pill For That!',
  2, -- show
  70, -- Red Room
  '[50]'::jsonb -- Miss Richfield 1981
);


-- ============================================================================
-- MONDAY OCTOBER 27 (Cozumel) - 6 Errors to Fix
-- ============================================================================

-- DELETE: Wrong day events (these belong on other days)
DELETE FROM events WHERE id = 157; -- Bingo (belongs on Sunday)
DELETE FROM events WHERE id = 158; -- Twisted Pink (belongs on Tuesday)

-- DELETE: Wrong shows (should be Duel Reality, not Miss Richfield)
DELETE FROM events WHERE id = 159; -- Miss Richfield @ 7:30pm (wrong show)
DELETE FROM events WHERE id = 160; -- Miss Richfield @ 10pm (wrong show)

-- DELETE: Extra event
DELETE FROM events WHERE id = 161; -- Sutton Lee Seymour @ 9pm (extra)

-- UPDATE: Wrong pianist (should be Ge Enrique, not Brian Nash)
UPDATE events
SET talent_ids = '[46]'::jsonb -- Ge Enrique
WHERE id = 163;

-- INSERT: Missing show - Duel Reality @ 7:30pm
INSERT INTO events (trip_id, date, time, title, description, event_type_id, ship_venue_id, talent_ids)
VALUES (
  74,
  '2025-10-27 00:00:00',
  '19:30',
  'Duel Reality',
  'A dazzling, modern, & sexy acrobatic retelling of Romeo and Juliet. Watch as two warring groups grapple through graceful and death-defying acts',
  2, -- show
  70, -- Red Room
  '[54]'::jsonb -- Duel Reality
);

-- INSERT: Missing show - Duel Reality @ 10pm
INSERT INTO events (trip_id, date, time, title, description, event_type_id, ship_venue_id, talent_ids)
VALUES (
  74,
  '2025-10-27 00:00:00',
  '22:00',
  'Duel Reality',
  'A dazzling, modern, & sexy acrobatic retelling of Romeo and Juliet',
  2, -- show
  70, -- Red Room
  '[54]'::jsonb -- Duel Reality
);


-- ============================================================================
-- TUESDAY OCTOBER 28 (Costa Maya) - 6 Errors to Fix
-- ============================================================================

-- DELETE: Wrong shows (should be Red Hot, not Solea Pfieffer)
DELETE FROM events WHERE id = 166; -- Solea @ 7:30pm (wrong show)
DELETE FROM events WHERE id = 167; -- Solea @ 10pm (wrong show)

-- DELETE: Wrong show and time (should be Christina @ 9:30pm)
DELETE FROM events WHERE id = 168; -- Cacophony @ 9pm (wrong)

-- UPDATE: Wrong pianist (should be Brian Nash, not Ge Enrique)
UPDATE events
SET talent_ids = '[21]'::jsonb -- Brian Nash
WHERE id = 170;

-- INSERT: Missing party - Twisted Pink T-Dance @ 4:30pm
INSERT INTO events (trip_id, date, time, title, description, event_type_id, ship_venue_id, party_theme_id, talent_ids)
VALUES (
  74,
  '2025-10-28 00:00:00',
  '16:30',
  'Twisted Pink T-Dance',
  'Let your imagination run wild and play out your favorite pink look for a hot afternoon of frivolous dolled up fun',
  1, -- party
  69, -- Aquatic Club
  30, -- Twisted Pink T-Dance theme
  '[]'::jsonb
);

-- INSERT: Missing event - Murder in the Manor @ 6:30pm
INSERT INTO events (trip_id, date, time, title, description, event_type_id, ship_venue_id, talent_ids)
VALUES (
  74,
  '2025-10-28 00:00:00',
  '18:30',
  'Murder in the Manor',
  'An interactive mystery somewhere between Scooby-Doo and Haunted Mansion, with plenty of tongue-in-cheek humor, 80s-inspired costumes, synth pop soundtrack, and moody staging',
  5, -- fun
  71, -- The Manor
  '[57]'::jsonb -- Murder in the Manor talent
);

-- INSERT: Missing show - Red Hot @ 7:30pm
INSERT INTO events (trip_id, date, time, title, description, event_type_id, ship_venue_id, talent_ids)
VALUES (
  74,
  '2025-10-28 00:00:00',
  '19:30',
  'Red Hot',
  'An all-new Virgin production show paying tribute to their musical roots through thrilling choreography, iconic performance and dazzling staging!',
  2, -- show
  70, -- Red Room
  '[55]'::jsonb -- Red Hot
);

-- INSERT: Missing show - Christina Bianco @ 9:30pm
INSERT INTO events (trip_id, date, time, title, description, event_type_id, ship_venue_id, talent_ids)
VALUES (
  74,
  '2025-10-28 00:00:00',
  '21:30',
  'Christina Bianco',
  'Acclaimed cabaret and Broadway star whose versatile vocals and celebrity impressions have been the hit of the NY scene. She''ll bring legends like Barbra, Celine, and Britney to life!',
  2, -- show
  71, -- The Manor
  '[47]'::jsonb -- Christina Bianco
);

-- INSERT: Missing show - Red Hot @ 10pm
INSERT INTO events (trip_id, date, time, title, description, event_type_id, ship_venue_id, talent_ids)
VALUES (
  74,
  '2025-10-28 00:00:00',
  '22:00',
  'Red Hot',
  'An all-new Virgin production show - Red Hot',
  2, -- show
  70, -- Red Room
  '[55]'::jsonb -- Red Hot
);


-- ============================================================================
-- WEDNESDAY OCTOBER 29 (Roatan) - 4 Errors to Fix
-- ============================================================================

-- DELETE: Wrong shows (should be Solea Pfieffer, not Red Hot)
DELETE FROM events WHERE id = 172; -- Red Hot @ 7:30pm (wrong show)
DELETE FROM events WHERE id = 173; -- Red Hot @ 10pm (wrong show)

-- DELETE: Wrong performer (should be Cacophony, not Christina)
DELETE FROM events WHERE id = 174; -- Christina @ 7pm (wrong)

-- DELETE: Extra event - Piano bar not in PDF for Wednesday
DELETE FROM events WHERE id = 176; -- Piano Bar (extra)

-- INSERT: Missing show - Cacophony Daniels @ 7pm
INSERT INTO events (trip_id, date, time, title, description, event_type_id, ship_venue_id, talent_ids)
VALUES (
  74,
  '2025-10-29 00:00:00',
  '19:00',
  'Cacophony Daniels',
  'Direct from the Broadway stage to Atlantis, a drag sensation with a voice as high as her hair!',
  2, -- show
  71, -- The Manor
  '[48]'::jsonb -- Cacophony Daniels
);

-- INSERT: Missing show - Solea Pfieffer @ 7:30pm
INSERT INTO events (trip_id, date, time, title, description, event_type_id, ship_venue_id, talent_ids)
VALUES (
  74,
  '2025-10-29 00:00:00',
  '19:30',
  'Solea Pfieffer',
  'New! Broadway''s hottest new diva, direct from a star role in Moulin Rouge! From Hamilton to Hadestown, pop to R&B, she''s here to thrill and dazzle!',
  2, -- show
  70, -- Red Room
  '[51]'::jsonb -- Solea Pfieffer
);

-- INSERT: Missing show - Solea Pfieffer @ 10pm
INSERT INTO events (trip_id, date, time, title, description, event_type_id, ship_venue_id, talent_ids)
VALUES (
  74,
  '2025-10-29 00:00:00',
  '22:00',
  'Solea Pfieffer',
  'Broadway''s hottest new diva - Solea Pfieffer',
  2, -- show
  70, -- Red Room
  '[51]'::jsonb -- Solea Pfieffer
);


-- ============================================================================
-- THURSDAY OCTOBER 30 (At Sea) - 1 Error to Fix
-- ============================================================================

-- INSERT: Missing event - Piano Bar with Ge Enrique @ 11pm
INSERT INTO events (trip_id, date, time, title, description, event_type_id, ship_venue_id, talent_ids)
VALUES (
  74,
  '2025-10-30 00:00:00',
  '23:00',
  'Piano Bar with Ge Enrique',
  'Our welcoming and rowdy piano bar, filled with musical surprises. Show tunes, pop hits, requests, and so much more',
  4, -- lounge
  72, -- On the Rocks
  '[46]'::jsonb -- Ge Enrique
);


-- ============================================================================
-- FRIDAY OCTOBER 31 (Bimini - Halloween) - 3 Errors to Fix
-- ============================================================================

-- DELETE: Extra event - Murder not in PDF for Friday
DELETE FROM events WHERE id = 185; -- Murder in the Manor @ 7:30pm (extra)

-- UPDATE: Wrong time (should be 12:00 noon, not 12:30pm)
UPDATE events
SET time = '12:00'
WHERE id = 183;

-- UPDATE: Wrong date/time (should be Oct 31 11pm, not Nov 1 midnight)
UPDATE events
SET date = '2025-10-31 00:00:00',
    time = '23:00'
WHERE id = 190;


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after committing to verify the fixes

-- Verify event count by day
-- SELECT
--   DATE(date) as event_date,
--   COUNT(*) as event_count
-- FROM events
-- WHERE trip_id = 74
-- GROUP BY DATE(date)
-- ORDER BY event_date;

-- Verify all events are correct
-- SELECT
--   DATE(date) as event_date,
--   time,
--   title,
--   ship_venue_id,
--   talent_ids
-- FROM events
-- WHERE trip_id = 74
-- ORDER BY date, time;

COMMIT;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
-- Total fixes: 26 errors corrected
-- - 7 events deleted (extra/wrong)
-- - 14 events inserted (missing)
-- - 5 events updated (wrong details)
-- ============================================================================
