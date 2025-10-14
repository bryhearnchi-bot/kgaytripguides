import { test } from '@playwright/test';

test.describe('Capture Parties Visual', () => {
  test.setTimeout(60000);

  test('should capture visible parties content', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    console.log('Navigating to trip page...');
    await page.goto('http://localhost:3002/trip/greek-isles-egypt-med-cruise', {
      waitUntil: 'networkidle',
    });

    await page.waitForTimeout(3000);

    console.log('Clicking Parties tab...');
    const partiesTab = page.locator('button').filter({ hasText: 'Parties' }).first();
    await partiesTab.click();

    await page.waitForTimeout(2000);

    // Scroll to make sure content is visible
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(500);

    // Take screenshot of current viewport
    await page.screenshot({
      path: '/Users/bryan/develop/projects/kgay-travel-guides/screenshots/parties-viewport-1.png',
      fullPage: false,
    });
    console.log('✓ Screenshot 1 saved (top section)');

    // Scroll down more
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: '/Users/bryan/develop/projects/kgay-travel-guides/screenshots/parties-viewport-2.png',
      fullPage: false,
    });
    console.log('✓ Screenshot 2 saved (middle section)');

    // Scroll down more
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: '/Users/bryan/develop/projects/kgay-travel-guides/screenshots/parties-viewport-3.png',
      fullPage: false,
    });
    console.log('✓ Screenshot 3 saved (bottom section)');

    // Count visible party cards
    const partyData = await page.evaluate(() => {
      // Look for date headers
      const dateHeaders = Array.from(document.querySelectorAll('[class*="items-center"]')).filter(
        el =>
          el.textContent?.includes('Aug') ||
          el.textContent?.includes('Thu') ||
          el.textContent?.includes('Fri')
      );

      // Look for party titles
      const titles = Array.from(document.querySelectorAll('h3, h4'))
        .map(el => el.textContent)
        .filter(Boolean);

      // Look for time badges
      const times = Array.from(document.querySelectorAll('[class*="badge"], [class*="rounded"]'))
        .map(el => el.textContent)
        .filter(text => text?.includes(':'));

      // Look for costume sections
      const costumeHeaders = Array.from(document.querySelectorAll('*')).filter(el =>
        el.textContent?.includes('COSTUME IDEAS')
      );

      return {
        dateHeaders: dateHeaders.length,
        partyTitles: titles.filter(t => t && t.length > 3 && t.length < 50),
        timeCount: times.length,
        costumeCount: costumeHeaders.length,
      };
    });

    console.log('\n=== Party Content Analysis ===');
    console.log(`Date headers found: ${partyData.dateHeaders}`);
    console.log(`Time badges found: ${partyData.timeCount}`);
    console.log(`Costume sections found: ${partyData.costumeCount}`);
    console.log('\nParty titles found:');
    partyData.partyTitles.slice(0, 15).forEach(title => {
      console.log(`  - ${title}`);
    });
  });
});
