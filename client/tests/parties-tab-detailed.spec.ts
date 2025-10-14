import { test, expect } from '@playwright/test';

test.describe('Parties Tab Detailed Testing', () => {
  test('should test parties tab with detailed analysis', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1280, height: 800 });

    // Capture console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`${msg.type()}: ${text}`);
      console.log(`Browser ${msg.type()}: ${text}`);
    });

    // Capture errors
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log('Page Error:', error.message);
    });

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
      path: '/Users/bryan/develop/projects/kgay-travel-guides/client/tests/screenshots/detailed-01-initial.png',
      fullPage: true,
    });

    // Click on Parties tab
    console.log('Looking for Parties tab...');
    const partiesTab = page.locator('text=Parties').first();
    await partiesTab.click();
    console.log('Clicked Parties tab');

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Take screenshot after clicking
    await page.screenshot({
      path: '/Users/bryan/develop/projects/kgay-travel-guides/client/tests/screenshots/detailed-02-after-click.png',
      fullPage: true,
    });

    // Check for "PARTY SCHEDULE" heading
    const partyScheduleHeading = page.locator('text=PARTY SCHEDULE');
    const hasHeading = await partyScheduleHeading.count();
    console.log(`Party Schedule heading found: ${hasHeading}`);

    // Check for "No parties scheduled" message
    const noPartiesMessage = page.locator('text=No parties scheduled');
    const hasNoPartiesMsg = await noPartiesMessage.count();
    console.log(`"No parties scheduled" message found: ${hasNoPartiesMsg}`);

    // Look for party cards using various selectors
    const partyCardSelectors = [
      '[data-party-card]',
      '[class*="party"]',
      '[class*="PartyCard"]',
      'div[class*="grid"] > div',
      'div[class*="bg-white/5"]',
    ];

    for (const selector of partyCardSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        console.log(`Found ${count} elements with selector: ${selector}`);
      }
    }

    // Get all divs under the parties tab content area
    const contentDivs = page.locator('div[class*="max-w-6xl"] > div');
    const contentDivsCount = await contentDivs.count();
    console.log(`Content divs found: ${contentDivsCount}`);

    // Get all images on the page
    const images = page.locator('img');
    const imageCount = await images.count();
    console.log(`Total images on page: ${imageCount}`);

    // Scroll down slowly to trigger any lazy loading
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: '/Users/bryan/develop/projects/kgay-travel-guides/client/tests/screenshots/detailed-03-after-scroll.png',
      fullPage: true,
    });

    // Check page height
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    console.log(`Page scroll height: ${pageHeight}px`);

    // Get the HTML content of the parties tab area
    const partiesTabContent = await page.locator('div[class*="max-w-6xl"]').first().innerHTML();
    const fs = await import('fs');
    fs.writeFileSync(
      '/Users/bryan/develop/projects/kgay-travel-guides/client/tests/screenshots/parties-tab-content.html',
      partiesTabContent
    );
    console.log('Parties tab HTML saved');

    // Report findings
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Console messages: ${consoleMessages.length}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Party Schedule heading: ${hasHeading > 0 ? 'YES' : 'NO'}`);
    console.log(`No parties message: ${hasNoPartiesMsg > 0 ? 'YES' : 'NO'}`);
    console.log(`Page height: ${pageHeight}px`);

    if (errors.length > 0) {
      console.log('\nErrors found:');
      errors.forEach(err => console.log(`  - ${err}`));
    }
  });
});
