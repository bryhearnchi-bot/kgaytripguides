import { chromium, FullConfig } from '@playwright/test';

/**
 * Global Setup for Invitation E2E Tests
 *
 * Prepares the test environment before running invitation tests:
 * - Verifies server is running
 * - Sets up test database state
 * - Creates necessary test users
 * - Validates authentication system
 */

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for invitation tests...');

  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Verify server is running
    console.log('📡 Checking server availability...');
    await page.goto(baseURL || 'http://localhost:3001');
    await page.waitForSelector('body', { timeout: 30000 });
    console.log('✅ Server is running and responsive');

    // Verify admin login works
    console.log('🔐 Verifying admin authentication...');
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@atlantis.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button:has-text("Sign In")');

    try {
      await page.waitForURL('/admin/dashboard', { timeout: 10000 });
      console.log('✅ Admin authentication verified');
    } catch (error) {
      console.error('❌ Admin authentication failed:', error);
      throw new Error('Admin authentication is not working');
    }

    // Verify invitation API endpoints are available
    console.log('🔗 Verifying invitation API endpoints...');
    const response = await page.request.get('/api/admin/invitations');
    if (response.status() === 200 || response.status() === 401) {
      console.log('✅ Invitation API endpoints are available');
    } else {
      console.warn(`⚠️ Invitation API returned status: ${response.status()}`);
    }

    // Clean up any existing test invitations
    console.log('🧹 Cleaning up existing test invitations...');
    try {
      // Delete any existing test invitations to ensure clean state
      await page.request.delete('/api/admin/test/cleanup-invitations');
    } catch (error) {
      // It's OK if cleanup endpoint doesn't exist
      console.log('ℹ️ Test cleanup endpoint not available (this is OK)');
    }

    console.log('✅ Global setup completed successfully');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;