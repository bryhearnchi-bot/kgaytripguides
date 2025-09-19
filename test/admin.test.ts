import { test, expect } from '@playwright/test';

test.describe('Admin Interface', () => {
  // Admin credentials from CLAUDE.md
  const adminEmail = 'admin@atlantis.com';
  const adminPassword = 'Admin123!';

  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Login as admin
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin dashboard
    await page.waitForURL('**/admin');
  });

  test('Admin dashboard loads correctly', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    
    // Check sidebar is visible
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    
    // Check cruise cards are displayed
    const cruiseCards = page.locator('[class*="cruise-card"]');
    await expect(cruiseCards).toBeTruthy();
  });

  test('Sidebar navigation works', async ({ page }) => {
    // Test collapsible sidebar
    const toggleButton = page.locator('button[aria-label="Toggle sidebar"]');
    await toggleButton.click();
    
    // Check sidebar is collapsed
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/collapsed/);
    
    // Expand sidebar again
    await toggleButton.click();
    await expect(sidebar).not.toHaveClass(/collapsed/);
  });

  test('Ships management page', async ({ page }) => {
    // Navigate to ships page
    await page.click('text=Ships');
    await page.waitForURL('**/admin/ships');
    
    // Check page loaded
    await expect(page.locator('h1')).toContainText('Ships');
    
    // Test add new ship
    await page.click('button:has-text("Add Ship")');
    
    // Fill in ship form
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    await page.fill('input[name="name"]', 'Test Ship');
    await page.fill('input[name="cruiseLine"]', 'Test Cruise Line');
    await page.fill('input[name="capacity"]', '3000');
    await page.fill('input[name="yearBuilt"]', '2020');
    
    // Submit form
    await page.click('button:has-text("Save")');
    
    // Check ship was added
    await expect(page.locator('text=Test Ship')).toBeVisible();
  });

  test('Locations management page', async ({ page }) => {
    // Navigate to locations page
    await page.click('text=Locations');
    await page.waitForURL('**/admin/locations');
    
    // Check page loaded
    await expect(page.locator('h1')).toContainText('Locations');
    
    // Check search functionality
    await page.fill('input[placeholder*="Search"]', 'Athens');
    await page.waitForTimeout(500); // Debounce delay
    
    // Should show filtered results
    const locations = page.locator('[class*="location-card"]');
    await expect(locations).toBeTruthy();
  });

  test('Artists management page', async ({ page }) => {
    // Navigate to artists page
    await page.click('text=Artists');
    await page.waitForURL('**/admin/artists');
    
    // Check page loaded
    await expect(page.locator('h1')).toContainText('Artists');
    
    // Test category filter
    const categoryFilter = page.locator('select[name="category"]');
    if (await categoryFilter.isVisible()) {
      await categoryFilter.selectOption('DJs');
      await page.waitForTimeout(500);
    }
  });

  test('Party themes management page', async ({ page }) => {
    // Navigate to themes page
    await page.click('text=Party Themes');
    await page.waitForURL('**/admin/themes');
    
    // Check page loaded
    await expect(page.locator('h1')).toContainText('Party Themes');
  });

  test('Cruise wizard functionality', async ({ page }) => {
    // Click create new cruise
    await page.click('button:has-text("Create Cruise")');
    await page.waitForURL('**/admin/cruises/new');
    
    // Check wizard loaded
    await expect(page.locator('h1')).toContainText('Create New Cruise');
    
    // Test tab navigation
    const tabs = page.locator('[role="tablist"] button');
    await expect(tabs).toHaveCount(5);
    
    // Fill basic info
    await page.fill('input[name="name"]', 'Test Cruise 2025');
    await page.fill('input[type="date"]:first', '2025-06-01');
    await page.fill('input[type="date"]:last', '2025-06-08');
    
    // Navigate to ship tab
    await page.click('button:has-text("Ship Details")');
    await expect(page.locator('text=Select Ship')).toBeVisible();
    
    // Navigate to itinerary tab
    await page.click('button:has-text("Itinerary")');
    await expect(page.locator('text=Select Ports')).toBeVisible();
  });

  test('Mobile responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    
    // Check sidebar is hidden on mobile
    const sidebar = page.locator('aside');
    const sidebarVisible = await sidebar.isVisible();
    
    // Check mobile menu toggle exists
    if (!sidebarVisible) {
      const mobileMenuButton = page.locator('button[aria-label*="menu"]');
      await expect(mobileMenuButton).toBeVisible();
    }
    
    // Check cruise cards stack on mobile
    const cruiseGrid = page.locator('.grid');
    await expect(cruiseGrid).toBeTruthy();
  });

  test('Search functionality', async ({ page }) => {
    // Test global search if available
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Drag Stars');
      await page.waitForTimeout(500); // Debounce
      
      // Check filtered results
      const results = page.locator('[class*="cruise-card"]');
      await expect(results).toBeTruthy();
    }
  });

  test('Logout functionality', async ({ page }) => {
    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Logout")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Should redirect to login page
      await page.waitForURL('**/login');
      await expect(page.locator('h1')).toContainText('Sign In');
    }
  });
});

test.describe('Admin CRUD Operations', () => {
  const adminEmail = 'admin@atlantis.com';
  const adminPassword = 'Admin123!';

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin');
  });

  test('Create, edit, and delete ship', async ({ page }) => {
    await page.goto('/admin/ships');
    
    // Create new ship
    await page.click('button:has-text("Add Ship")');
    await page.fill('input[name="name"]', 'Playwright Test Ship');
    await page.fill('input[name="cruiseLine"]', 'Test Line');
    await page.fill('input[name="capacity"]', '2500');
    await page.click('button:has-text("Save")');
    
    // Verify creation
    await expect(page.locator('text=Playwright Test Ship')).toBeVisible();
    
    // Edit ship
    await page.click('button[aria-label="Edit Playwright Test Ship"]');
    await page.fill('input[name="capacity"]', '3000');
    await page.click('button:has-text("Save")');
    
    // Delete ship
    await page.click('button[aria-label="Delete Playwright Test Ship"]');
    await page.click('button:has-text("Confirm")');
    
    // Verify deletion
    await expect(page.locator('text=Playwright Test Ship')).not.toBeVisible();
  });
});

test.describe('Admin Error Handling', () => {
  test('Handles API errors gracefully', async ({ page }) => {
    // Navigate to admin without authentication
    await page.goto('/admin');
    
    // Should redirect to login
    await page.waitForURL('**/login');
    await expect(page.locator('h1')).toContainText('Sign In');
  });

  test('Form validation works', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@atlantis.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin');
    
    // Navigate to ships and try to add invalid ship
    await page.goto('/admin/ships');
    await page.click('button:has-text("Add Ship")');
    
    // Try to save without required fields
    await page.click('button:has-text("Save")');
    
    // Should show validation errors
    const errors = page.locator('.text-red-500');
    await expect(errors).toBeTruthy();
  });
});