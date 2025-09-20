import { test, expect } from '@playwright/test';

const ADMIN_USER = {
  email: 'admin@atlantis.com',
  password: 'Admin123!'
};

test.describe('Profile Editing Debug Tests', () => {
  test.use({ viewport: { width: 1280, height: 720 } }); // Use desktop viewport only

  test('debug login and navigation flow', async ({ page }) => {
    // Enable console logs
    page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
    page.on('pageerror', err => console.log(`PAGE ERROR: ${err.message}`));

    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3001/login');

    // Wait for page to load and take a screenshot
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'debug-login-page.png' });
    console.log('Login page loaded');

    // Check if login form elements exist
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const signInButton = page.locator('button:has-text("Sign In")');

    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    await expect(signInButton).toBeVisible({ timeout: 5000 });

    // Fill login form
    console.log('Filling login form...');
    await emailInput.fill(ADMIN_USER.email);
    await passwordInput.fill(ADMIN_USER.password);

    // Take screenshot before clicking
    await page.screenshot({ path: 'debug-before-login.png' });

    // Monitor navigation
    const navigationPromise = page.waitForURL('**/admin/dashboard', { timeout: 15000 });

    console.log('Clicking sign in button...');
    await signInButton.click();

    // Wait for navigation or timeout
    try {
      await navigationPromise;
      console.log('Successfully navigated to dashboard');

      // Take screenshot of dashboard
      await page.screenshot({ path: 'debug-dashboard.png' });

      // Now try to navigate to profile
      console.log('Navigating to profile page...');
      await page.goto('http://localhost:3001/admin/profile');
      await page.waitForLoadState('networkidle');

      // Verify profile page
      await expect(page.locator('h1')).toContainText('My Profile', { timeout: 5000 });
      await page.screenshot({ path: 'debug-profile-page.png' });

      console.log('Successfully reached profile page');
    } catch (error) {
      console.log(`Navigation failed: ${error.message}`);

      // Take screenshot to see where we ended up
      await page.screenshot({ path: 'debug-navigation-failed.png' });

      // Log current URL
      console.log(`Current URL: ${page.url()}`);

      // Check for error messages
      const errorElements = await page.locator('text*="error"').all();
      for (const element of errorElements) {
        const text = await element.textContent();
        console.log(`Error element: ${text}`);
      }

      throw error;
    }
  });

  test('simple profile field test', async ({ page }) => {
    // Skip the beforeEach and directly test if we can reach the profile page

    // Try direct navigation to admin area (might require login)
    await page.goto('http://localhost:3001/admin/profile');

    // Check if redirected to login
    if (page.url().includes('/login')) {
      console.log('Redirected to login, performing authentication...');

      await page.fill('input[type="email"]', ADMIN_USER.email);
      await page.fill('input[type="password"]', ADMIN_USER.password);
      await page.click('button:has-text("Sign In")');

      // Wait for redirect back to profile
      await page.waitForURL('**/admin/profile', { timeout: 10000 });
    }

    // Now we should be on the profile page
    await expect(page.locator('h1')).toContainText('My Profile');

    // Try to fill a form field
    const fullNameInput = page.locator('input#fullName');
    await expect(fullNameInput).toBeVisible();

    await fullNameInput.fill('Test Profile Name');
    console.log('Successfully filled profile field');
  });
});