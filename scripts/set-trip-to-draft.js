#!/usr/bin/env node

/**
 * Script to set a trip back to draft status
 * Usage: node scripts/set-trip-to-draft.js <trip-name-or-id>
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials');
  console.error(
    'Make sure SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are set in .env.local'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setTripToDraft(tripIdentifier) {
  try {
    // First, get the Draft status ID
    const { data: draftStatus, error: statusError } = await supabase
      .from('trip_status')
      .select('id')
      .eq('status', 'Draft')
      .single();

    if (statusError || !draftStatus) {
      console.error('Error: Could not find Draft status in database');
      console.error(statusError);
      process.exit(1);
    }

    const draftStatusId = draftStatus.id;
    console.log(`Found Draft status ID: ${draftStatusId}`);

    // Find the trip by ID or name
    const isNumeric = /^\d+$/.test(tripIdentifier);
    let tripQuery = supabase.from('trips').select('id, name, slug, trip_status_id');

    if (isNumeric) {
      tripQuery = tripQuery.eq('id', parseInt(tripIdentifier));
    } else {
      tripQuery = tripQuery.ilike('name', `%${tripIdentifier}%`);
    }

    const { data: trips, error: tripError } = await tripQuery;

    if (tripError) {
      console.error('Error finding trip:', tripError);
      process.exit(1);
    }

    if (!trips || trips.length === 0) {
      console.error(`No trip found matching: ${tripIdentifier}`);
      process.exit(1);
    }

    if (trips.length > 1) {
      console.log('Multiple trips found:');
      trips.forEach(trip => {
        console.log(
          `  - ID: ${trip.id}, Name: "${trip.name}", Current Status ID: ${trip.trip_status_id}`
        );
      });
      console.error('\nPlease be more specific or use the trip ID');
      process.exit(1);
    }

    const trip = trips[0];
    console.log(
      `Found trip: "${trip.name}" (ID: ${trip.id}, Current Status ID: ${trip.trip_status_id})`
    );

    // Update the trip status
    const { data: updatedTrip, error: updateError } = await supabase
      .from('trips')
      .update({
        trip_status_id: draftStatusId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', trip.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating trip:', updateError);
      process.exit(1);
    }

    console.log(
      `\n✅ Successfully set trip "${updatedTrip.name}" (ID: ${updatedTrip.id}) to Draft status!`
    );
    console.log(
      `   Status ID changed from ${trip.trip_status_id} to ${updatedTrip.trip_status_id}`
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Get trip identifier from command line
const tripIdentifier = process.argv[2];

if (!tripIdentifier) {
  console.error('Usage: node scripts/set-trip-to-draft.js <trip-name-or-id>');
  console.error('Example: node scripts/set-trip-to-draft.js testing');
  console.error('Example: node scripts/set-trip-to-draft.js 123');
  process.exit(1);
}

setTripToDraft(tripIdentifier);
