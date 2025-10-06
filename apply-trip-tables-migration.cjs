// Apply migration to create trip_amenities and trip_venues tables
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('Creating trip_amenities and trip_venues tables...\n');

  try {
    // Create trip_amenities table
    const { error: amenitiesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS trip_amenities (
          trip_id INT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
          amenity_id INT NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (trip_id, amenity_id)
        )
      `
    }).single();

    if (amenitiesError && !amenitiesError.message.includes('already exists')) {
      console.error('Error creating trip_amenities table:', amenitiesError);
    } else {
      console.log('✅ trip_amenities table created/verified');
    }

    // Create trip_venues table
    const { error: venuesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS trip_venues (
          trip_id INT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
          venue_id INT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (trip_id, venue_id)
        )
      `
    }).single();

    if (venuesError && !venuesError.message.includes('already exists')) {
      console.error('Error creating trip_venues table:', venuesError);
    } else {
      console.log('✅ trip_venues table created/verified');
    }

    // Test the tables
    console.log('\nTesting tables...');

    // Test insert into trip_amenities
    const { data: testAmenity, error: testAmenityError } = await supabase
      .from('trip_amenities')
      .upsert({ trip_id: 7, amenity_id: 1 })
      .select()
      .single();

    if (testAmenityError) {
      console.error('Error testing trip_amenities:', testAmenityError);
    } else {
      console.log('✅ Successfully inserted test data into trip_amenities:', testAmenity);
    }

    // Test insert into trip_venues
    const { data: testVenue, error: testVenueError } = await supabase
      .from('trip_venues')
      .upsert({ trip_id: 7, venue_id: 1 })
      .select()
      .single();

    if (testVenueError) {
      console.error('Error testing trip_venues:', testVenueError);
    } else {
      console.log('✅ Successfully inserted test data into trip_venues:', testVenue);
    }

    console.log('\n✅ Migration complete! Tables are ready to use.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

applyMigration().then(() => process.exit(0));