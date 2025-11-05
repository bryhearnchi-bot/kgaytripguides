import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Navigate to landing page
    console.log('Navigating to landing page...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for the About KGAY Travel button
    console.log('Looking for About KGAY Travel button...');
    const aboutButton = await page.locator('button:has-text("About KGAY Travel")').first();

    if (await aboutButton.isVisible()) {
      console.log('Found About button, clicking...');
      await aboutButton.click({ force: true });
      await page.waitForTimeout(1500);

      // Take screenshot of modal on landing page
      console.log('Taking screenshot of modal on landing page...');
      await page.screenshot({
        path: '/Users/bryan/develop/projects/kgay-travel-guides/landing-modal.png',
        fullPage: false
      });
      console.log('Screenshot saved: landing-modal.png');
    } else {
      console.log('About button not found on landing page');
    }

    // Navigate to trip guide page
    console.log('Navigating to trip guide page...');
    await page.goto('http://localhost:3001/trip/drag-stars-at-sea');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for the About KGAY Travel button on trip guide
    console.log('Looking for About KGAY Travel button on trip guide...');
    const aboutButtonTrip = await page.locator('button:has-text("About KGAY Travel")').first();

    if (await aboutButtonTrip.isVisible()) {
      console.log('Found About button, clicking...');
      await aboutButtonTrip.click({ force: true });
      await page.waitForTimeout(1500);

      // Take screenshot of modal on trip guide
      console.log('Taking screenshot of modal on trip guide...');
      await page.screenshot({
        path: '/Users/bryan/develop/projects/kgay-travel-guides/trip-guide-modal.png',
        fullPage: false
      });
      console.log('Screenshot saved: trip-guide-modal.png');
    } else {
      console.log('About button not found on trip guide page');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
