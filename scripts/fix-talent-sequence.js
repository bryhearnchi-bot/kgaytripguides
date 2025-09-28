#!/usr/bin/env node

/**
 * Fix PostgreSQL sequence issue in the talent table
 *
 * This script will:
 * 1. Check the current max ID in the talent table
 * 2. Get the current sequence value
 * 3. Reset the sequence to the correct next value
 */

import { getSupabaseAdmin } from '../server/supabase-admin.js';

async function fixTalentSequence() {
  console.log('🔧 Starting talent table sequence fix...');

  try {
    const supabase = getSupabaseAdmin();

    // Step 1: Check current max ID in talent table
    console.log('\n📊 Step 1: Checking current max ID in talent table...');
    const { data: maxIdResult, error: maxIdError } = await supabase
      .rpc('get_max_talent_id');

    if (maxIdError) {
      // Fallback: Use direct query if RPC doesn't exist
      console.log('RPC not found, using direct query...');
      const { data: talentData, error: talentError } = await supabase
        .from('talent')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);

      if (talentError) {
        throw new Error(`Failed to get max ID: ${talentError.message}`);
      }

      const maxId = talentData && talentData.length > 0 ? talentData[0].id : 0;
      console.log(`📈 Current max ID in talent table: ${maxId}`);

      // Step 2: Check current sequence value
      console.log('\n🔢 Step 2: Checking current sequence value...');
      const { data: seqData, error: seqError } = await supabase
        .rpc('get_sequence_value', { sequence_name: 'talent_id_seq' });

      if (seqError) {
        // Fallback: Use raw SQL query
        console.log('RPC not found, using raw SQL...');
        const { data: rawSeqData, error: rawSeqError } = await supabase
          .from('pg_sequences')
          .select('last_value')
          .eq('sequencename', 'talent_id_seq');

        if (rawSeqError) {
          console.log('⚠️  Could not check sequence value. Will reset based on max ID.');
        } else {
          const currentSeqValue = rawSeqData && rawSeqData.length > 0 ? rawSeqData[0].last_value : 0;
          console.log(`🔢 Current sequence value: ${currentSeqValue}`);
        }
      } else {
        console.log(`🔢 Current sequence value: ${seqData}`);
      }

      // Step 3: Reset sequence to correct value
      const nextId = maxId + 1;
      console.log(`\n🔄 Step 3: Resetting sequence to ${nextId}...`);

      // Execute the sequence reset
      const { data: resetData, error: resetError } = await supabase
        .rpc('reset_talent_sequence', { new_value: nextId });

      if (resetError) {
        // Fallback: Use direct SQL
        console.log('RPC not found, using direct SQL...');
        const { error: sqlError } = await supabase.rpc('sql', {
          query: `SELECT setval('talent_id_seq', ${nextId}, false);`
        });

        if (sqlError) {
          throw new Error(`Failed to reset sequence: ${sqlError.message}`);
        }
      }

      console.log(`✅ Sequence reset successfully to ${nextId}`);

      // Step 4: Verify the fix
      console.log('\n🧪 Step 4: Verifying the fix...');
      const { data: verifyData, error: verifyError } = await supabase
        .rpc('get_sequence_value', { sequence_name: 'talent_id_seq' });

      if (!verifyError) {
        console.log(`✅ Verification successful. New sequence value: ${verifyData}`);
      } else {
        console.log('⚠️  Could not verify sequence value, but reset command was executed.');
      }

      console.log('\n🎉 Talent sequence fix completed successfully!');
      console.log('You can now try creating new talent records.');

    } else {
      console.log(`📈 Current max ID in talent table: ${maxIdResult}`);
    }

  } catch (error) {
    console.error('❌ Error fixing talent sequence:', error.message);
    console.error('\n🔧 Manual SQL commands to run:');
    console.error('1. Check max ID: SELECT MAX(id) FROM talent;');
    console.error('2. Reset sequence: SELECT setval(\'talent_id_seq\', (SELECT MAX(id) FROM talent) + 1, false);');
    process.exit(1);
  }
}

// Execute the fix
fixTalentSequence();