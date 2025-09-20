import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'test.user@example.com',
  password: 'TestPassword123!',
  fullName: 'Test User',
  phoneNumber: '+1234567890'
};

const ADMIN_USER = {
  email: 'admin@atlantis.com',
  password: 'Admin123!'
};

test.describe('User Registration and Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login button in navigation', async ({ page }) => {
    const loginButton = page.locator('a[href="/login"] button');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toContainText('Login');
  });

  test('should navigate to login page', async ({ page }) => {
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('Sign In');
  });

  test('should show sign up form when switching from login', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Create account")');
    await expect(page.locator('h2')).toContainText('Create Account');
  });

  test('should validate sign up form fields', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Create account")');

    // Try submitting empty form
    await page.click('button:has-text("Create Account")');

    // Should show validation errors
    await expect(page.locator('text=Full name is required')).toBeVisible();
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
  });

  test('should display social auth buttons', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Create account")');

    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
    await expect(page.locator('button:has-text("Continue with Facebook")')).toBeVisible();
    await expect(page.locator('button:has-text("Continue with X")')).toBeVisible();
  });

  test('should show password requirements', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Create account")');

    await expect(page.locator('text=Password must contain at least 8 characters')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.locator('input[type="password"]').first();
    const toggleButton = page.locator('button').filter({ has: page.locator('svg') }).first();

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle to hide password again
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should require privacy policy and terms acceptance', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Create account")');

    // Fill form without accepting legal terms
    await page.fill('input[placeholder="John Doe"]', TEST_USER.fullName);
    await page.fill('input[placeholder="john@example.com"]', TEST_USER.email);
    await page.fill('input[placeholder="+1 (555) 123-4567"]', TEST_USER.phoneNumber);
    await page.locator('input[placeholder="••••••••"]').first().fill(TEST_USER.password);
    await page.locator('input[placeholder="••••••••"]').last().fill(TEST_USER.password);

    await page.click('button:has-text("Create Account")');

    // Should show error messages
    await expect(page.locator('text=You must accept the privacy policy')).toBeVisible();
    await expect(page.locator('text=You must accept the terms of service')).toBeVisible();
  });
});

test.describe('User Profile Management', () => {
  test('should show user dropdown menu when logged in', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button:has-text("Sign In")');

    // Wait for navigation
    await page.waitForURL('/admin/dashboard');

    // Click on user dropdown
    const userDropdown = page.locator('[role="button"]:has-text("admin@atlantis.com")').first();
    await userDropdown.click();

    // Check dropdown menu items
    await expect(page.locator('text=My Profile')).toBeVisible();
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    await expect(page.locator('text=Log out')).toBeVisible();
  });

  test('should navigate to profile page', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button:has-text("Sign In")');

    await page.waitForURL('/admin/dashboard');

    // Navigate to profile
    const userDropdown = page.locator('[role="button"]:has-text("admin@atlantis.com")').first();
    await userDropdown.click();
    await page.click('text=My Profile');

    await expect(page).toHaveURL('/profile');
    await expect(page.locator('h1')).toContainText('My Profile');
  });

  test('should display profile information', async ({ page }) => {
    // Login and navigate to profile
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button:has-text("Sign In")');

    await page.waitForURL('/admin/dashboard');
    await page.goto('/profile');

    // Check profile sections
    await expect(page.locator('text=Personal Information')).toBeVisible();
    await expect(page.locator('text=Communication Preferences')).toBeVisible();
    await expect(page.locator('text=Account Information')).toBeVisible();
    await expect(page.locator('text=Privacy & Data Management')).toBeVisible();

    // Check admin badge
    await expect(page.locator('text=Administrator')).toBeVisible();
  });

  test('should allow editing profile', async ({ page }) => {
    // Login and navigate to profile
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button:has-text("Sign In")');

    await page.waitForURL('/admin/dashboard');
    await page.goto('/profile');

    // Click edit profile button
    await page.click('button:has-text("Edit Profile")');

    // Should show edit form
    await expect(page.locator('h1')).toContainText('Edit Profile');
    await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
  });
});

