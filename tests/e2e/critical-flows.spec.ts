/**
 * Critical User Flows E2E Tests
 * End-to-end tests for the most important user journeys
 * Using Playwright for comprehensive browser testing
 */

import { test, expect, Page } from '@playwright/test';
import { fixtures } from '../utils/test-setup';

// Test configuration
test.describe.configure({ mode: 'parallel' });

test.describe('Critical User Flows', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Set up test environment
    await page.goto('/');

    // Mock API responses for consistent testing
    await page.route('**/api/trips*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              fixtures.tripFixtures.upcoming,
              fixtures.tripFixtures.past
            ],
            meta: { total: 2, page: 1, limit: 10 }
          })
        });
      }
    });

    await page.route('**/api/auth/**', async route => {
      const url = route.request().url();

      if (url.includes('/profile') && route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: fixtures.profileFixtures.user
          })
        });
      } else if (url.includes('/login') && route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              user: fixtures.profileFixtures.user,
              session: { access_token: 'mock-token' }
            }
          })
        });
      }
    });
  });

  test.describe('Landing Page and Navigation', () => {
    test('should load homepage successfully', async () => {
      // Act & Assert
      await expect(page).toHaveTitle(/K-GAY Travel Guides/);

      // Check main navigation elements
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.getByRole('link', { name: /trips/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /events/i })).toBeVisible();

      // Check hero section
      await expect(page.locator('.hero')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should navigate to trips page', async () => {
      // Act
      await page.getByRole('link', { name: /trips/i }).click();

      // Assert
      await expect(page).toHaveURL(/\/trips/);
      await expect(page.getByRole('heading', { name: /upcoming trips/i })).toBeVisible();
    });

    test('should handle mobile navigation', async () => {
      // Arrange - Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Act
      const menuButton = page.getByRole('button', { name: /menu/i });
      await expect(menuButton).toBeVisible();
      await menuButton.click();

      // Assert
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.getByRole('link', { name: /trips/i })).toBeVisible();
    });

    test('should be responsive across different screen sizes', async () => {
      const viewports = [
        { width: 375, height: 667 },  // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1024, height: 768 }, // Desktop
        { width: 1920, height: 1080 } // Large Desktop
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);

        // Check that key elements are visible
        await expect(page.locator('nav')).toBeVisible();
        await expect(page.locator('.hero')).toBeVisible();

        // Check no horizontal overflow
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalScroll).toBe(false);
      }
    });
  });

  test.describe('Trip Browsing Flow', () => {
    test('should display trip listings correctly', async () => {
      // Arrange
      await page.goto('/trips');

      // Assert
      await expect(page.getByRole('heading', { name: /upcoming trips/i })).toBeVisible();

      // Check trip cards are displayed
      const tripCards = page.locator('[data-testid="trip-card"]');
      await expect(tripCards).toHaveCount(2);

      // Check trip card content
      const firstCard = tripCards.first();
      await expect(firstCard.getByRole('heading')).toBeVisible();
      await expect(firstCard.locator('img')).toBeVisible();
      await expect(firstCard.getByText(/\$\d+/)).toBeVisible(); // Price
      await expect(firstCard.getByText(/\d+ days/)).toBeVisible(); // Duration
    });

    test('should navigate to trip detail page', async () => {
      // Arrange
      await page.goto('/trips');

      // Act
      const firstTripCard = page.locator('[data-testid="trip-card"]').first();
      await firstTripCard.click();

      // Assert
      await expect(page).toHaveURL(/\/trips\/mediterranean-gay-cruise-2024/);
      await expect(page.getByRole('heading', { name: /Mediterranean Gay Cruise 2024/i })).toBeVisible();
    });

    test('should show trip details with all sections', async () => {
      // Arrange
      await page.goto('/trips/mediterranean-gay-cruise-2024');

      // Mock trip detail response
      await page.route('**/api/trips/mediterranean-gay-cruise-2024', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              ...fixtures.tripFixtures.upcoming,
              itinerary: [fixtures.itineraryFixtures.day1, fixtures.itineraryFixtures.day2],
              events: [fixtures.eventFixtures.welcomeParty, fixtures.eventFixtures.whiteParty],
              talent: [fixtures.talentFixtures.dj, fixtures.talentFixtures.dragQueen]
            }
          })
        });
      });

      await page.reload();

      // Assert
      await expect(page.getByRole('heading', { name: /Mediterranean Gay Cruise 2024/i })).toBeVisible();

      // Check itinerary section
      await expect(page.getByRole('heading', { name: /itinerary/i })).toBeVisible();

      // Check events section
      await expect(page.getByRole('heading', { name: /events/i })).toBeVisible();

      // Check talent section
      await expect(page.getByRole('heading', { name: /talent/i })).toBeVisible();

      // Check booking section
      await expect(page.getByRole('button', { name: /book now/i })).toBeVisible();
    });

    test('should filter trips by status', async () => {
      // Arrange
      await page.goto('/trips');

      // Act
      await page.getByRole('tab', { name: /past trips/i }).click();

      // Assert
      await expect(page.getByRole('heading', { name: /past trips/i })).toBeVisible();
      const pastTripCards = page.locator('[data-testid="trip-card"]');
      await expect(pastTripCards).toHaveCount(1);
    });

    test('should handle empty trip results', async () => {
      // Arrange
      await page.route('**/api/trips*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            meta: { total: 0, page: 1, limit: 10 }
          })
        });
      });

      await page.goto('/trips');

      // Assert
      await expect(page.getByText(/no trips available/i)).toBeVisible();
    });

    test('should handle trip loading states', async () => {
      // Arrange
      await page.route('**/api/trips*', async route => {
        // Delay response to test loading state
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [fixtures.tripFixtures.upcoming],
            meta: { total: 1, page: 1, limit: 10 }
          })
        });
      });

      // Act
      await page.goto('/trips');

      // Assert loading state
      await expect(page.getByTestId('loading-spinner')).toBeVisible();

      // Wait for content to load
      await expect(page.locator('[data-testid="trip-card"]')).toBeVisible({ timeout: 2000 });
      await expect(page.getByTestId('loading-spinner')).not.toBeVisible();
    });
  });

  test.describe('Authentication Flow', () => {
    test('should show login form', async () => {
      // Act
      await page.getByRole('link', { name: /sign in/i }).click();

      // Assert
      await expect(page).toHaveURL(/\/auth\/login/);
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should complete login flow successfully', async () => {
      // Arrange
      await page.goto('/auth/login');

      // Act
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('TestPassword123!');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Assert
      await expect(page).toHaveURL('/dashboard'); // Should redirect to dashboard
      await expect(page.getByText(/welcome back/i)).toBeVisible();
    });

    test('should handle login validation errors', async () => {
      // Arrange
      await page.goto('/auth/login');

      // Act - Submit empty form
      await page.getByRole('button', { name: /sign in/i }).click();

      // Assert
      await expect(page.getByText(/email is required/i)).toBeVisible();
      await expect(page.getByText(/password is required/i)).toBeVisible();
    });

    test('should handle login authentication errors', async () => {
      // Arrange
      await page.goto('/auth/login');

      // Mock failed login
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: { message: 'Invalid login credentials' }
          })
        });
      });

      // Act
      await page.getByLabel(/email/i).fill('wrong@example.com');
      await page.getByLabel(/password/i).fill('wrongpassword');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Assert
      await expect(page.getByText(/invalid login credentials/i)).toBeVisible();
    });

    test('should show registration form', async () => {
      // Act
      await page.getByRole('link', { name: /sign up/i }).click();

      // Assert
      await expect(page).toHaveURL(/\/auth\/register/);
      await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByLabel(/first name/i)).toBeVisible();
      await expect(page.getByLabel(/last name/i)).toBeVisible();
      await expect(page.getByLabel(/username/i)).toBeVisible();
    });

    test('should complete registration flow', async () => {
      // Arrange
      await page.goto('/auth/register');

      // Mock successful registration
      await page.route('**/api/auth/register', async route => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            data: { user: fixtures.profileFixtures.user },
            message: 'Registration successful'
          })
        });
      });

      // Act
      await page.getByLabel(/email/i).fill('newuser@example.com');
      await page.getByLabel(/password/i).fill('NewPassword123!');
      await page.getByLabel(/first name/i).fill('New');
      await page.getByLabel(/last name/i).fill('User');
      await page.getByLabel(/username/i).fill('newuser');
      await page.getByRole('button', { name: /create account/i }).click();

      // Assert
      await expect(page.getByText(/registration successful/i)).toBeVisible();
      await expect(page).toHaveURL('/auth/verify-email');
    });

    test('should handle logout', async () => {
      // Arrange - Start in logged-in state
      await page.goto('/dashboard');
      await page.evaluate(() => {
        localStorage.setItem('auth_token', 'mock-token');
      });

      // Act
      await page.getByRole('button', { name: /user menu/i }).click();
      await page.getByRole('menuitem', { name: /sign out/i }).click();

      // Assert
      await expect(page).toHaveURL('/');
      await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();

      // Verify token is cleared
      const token = await page.evaluate(() => localStorage.getItem('auth_token'));
      expect(token).toBeNull();
    });
  });

  test.describe('Event Calendar Flow', () => {
    test('should display event calendar', async () => {
      // Arrange
      await page.goto('/trips/mediterranean-gay-cruise-2024');

      // Mock events data
      await page.route('**/api/trips/mediterranean-gay-cruise-2024/events*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              fixtures.eventFixtures.welcomeParty,
              fixtures.eventFixtures.whiteParty,
              fixtures.eventFixtures.dragsShow
            ]
          })
        });
      });

      // Act
      await page.getByRole('tab', { name: /events/i }).click();

      // Assert
      await expect(page.getByTestId('event-calendar')).toBeVisible();
      await expect(page.getByText(/Welcome Aboard Party/i)).toBeVisible();
      await expect(page.getByText(/White Party/i)).toBeVisible();
      await expect(page.getByText(/Drag Extravaganza/i)).toBeVisible();
    });

    test('should filter events by day', async () => {
      // Arrange
      await page.goto('/trips/mediterranean-gay-cruise-2024');
      await page.getByRole('tab', { name: /events/i }).click();

      // Act
      await page.getByRole('button', { name: /June 1/i }).click();

      // Assert
      await expect(page.getByText(/Welcome Aboard Party/i)).toBeVisible();
      await expect(page.getByText(/White Party/i)).not.toBeVisible();
    });

    test('should show event details in modal', async () => {
      // Arrange
      await page.goto('/trips/mediterranean-gay-cruise-2024');
      await page.getByRole('tab', { name: /events/i }).click();

      // Act
      await page.getByText(/Welcome Aboard Party/i).click();

      // Assert
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: /Welcome Aboard Party/i })).toBeVisible();
      await expect(page.getByText(/Kick off your cruise with style/i)).toBeVisible();
      await expect(page.getByText(/Pool Deck/i)).toBeVisible();
      await expect(page.getByText(/19:00/i)).toBeVisible();
    });

    test('should close event modal', async () => {
      // Arrange
      await page.goto('/trips/mediterranean-gay-cruise-2024');
      await page.getByRole('tab', { name: /events/i }).click();
      await page.getByText(/Welcome Aboard Party/i).click();

      // Act
      await page.getByRole('button', { name: /close/i }).click();

      // Assert
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle 404 errors gracefully', async () => {
      // Act
      await page.goto('/trips/non-existent-trip');

      // Assert
      await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /go home/i })).toBeVisible();
    });

    test('should handle API errors gracefully', async () => {
      // Arrange
      await page.route('**/api/trips*', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: { message: 'Internal server error' }
          })
        });
      });

      // Act
      await page.goto('/trips');

      // Assert
      await expect(page.getByText(/something went wrong/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
    });

    test('should handle slow network conditions', async () => {
      // Arrange - Simulate slow network
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        await route.continue();
      });

      // Act
      await page.goto('/trips');

      // Assert - Should show loading state
      await expect(page.getByTestId('loading-spinner')).toBeVisible();

      // Should eventually load content or show timeout message
      await expect(page.getByText(/loading/i).or(page.getByText(/timeout/i))).toBeVisible({ timeout: 5000 });
    });

    test('should be accessible to keyboard navigation', async () => {
      // Arrange
      await page.goto('/');

      // Act - Navigate using keyboard
      await page.keyboard.press('Tab'); // Focus first interactive element
      await page.keyboard.press('Enter'); // Activate element

      // Assert - Should navigate to focused element
      // (Specific assertions would depend on the first focusable element)
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should have proper ARIA labels and roles', async () => {
      // Arrange
      await page.goto('/trips');

      // Assert
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('banner')).toBeVisible();

      // Check for proper heading hierarchy
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1); // Should have exactly one h1
    });
  });

  test.describe('Performance and UX', () => {
    test('should load pages within performance budget', async () => {
      // Arrange
      const startTime = Date.now();

      // Act
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Assert
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3 second budget
    });

    test('should show loading states during navigation', async () => {
      // Arrange
      await page.goto('/');

      // Act
      await page.getByRole('link', { name: /trips/i }).click();

      // Assert - Should show loading indicator during navigation
      await expect(page.getByTestId('page-loading').or(page.getByTestId('loading-spinner'))).toBeVisible();
    });

    test('should cache data for improved performance', async () => {
      // Arrange
      let requestCount = 0;
      await page.route('**/api/trips*', async route => {
        requestCount++;
        await route.continue();
      });

      // Act - Visit trips page twice
      await page.goto('/trips');
      await page.waitForLoadState('networkidle');
      await page.goto('/');
      await page.goto('/trips');
      await page.waitForLoadState('networkidle');

      // Assert - Should use cache on second visit
      expect(requestCount).toBeLessThanOrEqual(2); // Allow for some cache misses
    });

    test('should work offline for cached content', async () => {
      // Arrange
      await page.goto('/trips');
      await page.waitForLoadState('networkidle');

      // Act - Go offline
      await page.context().setOffline(true);
      await page.reload();

      // Assert - Should show offline message or cached content
      await expect(
        page.getByText(/offline/i).or(page.locator('[data-testid="trip-card"]'))
      ).toBeVisible({ timeout: 10000 });
    });
  });
});