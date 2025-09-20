import { test, expect } from '@playwright/test';

const ADMIN_USER = {
  email: 'admin@atlantis.com',
  password: 'Admin123!'
};

test.describe('Profile Form Debug', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page and authenticate
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');

    // Login as admin
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForURL(/.*\/admin\/dashboard$/, { timeout: 15000 });
  });

  test('debug profile form submission', async ({ page }) => {
    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('/api/admin/profile')) {
        console.log(`Request: ${request.method()} ${request.url()}`);
        console.log(`Headers:`, request.headers());
        if (request.postData()) {
          console.log(`Body:`, request.postData());
        }
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/admin/profile')) {
        console.log(`Response: ${response.status()} ${response.url()}`);
        response.text().then(text => console.log(`Response body:`, text));
      }
    });

    page.on('console', msg => console.log(`Console: ${msg.text()}`));
    page.on('pageerror', err => console.log(`Page error: ${err.message}`));

    await page.goto('http://localhost:3001/admin/profile');
    console.log('Navigated to profile page');

    // Take screenshot to see the current state
    await page.screenshot({ path: 'debug-profile-before-form.png' });

    // Fill in the profile form
    const fullNameInput = page.locator('input#fullName');
    const emailInput = page.locator('input#email');
    const saveButton = page.locator('button:has-text("Save Changes")');

    // Check if fields are visible and enabled
    await expect(fullNameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(saveButton).toBeVisible();

    console.log('Form elements are visible');

    // Clear and fill fields
    await fullNameInput.clear();
    await fullNameInput.fill('Test Admin User Updated');

    await emailInput.clear();
    await emailInput.fill('admin-updated@atlantis.com');

    console.log('Filled form fields');

    // Take screenshot before submission
    await page.screenshot({ path: 'debug-profile-filled-form.png' });

    // Monitor the API request
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/admin/profile') && response.request().method() === 'PUT',
      { timeout: 10000 }
    );

    // Submit the form
    console.log('Clicking save button...');
    await saveButton.click();

    try {
      const response = await responsePromise;
      console.log(`API Response status: ${response.status()}`);

      const responseBody = await response.text();
      console.log(`API Response body: ${responseBody}`);

      if (response.ok()) {
        console.log('API call succeeded');

        // Wait a bit for toast to appear
        await page.waitForTimeout(1000);

        // Take screenshot after submission
        await page.screenshot({ path: 'debug-profile-after-submit.png' });

        // Look for any toast or notification elements
        const toastElements = await page.locator('[role="alert"], .toast, [data-state], [data-sonner-toast]').all();
        console.log(`Found ${toastElements.length} potential toast elements`);

        for (const element of toastElements) {
          const text = await element.textContent();
          console.log(`Toast element text: "${text}"`);
        }

        // Check if any success text appears anywhere
        const successElements = await page.locator('text*="success"').all();
        console.log(`Found ${successElements.length} elements containing "success"`);

        for (const element of successElements) {
          const text = await element.textContent();
          console.log(`Success element text: "${text}"`);
        }

      } else {
        console.log('API call failed');
      }
    } catch (error) {
      console.log(`Error waiting for API response: ${error.message}`);

      // Take screenshot of error state
      await page.screenshot({ path: 'debug-profile-error.png' });
    }
  });
});