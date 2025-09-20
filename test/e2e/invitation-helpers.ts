import { Page, expect } from '@playwright/test';

/**
 * Helper utilities for invitation system E2E tests
 *
 * Provides reusable functions for common invitation testing scenarios:
 * - Authentication helpers
 * - Invitation creation and management
 * - Test data generation
 * - Validation utilities
 */

// Test data constants
export const TEST_USERS = {
  ADMIN: {
    email: 'admin@atlantis.com',
    password: 'Admin123!',
    role: 'admin'
  },
  EDITOR: {
    email: 'editor@test.com',
    password: 'Editor123!',
    role: 'editor'
  }
} as const;

export const INVITATION_ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  USER: 'user'
} as const;

// Type definitions
export interface TestInvitation {
  email: string;
  fullName?: string;
  role: keyof typeof INVITATION_ROLES;
  password?: string;
  phoneNumber?: string;
}

export interface InvitationToken {
  token: string;
  email: string;
  role: string;
  expiresAt: string;
}

/**
 * Authentication Helper Functions
 */
export class AuthHelpers {
  static async loginAsAdmin(page: Page): Promise<void> {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USERS.ADMIN.email);
    await page.fill('input[type="password"]', TEST_USERS.ADMIN.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/admin/dashboard');

    // Verify login was successful
    await expect(page.locator(`text=${TEST_USERS.ADMIN.email}`)).toBeVisible();
  }

  static async loginAsEditor(page: Page): Promise<void> {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USERS.EDITOR.email);
    await page.fill('input[type="password"]', TEST_USERS.EDITOR.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/admin/dashboard');

    // Verify login was successful
    await expect(page.locator(`text=${TEST_USERS.EDITOR.email}`)).toBeVisible();
  }

  static async logout(page: Page): Promise<void> {
    // Click user dropdown
    const userDropdown = page.locator('[role="button"]').filter({ hasText: '@' }).first();
    await userDropdown.click();

    // Click logout
    await page.click('text=Log out');

    // Verify logout
    await expect(page).toHaveURL('/');
    await expect(page.locator('a[href="/login"] button')).toBeVisible();
  }

  static async clearSession(page: Page): Promise<void> {
    await page.context().clearCookies();
    await page.context().clearPermissions();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}

/**
 * Invitation Management Helper Functions
 */
export class InvitationHelpers {
  static async navigateToUserManagement(page: Page): Promise<void> {
    await page.goto('/admin/users');
    await expect(page.locator('h1')).toContainText('User Management');
  }

  static async openInviteModal(page: Page): Promise<void> {
    await page.click('button:has-text("Invite User")');
    await expect(page.locator('h2:has-text("Invite New User")')).toBeVisible();
  }

  static async fillInvitationForm(page: Page, invitation: TestInvitation): Promise<void> {
    // Fill name if provided
    if (invitation.fullName) {
      await page.fill('input[id="fullName"]', invitation.fullName);
    }

    // Fill email
    await page.fill('input[id="email"]', invitation.email);

    // Select role
    await page.click('[role="combobox"]');
    const roleText = invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1);
    await page.click(`text=${roleText}`);

    // Verify role preview is shown
    await expect(page.locator(`text=${roleText} Role`)).toBeVisible();
  }

  static async submitInvitation(page: Page): Promise<void> {
    await page.click('button:has-text("Send Invitation")');
    await expect(page.locator('text=Invitation sent!')).toBeVisible();
  }

  static async createInvitation(page: Page, invitation: TestInvitation): Promise<void> {
    await this.navigateToUserManagement(page);
    await this.openInviteModal(page);
    await this.fillInvitationForm(page, invitation);
    await this.submitInvitation(page);
  }

