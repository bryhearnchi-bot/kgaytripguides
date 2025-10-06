// Test to verify ship_amenities and ship_venues tables
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testShipAmenitiesVenues() {
  console.log('=== Testing Ship Amenities and Venues ===\n');

  const tripId = 7; // Test with trip 7

  try {
    // 1. Check trip details
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, name, trip_type_id')
      .eq('id', tripId)
      .single();

    if (tripError) {
      console.error('Error fetching trip:', tripError);
      return;
    }

    console.log('Trip found:', trip);
    console.log('');

    // 2. Check ship_amenities table
    console.log('--- Checking ship_amenities table ---');
    const { data: shipAmenities, error: shipAmenitiesError } = await supabase
      .from('ship_amenities')
      .select('*')
      .eq('trip_id', tripId);

    if (shipAmenitiesError) {
      console.error('Error fetching ship_amenities:', shipAmenitiesError);
    } else {
      console.log(`Found ${shipAmenities?.length || 0} amenities for trip ${tripId}`);
      if (shipAmenities && shipAmenities.length > 0) {
        console.log('Amenity IDs:', shipAmenities.map(a => a.amenity_id));
      }
    }
    console.log('');

    // 3. Check ship_venues table
    console.log('--- Checking ship_venues table ---');
    const { data: shipVenues, error: shipVenuesError } = await supabase
      .from('ship_venues')
      .select('*')
      .eq('trip_id', tripId);

    if (shipVenuesError) {
      console.error('Error fetching ship_venues:', shipVenuesError);
    } else {
      console.log(`Found ${shipVenues?.length || 0} venues for trip ${tripId}`);
      if (shipVenues && shipVenues.length > 0) {
        console.log('Venue IDs:', shipVenues.map(v => v.venue_id));
      }
    }
    console.log('');

    // 4. List all available amenities
    console.log('--- Available Amenities ---');
    const { data: allAmenities, error: amenitiesError } = await supabase
      .from('amenities')
      .select('id, name')
      .limit(5);

    if (amenitiesError) {
      console.error('Error fetching amenities:', amenitiesError);
    } else if (allAmenities && allAmenities.length > 0) {
      console.log('First 5 amenities in database:');
      allAmenities.forEach(a => console.log(`  - ID ${a.id}: ${a.name}`));
    }
    console.log('');

    // 5. List all available venues
    console.log('--- Available Venues ---');
    const { data: allVenues, error: venuesError } = await supabase
      .from('venues')
      .select('id, name')
      .limit(5);

    if (venuesError) {
      console.error('Error fetching venues:', venuesError);
    } else if (allVenues && allVenues.length > 0) {
      console.log('First 5 venues in database:');
      allVenues.forEach(v => console.log(`  - ID ${v.id}: ${v.name}`));
    }
    console.log('');

    // 6. Test inserting an amenity
    console.log('--- Testing Insert Operation ---');

    // First, clean up any existing test data
    await supabase
      .from('ship_amenities')
      .delete()
      .eq('trip_id', tripId)
      .eq('amenity_id', 1);

    // Try to insert
    const { data: insertData, error: insertError } = await supabase
      .from('ship_amenities')
      .insert({ trip_id: tripId, amenity_id: 1 })
      .select();

    if (insertError) {
      console.error('Error inserting amenity:', insertError);
    } else {
      console.log('Successfully inserted amenity:', insertData);
    }

    // Verify it was inserted
    const { data: verifyData, error: verifyError } = await supabase
      .from('ship_amenities')
      .select('*')
      .eq('trip_id', tripId)
      .eq('amenity_id', 1)
      .single();

    if (verifyError) {
      console.error('Error verifying insertion:', verifyError);
    } else if (verifyData) {
      console.log('✅ Amenity successfully saved and retrieved:', verifyData);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testShipAmenitiesVenues().then(() => {
  console.log('\n=== Test Complete ===');
  process.exit(0);
});