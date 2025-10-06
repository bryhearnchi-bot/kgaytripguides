// Test script to check if amenities and venues are being saved
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAmenitiesVenues() {
  const tripId = 7; // Test with trip 7

  console.log(`Testing amenities and venues for trip ${tripId}...\n`);

  // Check if trip exists
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, name')
    .eq('id', tripId)
    .single();

  if (tripError) {
    console.error('Error fetching trip:', tripError);
    return;
  }

  console.log('Trip found:', trip);

  // Check amenities
  const { data: amenities, error: amenitiesError, count: amenityCount } = await supabase
    .from('trip_amenities')
    .select('amenity_id', { count: 'exact' })
    .eq('trip_id', tripId);

  if (amenitiesError) {
    console.error('Error fetching amenities:', amenitiesError);
  } else {
    console.log(`\nFound ${amenityCount} amenities:`);
    if (amenities && amenities.length > 0) {
      // Get amenity details
      for (const item of amenities) {
        const { data: amenity } = await supabase
          .from('amenities')
          .select('name')
          .eq('id', item.amenity_id)
          .single();
        console.log(`  - Amenity ID ${item.amenity_id}: ${amenity?.name || 'Unknown'}`);
      }
    }
  }

  // Check venues
  const { data: venues, error: venuesError, count: venueCount } = await supabase
    .from('trip_venues')
    .select('venue_id', { count: 'exact' })
    .eq('trip_id', tripId);

  if (venuesError) {
    console.error('Error fetching venues:', venuesError);
  } else {
    console.log(`\nFound ${venueCount} venues:`);
    if (venues && venues.length > 0) {
      // Get venue details
      for (const item of venues) {
        const { data: venue } = await supabase
          .from('venues')
          .select('name')
          .eq('id', item.venue_id)
          .single();
        console.log(`  - Venue ID ${item.venue_id}: ${venue?.name || 'Unknown'}`);
      }
    }
  }

  // Test updating amenities
  console.log('\n--- Testing update operation ---');

  // Add a test amenity (assuming amenity ID 1 exists)
  const testAmenityId = 1;

  // First delete existing
  await supabase.from('trip_amenities').delete().eq('trip_id', tripId);

  // Then insert new
  const { error: insertError } = await supabase
    .from('trip_amenities')
    .insert({ trip_id: tripId, amenity_id: testAmenityId });

  if (insertError) {
    console.error('Error inserting test amenity:', insertError);
  } else {
    console.log(`Successfully added amenity ${testAmenityId} to trip ${tripId}`);

    // Verify it was saved
    const { data: verifyData, error: verifyError } = await supabase
      .from('trip_amenities')
      .select('*')
      .eq('trip_id', tripId)
      .eq('amenity_id', testAmenityId)
      .single();

    if (verifyError) {
      console.error('Error verifying:', verifyError);
    } else {
      console.log('Verified: Amenity was saved successfully:', verifyData);
    }
  }
}

testAmenitiesVenues().then(() => process.exit(0));