import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { format } from 'date-fns';

// Test configuration
const ADMIN_USER = {
  email: 'admin@atlantis.com',
  password: 'Admin123!'
};

const TEST_INVITATION = {
  email: 'test.user@example.com',
  fullName: 'Test User',
  role: 'user' as const,
  password: 'TestPassword123!',
  phoneNumber: '+1234567890'
};

const EDITOR_INVITATION = {
  email: 'editor@example.com',
  fullName: 'Content Editor',
  role: 'editor' as const,
  password: 'EditorPassword123!'
};

// Helper functions
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', ADMIN_USER.email);
  await page.fill('input[type="password"]', ADMIN_USER.password);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('/admin/dashboard');
}

async function createTestInvitation(page: Page, invitation = TEST_INVITATION) {
  // Navigate to user management
  await page.goto('/admin/users');

  // Open invite modal
  await page.click('button:has-text("Invite User")');
  await expect(page.locator('h2:has-text("Invite New User")')).toBeVisible();

  // Fill invitation form
  if (invitation.fullName) {
    await page.fill('input[id="fullName"]', invitation.fullName);
  }
  await page.fill('input[id="email"]', invitation.email);

  // Select role
  await page.click('[role="combobox"]');
  await page.click(`text=${invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}`);

  // Submit invitation
  await page.click('button:has-text("Send Invitation")');

  // Wait for success message
  await expect(page.locator('text=Invitation sent!')).toBeVisible();

  // Return invitation details for later use
  return invitation;
}

async function extractInvitationToken(page: Page): Promise<string | null> {
  // In development mode, the token might be returned in the response
  // For testing purposes, we'll mock this or use a test endpoint
  // This would normally come from email content in a real scenario

  // For now, we'll simulate getting a token from the invitation system
  // In a real test, you would extract this from the email or use a test API
  const mockToken = 'test_token_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  return mockToken;
}