  static async cancelInviteModal(page: Page): Promise<void> {
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('h2:has-text("Invite New User")')).not.toBeVisible();
  }

  static async searchInvitations(page: Page, searchTerm: string): Promise<void> {
    await page.fill('input[placeholder*="Search"]', searchTerm);
    // Wait for search to complete
    await page.waitForTimeout(500);
  }

  static async refreshInvitations(page: Page): Promise<void> {
    const refreshButton = page.locator('button').filter({ has: page.locator('svg') });
    await refreshButton.click();
    // Wait for refresh to complete
    await expect(page.locator('text=Loading invitations')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Loading invitations')).not.toBeVisible({ timeout: 10000 });
  }

  static async deleteInvitation(page: Page, email: string, confirm: boolean = true): Promise<void> {
    // Find the invitation row
    const invitationRow = page.locator(`tr:has-text("${email}")`);
    await expect(invitationRow).toBeVisible();

    // Click delete button
    const deleteButton = invitationRow.locator('button[title="Delete invitation"]');
    await deleteButton.click();

    // Handle confirmation dialog
    await expect(page.locator('text=Delete Invitation')).toBeVisible();

    if (confirm) {
      await page.click('button:has-text("Delete")');
      await expect(page.locator('text=Invitation deleted')).toBeVisible();
    } else {
      await page.click('button:has-text("Cancel")');
      await expect(page.locator('text=Delete Invitation')).not.toBeVisible();
    }
  }

  static async resendInvitation(page: Page, email: string): Promise<void> {
    // Find the invitation row
    const invitationRow = page.locator(`tr:has-text("${email}")`);
    await expect(invitationRow).toBeVisible();

    // Click resend button
    const resendButton = invitationRow.locator('button[title="Resend invitation"]');
    await resendButton.click();

    // Verify success
    await expect(page.locator('text=Invitation resent')).toBeVisible();
  }

  static async copyInvitationLink(page: Page, email: string): Promise<void> {
    // Find the invitation row
    const invitationRow = page.locator(`tr:has-text("${email}")`);
    await expect(invitationRow).toBeVisible();

    // Click copy button
    const copyButton = invitationRow.locator('button[title="Copy invitation link"]');
    await copyButton.click();

    // Verify success
    await expect(page.locator('text=Copied')).toBeVisible();
  }

  static async verifyInvitationInList(page: Page, invitation: TestInvitation): Promise<void> {
    await this.navigateToUserManagement(page);

    // Check invitation appears in table
    await expect(page.locator(`text=${invitation.email}`)).toBeVisible();

    if (invitation.fullName) {
      await expect(page.locator(`text=${invitation.fullName}`)).toBeVisible();
    }

    // Check role badge
    const roleText = invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1);
    await expect(page.locator(`text=${roleText}`)).toBeVisible();

    // Check status is pending
    await expect(page.locator('text=Pending')).toBeVisible();
  }

  static async getInvitationStatistics(page: Page): Promise<{pending: number, accepted: number, expired: number}> {
    await this.navigateToUserManagement(page);

    const pendingElement = page.locator('text=Pending').locator('..').locator('p').nth(1);
    const acceptedElement = page.locator('text=Accepted').locator('..').locator('p').nth(1);
    const expiredElement = page.locator('text=Expired').locator('..').locator('p').nth(1);

    const pending = parseInt(await pendingElement.textContent() || '0');
    const accepted = parseInt(await acceptedElement.textContent() || '0');
    const expired = parseInt(await expiredElement.textContent() || '0');

    return { pending, accepted, expired };
  }
}

/**
 * Account Setup Flow Helper Functions
 */
export class AccountSetupHelpers {
  static async navigateToAccountSetup(page: Page, token: string): Promise<void> {
    await page.goto(`/setup-account/${token}`);
  }

  static async verifyInvalidToken(page: Page): Promise<void> {
    await expect(page.locator('h2:has-text("Invalid Invitation")')).toBeVisible();
    await expect(page.locator('text=Invalid invitation link')).toBeVisible();
    await expect(page.locator('button:has-text("Go to Login")')).toBeVisible();
  }

  static async goToLoginFromInvalidToken(page: Page): Promise<void> {
    await page.click('button:has-text("Go to Login")');
    await expect(page).toHaveURL('/login');
  }

  static async verifyAccountSetupWizard(page: Page): Promise<void> {
    await expect(page.locator('text=Account Setup')).toBeVisible();
    await expect(page.locator('text=Step 1 of 4')).toBeVisible();
  }

  static async fillPasswordStep(page: Page, password: string, confirmPassword?: string): Promise<void> {
    await page.fill('input[id="password"]', password);
    await page.fill('input[id="confirmPassword"]', confirmPassword || password);
  }

  static async verifyPasswordStrength(page: Page, password: string): Promise<void> {
    await page.fill('input[id="password"]', password);

    // Check password strength indicators
    await expect(page.locator('text=Password Strength')).toBeVisible();
    await expect(page.locator('text=At least 8 characters')).toBeVisible();
    await expect(page.locator('text=One uppercase letter')).toBeVisible();
    await expect(page.locator('text=One lowercase letter')).toBeVisible();
    await expect(page.locator('text=One number')).toBeVisible();
    await expect(page.locator('text=One special character')).toBeVisible();
  }

  static async togglePasswordVisibility(page: Page, passwordField: 'password' | 'confirmPassword'): Promise<void> {
    const passwordInput = page.locator(`input[id="${passwordField}"]`);
    const toggleButton = passwordInput.locator('..').locator('button').last();

    // Get current type
    const currentType = await passwordInput.getAttribute('type');

    // Click toggle
    await toggleButton.click();

    // Verify type changed
    const newType = await passwordInput.getAttribute('type');
    expect(newType).not.toBe(currentType);
  }

  static async fillProfileStep(page: Page, profile: Partial<TestInvitation>): Promise<void> {
    if (profile.fullName) {
      await page.fill('input[id="fullName"]', profile.fullName);
    }

    if (profile.phoneNumber) {
      await page.fill('input[id="phoneNumber"]', profile.phoneNumber);
    }
  }