test.describe('Admin User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/admin/dashboard');
  });

  test('should navigate to user management page', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.locator('h1')).toContainText('User Management');
  });

  test('should display user list with search and filters', async ({ page }) => {
    await page.goto('/admin/users');

    // Check for search input
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();

    // Check for filter buttons or dropdowns
    await expect(page.locator('text=All Users')).toBeVisible();

    // Check for user table or list
    await expect(page.locator('text=Email')).toBeVisible();
    await expect(page.locator('text=Role')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
  });

  test('should open add user modal', async ({ page }) => {
    await page.goto('/admin/users');

    // Click add user button
    await page.click('button:has-text("Add User")');

    // Check modal is open
    await expect(page.locator('h2:has-text("Add New User")')).toBeVisible();
    await expect(page.locator('input[placeholder*="email"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="name"]')).toBeVisible();
  });

  test('should filter users by role', async ({ page }) => {
    await page.goto('/admin/users');

    // Click on admin filter
    const adminFilter = page.locator('button:has-text("Admins")');
    if (await adminFilter.isVisible()) {
      await adminFilter.click();

      // Verify filtered results
      const userRows = page.locator('[role="row"]').filter({ hasText: 'admin' });
      const count = await userRows.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should search for users', async ({ page }) => {
    await page.goto('/admin/users');

    // Search for admin user
    await page.fill('input[placeholder*="Search"]', 'admin@atlantis.com');

    // Wait for search results
    await page.waitForTimeout(500);

    // Verify search results
    await expect(page.locator('text=admin@atlantis.com')).toBeVisible();
  });

  test('should view user details', async ({ page }) => {
    await page.goto('/admin/users');

    // Click on a user row or view button
    const viewButton = page.locator('button:has-text("View")').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();

      // Check user detail modal/page
      await expect(page.locator('text=User Details')).toBeVisible();
      await expect(page.locator('text=Account Information')).toBeVisible();
    }
  });
});

test.describe('Password Reset Flow', () => {
  test('should show password reset form', async ({ page }) => {
    await page.goto('/login');

    // Click forgot password link
    await page.click('text=Forgot your password?');

    // Check reset form is shown
    await expect(page.locator('h2')).toContainText('Reset Password');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button:has-text("Send Reset Email")')).toBeVisible();
  });

  test('should validate email in reset form', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Forgot your password?');

    // Try submitting with invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button:has-text("Send Reset Email")');

    // Should show validation error
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
  });

  test('should go back to login from reset form', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Forgot your password?');

    // Click back to login
    await page.click('text=Back to login');

    // Should show login form
    await expect(page.locator('h1')).toContainText('Sign In');
  });
});

test.describe('Logout Functionality', () => {
  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button:has-text("Sign In")');

    await page.waitForURL('/admin/dashboard');

    // Click user dropdown and logout
    const userDropdown = page.locator('[role="button"]:has-text("admin@atlantis.com")').first();
    await userDropdown.click();
    await page.click('text=Log out');

    // Should redirect to home page
    await expect(page).toHaveURL('/');

    // Should show login button again
    await expect(page.locator('a[href="/login"] button')).toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should show mobile-optimized login form', async ({ page }) => {
    await page.goto('/login');

    // Check form is visible and properly sized
    const form = page.locator('form').first();
    await expect(form).toBeVisible();

    // Check responsive navigation
    const loginButton = page.locator('button:has-text("Sign In")');
    await expect(loginButton).toBeVisible();
  });

  test('should show mobile-optimized profile page', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.password);
    await page.click('button:has-text("Sign In")');

    await page.waitForURL('/admin/dashboard');
    await page.goto('/profile');

    // Check mobile layout
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button:has-text("Edit Profile")')).toBeVisible();
  });
});