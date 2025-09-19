import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('Login and access admin dashboard', async ({ page }) => {
    // Go to the homepage
    await page.goto('http://localhost:3001');

    // Click on Sign In button in header
    await page.click('text=Sign In');

    // Wait for auth modal to appear
    await page.waitForSelector('.auth-container', { timeout: 5000 });

    // Fill in credentials using the Supabase Auth UI
    await page.fill('input[type="email"]', 'bryan@atlantisevents.com');
    await page.fill('input[type="password"]', 'password123');

    // Click Sign In button in the modal
    await page.click('button[type="submit"]:has-text("Sign In")');

    // Wait for redirect to admin dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });

    // Verify dashboard loaded
    const dashboardTitle = await page.locator('h1:has-text("Admin Dashboard")');
    await expect(dashboardTitle).toBeVisible();

    // Test Port Management tab
    await page.click('button:has-text("Ports")');
    await page.waitForTimeout(1000);

    // Check if Port Management renders without errors
    const portManagement = await page.locator('h2:has-text("Port Management")');
    const isVisible = await portManagement.isVisible().catch(() => false);

    console.log('Port Management visible:', isVisible);
    expect(isVisible).toBeTruthy();
  });
});