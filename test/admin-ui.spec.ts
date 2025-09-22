import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';

test.describe('Admin UI login (mock-safe)', () => {
  test.skip(!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY || !process.env.PW_ADMIN_EMAIL || !process.env.PW_ADMIN_PASSWORD, 'Supabase env and admin creds required');

  test('login via Supabase UI and reach admin dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Fill email & password in Supabase Auth UI
    await page.getByLabel(/email/i).fill(process.env.PW_ADMIN_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.PW_ADMIN_PASSWORD!);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    // Expect redirect to admin dashboard route even in mock mode
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });

    // Minimal assertion that page shell loaded (avoid data-fetching specifics in mock mode)
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });
});


