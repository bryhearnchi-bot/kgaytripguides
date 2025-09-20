import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1024, height: 768 }
  });
  const page = await context.newPage();

  try {
    // Navigate to the home page first
    console.log('Navigating to http://localhost:3001');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

    // Take initial screenshot
    await page.screenshot({ path: 'homepage-initial.png', fullPage: true });
    console.log('Homepage screenshot saved as homepage-initial.png');

    // Wait a moment and look for login elements
    await page.waitForTimeout(2000);

    // Check if already logged in by looking for admin elements
    const adminNav = await page.locator('[data-testid="admin-nav"], .admin-nav, [href*="admin"]').first();
    const isLoggedIn = await adminNav.isVisible().catch(() => false);

    if (!isLoggedIn) {
      console.log('Not logged in, looking for login button...');

      // Look for login button
      const loginButton = await page.locator('button:has-text("Login"), a:has-text("Login"), button:has-text("Sign In"), a:has-text("Sign In")').first();

      if (await loginButton.isVisible()) {
        console.log('Found login button, clicking...');
        await loginButton.click();
        await page.waitForTimeout(1000);
      }

      // Look for email input field
      const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
      if (await emailInput.isVisible()) {
        console.log('Found email input, filling...');
        await emailInput.fill('admin@atlantis.com');

        // Look for password input
        const passwordInput = await page.locator('input[type="password"], input[name="password"]').first();
        if (await passwordInput.isVisible()) {
          console.log('Found password input, filling...');
          await passwordInput.fill('Admin123!');

          // Look for submit button
          const submitButton = await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
          if (await submitButton.isVisible()) {
            console.log('Found submit button, clicking...');
            await submitButton.click();
            await page.waitForTimeout(3000);
          }
        }
      }
    }

    // Take screenshot after login attempt
    await page.screenshot({ path: 'after-login-attempt.png', fullPage: true });
    console.log('After login screenshot saved as after-login-attempt.png');

    // Navigate directly to admin/users page
    console.log('Navigating to http://localhost:3001/admin/users');
    await page.goto('http://localhost:3001/admin/users', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Take screenshot of user management page
    await page.screenshot({ path: 'user-management-page.png', fullPage: true });
    console.log('User management page screenshot saved as user-management-page.png');

    // Check for common elements and log what we find
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);

    const headings = await page.locator('h1, h2, h3').allTextContents();
    console.log('Found headings:', headings);

    // Check for error messages
    const errors = await page.locator('.error, [role="alert"], .alert-error').allTextContents();
    if (errors.length > 0) {
      console.log('Found errors:', errors);
    }

    // Check for forms
    const forms = await page.locator('form').count();
    console.log('Found forms:', forms);

    // Check for loading states
    const loading = await page.locator('.loading, .spinner, [data-loading="true"]').count();
    console.log('Loading elements:', loading);

    // Check if page content is visible (not white screen)
    const bodyText = await page.locator('body').textContent();
    const hasContent = bodyText && bodyText.trim().length > 100;
    console.log('Page has content:', hasContent);

    if (!hasContent) {
      console.log('WARNING: Page appears to be mostly empty (possible white screen)');
    }

    // Wait a bit more to see final state
    await page.waitForTimeout(2000);

    // Take final screenshot
    await page.screenshot({ path: 'user-management-final.png', fullPage: true });
    console.log('Final screenshot saved as user-management-final.png');

  } catch (error) {
    console.error('Error during navigation:', error);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();