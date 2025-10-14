import { test, expect } from '@playwright/test';

test.describe('Parties Tab Testing', () => {
  test('should navigate to trip guide and test parties tab', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1280, height: 800 });

    // Navigate to the trip guide page
    console.log('Navigating to trip guide page...');
    await page.goto('http://localhost:3002/trip/greek-isles-egypt-med-cruise');

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    console.log('Page loaded');

    // Wait a bit more for any dynamic content
    await page.waitForTimeout(2000);

    // Take initial screenshot
    await page.screenshot({
      path: '/Users/bryan/develop/projects/kgay-travel-guides/client/tests/screenshots/01-initial-page.png',
      fullPage: true,
    });
    console.log('Initial screenshot taken');

    // Look for the Parties tab and click it
    console.log('Looking for Parties tab...');

    // Try multiple selectors to find the Parties tab
    const partiesTabSelectors = [
      'text=Parties',
      '[role="tab"]:has-text("Parties")',
      'button:has-text("Parties")',
      '[data-tab="parties"]',
      '.tab:has-text("Parties")',
    ];

    let partiesTab = null;
    for (const selector of partiesTabSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          partiesTab = element;
          console.log(`Found Parties tab using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (partiesTab) {
      await partiesTab.click();
      console.log('Clicked on Parties tab');

      // Wait for tab content to load
      await page.waitForTimeout(2000);

      // Take screenshot after clicking parties tab
      await page.screenshot({
        path: '/Users/bryan/develop/projects/kgay-travel-guides/client/tests/screenshots/02-parties-tab-initial.png',
        fullPage: true,
      });
      console.log('Parties tab initial screenshot taken');

      // Check for party cards
      const partyCards = page.locator('[class*="party"], [class*="card"], [data-party]');
      const cardCount = await partyCards.count();
      console.log(`Found ${cardCount} party cards`);

      // Take a focused screenshot of the parties content area
      await page.screenshot({
        path: '/Users/bryan/develop/projects/kgay-travel-guides/client/tests/screenshots/03-parties-content.png',
        fullPage: false,
      });

      // Scroll down to see more cards
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: '/Users/bryan/develop/projects/kgay-travel-guides/client/tests/screenshots/04-parties-scrolled.png',
        fullPage: false,
      });
      console.log('Scrolled screenshot taken');

      // Try to click on first party card if available
      if (cardCount > 0) {
        console.log('Attempting to click first party card...');
        try {
          await partyCards.first().click();
          await page.waitForTimeout(1500);

          await page.screenshot({
            path: '/Users/bryan/develop/projects/kgay-travel-guides/client/tests/screenshots/05-party-card-clicked.png',
            fullPage: false,
          });
          console.log('Party card clicked screenshot taken');
        } catch (e) {
          console.log('Could not click party card:', e);
        }
      }

      // Check for specific elements within party cards
      const images = page.locator('img[class*="party"], img[alt*="party" i]');
      const imageCount = await images.count();
      console.log(`Found ${imageCount} party images`);

      const badges = page.locator('[class*="badge"]');
      const badgeCount = await badges.count();
      console.log(`Found ${badgeCount} badges`);

      // Get console logs
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('Browser Console Error:', msg.text());
        } else if (msg.type() === 'warning') {
          console.log('Browser Console Warning:', msg.text());
        }
      });

      // Capture any errors
      page.on('pageerror', error => {
        console.log('Page Error:', error.message);
      });
    } else {
      console.log('Could not find Parties tab');
      await page.screenshot({
        path: '/Users/bryan/develop/projects/kgay-travel-guides/client/tests/screenshots/error-no-parties-tab.png',
        fullPage: true,
      });
    }

    // Take final full page screenshot
    await page.screenshot({
      path: '/Users/bryan/develop/projects/kgay-travel-guides/client/tests/screenshots/06-final-state.png',
      fullPage: true,
    });
    console.log('Final screenshot taken');

    // Get page HTML for debugging - using import instead of require
    const html = await page.content();
    const fs = await import('fs');
    fs.writeFileSync(
      '/Users/bryan/develop/projects/kgay-travel-guides/client/tests/screenshots/page-content.html',
      html
    );
    console.log('Page HTML saved');
  });
});
