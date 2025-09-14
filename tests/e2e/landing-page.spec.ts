import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('displays trip cards and navigation', async ({ page }) => {
    await page.goto('/');

    // Check navigation banner
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByAltText('Atlantis Events')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Admin' })).toBeVisible();

    // Check time format toggle
    await expect(page.getByText('12h')).toBeVisible();

    // Check that trip cards are loaded
    await expect(page.locator('[data-testid="trip-card"]').first()).toBeVisible();

    // Check that trip images load
    await expect(page.locator('img').first()).toBeVisible();
  });

  test('time format toggle works', async ({ page }) => {
    await page.goto('/');

    const toggle = page.getByRole('switch');
    await expect(toggle).toBeVisible();

    // Should start with 12h format
    await expect(page.getByText('12h')).toBeVisible();

    // Click toggle to switch to 24h
    await toggle.click();
    await expect(page.getByText('24h')).toBeVisible();

    // Click again to switch back to 12h
    await toggle.click();
    await expect(page.getByText('12h')).toBeVisible();
  });

  test('trip cards are clickable and navigate to trip page', async ({ page }) => {
    await page.goto('/');

    // Wait for trip cards to load
    await page.waitForSelector('[data-testid="trip-card"]');

    const firstTripCard = page.locator('[data-testid="trip-card"]').first();
    await expect(firstTripCard).toBeVisible();

    // Click on the first trip card
    await firstTripCard.click();

    // Should navigate to trip page
    await expect(page).toHaveURL(/\/trip\/.+/);
  });

  test('responsive design works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Navigation should still be visible
    await expect(page.locator('header')).toBeVisible();

    // Trip cards should adapt to mobile layout
    await expect(page.locator('[data-testid="trip-card"]').first()).toBeVisible();
  });
});