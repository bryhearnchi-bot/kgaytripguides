import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  try {
    // Create a test user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'testpassword123',
      email_confirm: true
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return;
    }

    console.log('Test user created:', authData.user.email);

    // Create a profile for the user
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        role: 'admin',
        first_name: 'Test',
        last_name: 'User'
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return;
    }

    console.log('Profile created for test user');
    console.log('\nTest credentials:');
    console.log('Email: test@example.com');
    console.log('Password: testpassword123');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

createTestUser();