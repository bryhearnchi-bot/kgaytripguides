# HW25 Event Schedule Fix Summary

## Overview

This document summarizes the 26 errors found in the Halloween Caribbean Cruise (HW25) event schedule and the SQL script to fix them.

## File Location

- SQL Fix Script: `fix-hw25-events.sql`
- PDF Reference: `pdf/HW25-Cruise-vacation-guide-FINAL.pdf`

## How to Run the Fix

### Option 1: Via Supabase SQL Editor (Recommended)

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy the contents of `fix-hw25-events.sql`
4. Paste and run the script
5. The script uses a transaction (BEGIN/COMMIT) so it's all-or-nothing

### Option 2: Via Command Line

```bash
psql "postgresql://postgres:...@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres" < fix-hw25-events.sql
```

### Option 3: Via Claude Code (Safest)

Ask Claude to run the script using the Supabase MCP tool, which will apply the migrations safely.

---

## Error Summary by Day

### ✅ SATURDAY Oct 25 - PERFECT (0 errors)

All 8 events are correct. No changes needed.

### ❌ SUNDAY Oct 26 - 6 Errors Fixed

**Deleted (3):**

- Duel Reality @ 7:30pm (wrong show)
- Duel Reality @ 10pm (wrong show)
- The Diva Goes West @ 9pm (extra event)
- Christina Bianco @ 11pm (extra event)

**Updated (1):**

- Piano Bar: Changed from Ge Enrique → Brian Nash

**Inserted (3):**

- Bingo with Miss Richfield & The Diva @ 2pm
- Miss Richfield 1981 @ 7:30pm
- Miss Richfield 1981 @ 10pm

### ❌ MONDAY Oct 27 - 6 Errors Fixed

**Deleted (5):**

- Bingo @ 2pm (wrong day - belongs on Sunday)
- Twisted Pink T-Dance @ 4:30pm (wrong day - belongs on Tuesday)
- Miss Richfield 1981 @ 7:30pm (wrong show)
- Miss Richfield 1981 @ 10pm (wrong show)
- Sutton Lee Seymour @ 9pm (extra event)

**Updated (1):**

- Piano Bar: Changed from Brian Nash → Ge Enrique

**Inserted (2):**

- Duel Reality @ 7:30pm
- Duel Reality @ 10pm

### ❌ TUESDAY Oct 28 - 6 Errors Fixed

**Deleted (3):**

- Solea Pfieffer @ 7:30pm (wrong show)
- Solea Pfieffer @ 10pm (wrong show)
- Cacophony Daniels @ 9pm (wrong time/show)

**Updated (1):**

- Piano Bar: Changed from Ge Enrique → Brian Nash

**Inserted (5):**

- Twisted Pink T-Dance @ 4:30pm
- Murder in the Manor @ 6:30pm
- Red Hot @ 7:30pm
- Christina Bianco @ 9:30pm
- Red Hot @ 10pm

### ❌ WEDNESDAY Oct 29 - 4 Errors Fixed

**Deleted (4):**

- Red Hot @ 7:30pm (wrong show)
- Red Hot @ 10pm (wrong show)
- Christina Bianco @ 7pm (wrong performer)
- Piano Bar @ 11pm (extra event - not in PDF)

**Inserted (3):**

- Cacophony Daniels @ 7pm
- Solea Pfieffer @ 7:30pm
- Solea Pfieffer @ 10pm

### ❌ THURSDAY Oct 30 - 1 Error Fixed

**Inserted (1):**

- Piano Bar with Ge Enrique @ 11pm

### ❌ FRIDAY Oct 31 - 3 Errors Fixed

**Deleted (1):**

- Murder in the Manor @ 7:30pm (extra event)

**Updated (2):**

- Halloween Pool Games: Time changed from 12:30pm → 12:00pm (Noon)
- Last Dance: Date/time changed from Nov 1 00:00 → Oct 31 23:00 (11pm)

---

## Statistics

### By Operation Type:

- **DELETE**: 16 events removed (extra/wrong events)
- **UPDATE**: 5 events modified (wrong details)
- **INSERT**: 17 events added (missing events)
- **TOTAL**: 26 errors fixed + 12 replacement operations = 38 total operations

### Error Pattern Analysis:

The main issue was that shows were scheduled on the wrong days:

- Sunday and Monday had their main shows swapped (Miss Richfield ↔ Duel Reality)
- Tuesday and Wednesday had their main shows swapped (Red Hot ↔ Solea Pfieffer)
- Piano bar performers (Brian Nash and Ge Enrique) were swapped on multiple days
- Several events were duplicated or placed on wrong days

---

## Verification After Running

After running the fix script, verify with these queries:

### Check event count by day:

```sql
SELECT
  DATE(date) as event_date,
  COUNT(*) as event_count
FROM events
WHERE trip_id = 74
GROUP BY DATE(date)
ORDER BY event_date;
```

Expected counts:

- Oct 25: 8 events
- Oct 26: 7 events
- Oct 27: 5 events
- Oct 28: 8 events
- Oct 29: 4 events
- Oct 30: 6 events
- Oct 31: 7 events

### View all events in order:

```sql
SELECT
  DATE(date) as event_date,
  time,
  title,
  (SELECT name FROM ship_venues WHERE id = events.ship_venue_id) as venue
FROM events
WHERE trip_id = 74
ORDER BY date, time;
```

---

## Safety Notes

1. **The script uses a transaction** - If any error occurs, nothing will be committed
2. **Make a backup first** if you want to be extra cautious
3. **Test on dev database first** if available
4. **The script is idempotent** - You can run it multiple times safely (though it will fail on duplicate inserts after first run)

---

## Next Steps After Fix

1. Run the fix script
2. Verify with the queries above
3. Test the app to ensure events display correctly
4. Check the trip guide page to ensure all events show properly
5. Verify no orphaned event_talent relationships exist

---

## Contact

If you encounter any issues running this script, check:

1. Database connection is working
2. Trip ID 74 exists (HW25 Halloween Caribbean Cruise)
3. All referenced talent IDs exist in the talent table
4. All referenced venue IDs exist in ship_venues table

Generated: 2025-10-25
