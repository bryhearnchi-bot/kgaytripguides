## Security Review – K-GAY Travel Guides

- Date: 2025-10-15
- Scope: `server/`, `client/`, `supabase/migrations/`, `client/public/sw.js`, build/config, and secrets usage

### Executive summary

- Overall: Solid foundations (auth middleware, Zod validation, rate limiting, RLS enabled, Supabase Admin only on server). Logging and error handling are well-structured.
- Critical gaps: Unsanitized HTML rendering; permissive CSP in production; unauthenticated debug endpoints exposed in production builds.
- Priority actions: Sanitize HTML, harden CSP (prod), remove/guard debug endpoints, restrict SW caching, separate JWT secrets, standardize rate limiting.

---

### Critical findings (P0 – fix immediately)

1. XSS risk: unsanitized HTML rendered from DB content

- Location: `client/src/components/trip-guide/info-sections/InfoSectionCard.tsx` uses `dangerouslySetInnerHTML` with `section.content` directly.
- Impact: Any stored/reflective XSS in `section.content` executes in user browsers.
- Remediation:
  - Sanitize content on write (server) and on render (client) with allowlist-based sanitizer (e.g., DOMPurify) to remove scripts, event handlers, and `javascript:` URLs.
  - Prefer storing sanitized HTML and track `sanitizedAt`/`sanitizedBy` for audit.

2. CSP allows inline/eval in production

- Location: `server/middleware/security.ts` sets `script-src` with `'unsafe-inline'` and `'unsafe-eval'` unconditionally.
- Impact: XSS becomes far easier to exploit.
- Remediation:
  - Make CSP environment-aware: allow inline/eval in development only; in production remove them and use nonces or hashes for any required inline.
  - Narrow `connect-src`/`img-src`/`media-src` to only necessary origins (API, Supabase storage, same-origin).

3. Unauthenticated debug endpoints in production

- Location: `server/index.ts` exposes `/api/debug/memory` and `/api/debug/paths` in production.
- Impact: Information disclosure (paths, env presence hints), operational footprint.
- Remediation: Remove in production, or guard with `requireAdmin` + rate limiting + feature flag.

---

### High-priority findings (P1)

1. JWT secret reuse

- Location: `server/auth.ts` uses `SESSION_SECRET` for access tokens and as fallback for refresh tokens.
- Risk: Secret reuse complicates rotation and increases blast radius.
- Remediation: Require distinct `JWT_SECRET` and `JWT_REFRESH_SECRET` (fail-fast if missing) and stop reusing `SESSION_SECRET`.

2. Service-role reads for public data

- Pattern: Many public GET endpoints query with Supabase service-role on the server, then filter in code (e.g., excluding drafts).
- Risk: If code filters are altered, drafts or restricted content could be exposed. RLS is enabled but bypassed by service-role.
- Remediation: Prefer anon-key client (server-side instantiation) governed by RLS for public reads, or RPCs with strict policies; keep service-role for admin mutations only.

3. Service Worker caches 3rd-party images broadly

- Location: `client/public/sw.js` caches hosts like `freepik.com` by default.
- Risk: Larger attack and privacy surface; potential cache poisoning.
- Remediation: Restrict image caching to same-origin and Supabase storage domain(s). Remove broad host allowances unless absolutely necessary and vetted.

4. Rate limiting duplication/consistency

- Pattern: A basic limiter exists in `server/middleware/security.ts` while the project already uses `server/middleware/rate-limiting.ts` with richer features.
- Risk: Confusion and uneven protections.
- Remediation: Standardize on `rate-limiting.ts`; plan Redis store for production.

5. Static folders

- Location: `server/routes.ts` serves `/uploads` and `/logos` from local filesystem.
- Risk: If unused or misused, adds surface area.
- Remediation: Remove if unused; otherwise verify contents and explicitly deny dotfiles.

---

### Medium-priority findings (P2)

- Security headers: Add COOP/COEP/CORP and other hardening headers where compatible; a minimal curated Helmet setup for production is acceptable if tuned precisely.
- CSRF: Double-submit implementation is solid and exempted for Bearer flows. Keep `sameSite: 'strict'` and ensure coverage on all cookie-auth state-changing routes (currently handled via route-level middleware).
- Invitation flow: `createUserFromInvitation` is a placeholder. Either finalize Supabase Auth integration or disable endpoint in production.
- CDN headers: `Access-Control-Allow-Origin: *` is set for static assets only (by extension). Keep it scoped to assets; ensure it cannot apply to JSON/API endpoints.
- Validation coverage: Good use of Zod (`validateBody/Params/Query`). Continue adding schemas where any mutation route lacks validation.

---

### Database and RLS review

