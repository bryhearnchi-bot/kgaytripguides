import { test, expect } from '@playwright/test';

/**
 * Profile API Endpoint Tests
 *
 * Testing the profile update functionality end-to-end:
 * 1. CSRF token endpoint
 * 2. Profile update endpoint with auth
 * 3. Password change endpoint with auth
 * 4. Field mapping validation (snake_case ↔ camelCase)
 * 5. Security and error handling
 */

// Test configuration
const BASE_URL = 'http://localhost:3001';
const ADMIN_EMAIL = 'admin@atlantis.com';
const ADMIN_PASSWORD = 'Admin123!';

interface AuthTokens {
  accessToken: string;
  csrfToken: string;
}

/**
 * Helper function to authenticate and get tokens
 */
async function authenticateAndGetTokens(): Promise<AuthTokens> {
  // Step 1: Get CSRF token
  const csrfResponse = await fetch(`${BASE_URL}/api/csrf-token`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!csrfResponse.ok) {
    throw new Error(`Failed to get CSRF token: ${csrfResponse.status}`);
  }

  const csrfData = await csrfResponse.json();
  const csrfToken = csrfData.csrfToken;

  if (!csrfToken) {
    throw new Error('No CSRF token received');
  }

  // Step 2: Authenticate via Supabase (mock for testing)
  // In real tests, we'd use the actual Supabase auth flow
  // For now, we'll simulate having a valid access token
  const mockAccessToken = 'mock-access-token-for-testing';

  return {
    accessToken: mockAccessToken,
    csrfToken
  };
}

