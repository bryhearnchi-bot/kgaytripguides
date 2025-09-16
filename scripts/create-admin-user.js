#!/usr/bin/env node

/**
 * Script to create an admin user in Supabase
 * Usage: node scripts/create-admin-user.js <email> <password>
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser(email, password) {
  try {
    console.log(`\n📧 Creating admin user: ${email}`);

    // 1. Create the user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm the email
    });

    if (authError) {
      throw authError;
    }

    console.log('✅ User created successfully');
    console.log(`   ID: ${authData.user.id}`);

    // 2. Update the profile to set admin role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', authData.user.id);

    if (profileError) {
      // If profile doesn't exist, create it
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email,
          role: 'admin',
          full_name: 'Admin User'
        });

      if (insertError) {
        console.error('⚠️  Warning: Could not set admin role:', insertError.message);
      } else {
        console.log('✅ Admin role assigned');
      }
    } else {
      console.log('✅ Admin role assigned');
    }

    console.log('\n🎉 Admin user created successfully!');
    console.log('\n📝 Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🔗 Login at: http://localhost:3001/login');
    
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    if (error.message.includes('already been registered')) {
      console.log('\n💡 Tip: User already exists. You can:');
      console.log('   1. Use a different email address');
      console.log('   2. Reset the password in Supabase Dashboard');
      console.log('   3. Delete the user and try again');
    }
    process.exit(1);
  }
}

// Main execution
const [,, email, password] = process.argv;

if (!email || !password) {
  console.log('\n📖 Usage: node scripts/create-admin-user.js <email> <password>');
  console.log('\n📝 Example:');
  console.log('   node scripts/create-admin-user.js admin@example.com SecurePassword123!');
  process.exit(1);
}

// Validate email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Invalid email address');
  process.exit(1);
}

// Validate password (min 6 characters for Supabase)
if (password.length < 6) {
  console.error('❌ Password must be at least 6 characters long');
  process.exit(1);
}

createAdminUser(email, password);