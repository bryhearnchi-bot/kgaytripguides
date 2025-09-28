#!/usr/bin/env node

/**
 * Direct SQL Script to Fix PostgreSQL Sequence Issue in Talent Table
 *
 * This script connects directly to the Supabase database and executes
 * the necessary SQL commands to fix the sequence issue.
 */

import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixTalentSequence() {
  let client;

  try {
    console.log('🔧 Starting talent table sequence fix...');

    // Parse the DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable not found');
    }

    console.log('🔗 Connecting to database...');

    // Create PostgreSQL client
    client = new Client({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });

    await client.connect();
    console.log('✅ Connected to database');

    // Step 1: Check current max ID in talent table
    console.log('\n📊 Step 1: Checking current max ID in talent table...');
    const maxIdResult = await client.query('SELECT MAX(id) as max_id FROM talent;');
    const maxId = maxIdResult.rows[0].max_id || 0;
    console.log(`📈 Current max ID in talent table: ${maxId}`);

    // Step 2: Check current sequence value
    console.log('\n🔢 Step 2: Checking current sequence value...');
    const seqResult = await client.query("SELECT last_value FROM talent_id_seq;");
    const currentSeqValue = seqResult.rows[0].last_value;
    console.log(`🔢 Current sequence value: ${currentSeqValue}`);

    // Step 3: Calculate the correct next value
    const nextId = maxId + 1;
    console.log(`\n🔄 Step 3: Setting sequence to ${nextId}...`);

    // Step 4: Reset the sequence
    const resetResult = await client.query(`SELECT setval('talent_id_seq', ${nextId}, false);`);
    console.log(`✅ Sequence reset successfully. New value: ${resetResult.rows[0].setval}`);

    // Step 5: Verify the fix
    console.log('\n🧪 Step 4: Verifying the fix...');
    const verifyResult = await client.query("SELECT last_value FROM talent_id_seq;");
    const newSeqValue = verifyResult.rows[0].last_value;
    console.log(`✅ Verification successful. New sequence value: ${newSeqValue}`);

    console.log('\n🎉 Talent sequence fix completed successfully!');
    console.log('You can now try creating new talent records.');

    // Test sequence with a sample query (doesn't create, just tests)
    console.log('\n🧪 Testing sequence with nextval...');
    const testResult = await client.query("SELECT nextval('talent_id_seq') as next_id;");
    console.log(`🔢 Next ID that would be generated: ${testResult.rows[0].next_id}`);

    // Reset sequence back to the correct value after test
    await client.query(`SELECT setval('talent_id_seq', ${nextId}, false);`);
    console.log(`🔄 Sequence reset back to ${nextId} after test`);

  } catch (error) {
    console.error('❌ Error fixing talent sequence:', error.message);
    console.error('\n🔧 Manual SQL commands to run in Supabase dashboard:');
    console.error('1. Check max ID: SELECT MAX(id) FROM talent;');
    console.error('2. Check sequence: SELECT last_value FROM talent_id_seq;');
    console.error('3. Reset sequence: SELECT setval(\'talent_id_seq\', (SELECT MAX(id) FROM talent) + 1, false);');
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Execute the fix
fixTalentSequence();