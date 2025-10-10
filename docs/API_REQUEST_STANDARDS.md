# API Request Standards

**MANDATORY: All API requests MUST follow these patterns. No exceptions.**

---

## Standard Fetch Request Pattern

**ALL fetch requests in this application MUST include:**

1. ✅ **CSRF Token** (for POST/PUT/DELETE)
2. ✅ **Credentials: 'include'** (for authentication cookies)
3. ✅ **Correct API prefix** (`/api/admin/` for admin routes)

---

## ✅ CORRECT Pattern (Copy This)

```typescript
import { addCsrfToken } from '@/utils/csrf';

// For POST/PUT requests
const headers = await addCsrfToken({ 'Content-Type': 'application/json' });

const response = await fetch('/api/admin/resource', {
  method: 'POST', // or 'PUT', 'DELETE'
  headers,
  credentials: 'include', // REQUIRED - sends auth cookies
  body: JSON.stringify(data),
});

if (!response.ok) throw new Error('Failed to save');

const result = await response.json();
```

### For DELETE requests:

```typescript
const headers = await addCsrfToken();

const response = await fetch(`/api/admin/resource/${id}`, {
  method: 'DELETE',
  headers,
  credentials: 'include', // REQUIRED
});

if (!response.ok) throw new Error('Failed to delete');
```

### For GET requests:

```typescript
const response = await fetch('/api/admin/resource', {
  credentials: 'include', // REQUIRED - sends auth cookies
});

if (!response.ok) throw new Error('Failed to fetch');

const data = await response.json();
```

---

## ❌ WRONG Patterns (Never Do This)

```typescript
// ❌ WRONG - Missing credentials
const response = await fetch('/api/admin/resource', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

// ❌ WRONG - Missing CSRF token
const response = await fetch('/api/admin/resource', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify(data),
});

// ❌ WRONG - Missing /admin prefix (for admin routes)
const response = await fetch('/api/trips', {
  method: 'POST',
  // ...
});
```

---

## Common Errors and Solutions

| Error                | Cause               | Solution                                  |
| -------------------- | ------------------- | ----------------------------------------- |
| **403 Forbidden**    | Missing CSRF token  | Add `await addCsrfToken()` to headers     |
| **401 Unauthorized** | Missing credentials | Add `credentials: 'include'`              |
| **404 Not Found**    | Wrong endpoint      | Check for `/admin` prefix on admin routes |

---

## API Endpoint Patterns

### Admin Routes (require authentication)

- ✅ `/api/admin/trips/:id`
- ✅ `/api/admin/trips/:id/events`
- ✅ `/api/admin/events/:id`
- ✅ `/api/admin/resorts`
- ✅ `/api/admin/ships`
- ✅ `/api/admin/talent`
- ✅ `/api/admin/lookup-tables/*`

### Public Routes (no auth required)

- ✅ `/api/trips` (public trip list)
- ✅ `/api/trips/:slug` (public trip details)

---

## Reference Files (Examples of Correct Usage)

Look at these files for correct examples:

- `client/src/utils/csrf.ts` - CSRF token utilities
- `client/src/lib/api-client.ts` - API client wrapper
- `client/src/pages/admin/lookup-tables.tsx` - Multiple fetch examples
- `client/src/pages/admin/trip-detail.tsx` - Trip operations

---

## Quick Checklist

Before writing ANY fetch request, verify:

- [ ] Import: `import { addCsrfToken } from '@/utils/csrf';`
- [ ] Headers: `const headers = await addCsrfToken({ 'Content-Type': 'application/json' });`
- [ ] Credentials: `credentials: 'include'`
- [ ] Endpoint: Correct path with `/admin` prefix for admin routes
- [ ] Error handling: Check `!response.ok`

---

## Why This Matters

1. **CSRF tokens** prevent cross-site request forgery attacks
2. **credentials: 'include'** sends authentication cookies (session/JWT)
3. **Correct endpoints** ensure requests reach the right route handlers

**Missing any of these = Request fails = Frustration**

---

_Last updated: October 2025_
_If you're writing a fetch request and don't see these patterns, STOP and fix it._
