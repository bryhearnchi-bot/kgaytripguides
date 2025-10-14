import { test } from '@playwright/test';

test.describe('Debug Parties Data', () => {
  test.setTimeout(60000);

  test('should check party data in the page', async ({ page }) => {
    console.log('=== Debugging Party Data ===\n');

    // Listen to console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`[BROWSER ${msg.type().toUpperCase()}] ${text}`);
      }
    });

    // Listen to network requests
    const apiRequests: { url: string; status: number }[] = [];
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('supabase')) {
        apiRequests.push({
          url,
          status: response.status(),
        });
        console.log(`[API] ${response.status()} ${url}`);
      }
    });

    // Navigate to the page
    await page.goto('http://localhost:3002/trip/greek-isles-egypt-med-cruise', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('\n=== Waiting for page to load ===');
    await page.waitForTimeout(3000);

    // Click Parties tab
    const partiesTab = page.locator('button').filter({ hasText: 'Parties' }).first();
    await partiesTab.click();
    console.log('\n✓ Clicked Parties tab');

    await page.waitForTimeout(2000);

    // Check for "No parties scheduled" message
    const noPartiesMsg = page.locator('text=/No parties scheduled/i');
    const hasNoPartiesMsg = await noPartiesMsg.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasNoPartiesMsg) {
      console.log('\n❌ Found "No parties scheduled" message');
      console.log(
        'This means the PartiesTab component is working, but no party data is being found'
      );
    } else {
      console.log('\n✓ No "No parties scheduled" message found');
    }

    // Try to extract data from React DevTools or window object
    const pageData = await page.evaluate(() => {
      // Try to find React component data
      const rootElement = document.getElementById('root');

      // Check if there are any party-related elements
      const partyCards = document.querySelectorAll('[class*="party"]');
      const gridItems = document.querySelectorAll('[class*="grid"] > div');

      return {
        partyCards: partyCards.length,
        gridItems: gridItems.length,
        bodyText: document.body.innerText.substring(0, 1000),
      };
    });

    console.log('\n=== Page Data ===');
    console.log(`Party card elements: ${pageData.partyCards}`);
    console.log(`Grid items: ${pageData.gridItems}`);
    console.log('\nBody text preview:');
    console.log(pageData.bodyText);

    console.log('\n=== API Requests ===');
    apiRequests.forEach(req => {
      console.log(`${req.status} - ${req.url}`);
    });

    console.log('\n=== Console Logs ===');
    consoleLogs.slice(-20).forEach(log => {
      console.log(log);
    });

    // Take screenshot
    await page.screenshot({
      path: '/Users/bryan/develop/projects/kgay-travel-guides/screenshots/debug-parties.png',
      fullPage: true,
    });
    console.log('\n✓ Screenshot saved: debug-parties.png');
  });
});