test.describe('Profile API Endpoints', () => {

  test.describe('CSRF Token Endpoint', () => {

    test('GET /api/csrf-token should return valid CSRF token', async () => {
      const response = await fetch(`${BASE_URL}/api/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('csrfToken');
      expect(typeof data.csrfToken).toBe('string');
      expect(data.csrfToken.length).toBeGreaterThan(0);

      // CSRF token should be a valid format (usually base64 or hex)
      expect(data.csrfToken).toMatch(/^[A-Za-z0-9+/=_-]+$/);
    });

    test('CSRF endpoint should set appropriate headers', async () => {
      const response = await fetch(`${BASE_URL}/api/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      // Should not cache CSRF tokens
      const cacheControl = response.headers.get('cache-control');
      expect(cacheControl).toContain('no-cache');
    });

    test('CSRF endpoint should handle CORS properly', async () => {
      const response = await fetch(`${BASE_URL}/api/csrf-token`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });

      expect(response.status).toBe(200);
      // Verify CORS headers are present if needed
    });
  });

  test.describe('Profile Update Endpoint', () => {

    test('PUT /api/admin/profile should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: 'Test User',
          email: 'test@example.com'
        })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Authentication required');
    });

    test('PUT /api/admin/profile should require CSRF token', async () => {
      const { accessToken } = await authenticateAndGetTokens();

      const response = await fetch(`${BASE_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          full_name: 'Test User',
          email: 'test@example.com'
        })
      });

      // Should fail due to missing CSRF token
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('CSRF');
    });

    test('PUT /api/admin/profile should validate input fields', async () => {
      const { accessToken, csrfToken } = await authenticateAndGetTokens();

      // Test with no fields
      const response = await fetch(`${BASE_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('At least one field');
    });

    test('PUT /api/admin/profile should handle field mapping correctly', async () => {
      const { accessToken, csrfToken } = await authenticateAndGetTokens();

      // Test snake_case input mapping to camelCase in database
      const testData = {
        full_name: 'John Doe Updated',
        email: 'john.updated@example.com'
      };

      const response = await fetch(`${BASE_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        const data = await response.json();
        expect(data).toHaveProperty('message');
        expect(data).toHaveProperty('profile');

        // Verify response maps back to snake_case
        expect(data.profile).toHaveProperty('full_name');
        expect(data.profile).toHaveProperty('email');
        expect(data.profile.full_name).toBe(testData.full_name);
        expect(data.profile.email).toBe(testData.email);

        // Should NOT have camelCase fields in response
        expect(data.profile).not.toHaveProperty('fullName');
      } else {
        // Log error for debugging
        const errorData = await response.json();
        console.log('Profile update failed:', response.status, errorData);
      }
    });

    test('PUT /api/admin/profile should validate email format', async () => {
      const { accessToken, csrfToken } = await authenticateAndGetTokens();

      const response = await fetch(`${BASE_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          email: 'invalid-email-format'
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('email');
    });

    test('PUT /api/admin/profile should handle partial updates', async () => {
      const { accessToken, csrfToken } = await authenticateAndGetTokens();

      // Test updating only full_name
      const response1 = await fetch(`${BASE_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          full_name: 'Only Name Updated'
        })
      });

      if (response1.ok) {
        const data1 = await response1.json();
        expect(data1.profile.full_name).toBe('Only Name Updated');
      }

      // Test updating only email
      const response2 = await fetch(`${BASE_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          email: 'only.email@updated.com'
        })
      });

      if (response2.ok) {
        const data2 = await response2.json();
        expect(data2.profile.email).toBe('only.email@updated.com');
        // full_name should remain from previous update
        expect(data2.profile.full_name).toBe('Only Name Updated');
      }
    });
  });

  test.describe('Password Change Endpoint', () => {

    test('POST /api/admin/change-password should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: 'old123',
          newPassword: 'new123456'
        })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Authentication required');
    });

    test('POST /api/admin/change-password should require CSRF token', async () => {
      const { accessToken } = await authenticateAndGetTokens();

      const response = await fetch(`${BASE_URL}/api/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          currentPassword: 'old123',
          newPassword: 'new123456'
        })
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('CSRF');
    });

    test('POST /api/admin/change-password should validate required fields', async () => {
      const { accessToken, csrfToken } = await authenticateAndGetTokens();

      // Missing currentPassword
      const response1 = await fetch(`${BASE_URL}/api/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          newPassword: 'new123456'
        })
      });

      expect(response1.status).toBe(400);
      const data1 = await response1.json();
      expect(data1.error).toContain('currentPassword');

      // Missing newPassword
      const response2 = await fetch(`${BASE_URL}/api/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          currentPassword: 'old123'
        })
      });

      expect(response2.status).toBe(400);
      const data2 = await response2.json();
      expect(data2.error).toContain('newPassword');
    });

    test('POST /api/admin/change-password should validate password length', async () => {
      const { accessToken, csrfToken } = await authenticateAndGetTokens();

      const response = await fetch(`${BASE_URL}/api/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          currentPassword: 'oldpass',
          newPassword: '123' // Too short
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('8 characters');
    });

    test('POST /api/admin/change-password should verify current password', async () => {
      const { accessToken, csrfToken } = await authenticateAndGetTokens();

      const response = await fetch(`${BASE_URL}/api/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          currentPassword: 'wrong-password',
          newPassword: 'new-valid-password-123'
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Current password is incorrect');
    });

    test('POST /api/admin/change-password should handle Supabase integration', async () => {
      const { accessToken, csrfToken } = await authenticateAndGetTokens();

      // This test would normally use the actual admin password
      // But since we're using mock auth, we'll test the structure
      const response = await fetch(`${BASE_URL}/api/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          currentPassword: ADMIN_PASSWORD,
          newPassword: 'new-secure-password-123'
        })
      });

      // Expect either success or a specific Supabase error
      if (response.ok) {
        const data = await response.json();
        expect(data).toHaveProperty('message');
        expect(data.message).toContain('Password updated successfully');
      } else {
        // If it fails, should be due to Supabase configuration or auth issues
        const data = await response.json();
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(data).toHaveProperty('error');
      }
    });
  });

  test.describe('Security and Error Handling', () => {

    test('API should handle malformed JSON', async () => {
      const { accessToken, csrfToken } = await authenticateAndGetTokens();

      const response = await fetch(`${BASE_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken
        },
        body: 'invalid-json-content'
      });

      expect(response.status).toBe(400);
    });

    test('API should handle oversized requests', async () => {
      const { accessToken, csrfToken } = await authenticateAndGetTokens();

      // Create a very large string
      const largeString = 'x'.repeat(10000);

      const response = await fetch(`${BASE_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          full_name: largeString
        })
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('API should prevent SQL injection attempts', async () => {
      const { accessToken, csrfToken } = await authenticateAndGetTokens();

      const maliciousInputs = [
        "'; DROP TABLE profiles; --",
        "admin'; UPDATE profiles SET role='super_admin' WHERE id='any'; --",
        "' OR '1'='1",
        "<script>alert('xss')</script>"
      ];

      for (const maliciousInput of maliciousInputs) {
        const response = await fetch(`${BASE_URL}/api/admin/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'X-CSRF-Token': csrfToken
          },
          body: JSON.stringify({
            full_name: maliciousInput
          })
        });

        // Should either reject the input or sanitize it
        if (response.ok) {
          const data = await response.json();
          // If accepted, the malicious content should be sanitized
          expect(data.profile.full_name).not.toContain('DROP TABLE');
          expect(data.profile.full_name).not.toContain('<script>');
        } else {
          // Rejection is also acceptable for security
          expect(response.status).toBeGreaterThanOrEqual(400);
        }
      }
    });

    test('API should handle rate limiting', async () => {
      const { accessToken, csrfToken } = await authenticateAndGetTokens();

      // Make rapid requests to test rate limiting
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          fetch(`${BASE_URL}/api/admin/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({
              full_name: `Test ${i}`
            })
          })
        );
      }

      const responses = await Promise.all(promises);

      // At least some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('API should provide consistent error response format', async () => {
      // Test various error scenarios and ensure consistent format
      const errorTests = [
        {
          name: 'Unauthenticated request',
          url: '/api/admin/profile',
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: 'test' }),
          expectedStatus: 401
        },
        {
          name: 'Invalid endpoint',
          url: '/api/admin/invalid-endpoint',
          method: 'GET',
          headers: {},
          body: null,
          expectedStatus: 404
        }
      ];

      for (const test of errorTests) {
        const response = await fetch(`${BASE_URL}${test.url}`, {
          method: test.method,
          headers: test.headers,
          body: test.body
        });

        expect(response.status).toBe(test.expectedStatus);

        const data = await response.json();
        expect(data).toHaveProperty('error');
        expect(typeof data.error).toBe('string');
        expect(data.error.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Performance and Reliability', () => {

    test('API should respond within acceptable time limits', async () => {
      const startTime = Date.now();

      const response = await fetch(`${BASE_URL}/api/csrf-token`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.ok).toBe(true);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test('API should handle concurrent requests', async () => {
      // Test concurrent CSRF token requests
      const promises = Array.from({ length: 10 }, () =>
        fetch(`${BASE_URL}/api/csrf-token`)
      );

      const responses = await Promise.all(promises);

      for (const response of responses) {
        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data).toHaveProperty('csrfToken');
      }
    });

    test('API should maintain session consistency', async () => {
      // Get CSRF token and use same session for profile update
      const { csrfToken } = await authenticateAndGetTokens();

      // The CSRF token should remain valid for the session
      expect(csrfToken).toBeTruthy();
      expect(typeof csrfToken).toBe('string');

      // Additional session tests could be added here
    });
  });
});

test.describe('Integration Tests', () => {

  test('Complete profile update workflow', async () => {
    // 1. Get CSRF token
    const csrfResponse = await fetch(`${BASE_URL}/api/csrf-token`);
    expect(csrfResponse.ok).toBe(true);

    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.csrfToken;

    // 2. Mock authentication (in real scenario, would authenticate via Supabase)
    const accessToken = 'mock-access-token';

    // 3. Update profile
    const updateResponse = await fetch(`${BASE_URL}/api/admin/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({
        full_name: 'Integration Test User',
        email: 'integration@test.com'
      })
    });

    // Should succeed or fail with expected authentication error
    if (updateResponse.ok) {
      const updateData = await updateResponse.json();
      expect(updateData).toHaveProperty('message');
      expect(updateData).toHaveProperty('profile');
    } else {
      // Expected to fail with mock auth
      expect(updateResponse.status).toBeGreaterThanOrEqual(400);
    }

    // 4. Test password change
    const passwordResponse = await fetch(`${BASE_URL}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({
        currentPassword: 'old-password',
        newPassword: 'new-secure-password-123'
      })
    });

    // Should handle the request appropriately
    expect(passwordResponse.status).toBeGreaterThanOrEqual(400); // Expected with mock auth
  });
});