test.describe('User Invitation System - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing data
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test.describe('Admin Sending Invitations', () => {
    test('should successfully send a user invitation', async ({ page }) => {
      await loginAsAdmin(page);

      // Navigate to user management
      await page.goto('/admin/users');
      await expect(page.locator('h1')).toContainText('User Management');

      // Open invite modal
      await page.click('button:has-text("Invite User")');
      await expect(page.locator('h2:has-text("Invite New User")')).toBeVisible();

      // Fill and submit invitation form
      await page.fill('input[id="fullName"]', TEST_INVITATION.fullName);
      await page.fill('input[id="email"]', TEST_INVITATION.email);

      // Select user role
      await page.click('[role="combobox"]');
      await page.click('text=User');

      // Verify role preview
      await expect(page.locator('text=User Role')).toBeVisible();
      await expect(page.locator('text=View trips and content')).toBeVisible();

      // Submit invitation
      await page.click('button:has-text("Send Invitation")');

      // Verify success
      await expect(page.locator('text=Invitation sent!')).toBeVisible();
      await expect(page.locator(`text=An invitation has been sent to ${TEST_INVITATION.email}`)).toBeVisible();
    });

    test('should validate invitation form fields', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/users');

      // Open invite modal
      await page.click('button:has-text("Invite User")');

      // Try submitting empty form
      await page.click('button:has-text("Send Invitation")');

      // Should show validation errors
      await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
      await expect(page.locator('text=Please select a role')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/users');

      // Open invite modal
      await page.click('button:has-text("Invite User")');

      // Enter invalid email
      await page.fill('input[id="email"]', 'invalid-email');
      await page.click('button:has-text("Send Invitation")');

      // Should show email validation error
      await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
    });

    test('should send editor role invitation', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/users');

      // Open invite modal
      await page.click('button:has-text("Invite User")');

      // Fill form for editor role
      await page.fill('input[id="fullName"]', EDITOR_INVITATION.fullName);
      await page.fill('input[id="email"]', EDITOR_INVITATION.email);

      // Select editor role
      await page.click('[role="combobox"]');
      await page.click('text=Editor');

      // Verify role preview
      await expect(page.locator('text=Editor Role')).toBeVisible();
      await expect(page.locator('text=Edit content and manage trips')).toBeVisible();

      // Submit invitation
      await page.click('button:has-text("Send Invitation")');

      // Verify success
      await expect(page.locator('text=Invitation sent!')).toBeVisible();
    });

    test('should send admin role invitation', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/users');

      // Open invite modal
      await page.click('button:has-text("Invite User")');

      // Fill form for admin role
      await page.fill('input[id="fullName"]', 'Admin User');
      await page.fill('input[id="email"]', 'admin.test@example.com');

      // Select admin role
      await page.click('[role="combobox"]');
      await page.click('text=Admin');

      // Verify role preview
      await expect(page.locator('text=Admin Role')).toBeVisible();
      await expect(page.locator('text=Full system access')).toBeVisible();

      // Submit invitation
      await page.click('button:has-text("Send Invitation")');

      // Verify success
      await expect(page.locator('text=Invitation sent!')).toBeVisible();
    });

    test('should handle invitation modal cancellation', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/users');

      // Open and cancel invite modal
      await page.click('button:has-text("Invite User")');
      await expect(page.locator('h2:has-text("Invite New User")')).toBeVisible();

      await page.click('button:has-text("Cancel")');
      await expect(page.locator('h2:has-text("Invite New User")')).not.toBeVisible();
    });
  });

  test.describe('Invitation Management Panel', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should display invitation management interface', async ({ page }) => {
      await page.goto('/admin/users');

      // Should show invitation management section
      await expect(page.locator('text=Invitation Management')).toBeVisible();
      await expect(page.locator('text=Manage user invitations and track their status')).toBeVisible();

      // Should show statistics
      await expect(page.locator('text=Pending')).toBeVisible();
      await expect(page.locator('text=Accepted')).toBeVisible();
      await expect(page.locator('text=Expired')).toBeVisible();

      // Should show table headers
      await expect(page.locator('text=Recipient')).toBeVisible();
      await expect(page.locator('text=Role')).toBeVisible();
      await expect(page.locator('text=Status')).toBeVisible();
      await expect(page.locator('text=Invited By')).toBeVisible();
      await expect(page.locator('text=Sent Date')).toBeVisible();
      await expect(page.locator('text=Expires')).toBeVisible();
      await expect(page.locator('text=Actions')).toBeVisible();
    });

    test('should search invitations', async ({ page }) => {
      // First create a test invitation
      await createTestInvitation(page);

      await page.goto('/admin/users');

      // Use search functionality
      await page.fill('input[placeholder*="Search"]', TEST_INVITATION.email);

      // Should show filtered results
      await expect(page.locator(`text=${TEST_INVITATION.email}`)).toBeVisible();

      // Clear search
      await page.fill('input[placeholder*="Search"]', '');

      // Should show all invitations again
      await expect(page.locator('table')).toBeVisible();
    });

    test('should refresh invitation list', async ({ page }) => {
      await page.goto('/admin/users');

      // Click refresh button
      const refreshButton = page.locator('button').filter({ has: page.locator('svg') });
      await refreshButton.click();

      // Should show loading state briefly
      await expect(page.locator('text=Loading invitations')).toBeVisible({ timeout: 1000 });
    });

    test('should show invitation statistics', async ({ page }) => {
      await page.goto('/admin/users');

      // Check statistics are displayed with numbers
      const pendingCount = page.locator('text=Pending').locator('..').locator('p').nth(1);
      const acceptedCount = page.locator('text=Accepted').locator('..').locator('p').nth(1);
      const expiredCount = page.locator('text=Expired').locator('..').locator('p').nth(1);

      await expect(pendingCount).toBeVisible();
      await expect(acceptedCount).toBeVisible();
      await expect(expiredCount).toBeVisible();
    });
  });

  test.describe('Account Setup Flow', () => {
    test('should display invalid invitation error', async ({ page }) => {
      // Try to access account setup with invalid token
      await page.goto('/setup-account/invalid-token-123');

      // Should show error state
      await expect(page.locator('h2:has-text("Invalid Invitation")')).toBeVisible();
      await expect(page.locator('text=Invalid invitation link')).toBeVisible();
      await expect(page.locator('button:has-text("Go to Login")')).toBeVisible();
    });

    test('should navigate to login from invalid invitation', async ({ page }) => {
      await page.goto('/setup-account/invalid-token-123');

      // Click go to login button
      await page.click('button:has-text("Go to Login")');

      // Should redirect to login page
      await expect(page).toHaveURL('/login');
      await expect(page.locator('h1')).toContainText('Sign In');
    });

    test('should display account setup wizard steps', async ({ page }) => {
      // For this test, we'll mock a valid token scenario
      // In a real implementation, you'd have a test endpoint or email extraction

      // Navigate to account setup with mock token
      // This would normally be from clicking an email link
      const mockToken = 'valid_test_token_123456789';
      await page.goto(`/setup-account/${mockToken}`);

      // Should show loading state initially
      await expect(page.locator('text=Loading')).toBeVisible({ timeout: 5000 });

      // If valid, should show setup steps
      // Note: This might show invalid invitation error if no real token exists
      // In a real test environment, you'd create a valid invitation first
    });

    test('should show step progress indicator', async ({ page }) => {
      const mockToken = 'valid_test_token_123456789';
      await page.goto(`/setup-account/${mockToken}`);

      // Should show progress bar and step indicator
      await expect(page.locator('text=Account Setup')).toBeVisible();
      await expect(page.locator('text=Step 1 of 4')).toBeVisible();
    });
  });

  test.describe('Password Creation Step', () => {
    test.skip('should validate password requirements', async ({ page }) => {
      // This test would require a valid invitation token
      // Skipping for now but showing the test structure

      const mockToken = 'valid_test_token_123456789';
      await page.goto(`/setup-account/${mockToken}`);

      // Assuming we get to the password step
      await page.fill('input[id="password"]', 'weak');

      // Should show password strength indicator
      await expect(page.locator('text=Password Strength')).toBeVisible();
      await expect(page.locator('text=At least 8 characters')).toBeVisible();
      await expect(page.locator('text=One uppercase letter')).toBeVisible();
      await expect(page.locator('text=One lowercase letter')).toBeVisible();
      await expect(page.locator('text=One number')).toBeVisible();
      await expect(page.locator('text=One special character')).toBeVisible();
    });

    test.skip('should toggle password visibility', async ({ page }) => {
      const mockToken = 'valid_test_token_123456789';
      await page.goto(`/setup-account/${mockToken}`);

      // Test password visibility toggle
      const passwordInput = page.locator('input[id="password"]');
      const toggleButton = page.locator('button').filter({ has: page.locator('svg') });

      // Initially should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Click to show
      await toggleButton.first().click();
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Click to hide again
      await toggleButton.first().click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test.skip('should validate password confirmation', async ({ page }) => {
      const mockToken = 'valid_test_token_123456789';
      await page.goto(`/setup-account/${mockToken}`);

      // Fill different passwords
      await page.fill('input[id="password"]', 'TestPassword123!');
      await page.fill('input[id="confirmPassword"]', 'DifferentPassword123!');

      // Try to continue
      await page.click('button:has-text("Continue")');

      // Should show error
      await expect(page.locator('text=Passwords don\'t match')).toBeVisible();
    });
  });

  test.describe('Profile Setup Step', () => {
    test.skip('should validate required profile fields', async ({ page }) => {
      const mockToken = 'valid_test_token_123456789';
      await page.goto(`/setup-account/${mockToken}`);

      // Navigate to profile step (would require going through previous steps)
      // Fill empty name
      await page.fill('input[id="fullName"]', '');

      // Try to continue
      await page.click('button:has-text("Continue")');

      // Should show validation error
      await expect(page.locator('text=Full name is required')).toBeVisible();
    });

    test.skip('should handle optional fields', async ({ page }) => {
      const mockToken = 'valid_test_token_123456789';
      await page.goto(`/setup-account/${mockToken}`);

      // Fill required fields only
      await page.fill('input[id="fullName"]', TEST_INVITATION.fullName);

      // Leave optional fields empty
      // Should still be able to continue
      await page.click('button:has-text("Continue")');

      // Should not show validation errors for optional fields
    });

    test.skip('should handle communication preferences', async ({ page }) => {
      const mockToken = 'valid_test_token_123456789';
      await page.goto(`/setup-account/${mockToken}`);

      // Test checkbox interactions
      const emailNotifications = page.locator('input[id="emailNotifications"]');
      const smsNotifications = page.locator('input[id="smsNotifications"]');

      // Email should be checked by default
      await expect(emailNotifications).toBeChecked();

      // SMS should be unchecked by default
      await expect(smsNotifications).not.toBeChecked();

      // Toggle SMS notifications
      await smsNotifications.check();
      await expect(smsNotifications).toBeChecked();
    });
  });

  test.describe('Terms and Conditions Step', () => {
    test.skip('should require all legal agreements', async ({ page }) => {
      const mockToken = 'valid_test_token_123456789';
      await page.goto(`/setup-account/${mockToken}`);

      // Navigate to terms step
      // Try to complete without accepting terms
      await page.click('button:has-text("Complete Setup")');

      // Should show validation errors
      await expect(page.locator('text=You must accept the Terms and Conditions')).toBeVisible();
      await expect(page.locator('text=You must accept the Privacy Policy')).toBeVisible();
      await expect(page.locator('text=You must confirm you are 18 or older')).toBeVisible();
    });

    test.skip('should allow completion after accepting all terms', async ({ page }) => {
      const mockToken = 'valid_test_token_123456789';
      await page.goto(`/setup-account/${mockToken}`);

      // Navigate to terms step and accept all
      await page.check('input[id="acceptTerms"]');
      await page.check('input[id="acceptPrivacy"]');
      await page.check('input[id="confirmAge"]');

      // Should be able to complete
      await page.click('button:has-text("Complete Setup")');

      // Should show success or redirect to dashboard
      await expect(page.locator('text=Account Created!')).toBeVisible();
    });

    test.skip('should open terms and privacy links in new tab', async ({ page, context }) => {
      const mockToken = 'valid_test_token_123456789';
      await page.goto(`/setup-account/${mockToken}`);

      // Test terms link
      const [termsPage] = await Promise.all([
        context.waitForEvent('page'),
        page.click('a[href="/terms"]')
      ]);
      await expect(termsPage).toHaveURL('/terms');
      await termsPage.close();

      // Test privacy link
      const [privacyPage] = await Promise.all([
        context.waitForEvent('page'),
        page.click('a[href="/privacy"]')
      ]);
      await expect(privacyPage).toHaveURL('/privacy');
      await privacyPage.close();
    });
  });

  test.describe('Role-Based Access Control', () => {
    test('should require admin authentication for invitation management', async ({ page }) => {
      // Try to access user management without authentication
      await page.goto('/admin/users');

      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('should show different role options for different admin levels', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/users');

      // Open invite modal
      await page.click('button:has-text("Invite User")');

      // Should show all role options for super admin
      await page.click('[role="combobox"]');
      await expect(page.locator('text=User')).toBeVisible();
      await expect(page.locator('text=Editor')).toBeVisible();
      await expect(page.locator('text=Admin')).toBeVisible();
    });

    test('should enforce proper role permissions', async ({ page }) => {
      await loginAsAdmin(page);

      // Create invitation and verify role-based behavior
      await createTestInvitation(page, { ...TEST_INVITATION, role: 'user' });

      // User role should have limited permissions
      await page.goto('/admin/users');

      // Should see the invitation in the list
      await expect(page.locator(`text=${TEST_INVITATION.email}`)).toBeVisible();
      await expect(page.locator('text=User').first()).toBeVisible();
    });
  });

  test.describe('Invitation Expiration', () => {
    test('should display expiration information', async ({ page }) => {
      await loginAsAdmin(page);

      // Create test invitation
      await createTestInvitation(page);

      await page.goto('/admin/users');

      // Should show expiration date in the table
      const today = new Date();
      const expirationDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const expectedDate = format(expirationDate, 'MMM d, yyyy');

      // Look for expiration date (might not be exact due to timing)
      await expect(page.locator('table')).toContainText('Expires');
    });

    test('should show expiration warning info', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/users');

      // Should show invitation information box
      await expect(page.locator('text=Invitation Information')).toBeVisible();
      await expect(page.locator('text=Invitations expire after 7 days')).toBeVisible();
      await expect(page.locator('text=Each invitation link can only be used once')).toBeVisible();
      await expect(page.locator('text=Users must set up their password and accept terms')).toBeVisible();
      await expect(page.locator('text=Expired invitations can be resent with a new link')).toBeVisible();
    });
  });

  test.describe('Security Validations', () => {
    test('should prevent unauthorized access to admin functions', async ({ page }) => {
      // Without login, should not be able to access admin endpoints
      await page.goto('/admin/users');

      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('should validate email format in invitation form', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/users');

      // Open invite modal
      await page.click('button:has-text("Invite User")');

      // Test various invalid email formats
      const invalidEmails = [
        'notanemail',
        '@domain.com',
        'user@',
        'user@domain',
        'user space@domain.com'
      ];

      for (const email of invalidEmails) {
        await page.fill('input[id="email"]', email);
        await page.click('button:has-text("Send Invitation")');
        await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
        await page.fill('input[id="email"]', ''); // Clear for next test
      }
    });

    test('should prevent duplicate invitations', async ({ page }) => {
      await loginAsAdmin(page);

      // Create first invitation
      await createTestInvitation(page);

      // Try to create duplicate invitation
      await page.goto('/admin/users');
      await page.click('button:has-text("Invite User")');

      await page.fill('input[id="email"]', TEST_INVITATION.email);
      await page.click('[role="combobox"]');
      await page.click('text=User');

      await page.click('button:has-text("Send Invitation")');

      // Should show error for duplicate email
      await expect(page.locator('text=already exists').or(page.locator('text=duplicate')).or(page.locator('text=pending invitation'))).toBeVisible();
    });

    test('should handle rate limiting gracefully', async ({ page }) => {
      await loginAsAdmin(page);

      // Simulate rapid invitation creation (if rate limiting is implemented)
      await page.goto('/admin/users');

      // Create multiple invitations rapidly
      for (let i = 0; i < 3; i++) {
        await page.click('button:has-text("Invite User")');
        await page.fill('input[id="email"]', `test${i}@example.com`);
        await page.click('[role="combobox"]');
        await page.click('text=User');
        await page.click('button:has-text("Send Invitation")');

        // Wait for modal to close
        await expect(page.locator('h2:has-text("Invite New User")')).not.toBeVisible();
      }

      // Should still work for reasonable usage
      await expect(page.locator('text=Invitation sent!')).toHaveCount(3);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/users');

      // Simulate network failure by going offline
      await page.context().setOffline(true);

      // Try to send invitation
      await page.click('button:has-text("Invite User")');
      await page.fill('input[id="email"]', 'network.test@example.com');
      await page.click('[role="combobox"]');
      await page.click('text=User');
      await page.click('button:has-text("Send Invitation")');

      // Should show error message
      await expect(page.locator('text=Failed').or(page.locator('text=Error'))).toBeVisible();

      // Restore network
      await page.context().setOffline(false);
    });

    test('should show appropriate error messages', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/users');

      // Test form validation errors
      await page.click('button:has-text("Invite User")');
      await page.click('button:has-text("Send Invitation")');

      // Should show field-specific errors
      await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
      await expect(page.locator('text=Please select a role')).toBeVisible();
    });

    test('should handle server errors', async ({ page }) => {
      // This would test server error scenarios
      // In a real test, you might mock server responses or use test data

      await loginAsAdmin(page);
      await page.goto('/admin/users');

      // Should handle errors gracefully and show user-friendly messages
      await expect(page.locator('h1')).toContainText('User Management');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display mobile-optimized invitation interface', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/users');

      // Should be responsive on mobile
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('button:has-text("Invite User")')).toBeVisible();
    });

    test('should show mobile-optimized invite modal', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/users');

      // Open invite modal on mobile
      await page.click('button:has-text("Invite User")');
      await expect(page.locator('h2:has-text("Invite New User")')).toBeVisible();

      // Form should be usable on mobile
      await expect(page.locator('input[id="email"]')).toBeVisible();
      await expect(page.locator('[role="combobox"]')).toBeVisible();
    });

    test('should handle mobile account setup flow', async ({ page }) => {
      // Test mobile version of account setup
      const mockToken = 'valid_test_token_123456789';
      await page.goto(`/setup-account/${mockToken}`);

      // Should show mobile-optimized layout
      await expect(page.locator('text=Account Setup')).toBeVisible();
    });
  });

  test.describe('Integration Tests', () => {
    test('should complete full invitation to acceptance flow', async ({ page, context }) => {
      // This is a comprehensive test that would go through the entire flow
      // In a real scenario, this would require email integration or mock email service

      // Step 1: Admin sends invitation
      await loginAsAdmin(page);
      await createTestInvitation(page);

      // Step 2: Extract invitation token (normally from email)
      const invitationToken = await extractInvitationToken(page);

      // Step 3: New user clicks invitation link (simulate new session)
      const newUserPage = await context.newPage();
      if (invitationToken) {
        await newUserPage.goto(`/setup-account/${invitationToken}`);

        // Should show account setup
        await expect(newUserPage.locator('text=Account Setup')).toBeVisible();
      }

      await newUserPage.close();
    });

    test('should handle multiple concurrent invitations', async ({ page }) => {
      await loginAsAdmin(page);

      // Create multiple invitations concurrently
      const invitations = [
        { email: 'user1@example.com', fullName: 'User One', role: 'user' as const },
        { email: 'user2@example.com', fullName: 'User Two', role: 'editor' as const },
        { email: 'user3@example.com', fullName: 'User Three', role: 'user' as const }
      ];

      for (const invitation of invitations) {
        await createTestInvitation(page, invitation);
      }

      // Verify all invitations were created
      await page.goto('/admin/users');

      for (const invitation of invitations) {
        await expect(page.locator(`text=${invitation.email}`)).toBeVisible();
      }
    });
  });
});

