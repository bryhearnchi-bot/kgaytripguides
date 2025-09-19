const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('Browser console:', msg.text());
    }
  });

  console.log('1. Navigating to admin dashboard...');
  await page.goto('http://localhost:3001/admin/dashboard');
  await page.waitForTimeout(1000);

  console.log('2. Should be redirected to login page');
  console.log('   Current URL:', page.url());

  // Fill in login form
  console.log('3. Filling in login credentials...');
  await page.fill('input[type="email"]', 'bryan@atlantisevents.com');
  await page.fill('input[type="password"]', 'password123');

  // Click Sign In button
  console.log('4. Clicking Sign In button...');
  await page.click('button:has-text("Sign In")');

  // Wait for navigation or loading to complete
  console.log('5. Waiting for authentication...');

  // Wait for either dashboard or error
  try {
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    console.log('✅ Successfully redirected to admin dashboard!');
    console.log('   Current URL:', page.url());

    // Check if dashboard content loads
    await page.waitForTimeout(2000);

    const dashboardTitle = await page.locator('h1:has-text("Admin Dashboard")').isVisible().catch(() => false);
    console.log('   Admin Dashboard title visible:', dashboardTitle);

    // Check if loading spinner is gone
    const checkingAuth = await page.locator('text=Checking authentication').isVisible().catch(() => false);
    console.log('   Still showing "Checking authentication":', checkingAuth);

    // Try clicking on Port Management
    console.log('6. Testing Port Management tab...');
    await page.click('button:has-text("Ports")');
    await page.waitForTimeout(2000);

    const portManagement = await page.locator('h2:has-text("Port Management")').isVisible().catch(() => false);
    console.log('   Port Management visible:', portManagement);

    // Take screenshot
    await page.screenshot({ path: 'logged-in-dashboard.png', fullPage: true });
    console.log('   Screenshot saved as logged-in-dashboard.png');

  } catch (error) {
    console.log('❌ Login failed or redirect did not occur');
    console.log('   Error:', error.message);
    console.log('   Current URL:', page.url());

    // Check for error messages
    const errorMessage = await page.locator('.auth-widget-form-error, .error, [role="alert"]').textContent().catch(() => null);
    if (errorMessage) {
      console.log('   Error message:', errorMessage);
    }

    // Take screenshot
    await page.screenshot({ path: 'login-error.png', fullPage: true });
    console.log('   Screenshot saved as login-error.png');
  }

  await browser.close();
})();