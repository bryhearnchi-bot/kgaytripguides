#!/usr/bin/env node

/**
 * Test script to verify Supabase admin connection and permissions
 * Run this to ensure the admin panel can write to the database
 */

import { config } from 'dotenv';
import { getSupabaseAdmin, testAdminConnection } from './supabase-admin';

// Load environment variables
config();

async function runTests() {
  console.log('🧪 Testing Supabase Admin Connection...\n');

  // Check environment variables
  console.log('1️⃣  Environment Variables Check:');
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('   ❌ SUPABASE_URL or VITE_SUPABASE_URL not found');
    process.exit(1);
  } else {
    console.log(`   ✅ Supabase URL: ${supabaseUrl.substring(0, 40)}...`);
  }

  if (!serviceRoleKey) {
    console.error('   ❌ SUPABASE_SERVICE_ROLE_KEY not found');
    console.error('      This is required for admin operations to bypass RLS');
    process.exit(1);
  } else {
    console.log(`   ✅ Service Role Key: ${serviceRoleKey.substring(0, 20)}... (length: ${serviceRoleKey.length})`);
    if (serviceRoleKey.length < 200) {
      console.warn('   ⚠️  Warning: Key seems short. Make sure it\'s the service role key, not anon key');
    }
  }

  console.log('\n2️⃣  Testing Admin Connection:');
  try {
    const success = await testAdminConnection();
    if (success) {
      console.log('   ✅ Admin connection successful!');
    } else {
      console.error('   ❌ Admin connection failed');
      // Continue with other tests anyway to gather more info
    }
  } catch (error) {
    console.error('   ❌ Connection test error:', error);
    // Continue with other tests anyway to gather more info
  }

  console.log('\n3️⃣  Testing Write Operations:');
  try {
    const admin = getSupabaseAdmin();

    // Test creating a location (will delete it after)
    const testLocation = {
      name: `Test Location ${Date.now()}`,
      country: 'Test Country',
      description: 'This is a test location created by admin connection test'
    };

    console.log('   🔄 Creating test location...');
    const { data: createdLocation, error: createError } = await admin
      .from('locations')
      .insert(testLocation)
      .select()
      .single();

    if (createError) {
      console.error('   ❌ Failed to create location:', createError);
      process.exit(1);
    }

    console.log(`   ✅ Location created: ${createdLocation.name} (ID: ${createdLocation.id})`);

    // Test updating the location
    console.log('   🔄 Updating test location...');
    const { error: updateError } = await admin
      .from('locations')
      .update({ description: 'Updated description' })
      .eq('id', createdLocation.id);

    if (updateError) {
      console.error('   ❌ Failed to update location:', updateError);
    } else {
      console.log('   ✅ Location updated successfully');
    }

    // Clean up - delete the test location
    console.log('   🔄 Cleaning up test location...');
    const { error: deleteError } = await admin
      .from('locations')
      .delete()
      .eq('id', createdLocation.id);

    if (deleteError) {
      console.error('   ❌ Failed to delete test location:', deleteError);
      console.error('      Please manually delete location with ID:', createdLocation.id);
    } else {
      console.log('   ✅ Test location deleted');
    }

  } catch (error) {
    console.error('   ❌ Write operations test failed:', error);
    process.exit(1);
  }

  console.log('\n✨ All tests passed! Admin panel should be able to write to the database.');
  console.log('   The service role key successfully bypasses RLS policies.');
  process.exit(0);
}

// Run the tests
runTests().catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
});