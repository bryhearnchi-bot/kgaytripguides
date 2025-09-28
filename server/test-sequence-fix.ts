/**
 * Test script to verify sequence fix is working
 * Run with: npx tsx server/test-sequence-fix.ts
 */

import { config } from 'dotenv';
config();

import { getSupabaseAdmin } from './supabase-admin';

async function testSequenceFix() {
  console.log('=== TESTING SEQUENCE FIX ===\n');

  const supabaseAdmin = getSupabaseAdmin();

  try {
    // Step 1: Check current max ID
    console.log('1. Checking current max ID in talent table...');
    const { data: maxIdData, error: maxIdError } = await supabaseAdmin
      .from('talent')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);

    if (maxIdError) {
      console.error('Error getting max ID:', maxIdError);
      return;
    }

    const currentMaxId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id : 0;
    console.log(`   Current max ID: ${currentMaxId}`);
    console.log(`   Next ID should be: ${currentMaxId + 1}\n`);

    // Step 2: Try to create a test talent entry
    console.log('2. Attempting to create a test talent entry...');
    const testTalent = {
      name: `Test Talent ${Date.now()}`,
      talent_category_id: 1, // Assuming category 1 exists (Headliners)
      bio: 'This is a test entry to verify sequence fix',
      known_for: 'Testing database sequences'
    };

    console.log('   Creating talent with data:', testTalent);

    const { data: newTalent, error: createError } = await supabaseAdmin
      .from('talent')
      .insert(testTalent)
      .select()
      .single();

    if (createError) {
      console.error('\n❌ ERROR: Failed to create talent');
      console.error('   Error code:', createError.code);
      console.error('   Error message:', createError.message);
      console.error('   Error details:', createError.details);
      console.error('\n   This indicates the sequence is still out of sync.');
      console.error('   Please run the SQL script: scripts/fix-talent-sequence.sql in your Supabase dashboard.\n');
      return;
    }

    console.log(`\n✅ SUCCESS: Talent created with ID ${newTalent.id}`);
    console.log('   The sequence is working correctly!\n');

    // Step 3: Clean up - delete the test entry
    console.log('3. Cleaning up test entry...');
    const { error: deleteError } = await supabaseAdmin
      .from('talent')
      .delete()
      .eq('id', newTalent.id);

    if (deleteError) {
      console.error('   Warning: Failed to delete test entry:', deleteError.message);
      console.log(`   You may want to manually delete talent with ID ${newTalent.id}`);
    } else {
      console.log('   Test entry deleted successfully.\n');
    }

    // Step 4: Summary
    console.log('=== TEST COMPLETE ===');
    console.log('✅ The talent sequence is working correctly!');
    console.log('   You can now create new talent entries without errors.\n');

  } catch (error) {
    console.error('Unexpected error during test:', error);
  }
}

// Run the test
testSequenceFix().catch(console.error);