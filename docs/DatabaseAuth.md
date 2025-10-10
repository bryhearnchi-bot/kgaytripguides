# Database Authentication - The ONE True Way

**IF YOU'RE GETTING 401/403 ERRORS, READ THIS FIRST.**

---

## 🚨 THE PROBLEM

**Symptoms:**

- 401 Unauthorized errors
- 403 Forbidden errors
- "Authentication required" in server logs
- "CSRF token missing" errors

**Root Cause:**
You're using raw `fetch()` instead of the `api` client.

---

## ✅ THE SOLUTION (Copy This)

**ALWAYS use the `api` client from `@/lib/api-client`:**

```typescript
import { api } from '@/lib/api-client';

// POST request
const response = await api.post('/api/admin/trips/69/events', eventData);
if (!response.ok) throw new Error('Failed to save');
const result = await response.json();

// PUT request
const response = await api.put(`/api/admin/events/${id}`, eventData);

// DELETE request
const response = await api.delete(`/api/admin/events/${id}`);

// GET request
const response = await api.get('/api/admin/trips');
```

**That's it. This handles EVERYTHING automatically:**

- ✅ Supabase session token
- ✅ Authorization header (`Bearer <token>`)
- ✅ CSRF token
- ✅ credentials: 'include'
- ✅ Content-Type headers

---

## ❌ NEVER DO THIS

```typescript
// ❌ WRONG - Raw fetch without auth
const response = await fetch('/api/admin/trips/69/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

// ❌ WRONG - Manual CSRF token but missing Supabase auth
const headers = await addCsrfToken({ 'Content-Type': 'application/json' });
const response = await fetch('/api/admin/trips/69/events', {
  method: 'POST',
  headers,
  credentials: 'include',
  body: JSON.stringify(data),
});

// ❌ WRONG - Everything except Supabase token
const headers = await addCsrfToken({ 'Content-Type': 'application/json' });
const response = await fetch('/api/admin/trips/69/events', {
  method: 'POST',
  headers,
  credentials: 'include',
  body: JSON.stringify(data),
});
```

**Why these fail:**

- Missing `Authorization: Bearer <supabase-token>` header
- Server's `requireAuth` middleware checks for this token
- Without it, you get 401 Unauthorized

---

## How Authentication Works

**Server-side (`server/auth.ts:83-91`):**

```typescript
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7) // ← Gets token from header
    : req.cookies?.accessToken; // ← Or from cookie

  if (!token) {
    throw ApiError.unauthorized('Authentication required'); // ← THIS IS YOUR ERROR
  }
  // ... validates token with Supabase
}
```

**The `api` client (`client/src/lib/api-client.ts:20-58`):**

```typescript
export async function apiClient(url: string, options = {}) {
  // 1. Get Supabase session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 2. Build headers with auth token
  const requestHeaders = {
    ...headers,
    'Content-Type': 'application/json',
  };

  // 3. Add Authorization header ← THIS IS THE CRITICAL PART
  if (requireAuth && session?.access_token) {
    requestHeaders['Authorization'] = `Bearer ${session.access_token}`;
  }

  // 4. Make request with credentials
  return fetch(url, {
    ...options,
    headers: requestHeaders,
    credentials: 'include',
  });
}
```

---

## Real-World Example

**From `TripWizardContext.tsx` (CORRECT):**

```typescript
import { api } from '@/lib/api-client';

const addEvent = async (event: any) => {
  const tripId = state.tripData.id;
  if (!tripId) throw new Error('No trip ID available');

  const response = await api.post(`/api/admin/trips/${tripId}/events`, event);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add event: ${response.status} ${errorText}`);
  }

  const newEvent = await response.json();
  setState(prev => ({
    ...prev,
    events: [...(prev.events || []), newEvent],
  }));
};
```

**What this does:**

1. Calls `api.post()` which wraps `apiClient()`
2. `apiClient()` gets Supabase session
3. Adds `Authorization: Bearer <token>` header
4. Adds CSRF token automatically
5. Server validates token via `requireAuth` middleware
6. Request succeeds ✅

---

## Reference Files

**Good examples (copy these patterns):**

- `client/src/lib/api-client.ts` - The API client
- `client/src/pages/admin/lookup-tables.tsx` - Uses `api.post()`
- `client/src/components/admin/PartyManagement.tsx` - Uses `api.put()`

**Server auth logic:**

- `server/auth.ts` - Authentication middleware
- `server/routes/admin/events.ts` - Protected route example

---

## Quick Debugging

**If you're still getting 401/403:**

1. **Check browser console:**
   - Look for the request in Network tab
   - Check Request Headers
   - Verify `Authorization: Bearer <token>` is present

2. **Check server logs:**
   - Look for "Authentication required" message
   - Check if token validation failed

3. **Verify you're logged in:**
   ```typescript
   import { supabase } from '@/lib/supabase';
   const {
     data: { session },
   } = await supabase.auth.getSession();
   console.log('Session:', session); // Should have access_token
   ```

---

## Summary

**DO THIS:**

```typescript
import { api } from '@/lib/api-client';
const response = await api.post('/api/admin/resource', data);
```

**NOT THIS:**

```typescript
const response = await fetch('/api/admin/resource', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
```

**That's it. Use `api` client. Always. End of story.**

---

_Last updated: October 2025_
_Next time you get 401/403, come here first. Don't waste time debugging._
