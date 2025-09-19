import { test, expect } from '@playwright/test';

test('Admin login flow test', async ({ page }) => {
  // Track all console messages and errors
  const consoleLogs: string[] = [];
  const errors: string[] = [];

  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
  });

  // Track failed network requests
  const failedRequests: string[] = [];
  page.on('response', response => {
    if (!response.ok()) {
      failedRequests.push(`${response.status()} ${response.url()}`);
    }
  });

  console.log('Starting admin login flow test...');

  // Step 1: Navigate to admin page
  console.log('Step 1: Navigating to http://localhost:3001/admin');
  await page.goto('/admin');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Step 2: Take screenshot of login page
  console.log('Step 2: Taking screenshot of login page');
  await page.screenshot({
    path: '/Users/bryan/develop/projects/kgay-travel-guides/test-results/login-page.png',
    fullPage: true
  });

  // Check what's visible on the page
  const pageTitle = await page.title();
  const pageUrl = page.url();
  console.log(`Page title: ${pageTitle}`);
  console.log(`Current URL: ${pageUrl}`);

  // Look for login form elements
  const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
  const passwordField = page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]');
  const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), input[type="submit"]');

  const emailExists = await emailField.count() > 0;
  const passwordExists = await passwordField.count() > 0;
  const loginButtonExists = await loginButton.count() > 0;

  console.log(`Email field found: ${emailExists}`);
  console.log(`Password field found: ${passwordExists}`);
  console.log(`Login button found: ${loginButtonExists}`);

  if (emailExists && passwordExists && loginButtonExists) {
    // Step 3: Fill in credentials
    console.log('Step 3: Filling in email and password');
    await emailField.fill('admin@atlantis.com');
    await passwordField.fill('Admin123!');

    // Take screenshot after filling fields
    await page.screenshot({
      path: '/Users/bryan/develop/projects/kgay-travel-guides/test-results/fields-filled.png',
      fullPage: true
    });

    // Step 4: Click login button
    console.log('Step 4: Clicking login button');
    await loginButton.click();

    // Wait for response
    await page.waitForTimeout(3000);

    // Take screenshot after login attempt
    await page.screenshot({
      path: '/Users/bryan/develop/projects/kgay-travel-guides/test-results/after-login-attempt.png',
      fullPage: true
    });

    // Check current URL after login attempt
    const postLoginUrl = page.url();
    console.log(`URL after login attempt: ${postLoginUrl}`);

    // Look for error messages
    const errorMessages = await page.locator('.error, .alert-error, [role="alert"], .text-red-500, .text-danger').allTextContents();
    if (errorMessages.length > 0) {
      console.log('Error messages found:', errorMessages);
    }

    // Check if we're still on login page or redirected
    if (postLoginUrl.includes('/admin') && !postLoginUrl.includes('/admin/dashboard')) {
      console.log('Still on login page - login likely failed');
    } else if (postLoginUrl.includes('/admin/dashboard')) {
      console.log('Successfully redirected to dashboard');
    }

  } else {
    console.log('Login form not found! This might be a routing issue.');

    // Check if we're redirected somewhere else
    if (!pageUrl.includes('/admin')) {
      console.log('Redirected away from admin page');
    }

    // Look for any authentication-related elements
    const authElements = await page.locator('form, [data-testid*="auth"], [data-testid*="login"]').count();
    console.log(`Authentication elements found: ${authElements}`);
  }

  // Report console logs
  if (consoleLogs.length > 0) {
    console.log('\n--- Console Logs ---');
    consoleLogs.forEach(log => console.log(log));
  }

  // Report errors
  if (errors.length > 0) {
    console.log('\n--- Page Errors ---');
    errors.forEach(error => console.log(error));
  }

  // Report failed requests
  if (failedRequests.length > 0) {
    console.log('\n--- Failed Network Requests ---');
    failedRequests.forEach(req => console.log(req));
  }

  // Take final screenshot
  await page.screenshot({
    path: '/Users/bryan/develop/projects/kgay-travel-guides/test-results/final-state.png',
    fullPage: true
  });

  console.log('Test completed. Check screenshots in test-results/ directory.');
});