  static async setNotificationPreferences(page: Page, emailNotifications: boolean, smsNotifications: boolean): Promise<void> {
    const emailCheckbox = page.locator('input[id="emailNotifications"]');
    const smsCheckbox = page.locator('input[id="smsNotifications"]');

    if (emailNotifications) {
      await emailCheckbox.check();
    } else {
      await emailCheckbox.uncheck();
    }

    if (smsNotifications) {
      await smsCheckbox.check();
    } else {
      await smsCheckbox.uncheck();
    }
  }

  static async acceptTermsAndConditions(page: Page): Promise<void> {
    await page.check('input[id="acceptTerms"]');
    await page.check('input[id="acceptPrivacy"]');
    await page.check('input[id="confirmAge"]');
  }

  static async completeSetup(page: Page): Promise<void> {
    await page.click('button:has-text("Complete Setup")');
    await expect(page.locator('text=Account Created!')).toBeVisible();
  }

  static async navigateSteps(page: Page, direction: 'next' | 'back'): Promise<void> {
    if (direction === 'next') {
      await page.click('button:has-text("Continue")');
    } else {
      await page.click('button:has-text("Back")');
    }
  }
}

/**
 * Test Data Generation Utilities
 */
export class TestDataHelpers {
  static generateRandomEmail(prefix: string = 'test'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}.${timestamp}.${random}@example.com`;
  }

  static generateRandomName(): string {
    const firstNames = ['John', 'Jane', 'Alex', 'Sam', 'Taylor', 'Jordan', 'Casey', 'Morgan'];
    const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    return `${firstName} ${lastName}`;
  }

  static generateTestInvitation(overrides: Partial<TestInvitation> = {}): TestInvitation {
    return {
      email: this.generateRandomEmail(),
      fullName: this.generateRandomName(),
      role: 'user',
      password: 'TestPassword123!',
      phoneNumber: '+1234567890',
      ...overrides
    };
  }

  static generateMultipleInvitations(count: number, baseRole: keyof typeof INVITATION_ROLES = 'user'): TestInvitation[] {
    return Array.from({ length: count }, (_, index) =>
      this.generateTestInvitation({
        email: this.generateRandomEmail(`user${index}`),
        fullName: `Test User ${index + 1}`,
        role: baseRole
      })
    );
  }

  static generateStrongPassword(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }

  static generateWeakPasswords(): string[] {
    return [
      '123',           // Too short
      'password',      // No uppercase, numbers, symbols
      'PASSWORD',      // No lowercase, numbers, symbols
      '12345678',      // No letters, symbols
      'Password',      // No numbers, symbols
      'Password1',     // No symbols
      'pass word',     // Contains space
      ''               // Empty
    ];
  }
}

/**
 * Validation Helper Functions
 */
export class ValidationHelpers {
  static async verifyEmailValidation(page: Page, invalidEmails: string[]): Promise<void> {
    for (const email of invalidEmails) {
      await page.fill('input[id="email"]', email);
      await page.click('button:has-text("Send Invitation")');
      await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
      await page.fill('input[id="email"]', ''); // Clear for next test
    }
  }

  static async verifyPasswordValidation(page: Page, weakPasswords: string[]): Promise<void> {
    for (const password of weakPasswords) {
      await page.fill('input[id="password"]', password);

      // Should show appropriate validation error
      if (password.length < 8) {
        await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
      }

      await page.fill('input[id="password"]', ''); // Clear for next test
    }
  }

  static async verifyRequiredFields(page: Page, fields: string[]): Promise<void> {
    // Try to submit without filling required fields
    await page.click('button:has-text("Send Invitation")');

    for (const field of fields) {
      const errorMessage = this.getRequiredFieldError(field);
      await expect(page.locator(`text=${errorMessage}`)).toBeVisible();
    }
  }

  private static getRequiredFieldError(field: string): string {
    const errorMessages: Record<string, string> = {
      email: 'Please enter a valid email address',
      role: 'Please select a role',
      fullName: 'Full name is required',
      password: 'Password must be at least 8 characters',
      terms: 'You must accept the Terms and Conditions',
      privacy: 'You must accept the Privacy Policy',
      age: 'You must confirm you are 18 or older'
    };

    return errorMessages[field] || `${field} is required`;
  }
}

/**
 * Network and Error Simulation Helpers
 */
export class ErrorSimulationHelpers {
  static async simulateNetworkError(page: Page): Promise<void> {
    await page.context().setOffline(true);
  }

  static async restoreNetwork(page: Page): Promise<void> {
    await page.context().setOffline(false);
  }

  static async simulateSlowNetwork(page: Page): Promise<void> {
    await page.context().route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      await route.continue();
    });
  }

  static async clearNetworkSimulation(page: Page): Promise<void> {
    await page.context().unroute('**/*');
  }
}