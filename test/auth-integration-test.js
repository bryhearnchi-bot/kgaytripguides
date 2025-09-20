#!/usr/bin/env node

/**
 * Authentication Integration Test
 *
 * This script demonstrates the authentication issue between Supabase frontend
 * tokens and backend JWT verification system.
 */

const BASE_URL = 'http://localhost:3001';

// Test with a mock Supabase JWT token structure
const MOCK_SUPABASE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNjk1MTQwNDAwLCJpYXQiOjE2OTUxMzY4MDAsImlzcyI6Imh0dHBzOi8vYnhpaW9kZXlxdnFxY2d6enF6dnQuc3VwYWJhc2UuY28vYXV0aC92MSIsInN1YiI6IjEyMzQ1Njc4LTkwYWItY2RlZi0xMjM0LTU2Nzg5MGFiY2RlZiIsImVtYWlsIjoiYWRtaW5AYXRsYW50aXMuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6e30sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE2OTUxMzY4MDB9XSwic2Vzc2lvbl9pZCI6IjEyMzQ1Njc4LTkwYWItY2RlZi0xMjM0LTU2Nzg5MGFiY2RlZiJ9.mock-signature';

// Custom JWT token that the backend expects
const CUSTOM_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NSIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE2OTUxMzY4MDAsImV4cCI6MTY5NTE0NTgwMH0.mock-signature';

async function testAuthenticationFlow() {
  console.log('🔍 Testing Authentication Integration Issues\n');

  // Get CSRF token first
  const csrfResponse = await fetch(`${BASE_URL}/api/csrf-token`);
  const csrfData = await csrfResponse.json();
  const csrfToken = csrfData.csrfToken;

  console.log('1. Testing with Supabase-style JWT token:');
  console.log(`   Token type: Supabase Auth JWT`);
  console.log(`   Token preview: ${MOCK_SUPABASE_TOKEN.substring(0, 50)}...`);

  const supabaseResult = await fetch(`${BASE_URL}/api/admin/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MOCK_SUPABASE_TOKEN}`,
      'x-csrf-token': csrfToken
    },
    body: JSON.stringify({
      full_name: 'Test with Supabase Token',
      email: 'supabase@test.com'
    })
  });

  const supabaseData = await supabaseResult.json();
  console.log(`   Result: ${supabaseResult.status} - ${supabaseData.error || 'Success'}`);

  console.log('\n2. Testing with Custom JWT token:');
  console.log(`   Token type: Custom JWT`);
  console.log(`   Token preview: ${CUSTOM_JWT_TOKEN.substring(0, 50)}...`);

  const customResult = await fetch(`${BASE_URL}/api/admin/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CUSTOM_JWT_TOKEN}`,
      'x-csrf-token': csrfToken
    },
    body: JSON.stringify({
      full_name: 'Test with Custom Token',
      email: 'custom@test.com'
    })
  });

  const customData = await customResult.json();
  console.log(`   Result: ${customResult.status} - ${customData.error || 'Success'}`);

  console.log('\n3. Analysis:');
  if (supabaseResult.status === 401 && customResult.status === 401) {
    console.log('   ✅ Both token types rejected (authentication system working)');
    console.log('   ⚠️  Issue: Backend expects different token format than frontend provides');
  } else if (supabaseResult.status === 200) {
    console.log('   ✅ Supabase token accepted - integration working correctly');
  } else if (customResult.status === 200) {
    console.log('   ✅ Custom token accepted - using custom JWT system');
  }

  console.log('\n4. Authentication System Status:');

  // Check if Supabase or custom auth is active
  const authRouteComment = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'test', password: 'test' })
  });

  if (authRouteComment.status === 404) {
    console.log('   📋 Custom JWT auth routes: DISABLED');
    console.log('   📋 Expected auth system: Supabase Auth');
    console.log('   🔧 Issue: Backend middleware needs Supabase token verification');
  } else {
    console.log('   📋 Custom JWT auth routes: ENABLED');
    console.log('   📋 Auth system: Custom JWT');
  }

  console.log('\n5. Recommended Fix:');
  console.log('   Update server/auth.ts requireAuth middleware to:');
  console.log('   - Accept Supabase JWT tokens');
  console.log('   - Verify tokens with Supabase Auth API');
  console.log('   - Extract user info from Supabase token payload');

  console.log('\n6. Testing Password Change (Supabase Integration):');
  const passwordResult = await fetch(`${BASE_URL}/api/admin/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MOCK_SUPABASE_TOKEN}`,
      'x-csrf-token': csrfToken
    },
    body: JSON.stringify({
      currentPassword: 'Admin123!',
      newPassword: 'NewPassword123!'
    })
  });

  const passwordData = await passwordResult.json();
  console.log(`   Password change result: ${passwordResult.status} - ${passwordData.error || passwordData.message || 'Success'}`);

  if (passwordResult.status === 401) {
    console.log('   🔧 Same authentication issue affects password change');
  } else if (passwordResult.status === 500) {
    console.log('   ⚠️  Password change has Supabase integration but authentication fails');
  }
}

// Run the test
testAuthenticationFlow().catch(console.error);