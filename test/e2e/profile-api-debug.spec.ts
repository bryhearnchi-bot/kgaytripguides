import { test, expect } from '@playwright/test';

const ADMIN_USER = {
  email: 'admin@atlantis.com',
  password: 'Admin123!'
};

test.describe('Profile API Debug', () => {
  test('test profile API endpoints directly', async ({ page }) => {
    // Login first to get authentication
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForURL(/.*\/admin\/dashboard$/, { timeout: 15000 });

    // Test the GET profile endpoint
    const profileResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/admin/profile', {
          method: 'GET',
          credentials: 'include',
        });

        return {
          status: response.status,
          statusText: response.statusText,
          body: response.ok ? await response.json() : await response.text()
        };
      } catch (error) {
        return {
          status: 0,
          statusText: 'Network Error',
          body: error.message
        };
      }
    });

    console.log('GET /api/admin/profile response:', JSON.stringify(profileResponse, null, 2));

    if (profileResponse.status === 200) {
      console.log('Profile GET endpoint is working');

      // Now test the PUT endpoint
      const updateResponse = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/admin/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              full_name: 'Test Update from E2E',
              email: 'e2e-test@atlantis.com'
            })
          });

          return {
            status: response.status,
            statusText: response.statusText,
            body: response.ok ? await response.json() : await response.text()
          };
        } catch (error) {
          return {
            status: 0,
            statusText: 'Network Error',
            body: error.message
          };
        }
      });

      console.log('PUT /api/admin/profile response:', JSON.stringify(updateResponse, null, 2));

      if (updateResponse.status === 200) {
        console.log('Profile UPDATE endpoint is working');
      } else {
        console.log('Profile UPDATE endpoint failed');
      }
    } else {
      console.log('Profile GET endpoint failed');
    }

    // Test authentication status
    const authResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        });

        return {
          status: response.status,
          statusText: response.statusText,
          body: response.ok ? await response.json() : await response.text()
        };
      } catch (error) {
        return {
          status: 0,
          statusText: 'Network Error',
          body: error.message
        };
      }
    });

    console.log('GET /api/auth/me response:', JSON.stringify(authResponse, null, 2));

    // Test if CSRF is required
    const csrfResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/csrf-token', {
          method: 'GET',
          credentials: 'include',
        });

        return {
          status: response.status,
          statusText: response.statusText,
          body: response.ok ? await response.json() : await response.text()
        };
      } catch (error) {
        return {
          status: 0,
          statusText: 'Network Error',
          body: error.message
        };
      }
    });

    console.log('GET /api/csrf-token response:', JSON.stringify(csrfResponse, null, 2));
  });
});