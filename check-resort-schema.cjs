// Check resort-related schema in database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('=== Checking Resort-Related Database Schema ===\n');

  try {
    // 1. Check if resort_schedules table exists and get its columns
    console.log('1. Checking resort_schedules table structure:');
    const { data: scheduleColumns, error: scheduleError } = await supabase
      .from('resort_schedules')
      .select('*')
      .limit(0);

    if (scheduleError) {
      console.log('❌ resort_schedules table error:', scheduleError.message);
    } else {
      console.log('✅ resort_schedules table exists');
      // Get actual data to see column structure
      const { data: sampleData } = await supabase
        .from('resort_schedules')
        .select('*')
        .limit(1);

      if (sampleData && sampleData.length > 0) {
        console.log('   Columns:', Object.keys(sampleData[0]));
      }
    }
    console.log('');

    // 2. Check resort_amenities table
    console.log('2. Checking resort_amenities table:');
    const { data: amenitiesSample } = await supabase
      .from('resort_amenities')
      .select('*')
      .limit(1);

    if (amenitiesSample) {
      console.log('✅ resort_amenities table exists');
      if (amenitiesSample.length > 0) {
        console.log('   Columns:', Object.keys(amenitiesSample[0]));
      }
    }
    console.log('');

    // 3. Check resort_venues table
    console.log('3. Checking resort_venues table:');
    const { data: venuesSample } = await supabase
      .from('resort_venues')
      .select('*')
      .limit(1);

    if (venuesSample) {
      console.log('✅ resort_venues table exists');
      if (venuesSample.length > 0) {
        console.log('   Columns:', Object.keys(venuesSample[0]));
      }
    }
    console.log('');

    // 4. Check a sample resort trip
    console.log('4. Sample resort trip data:');
    const { data: resortTrip } = await supabase
      .from('trips')
      .select('id, name, resort_id, ship_id')
      .not('resort_id', 'is', null)
      .limit(1)
      .single();

    if (resortTrip) {
      console.log('   Trip:', resortTrip);

      // Get schedules for this trip
      const { data: schedules, error: schedError } = await supabase
        .from('resort_schedules')
        .select('*')
        .eq('trip_id', resortTrip.id)
        .order('day_number');

      if (schedError) {
        console.log('   ❌ Error fetching schedules:', schedError.message);
      } else {
        console.log(`   Found ${schedules?.length || 0} schedule entries`);
        if (schedules && schedules.length > 0) {
          console.log('   First schedule entry:', schedules[0]);
        }
      }
    }
    console.log('');

    // 5. Check what columns actually exist in resort_schedules
    console.log('5. Getting actual resort_schedules schema from information_schema:');
    const { data: columnsInfo } = await supabase.rpc('get_table_columns', {
      table_name: 'resort_schedules'
    }).single();

    console.log('   Columns info:', columnsInfo);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkSchema().then(() => {
  console.log('\n=== Schema Check Complete ===');
  process.exit(0);
});