// Test the API endpoint to verify itinerary data is being fetched
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAPI() {
  try {
    // First, get auth token via Supabase
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'bryan@atlantisevents.com',
      password: 'bryan-pass'
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      console.error('No access token available');
      return;
    }

    // Make API request with auth
    const response = await fetch('http://localhost:3001/api/admin/trips', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    // Find trip 7
    const trip7 = data.trips?.find(t => t.id === 7);

    if (trip7) {
      console.log('Trip 7 found:', {
        id: trip7.id,
        name: trip7.name,
        itineraryEntries: trip7.itineraryEntries?.length || 0,
        scheduleEntries: trip7.scheduleEntries?.length || 0
      });

      if (trip7.itineraryEntries && trip7.itineraryEntries.length > 0) {
        console.log('\nItinerary entries:');
        trip7.itineraryEntries.forEach(entry => {
          console.log(`  Day ${entry.dayNumber}: ${entry.locationName}`);
        });
      } else {
        console.log('\nNo itinerary entries found in API response');
      }
    } else {
      console.log('Trip 7 not found in API response');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testAPI();