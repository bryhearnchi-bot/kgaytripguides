import { test, expect } from '@playwright/test';

test.describe('Admin Interface Debug', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication by directly setting the Supabase session
    await page.goto('http://localhost:3001');

    // Login via the auth modal
    await page.goto('http://localhost:3001/auth/login');
    await page.waitForLoadState('networkidle');

    // Fill in login credentials
    await page.fill('input[name="email"]', 'bryan@atlantisevents.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');

    // Wait for authentication to complete
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
  });

  test('Check authentication flow and admin dashboard', async ({ page }) => {
    // Check if admin dashboard loads
    const dashboardTitle = await page.locator('h1:has-text("Admin Dashboard")');
    await expect(dashboardTitle).toBeVisible();

    // Check if user info is displayed
    const userEmail = await page.locator('text=bryan@atlantisevents.com');
    await expect(userEmail).toBeVisible();
  });

  test('Check Port Management for errors', async ({ page }) => {
    // Navigate to Port Management tab
    await page.click('button:has-text("Ports")');

    // Check console for errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait for Port Management to load
    await page.waitForTimeout(2000);

    // Check if Port Management renders
    const portManagementTitle = await page.locator('h2:has-text("Port Management")');
    const isVisible = await portManagementTitle.isVisible().catch(() => false);

    if (!isVisible) {
      console.log('Port Management not visible');
      console.log('Console errors:', consoleErrors);

      // Take screenshot for debugging
      await page.screenshot({ path: 'port-management-error.png', fullPage: true });
    }

    expect(isVisible).toBeTruthy();
  });

  test('Check navigation without refresh', async ({ page }) => {
    // Check all tabs work without refresh
    const tabs = ['Trips', 'Artists', 'Users', 'Settings', 'Ports', 'Parties'];

    for (const tab of tabs) {
      await page.click(`button:has-text("${tab}")`);
      await page.waitForTimeout(500);

      // Check page doesn't go blank
      const content = await page.locator('.tab-content, [role="tabpanel"]').first();
      await expect(content).toBeVisible();
    }
  });
});