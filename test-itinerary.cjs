// Test script to check if itinerary data exists for trip 7
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testItinerary() {
  console.log('Testing itinerary data for trip 7...\n');

  // Check if trip 7 exists
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, name, trip_type_id')
    .eq('id', 7)
    .single();

  if (tripError) {
    console.error('Error fetching trip:', tripError);
    return;
  }

  console.log('Trip found:', trip);

  // Check itinerary entries
  const { data: itineraryData, error: itineraryError, count } = await supabase
    .from('itinerary')
    .select('*', { count: 'exact' })
    .eq('trip_id', 7)
    .order('day');

  if (itineraryError) {
    console.error('Error fetching itinerary:', itineraryError);
    return;
  }

  console.log(`\nFound ${count} itinerary entries:`);
  if (itineraryData && itineraryData.length > 0) {
    itineraryData.forEach(entry => {
      console.log(`  Day ${entry.day}: ${entry.location_name} (${entry.date})`);
    });
  }
}

testItinerary();