- RLS is enabled across lookup and join tables (e.g., `venue_types`, `amenities`, `venues`, `resorts`, `trip_section_assignments`). Admin policies typically consult `profiles.role`.
- Recommendations:
  - Prefer a single source of truth for role checks in policies (`profiles.role`) rather than `auth.users.raw_user_meta_data` used in a few places.
  - Ensure `WITH CHECK` clauses exist for insert/update policies (some use only `USING`; be explicit to prevent privilege drift).
  - For public read tables, keep `FOR SELECT USING (true)` as needed; all mutations should be gated by role checks via `profiles` + `auth.uid()`.

---

### Secrets and configuration

- Startup validation is present for critical envs. Strengthen it to:
  - Require `JWT_SECRET` and `JWT_REFRESH_SECRET` (no defaults), distinct from `SESSION_SECRET`.
  - Fail-fast for missing/weak secrets; provide rotation guidance.
- Client only references `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; no service key exposure observed.

---

### PWA/Service Worker

- Manifest/metadata endpoints are JSON-only; no templated HTML injection paths observed.
- Restrict SW caching to same-origin + Supabase storage; avoid caching 3rd-party hosts by default.
- Consider cache versioning/ttl for API GETs that may include sensitive state.

---

### Ready-to-implement remediation examples

1. Strict CSP in production (nonce- or hash-based)

```ts
// server/middleware/security.ts (example pattern)
const isProd = process.env.NODE_ENV === 'production';
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': isProd
    ? ["'self'", 'https:'] // add nonce/sha256 for any inline if required
    : ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https:'],
  'style-src': isProd ? ["'self'", 'https:'] : ["'self'", "'unsafe-inline'", 'https:'],
  'img-src': ["'self'", 'data:', 'https:'], // narrow to Supabase storage if possible
  'connect-src': ["'self'", process.env.SUPABASE_URL || ''],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
};
```

2. Sanitize InfoSection HTML on render (defense-in-depth)

```tsx
// client/src/components/trip-guide/info-sections/InfoSectionCard.tsx (snippet)
import DOMPurify from 'dompurify';

const safeHtml = useMemo(
  () =>
    DOMPurify.sanitize(section.content ?? '', {
      ALLOWED_TAGS: ['p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'br', 'span'],
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
      ALLOW_UNKNOWN_PROTOCOLS: false,
      FORBID_ATTR: ['on*'],
      FORBID_TAGS: ['script', 'style'],
    }),
  [section.content]
);

<div dangerouslySetInnerHTML={{ __html: safeHtml }} />;
```

Also sanitize on write (server) before persisting.

3. Guard or remove debug endpoints in production

```ts
// server/index.ts
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug/memory', ...);
  app.get('/api/debug/paths', ...);
}
// or protect with requireAdmin + rate limiting
```

4. Restrict SW caching to trusted origins

```js
// client/public/sw.js (simplify image rule)
if (request.destination === 'image') {
  const sameOrigin = url.origin === self.location.origin;
  const isSupabase = /\.supabase\.co$/i.test(url.hostname);
  if (sameOrigin || isSupabase) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }
}
```

5. Separate JWT secrets and fail-fast

```ts
// server/auth.ts
const accessSecret = process.env.JWT_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;
if (!accessSecret || !refreshSecret) {
  throw new Error('FATAL: JWT secrets not configured');
}
```

6. Standardize rate limiting

```ts
// Prefer server/middleware/rate-limiting.ts everywhere
// Remove the simpler limiter in server/middleware/security.ts to avoid overlap
```

7. Align RLS policies

- Prefer `profiles.role` checks; add explicit `WITH CHECK` for insert/update policies; keep public `SELECT` only where intended.

---

### Prioritized remediation plan

- P0 (Immediate)
  - Sanitize HTML content (read + write paths).
  - Enforce strict CSP in production (remove `'unsafe-inline'`/`'unsafe-eval'`; adopt nonce/hash).
  - Remove or protect debug endpoints in production.

- P1 (Next)
  - Require distinct `JWT_SECRET` and `JWT_REFRESH_SECRET` (no fallbacks).
  - Restrict SW image caching to same-origin + Supabase storage.
  - Standardize on `rate-limiting.ts` and plan Redis store in prod.
  - For public reads, prefer anon client with RLS or secure RPCs; reserve service-role for admin mutations.
  - Remove `/uploads` if unused; otherwise harden and audit contents.

- P2 (Hardening)
  - Add COOP/COEP/CORP and additional security headers where compatible; optionally use Helmet (prod-only) with tuned config.
  - Align RLS policies across new tables; add `WITH CHECK` clauses.
  - Finalize or disable the invitation flow in production.

---

### Notes

- No exposure of Supabase service-role keys on the client detected.
- Validation coverage is strong; continue to enforce Zod on all mutating endpoints.
- Continue to run `scripts/security-check.sh` and `npm audit` in CI, and schedule regular dependency reviews.
