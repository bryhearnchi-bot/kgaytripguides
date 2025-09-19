const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to homepage...');
  await page.goto('http://localhost:3001');

  // Take a screenshot of the homepage
  await page.screenshot({ path: 'homepage.png', fullPage: true });
  console.log('Homepage screenshot saved');

  // Navigate directly to admin
  console.log('Navigating directly to admin dashboard...');
  await page.goto('http://localhost:3001/admin/dashboard');

  // Wait a bit to see what happens
  await page.waitForTimeout(3000);

  // Take a screenshot
  await page.screenshot({ path: 'admin-dashboard.png', fullPage: true });
  console.log('Admin dashboard screenshot saved');

  // Check current URL
  console.log('Current URL:', page.url());

  // Check if we're on login page or dashboard
  const isOnLogin = page.url().includes('login');
  const isOnDashboard = page.url().includes('admin/dashboard');

  console.log('Is on login page:', isOnLogin);
  console.log('Is on dashboard:', isOnDashboard);

  // Look for "Checking authentication..." text
  const checkingAuth = await page.locator('text=Checking authentication').isVisible().catch(() => false);
  console.log('Shows "Checking authentication...":', checkingAuth);

  // Look for "Admin Dashboard" text
  const dashboardTitle = await page.locator('h1:has-text("Admin Dashboard")').isVisible().catch(() => false);
  console.log('Shows "Admin Dashboard" title:', dashboardTitle);

  // Look for "Sign In" button
  const signInButton = await page.locator('text=Sign In').isVisible().catch(() => false);
  console.log('Shows "Sign In" button:', signInButton);

  // Get the body text content
  const bodyText = await page.locator('body').textContent();
  console.log('Page text (first 500 chars):', bodyText.substring(0, 500));

  await browser.close();
})();