#!/usr/bin/env node

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5173/api';

// Test credentials for admin user
const TEST_EMAIL = 'admin@atlantis.com';
const TEST_PASSWORD = 'Admin123!';

async function testProfileEndpoints() {
  try {
    console.log('🧪 Testing Profile API Endpoints...\n');

    // 1. First login to get session cookies
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      }),
      credentials: 'include'
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed, checking if using Supabase auth...');
      console.log('   Note: Since we use Supabase auth, direct API testing requires browser session');
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');

    // Extract cookies for subsequent requests
    const cookies = loginResponse.headers.get('set-cookie');

    // 2. Test GET /api/admin/profile
    console.log('\n2. Testing GET /api/admin/profile...');
    const getProfileResponse = await fetch(`${API_BASE}/admin/profile`, {
      method: 'GET',
      headers: {
        'Cookie': cookies || '',
        'Content-Type': 'application/json'
      }
    });

    if (getProfileResponse.ok) {
      const profileData = await getProfileResponse.json();
      console.log('✅ GET profile successful');
      console.log('   Profile data:', JSON.stringify(profileData.profile, null, 2));
    } else {
      const error = await getProfileResponse.text();
      console.log('❌ GET profile failed:', error);
    }

    // 3. Test PUT /api/admin/profile
    console.log('\n3. Testing PUT /api/admin/profile...');
    const updateData = {
      full_name: 'Test Admin Updated',
      phone_number: '+1-555-0123',
      bio: 'Test bio for admin user',
      location: {
        city: 'San Francisco',
        state: 'CA',
        country: 'USA'
      },
      communication_preferences: {
        email: true,
        sms: false
      },
      cruise_updates_opt_in: true,
      marketing_emails: false
    };

    const putProfileResponse = await fetch(`${API_BASE}/admin/profile`, {
      method: 'PUT',
      headers: {
        'Cookie': cookies || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (putProfileResponse.ok) {
      const updateResult = await putProfileResponse.json();
      console.log('✅ PUT profile successful');
      console.log('   Updated profile:', JSON.stringify(updateResult.profile, null, 2));
    } else {
      const error = await putProfileResponse.text();
      console.log('❌ PUT profile failed:', error);
    }

  } catch (error) {
    console.error('🔥 Test failed with error:', error.message);
  }
}

console.log('Note: This test requires the development server to be running with Supabase auth.');
console.log('For full testing, use the browser interface with proper authentication.\n');

testProfileEndpoints();