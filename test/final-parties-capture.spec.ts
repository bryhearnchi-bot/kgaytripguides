import { test } from '@playwright/test';

test.describe('Final Parties Capture', () => {
  test.setTimeout(60000);

  test('should scroll to and capture party cards', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    console.log('Navigating to trip page...');
    await page.goto('http://localhost:3002/trip/greek-isles-egypt-med-cruise', {
      waitUntil: 'networkidle',
    });

    await page.waitForTimeout(3000);

    console.log('Clicking Parties tab...');
    const partiesTab = page.locator('button').filter({ hasText: 'Parties' }).first();
    await partiesTab.click();

    await page.waitForTimeout(2000);

    // Find the "PARTY SCHEDULE" heading and scroll to it
    const partyHeading = page.locator('text=/PARTY SCHEDULE/i');
    await partyHeading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Scroll down a bit more to see the actual cards
    await page.evaluate(() => window.scrollBy(0, 100));
    await page.waitForTimeout(500);

    // Screenshot 1 - First party cards
    await page.screenshot({
      path: '/Users/bryan/develop/projects/kgay-travel-guides/screenshots/final-parties-1.png',
      fullPage: false,
    });
    console.log('✓ Screenshot 1: First party cards');

    // Scroll to see more cards
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: '/Users/bryan/develop/projects/kgay-travel-guides/screenshots/final-parties-2.png',
      fullPage: false,
    });
    console.log('✓ Screenshot 2: More party cards');

    // Scroll to see even more
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: '/Users/bryan/develop/projects/kgay-travel-guides/screenshots/final-parties-3.png',
      fullPage: false,
    });
    console.log('✓ Screenshot 3: Additional party cards');

    // Scroll to see the last ones
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: '/Users/bryan/develop/projects/kgay-travel-guides/screenshots/final-parties-4.png',
      fullPage: false,
    });
    console.log('✓ Screenshot 4: Last party cards');

    // Get detailed party info
    const partyInfo = await page.evaluate(() => {
      const partyCards = [];

      // Look for all images in the party section
      const allImages = Array.from(document.querySelectorAll('img'));
      const partyImages = allImages.filter(
        img => img.src.includes('parties/') || img.alt?.toLowerCase().includes('party')
      );

      // Get visible text content
      const mainContent = document.querySelector('[class*="max-w"]');
      const textContent = mainContent?.textContent || '';

      // Extract party names (look for common patterns)
      const lines = textContent
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

      return {
        partyImageCount: partyImages.length,
        partyImageUrls: partyImages.slice(0, 5).map(img => img.src),
        textLines: lines.slice(0, 50),
      };
    });

    console.log('\n=== Party Details ===');
    console.log(`Total party images: ${partyInfo.partyImageCount}`);
    console.log('\nFirst 5 party image URLs:');
    partyInfo.partyImageUrls.forEach((url, i) => {
      console.log(`  ${i + 1}. ${url.split('/').pop()}`);
    });
  });
});