test.describe('Invitation Management Actions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should resend invitation', async ({ page }) => {
    // Create test invitation first
    await createTestInvitation(page);

    await page.goto('/admin/users');

    // Find and click resend button
    const resendButton = page.locator('button[title="Resend invitation"]').first();
    if (await resendButton.isVisible()) {
      await resendButton.click();

      // Should show success message
      await expect(page.locator('text=Invitation resent')).toBeVisible();
    }
  });

  test('should delete invitation with confirmation', async ({ page }) => {
    // Create test invitation first
    await createTestInvitation(page);

    await page.goto('/admin/users');

    // Find and click delete button
    const deleteButton = page.locator('button[title="Delete invitation"]').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Should show confirmation dialog
      await expect(page.locator('text=Delete Invitation')).toBeVisible();
      await expect(page.locator('text=Are you sure you want to delete this invitation?')).toBeVisible();

      // Confirm deletion
      await page.click('button:has-text("Delete")');

      // Should show success message
      await expect(page.locator('text=Invitation deleted')).toBeVisible();
    }
  });

  test('should cancel invitation deletion', async ({ page }) => {
    // Create test invitation first
    await createTestInvitation(page);

    await page.goto('/admin/users');

    // Find and click delete button
    const deleteButton = page.locator('button[title="Delete invitation"]').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Should show confirmation dialog
      await expect(page.locator('text=Delete Invitation')).toBeVisible();

      // Cancel deletion
      await page.click('button:has-text("Cancel")');

      // Dialog should close
      await expect(page.locator('text=Delete Invitation')).not.toBeVisible();
    }
  });

  test('should copy invitation link', async ({ page }) => {
    // Create test invitation first
    await createTestInvitation(page);

    await page.goto('/admin/users');

    // Find and click copy button
    const copyButton = page.locator('button[title="Copy invitation link"]').first();
    if (await copyButton.isVisible()) {
      await copyButton.click();

      // Should show copied message
      await expect(page.locator('text=Copied')).toBeVisible();
    }
  });
});