import { test, expect } from '@playwright/test';

test.describe('Invitation Email Functionality', () => {
  test('should send invitation email successfully', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('http://localhost:3001/admin/dashboard');

    // Login with admin credentials
    await page.fill('input[type="email"]', 'admin@atlantis.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/admin/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard Overview');

    // Navigate to User Management (look for the navigation button)
    await page.click('button:has-text("User Management")');
    await page.waitForURL('**/admin/users');

    // Click on Invitations tab
    await page.click('button:has-text("Invitations")');

    // Wait for the Send Invitation button to appear
    await page.waitForSelector('button:has-text("Send Invitation")');

    // Click the Send Invitation button
    await page.click('button:has-text("Send Invitation")');

    // Wait for modal to appear
    await page.waitForSelector('input#email');

    // Fill in the invitation form
    await page.fill('input#email', 'bryhearnchi@gmail.com');

    // Role defaults to 'viewer', so we can submit directly
    // Submit the invitation
    await page.click('button:has-text("Send Invitation")');

    // Wait for success message or confirmation
    await expect(page.locator('.success, .toast, [role="alert"]')).toBeVisible({ timeout: 10000 });

    // Verify the invitation appears in the list
    await expect(page.locator('text=bryhearnchi@gmail.com')).toBeVisible({ timeout: 5000 });

    console.log('✅ Invitation test completed successfully');
  });

  test('should capture server logs during invitation process', async ({ page }) => {
    // Set up console log capturing
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Set up request/response monitoring
    const requests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('/invitations')) {
        requests.push({
          method: request.method(),
          url: request.url(),
          headers: request.headers()
        });
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('/invitations')) {
        console.log(`Response: ${response.status()} - ${response.url()}`);
      }
    });

    // Repeat the invitation process for monitoring
    await page.goto('http://localhost:3001/admin/dashboard');
    await page.fill('input[type="email"]', 'admin@atlantis.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard');

    await page.click('button:has-text("User Management")');
    await page.waitForURL('**/admin/users');
    await page.click('button:has-text("Invitations")');

    // Monitor the invitation creation request
    await page.click('button:has-text("Send Invitation")');

    await page.waitForSelector('input#email');
    await page.fill('input#email', 'bryhearnchi@gmail.com');

    // Monitor the actual invitation sending
    await page.click('button:has-text("Send Invitation")');

    // Wait and capture final logs
    await page.waitForTimeout(5000);

    console.log('=== Captured Requests ===');
    requests.forEach(req => console.log(JSON.stringify(req, null, 2)));

    console.log('=== Captured Console Logs ===');
    logs.forEach(log => console.log(log));
  });
});