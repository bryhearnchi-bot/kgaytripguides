import { test, expect } from '@playwright/test';

test.describe('Simple Invitation Email Test', () => {
  test('should navigate to invitation form and send invitation', async ({ page }) => {
    console.log('🚀 Starting invitation test...');

    // Navigate to admin dashboard
    await page.goto('http://localhost:3001/admin/dashboard');
    console.log('📱 Navigated to dashboard');

    // Login with admin credentials
    await page.fill('input[type="email"]', 'admin@atlantis.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    console.log('🔐 Logged in');

    // Wait for dashboard to load
    await page.waitForURL('**/admin/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard Overview');
    console.log('✅ Dashboard loaded');

    // Take screenshot for debugging
    await page.screenshot({ path: 'debug-dashboard-loaded.png' });

    // Navigate to User Management
    await page.click('button:has-text("User Management")');
    await page.waitForURL('**/admin/users');
    console.log('👥 Navigated to User Management');

    // Take screenshot of users page
    await page.screenshot({ path: 'debug-users-page.png' });

    // Click on Invitations tab
    await page.click('button:has-text("Invitations")');
    console.log('📧 Clicked Invitations tab');

    // Wait for and click Send Invitation button
    await page.waitForSelector('button:has-text("Send Invitation")');
    await page.click('button:has-text("Send Invitation")');
    console.log('📤 Clicked Send Invitation button');

    // Wait for modal and take screenshot
    await page.waitForSelector('input#email');
    await page.screenshot({ path: 'debug-invitation-modal.png' });
    console.log('📝 Invitation modal opened');

    // Fill email
    await page.fill('input#email', 'bryhearnchi@gmail.com');
    console.log('✉️ Filled email address');

    // Submit invitation
    await page.click('button:has-text("Send Invitation")');
    console.log('🚀 Submitted invitation');

    // Wait for response (either success or error)
    await page.waitForTimeout(5000);

    // Take final screenshot
    await page.screenshot({ path: 'debug-after-submission.png' });
    console.log('📸 Test completed, check screenshots for results');
  });
});