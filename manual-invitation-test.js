#!/usr/bin/env node

// Manual invitation test script
const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Starting manual invitation email test...');

  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    slowMo: 500
  });

  const page = await browser.newPage();

  try {
    console.log('📱 Navigating to admin dashboard...');
    await page.goto('http://localhost:3001/admin/dashboard');

    console.log('🔐 Filling login credentials...');
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'admin@atlantis.com');
    await page.type('input[type="password"]', 'Admin123!');

    console.log('▶️ Clicking login button...');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    console.log('⏳ Waiting for dashboard to load...');
    await page.waitForSelector('h1:contains("Dashboard Overview")', { timeout: 10000 });

    console.log('👥 Looking for User Management navigation...');
    await page.screenshot({ path: 'debug-dashboard.png' });

    // Try different selectors for User Management
    const userMgmtSelectors = [
      'button:contains("User Management")',
      'a[href="/admin/users"]',
      '.navigation *:contains("User Management")',
      '[aria-label*="User"]',
      'nav button:contains("User")'
    ];

    let foundUserMgmt = false;
    for (const selector of userMgmtSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        console.log(`✅ Found User Management with selector: ${selector}`);
        await page.click(selector);
        foundUserMgmt = true;
        break;
      } catch (e) {
        console.log(`❌ Selector not found: ${selector}`);
      }
    }

    if (!foundUserMgmt) {
      console.log('🔍 Checking all navigation elements...');
      const navElements = await page.evaluate(() => {
        const elements = [];
        document.querySelectorAll('button, a, nav *').forEach(el => {
          if (el.textContent.toLowerCase().includes('user') ||
              el.textContent.toLowerCase().includes('management') ||
              el.href && el.href.includes('users')) {
            elements.push({
              tagName: el.tagName,
              textContent: el.textContent.trim(),
              href: el.href,
              className: el.className
            });
          }
        });
        return elements;
      });

      console.log('🔍 Found navigation elements:', navElements);

      // Try to click sidebar menu if collapsed
      try {
        await page.click('[aria-label="menu"], .menu-button, button:contains("Menu")');
        await page.waitForTimeout(1000);
      } catch (e) {
        console.log('No menu button found');
      }
    }

    console.log('📸 Taking final screenshot...');
    await page.screenshot({ path: 'debug-final-state.png' });

    console.log('⏱️ Keeping browser open for manual inspection...');
    console.log('Press Ctrl+C to close the browser');

    // Keep browser open for manual testing
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'debug-error.png' });
  } finally {
    // Don't close automatically for manual inspection
    // await browser.close();
  }
})();