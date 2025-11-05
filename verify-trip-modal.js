import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Navigate to trip guide page
    console.log('Navigating to trip guide page...');
    await page.goto('http://localhost:3001/trip/drag-stars-at-sea');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Scroll to bottom to make footer visible
    console.log('Scrolling to bottom...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    // Try to find and click the About button
    console.log('Looking for About KGAY Travel button...');
    const aboutButton = page.locator('footer button:has-text("About KGAY Travel")');

    if (await aboutButton.count() > 0) {
      console.log('Found About button in footer, clicking...');
      await aboutButton.click({ force: true, timeout: 5000 });
      await page.waitForTimeout(1500);

      console.log('Taking screenshot of modal on trip guide...');
      await page.screenshot({
        path: '/Users/bryan/develop/projects/kgay-travel-guides/trip-guide-modal.png',
        fullPage: false
      });
      console.log('Screenshot saved: trip-guide-modal.png');
    } else {
      console.log('About button not found');
      // Take a screenshot anyway to see what's there
      await page.screenshot({
        path: '/Users/bryan/develop/projects/kgay-travel-guides/trip-guide-footer.png',
        fullPage: true
      });
      console.log('Screenshot saved: trip-guide-footer.png');
    }

  } catch (error) {
    console.error('Error:', error.message);
    // Take a screenshot on error
    await page.screenshot({
      path: '/Users/bryan/develop/projects/kgay-travel-guides/trip-guide-error.png',
      fullPage: true
    });
  } finally {
    await browser.close();
  }
})();
