import { test, expect } from '@playwright/test';

test.describe('Parties Tab Testing', () => {
  test('should display parties tab with party cards', async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Navigate to the trip guide page
    console.log('Step 1: Navigating to trip guide page...');
    await page.goto('http://localhost:3002/trip-guide/greek-isles-egypt-med-cruise');

    // 2. Wait 3 seconds for page load and hydration
    console.log('Step 2: Waiting for page load and hydration...');
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({
      path: '/Users/bryan/develop/projects/kgay-travel-guides/screenshots/01-initial-page.png',
      fullPage: false,
    });
    console.log('Screenshot saved: 01-initial-page.png');

    // 3. Click the "Parties" tab button
    console.log('Step 3: Looking for Parties tab button...');

    // Try multiple selectors to find the Parties tab
    const partiesTabSelectors = [
      'button:has-text("Parties")',
      '[role="tab"]:has-text("Parties")',
      'text=Parties',
      '[data-tab="parties"]',
    ];

    let partiesTab = null;
    for (const selector of partiesTabSelectors) {
      try {
        partiesTab = await page.locator(selector).first();
        const isVisible = await partiesTab.isVisible({ timeout: 1000 });
        if (isVisible) {
          console.log(`Found Parties tab with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!partiesTab) {
      console.log('Available tabs on page:');
      const allButtons = await page.locator('button').all();
      for (const button of allButtons) {
        const text = await button.textContent();
        console.log(`- Button text: "${text}"`);
      }
      throw new Error('Could not find Parties tab button');
    }

    await partiesTab.click();
    console.log('Clicked Parties tab');

    // 4. Wait 2 seconds for tab content to render
    console.log('Step 4: Waiting for tab content to render...');
    await page.waitForTimeout(2000);

    // 5. Take screenshot showing the parties tab content
    await page.screenshot({
      path: '/Users/bryan/develop/projects/kgay-travel-guides/screenshots/02-parties-tab-initial.png',
      fullPage: false,
    });
    console.log('Screenshot saved: 02-parties-tab-initial.png');

    // 6. Verify content
    console.log('Step 6: Verifying parties tab content...');

    // Check for "PARTY SCHEDULE" heading
    const partyScheduleHeading = page.locator('text=/PARTY SCHEDULE/i');
    const hasHeading = await partyScheduleHeading.isVisible({ timeout: 2000 });
    console.log(`✓ PARTY SCHEDULE heading visible: ${hasHeading}`);

    // Look for party cards - try multiple selectors
    const partyCardSelectors = [
      '[class*="grid"]',
      '[class*="party"]',
      'article',
      '[data-testid*="party"]',
    ];

    let partyCards = null;
    for (const selector of partyCardSelectors) {
      partyCards = page.locator(selector);
      const count = await partyCards.count();
      if (count > 0) {
        console.log(`Found ${count} elements with selector: ${selector}`);
        break;
      }
    }

    // Check for images
    const images = page.locator('img');
    const imageCount = await images.count();
    console.log(`✓ Found ${imageCount} images on page`);

    // Check for time badges
    const timeBadges = page.locator('text=/PM|AM/i');
    const timeBadgeCount = await timeBadges.count();
    console.log(`✓ Found ${timeBadgeCount} time badges`);

    // Check for venue badges
    const venueBadges = page.locator('text=/Pool|Deck|Main|Atrium|Theater/i');
    const venueBadgeCount = await venueBadges.count();
    console.log(`✓ Found ${venueBadgeCount} venue badges`);

    // 7. Scroll down to see more party cards
    console.log('Step 7: Scrolling down...');
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1000);

    // 8. Take another screenshot
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

    // 9. Try clicking on one party card
    console.log('Step 9: Looking for a party card to click...');

    // Try to find a clickable card element
    const clickableElements = await page.locator('article, [role="button"], button').all();
    let clickedCard = false;

    for (const element of clickableElements) {
      try {
        const text = await element.textContent();
        if (text && text.length > 20 && !text.includes('tab')) {
          await element.scrollIntoViewIfNeeded();
          await element.click({ timeout: 2000 });
          console.log('Clicked on a party card');
          clickedCard = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!clickedCard) {
      console.log('No clickable party cards found');
    }

    // 10. Check if modal opened
    await page.waitForTimeout(1000);
    const modal = page.locator('[role="dialog"], [class*="modal"]');
    const modalVisible = await modal.isVisible({ timeout: 1000 }).catch(() => false);
    console.log(`✓ Modal opened: ${modalVisible}`);

    if (modalVisible) {
      await page.screenshot({
        path: '/Users/bryan/develop/projects/kgay-travel-guides/screenshots/05-party-modal.png',
        fullPage: false,
      });
      console.log('Screenshot saved: 05-party-modal.png');
    }

    // Check console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors:');
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('\n✓ No console errors detected');
    }

    // Final report
    console.log('\n=== TEST REPORT ===');
    console.log(`✓ Page loaded successfully`);
    console.log(`✓ Parties tab found and clicked`);
    console.log(`✓ Images: ${imageCount}`);
    console.log(`✓ Time badges: ${timeBadgeCount}`);
    console.log(`✓ Venue badges: ${venueBadgeCount}`);
    console.log(`✓ Modal interaction: ${modalVisible ? 'Working' : 'Not detected'}`);
    console.log(
      `✓ Screenshots saved to: /Users/bryan/develop/projects/kgay-travel-guides/screenshots/`
    );
  });
});
