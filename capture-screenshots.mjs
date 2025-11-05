import { chromium } from 'playwright';
import { setTimeout } from 'timers/promises';

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('1. Navigating to landing page...');
    await page.goto('http://localhost:3001', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('2. Waiting for content to load...');
    await page.waitForSelector('text=Your Guide to an', { timeout: 30000 });

    console.log('3. Taking screenshot of landing page...');
    await page.screenshot({ path: '/tmp/1-landing-page.png', fullPage: true });
    console.log('   Saved: /tmp/1-landing-page.png');

    console.log('4. Looking for About KGAY Travel button...');
    await page.waitForSelector('button:has-text("About KGAY Travel")', { timeout: 10000 });
    await setTimeout(1000); // Wait for any animations to settle

    console.log('5. Taking screenshot of button...');
    await page.screenshot({ path: '/tmp/2-landing-with-button.png', fullPage: false });
    console.log('   Saved: /tmp/2-landing-with-button.png');

    console.log('6. Clicking About KGAY Travel button...');
    await page.click('button:has-text("About KGAY Travel")', { force: true });
    await setTimeout(1500); // Wait for modal animation

    console.log('7. Taking screenshot of modal...');
    await page.screenshot({ path: '/tmp/3-about-modal.png', fullPage: false });
    console.log('   Saved: /tmp/3-about-modal.png');

    console.log('8. Closing modal...');
    // Try to find close button
    const closeButton = await page.locator('[aria-label="Close"]').first();
    if (await closeButton.count() > 0) {
      await closeButton.click();
      await setTimeout(500);
    } else {
      // Press Escape key
      await page.keyboard.press('Escape');
      await setTimeout(500);
    }

    console.log('9. Navigating to trip guide page...');
    await page.goto('http://localhost:3001/trip/drag-stars-at-sea', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('10. Waiting for trip guide content...');
    // Wait for the Overview tab or trip content to load
    await page.waitForSelector('[role="tabpanel"]', { timeout: 30000 });
    await setTimeout(2000);

    console.log('11. Taking screenshot of trip guide...');
    await page.screenshot({ path: '/tmp/4-trip-guide-page.png', fullPage: true });
    console.log('   Saved: /tmp/4-trip-guide-page.png');

    console.log('12. Scrolling to top to find About KGAY Travel button...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await setTimeout(1000);

    console.log('13. Looking for About KGAY Travel button on trip guide...');
    const buttons = await page.locator('button:has-text("About KGAY Travel")').all();
    console.log(`    Found ${buttons.length} About KGAY Travel buttons`);

    // Use the last button (most likely to be visible)
    const visibleButton = buttons[buttons.length - 1];
    await setTimeout(1000); // Wait for any animations to settle

    console.log('14. Taking screenshot of trip guide with button...');
    await page.screenshot({ path: '/tmp/5-trip-guide-with-button.png', fullPage: false });
    console.log('   Saved: /tmp/5-trip-guide-with-button.png');

    console.log('15. Clicking About KGAY Travel button on trip guide...');
    await visibleButton.click({ force: true });
    await setTimeout(1500); // Wait for modal animation

    console.log('16. Taking screenshot of modal on trip guide...');
    await page.screenshot({ path: '/tmp/6-trip-guide-modal.png', fullPage: false });
    console.log('   Saved: /tmp/6-trip-guide-modal.png');

    console.log('\n✅ All screenshots captured successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);

    // Take a screenshot of the error state
    await page.screenshot({ path: '/tmp/error-state.png', fullPage: true });
    console.log('Error screenshot saved to /tmp/error-state.png');
  } finally {
    await browser.close();
  }
}

captureScreenshots();
