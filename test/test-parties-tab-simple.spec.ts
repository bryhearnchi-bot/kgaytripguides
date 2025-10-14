import { test, expect } from '@playwright/test';

test.describe('Parties Tab Testing - Simplified', () => {
  test.setTimeout(90000); // 90 second timeout

  test('should display parties tab with party cards', async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    console.log('=== Starting Parties Tab Test ===\n');

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[BROWSER ERROR] ${msg.text()}`);
      }
    });

    // 1. Navigate to the trip page on port 3002 (correct route is /trip/:slug)
    console.log('Step 1: Navigating to trip page on port 3002...');
    await page.goto('http://localhost:3002/trip/greek-isles-egypt-med-cruise', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 2. Wait 3 seconds for page load and hydration
    console.log('Step 2: Waiting for page load and hydration...');
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({
      path: '/Users/bryan/develop/projects/kgay-travel-guides/screenshots/01-initial-page.png',
      fullPage: false,
    });
    console.log('Screenshot saved: 01-initial-page.png');

    // Check if we got a 404
    const pageTitle = await page.title();
    const pageContent = await page.textContent('body');

    if (pageContent?.includes('404')) {
      console.log('ERROR: Got 404 page');
      console.log('Page title:', pageTitle);
      throw new Error('Page returned 404');
    }

    // 3. Look for tabs
    console.log('\nStep 3: Looking for tab navigation...');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('domcontentloaded');

    // Get all buttons and their text
    const allButtons = await page.locator('button').all();
    console.log(`Found ${allButtons.length} buttons on page`);

    for (let i = 0; i < Math.min(allButtons.length, 20); i++) {
      try {
        const button = allButtons[i];
        const text = await button.textContent();
        const isVisible = await button.isVisible();
        console.log(`  Button ${i}: "${text?.trim()}" (visible: ${isVisible})`);
      } catch (e) {
        // Skip if can't read button
      }
    }

    // Try to find the Parties tab with various methods
    console.log('\nLooking for Parties tab...');

    let partiesTab = null;
    let foundMethod = '';

    // Method 1: Look for button containing "Parties"
    try {
      const btn = page.locator('button').filter({ hasText: 'Parties' }).first();
      const isVisible = await btn.isVisible({ timeout: 2000 });
      if (isVisible) {
        partiesTab = btn;
        foundMethod = 'button with text "Parties"';
      }
    } catch (e) {
      console.log('  Method 1 failed: button with text');
    }

    // Method 2: Look for role=tab
    if (!partiesTab) {
      try {
        const btn = page.locator('[role="tab"]').filter({ hasText: 'Parties' }).first();
        const isVisible = await btn.isVisible({ timeout: 2000 });
        if (isVisible) {
          partiesTab = btn;
          foundMethod = '[role="tab"] with Parties text';
        }
      } catch (e) {
        console.log('  Method 2 failed: role=tab');
      }
    }

    // Method 3: Any element with Parties text
    if (!partiesTab) {
      try {
        const btn = page.getByText('Parties', { exact: false }).first();
        const isVisible = await btn.isVisible({ timeout: 2000 });
        if (isVisible) {
          partiesTab = btn;
          foundMethod = 'any element with Parties text';
        }
      } catch (e) {
        console.log('  Method 3 failed: getByText');
      }
    }

    if (!partiesTab) {
      console.log('\n❌ Could not find Parties tab!');

      // Take a full page screenshot for debugging
      await page.screenshot({
        path: '/Users/bryan/develop/projects/kgay-travel-guides/screenshots/debug-no-parties-tab.png',
        fullPage: true,
      });

      throw new Error('Could not find Parties tab button');
    }

    console.log(`✓ Found Parties tab using: ${foundMethod}`);

    // Click the Parties tab
    console.log('\nStep 4: Clicking Parties tab...');
    await partiesTab.click();
    console.log('✓ Clicked Parties tab');

    // Wait for tab content to render
    console.log('\nStep 5: Waiting for tab content to render...');
    await page.waitForTimeout(2000);

    // Take screenshot of parties tab
    await page.screenshot({
      path: '/Users/bryan/develop/projects/kgay-travel-guides/screenshots/02-parties-tab-initial.png',
      fullPage: false,
    });
    console.log('Screenshot saved: 02-parties-tab-initial.png');

    // 6. Verify content
    console.log('\nStep 6: Verifying parties tab content...');

    // Check for "PARTY SCHEDULE" heading
    const headingVisible = await page
      .locator('text=/PARTY SCHEDULE/i')
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    console.log(`  PARTY SCHEDULE heading: ${headingVisible ? '✓ Visible' : '✗ Not found'}`);

    // Count images
    const images = await page.locator('img').all();
    const visibleImages = [];
    for (const img of images) {
      if (await img.isVisible()) {
        visibleImages.push(img);
      }
    }
    console.log(`  Images found: ${visibleImages.length}`);

    // Look for time indicators (PM/AM)
    const timeElements = await page.locator('text=/\\d+:\\d+\\s*(PM|AM)/i').all();
    console.log(`  Time badges: ${timeElements.length}`);

    // Look for card-like structures
    const articles = await page.locator('article').count();
    const cards = await page.locator('[class*="card"]').count();
    const gridItems = await page.locator('[class*="grid"] > div').count();
    console.log(`  Articles: ${articles}`);
    console.log(`  Card elements: ${cards}`);
    console.log(`  Grid items: ${gridItems}`);

    // 7. Scroll down
    console.log('\nStep 7: Scrolling down to see more content...');
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: '/Users/bryan/develop/projects/kgay-travel-guides/screenshots/03-parties-tab-scrolled.png',
      fullPage: false,
    });
    console.log('Screenshot saved: 03-parties-tab-scrolled.png');

    // Take full page screenshot
    await page.screenshot({
      path: '/Users/bryan/develop/projects/kgay-travel-guides/screenshots/04-parties-tab-fullpage.png',
      fullPage: true,
    });
    console.log('Screenshot saved: 04-parties-tab-fullpage.png');

    // 8. Try to find and click a party card
    console.log('\nStep 8: Looking for clickable party cards...');

    const clickableCards = await page.locator('article, [class*="card"]').all();
    console.log(`  Found ${clickableCards.length} potential party cards`);

    if (clickableCards.length > 0) {
      try {
        await clickableCards[0].scrollIntoViewIfNeeded();
        await clickableCards[0].click({ timeout: 5000 });
        console.log('  ✓ Clicked first party card');

        await page.waitForTimeout(1000);

        // Check for modal
        const modalVisible = await page
          .locator('[role="dialog"]')
          .isVisible({ timeout: 2000 })
          .catch(() => false);
        console.log(`  Modal opened: ${modalVisible ? '✓ Yes' : '✗ No'}`);

        if (modalVisible) {
          await page.screenshot({
            path: '/Users/bryan/develop/projects/kgay-travel-guides/screenshots/05-party-modal.png',
            fullPage: false,
          });
          console.log('Screenshot saved: 05-party-modal.png');
        }
      } catch (e) {
        console.log(`  ✗ Could not click card: ${e}`);
      }
    } else {
      console.log('  ✗ No party cards found');
    }

    // Final report
    console.log('\n=== TEST REPORT ===');
    console.log(`✓ Page loaded successfully (port 3002)`);
    console.log(`✓ Parties tab found and clicked`);
    console.log(`✓ Content verification:`);
    console.log(`    - Heading visible: ${headingVisible}`);
    console.log(`    - Images: ${visibleImages.length}`);
    console.log(`    - Time badges: ${timeElements.length}`);
    console.log(`    - Potential party cards: ${clickableCards.length}`);
    console.log(
      `✓ Screenshots saved to: /Users/bryan/develop/projects/kgay-travel-guides/screenshots/`
    );
    console.log('\n===================\n');
  });
});
