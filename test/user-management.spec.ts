import { test, expect } from '@playwright/test';

test.describe('User Management System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
  });

  test('should display login button when not authenticated', async ({ page }) => {
    // Check for login button in navigation
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    // Click login button
    await page.click('button:has-text("Login")');

    // Should be on login page
    await expect(page).toHaveURL(/.*\/login/);

    // Check for sign in form elements
    await expect(page.locator('text=Sign in to your account')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign in")')).toBeVisible();

    // Check for social login buttons
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
    await expect(page.locator('button:has-text("Continue with Facebook")')).toBeVisible();
    await expect(page.locator('button:has-text("Continue with X")')).toBeVisible();
  });

  test('should show sign up form', async ({ page }) => {
    // Navigate to login and switch to sign up
    await page.goto('http://localhost:3001/login');

    // Click on sign up link
    await page.click('text=Sign up');

    // Check for sign up form elements
    await expect(page.locator('text=Create your account')).toBeVisible();
    await expect(page.locator('input[placeholder*="John Doe"]')).toBeVisible(); // Full name
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="tel"]')).toBeVisible(); // Phone
    await expect(page.locator('input[type="password"]').first()).toBeVisible();

    // Check for communication preferences
    await expect(page.locator('text=Communication Preferences')).toBeVisible();

    // Check for legal agreements
    await expect(page.locator('text=Privacy Policy')).toBeVisible();
    await expect(page.locator('text=Terms of Service')).toBeVisible();
  });

  test('should show password reset form', async ({ page }) => {
    // Navigate to login
    await page.goto('http://localhost:3001/login');

    // Click forgot password
    await page.click('text=Forgot your password?');

    // Check for reset form
    await expect(page.locator('text=Reset your password')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button:has-text("Send Reset Link")')).toBeVisible();
  });

  test.describe('Admin User Management', () => {
    // These tests would require authentication
    // For now, we'll just verify the admin routes exist

    test('should have admin dashboard route', async ({ page }) => {
      const response = await page.goto('http://localhost:3001/admin/dashboard');
      // Should redirect to login if not authenticated
      expect(response?.status()).toBeLessThan(500);
    });

    test('should have profile route', async ({ page }) => {
      const response = await page.goto('http://localhost:3001/profile');
      // Should redirect to login if not authenticated
      expect(response?.status()).toBeLessThan(500);
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should be responsive on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3001');

      // Navigation should still be accessible
      await expect(page.locator('button:has-text("Login")')).toBeVisible();

      // Navigate to login
      await page.click('button:has-text("Login")');

      // Form should be visible on mobile
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });
  });
});