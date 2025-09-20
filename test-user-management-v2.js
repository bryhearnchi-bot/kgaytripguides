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

    // Click the Login button
    console.log('Clicking Login button...');
    await page.click('text=Login');
    await page.waitForTimeout(2000);

    // Fill in the email and password
    console.log('Filling login form...');
    await page.fill('input[type="email"]', 'admin@atlantis.com');
    await page.fill('input[type="password"]', 'Admin123!');

    // Click the Sign In button inside the modal
    console.log('Clicking Sign In button...');
    await page.click('button:has-text("Sign In")');

    // Wait for login to complete
    await page.waitForTimeout(5000);

    // Take screenshot after login
    await page.screenshot({ path: 'after-successful-login.png', fullPage: true });
    console.log('After login screenshot saved');

    // Navigate directly to admin/users page
    console.log('Navigating to http://localhost:3001/admin/users');
    await page.goto('http://localhost:3001/admin/users', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Take screenshot of user management page
    await page.screenshot({ path: 'user-management-page-v2.png', fullPage: true });
    console.log('User management page screenshot saved as user-management-page-v2.png');

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

    // Check for tables
    const tables = await page.locator('table').count();
    console.log('Found tables:', tables);

    // Check for user-related elements
    const userElements = await page.locator('[data-testid*="user"], .user-row, .user-item').count();
    console.log('Found user-related elements:', userElements);

    // Check if page content is visible (not white screen)
    const bodyText = await page.locator('body').textContent();
    const hasContent = bodyText && bodyText.trim().length > 100;
    console.log('Page has content:', hasContent);
    console.log('Content length:', bodyText ? bodyText.trim().length : 0);

    if (!hasContent) {
      console.log('WARNING: Page appears to be mostly empty (possible white screen)');
    }

    // Check for loading states
    const loading = await page.locator('.loading, .spinner, [data-loading="true"]').count();
    console.log('Loading elements:', loading);

    // Check for buttons that might be user management related
    const buttons = await page.locator('button').allTextContents();
    console.log('Found buttons:', buttons);

    // Try to find any invite or add user functionality
    const inviteButton = await page.locator('button:has-text("Invite"), button:has-text("Add User"), button:has-text("Create")').count();
    console.log('Found invite/add buttons:', inviteButton);

    // Wait a bit more and take a final screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'user-management-final-v2.png', fullPage: true });
    console.log('Final screenshot saved as user-management-final-v2.png');

  } catch (error) {
    console.error('Error during navigation:', error);
    await page.screenshot({ path: 'error-screenshot-v2.png', fullPage: true });
    console.log('Error screenshot saved as error-screenshot-v2.png');
  } finally {
    await browser.close();
  }
})();