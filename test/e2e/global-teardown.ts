import { chromium, FullConfig } from '@playwright/test';

/**
 * Global Teardown for Invitation E2E Tests
 *
 * Cleans up after invitation tests:
 * - Removes test data from database
 * - Cleans up test invitations
 * - Resets system state
 * - Generates test report summary
 */

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for invitation tests...');

  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Login as admin for cleanup operations
    console.log('🔐 Authenticating for cleanup operations...');
    await page.goto(`${baseURL}/login`);
    await page.fill('input[type="email"]', 'admin@atlantis.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button:has-text("Sign In")');

    try {
      await page.waitForURL('/admin/dashboard', { timeout: 10000 });
      console.log('✅ Admin authentication successful');

      // Clean up test invitations
      console.log('🗑️ Cleaning up test invitations...');
      try {
        // Get list of test invitations (emails containing 'test' or 'example.com')
        const response = await page.request.get('/api/admin/invitations');
        if (response.ok()) {
          const data = await response.json();
          const testInvitations = data.invitations?.filter((inv: any) =>
            inv.email.includes('test') ||
            inv.email.includes('example.com') ||
            inv.email.includes('.test@')
          ) || [];

          console.log(`📧 Found ${testInvitations.length} test invitations to clean up`);

          // Delete each test invitation
          for (const invitation of testInvitations) {
            try {
              await page.request.delete(`/api/admin/invitations/${invitation.id}`);
              console.log(`🗑️ Deleted test invitation: ${invitation.email}`);
            } catch (error) {
              console.warn(`⚠️ Could not delete invitation ${invitation.email}:`, error);
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch invitations for cleanup:', error);
      }

      // Clean up test user accounts (if any were created)
      console.log('👤 Cleaning up test user accounts...');
      try {
        await page.request.delete('/api/admin/test/cleanup-users');
      } catch (error) {
        // It's OK if cleanup endpoint doesn't exist
        console.log('ℹ️ Test user cleanup endpoint not available (this is OK)');
      }

      // Generate test summary
      console.log('📊 Generating test summary...');
      const testResults = await generateTestSummary();
      console.log('📈 Test Summary:');
      console.log(`   Total Tests: ${testResults.total}`);
      console.log(`   Passed: ${testResults.passed}`);
      console.log(`   Failed: ${testResults.failed}`);
      console.log(`   Skipped: ${testResults.skipped}`);

    } catch (authError) {
      console.warn('⚠️ Could not authenticate for cleanup (this may be OK):', authError);
    }

    console.log('✅ Global teardown completed successfully');

  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error to avoid failing the test run
  } finally {
    await browser.close();
  }
}

/**
 * Generate a summary of test results
 */
async function generateTestSummary(): Promise<{
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}> {
  try {
    // Try to read test results from Playwright's JSON report
    const fs = require('fs');
    const path = require('path');

    const resultsPath = path.join(process.cwd(), 'test-results', 'invitation-results.json');

    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

      const summary = {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      };

      // Parse Playwright results format
      if (results.suites) {
        for (const suite of results.suites) {
          if (suite.specs) {
            for (const spec of suite.specs) {
              summary.total++;
              if (spec.ok) {
                summary.passed++;
              } else {
                summary.failed++;
              }
            }
          }
        }
      }

      return summary;
    }
  } catch (error) {
    console.warn('⚠️ Could not generate test summary:', error);
  }

  return {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };
}

export default globalTeardown;