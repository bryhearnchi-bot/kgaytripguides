import { test, expect, request } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';

test.describe('Admin Users API (smoke CRUD)', () => {
  test.skip(!process.env.PW_ADMIN_EMAIL || !process.env.PW_ADMIN_PASSWORD || !process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_URL, 'Requires admin credentials and Supabase envs');

  let accessToken: string;
  let api;

  test.beforeAll(async () => {
    // Ensure admin user exists using service role (idempotent-ish)
    const supabaseAdmin = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    // Ensure user exists
    const create = await supabaseAdmin.auth.admin.createUser({
      email: process.env.PW_ADMIN_EMAIL as string,
      password: process.env.PW_ADMIN_PASSWORD as string,
      email_confirm: true,
      user_metadata: { role: 'admin' },
    });
    const adminId = create.data?.user?.id;

    // Ensure metadata has role=admin (idempotent)
    try {
      const targetId = adminId || (await (async () => {
        const { data } = await supabaseAdmin.auth.admin.listUsers();
        const u = data.users.find(u => u.email === (process.env.PW_ADMIN_EMAIL as string));
        return u?.id;
      })());
      if (targetId) {
        await supabaseAdmin.auth.admin.updateUserById(targetId, {
          user_metadata: { role: 'admin' },
        });
      }
    } catch {}

    // Now sign-in with anon key
    const supabase = createClient(process.env.VITE_SUPABASE_URL as string, process.env.VITE_SUPABASE_ANON_KEY as string);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: process.env.PW_ADMIN_EMAIL as string,
      password: process.env.PW_ADMIN_PASSWORD as string,
    });
    if (error || !data.session?.access_token) {
      throw new Error(`Failed to sign in admin: ${error?.message}`);
    }
    accessToken = data.session.access_token;
    api = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  });

  test('list users', async () => {
    const res = await api.get('/api/admin/users');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.users)).toBeTruthy();
  });

  test('create, update, delete user', async () => {
    const unique = Date.now();
    const email = `e2e+${unique}@example.com`;
    const createRes = await api.post('/api/admin/users', {
      data: {
        email,
        password: 'TestPassword!1234',
        role: 'viewer',
        name: 'Playwright E2E',
        isActive: true,
      },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    const userId = created.user?.id || created.user?.data?.id || created.user?.user?.id;
    expect(userId).toBeTruthy();

    const updateRes = await api.put(`/api/admin/users/${userId}`, {
      data: {
        name: 'Playwright E2E Updated',
      },
    });
    expect(updateRes.status()).toBe(200);

    const deleteRes = await api.delete(`/api/admin/users/${userId}`);
    expect(deleteRes.status()).toBe(200);
  });
});


