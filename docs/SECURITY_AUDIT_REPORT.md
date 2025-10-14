# Security Audit Report - K-GAY Travel Guides

**Date:** September 29, 2025
**Auditor:** Security Audit Team
**Application:** K-GAY Travel Guides (Atlantis Events)

---

## Executive Summary

This comprehensive security audit has identified multiple critical vulnerabilities that require immediate attention. The most severe issues include **hardcoded credentials in package.json** and **fallback hardcoded credentials in authentication code**.

### Severity Distribution:

- **CRITICAL:** 2 issues
- **HIGH:** 5 issues
- **MEDIUM:** 8 issues
- **LOW:** 4 issues

---

## CRITICAL VULNERABILITIES

### 1. Hardcoded Supabase Credentials in package.json

**Severity:** CRITICAL
**File:** `/package.json:11`
**Impact:** Complete database compromise, unauthorized data access, data manipulation

**Issue:**

```json
"dev": "SUPABASE_URL=https://bxiiodeyqvqqcgzzqzvt.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aWlvZGV5cXZxcWNnenpxenZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk2NzAyOSwiZXhwIjoyMDczNTQzMDI5fQ.q-doRMuntNVc7aigqBsdxQXMwuCWABDRnJnsSQV0oK0 DATABASE_URL=postgresql://postgres:qRlGhCf4xnNXCeBF@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres NODE_ENV=development tsx server/index.ts"
```

**Immediate Fix Required:**

```json
// package.json
"dev": "tsx server/index.ts"
```

Create `.env` file:

```bash
SUPABASE_URL=https://bxiiodeyqvqqcgzzqzvt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<rotate-this-key-immediately>
DATABASE_URL=postgresql://postgres:<change-password>@db.bxiiodeyqvqqcgzzqzvt.supabase.co:6543/postgres
```

### 2. Hardcoded Fallback Credentials

**Severity:** CRITICAL
**Files:**

- `/server/auth.ts:8-9` - JWT secrets with fallbacks
- `/server/auth.ts:85-86` - Supabase URLs and keys with fallbacks
- `/server/middleware/csrf.ts:54` - CSRF secret with fallback

**Issue:**

```typescript
// server/auth.ts
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';

// Lines 85-86
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://bxiiodeyqvqqcgzzqzvt.supabase.co';
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Fix:**

```typescript
// server/auth.ts
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET not configured');
  process.exit(1);
}

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (!JWT_REFRESH_SECRET) {
  console.error('FATAL: JWT_REFRESH_SECRET not configured');
  process.exit(1);
}

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('FATAL: Supabase configuration missing');
  process.exit(1);
}
```

---

## HIGH SEVERITY ISSUES

### 3. CSRF Protection Not Consistently Applied

**Severity:** HIGH
**Files:** `/server/routes.ts:35-60`, `/server/routes/csrf-route.ts`
**Impact:** Cross-Site Request Forgery attacks possible

**Issue:**

- CSRF middleware conditionally applied based on Bearer token presence
- Weak CSRF token generation using Math.random()
- No CSRF protection for cookie-based sessions on some routes

**Fix:**

```typescript
// server/routes/csrf-route.ts
import crypto from 'crypto';

router.get('/api/csrf-token', (req, res) => {
  const existingToken = req.cookies?._csrf;

  if (existingToken && verifyTokenNotExpired(existingToken)) {
    return res.json({ csrfToken: existingToken, headerName: 'x-csrf-token' });
  }

  // Generate cryptographically secure token
  const token = crypto.randomBytes(32).toString('hex');

  res.cookie('_csrf', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000,
  });

  res.json({ csrfToken: token, headerName: 'x-csrf-token' });
});
```

### 4. Console.log Statements in Production Code

**Severity:** HIGH
**Count:** 131 in server, 45 in client
**Impact:** Information disclosure, performance impact

**Fix:** Replace all console.log with proper logging:

```typescript
// Use logger service instead
import { logger } from '@/lib/logger';
logger.info('User action', { userId, action });

// Never log sensitive data
// BAD: console.log('Password:', password);
// GOOD: logger.info('Authentication attempt', { userId });
```

### 5. Missing Environment Variable Validation

**Severity:** HIGH
**Multiple files using process.env without validation**
**Impact:** Runtime errors, security vulnerabilities

**Fix:** Create environment validation module:

```typescript
// server/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CSRF_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
  PORT: z.string().regex(/^\d+$/).transform(Number).optional().default('3001'),
});

export const env = envSchema.parse(process.env);
```

### 6. XSS Vulnerability - innerHTML Usage

**Severity:** HIGH
**Files:** `/client/src/main.tsx:64,86`
**Impact:** Cross-site scripting attacks

**Issue:**

```typescript
// main.tsx:64
notification.innerHTML = `...user controlled content...`;
```

**Fix:**

```typescript
// Use DOM methods instead
notification.textContent = message;
// Or use a safe templating library
```

### 7. Rate Limiting Uses In-Memory Store

**Severity:** HIGH (Production), LOW (Development)
**File:** `/server/middleware/rate-limiting.ts`
**Impact:** Rate limiting bypass on server restart, memory exhaustion

**Fix:** Implement Redis store for production:

```typescript
// server/config/redis.ts
import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: times => Math.min(times * 50, 2000),
});
```

---

## MEDIUM SEVERITY ISSUES

### 8. Weak Error Handling Exposes Stack Traces

**Severity:** MEDIUM
**File:** `/server/utils/ApiError.ts:191-193`
**Impact:** Information disclosure

**Issue:** Stack traces included in development responses

**Fix:**

```typescript
// Never include stack traces in production
toJSON() {
  const response: any = {
    error: {
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
    }
  };

  // Remove stack traces in production
  if (process.env.NODE_ENV === 'development' && this.stack) {
    response.error.stack = this.stack.split('\n').slice(0, 3); // Limit stack trace
  }

  return response;
}
```

### 9. Insufficient Input Validation

**Severity:** MEDIUM
**Impact:** Data integrity issues, potential injection attacks

**Fix:** Implement comprehensive validation middleware:

```typescript
// server/middleware/validation.ts
import { z } from 'zod';

export function validateRequest(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      req.body = validated.body || req.body;
      req.query = validated.query || req.query;
      req.params = validated.params || req.params;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}
```

### 10. CSP Headers Too Permissive

**Severity:** MEDIUM
**File:** `/server/middleware/security.ts`
**Impact:** XSS attacks possible

**Issue:** `unsafe-inline` and `unsafe-eval` allowed

**Fix for production:**

```typescript
const cspDirectives =
  process.env.NODE_ENV === 'production'
    ? {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'nonce-{NONCE}'"], // Use nonces
        'style-src': ["'self'", "'nonce-{NONCE}'"],
        'img-src': ["'self'", 'data:', 'https://bxiiodeyqvqqcgzzqzvt.supabase.co'],
        'connect-src': ["'self'", 'https://bxiiodeyqvqqcgzzqzvt.supabase.co'],
        'font-src': ["'self'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': [],
      }
    : existingDevConfig;
```

### 11. Session Management Issues

**Severity:** MEDIUM
**Impact:** Session hijacking, fixation attacks

**Fix:** Implement proper session management:

```typescript
// server/middleware/session.ts
import session from 'express-session';
import RedisStore from 'connect-redis';

export const sessionMiddleware = session({
  store: new RedisStore({ client: redis }),
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    sameSite: 'strict',
  },
  name: 'sessionId', // Don't use default name
  genid: () => crypto.randomUUID(), // Secure ID generation
});
```

### 12. Missing Security Headers

**Severity:** MEDIUM
**Impact:** Various attacks possible

**Add additional headers:**

```typescript
// server/middleware/security.ts
res.setHeader('X-DNS-Prefetch-Control', 'off');
res.setHeader('X-Download-Options', 'noopen');
res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
res.setHeader('Origin-Agent-Cluster', '?1');
res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
```

### 13. No Request Size Limits

**Severity:** MEDIUM
**Impact:** DoS attacks, memory exhaustion

**Fix:**

```typescript
// server/index.ts
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// For file uploads
import multer from 'multer';
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10,
  },
});
```

### 14. Database Connection String Exposed

**Severity:** MEDIUM
**Impact:** Database credentials visible in logs/errors

**Fix:** Use connection pooling with proper error handling:

```typescript
// server/database/connection.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', err => {
  logger.error('Database pool error', {
    error: err.message, // Don't log full error object
  });
});
```

### 15. Missing API Versioning Strategy

**Severity:** MEDIUM
**Impact:** Breaking changes affect all clients

**Current implementation exists but needs improvement:**

```typescript
// Enhance existing versioning middleware
app.use('/api/v2', v2Routes);
app.use('/api/v1', v1Routes); // Maintain backward compatibility
```

---

## LOW SEVERITY ISSUES

### 16. Cookies Without Secure Attributes

**Severity:** LOW (Dev), HIGH (Prod)
**Impact:** Cookie hijacking in production

**Fix:** Already handled conditionally but verify in production:

```typescript
secure: process.env.NODE_ENV === 'production';
```

### 17. Missing Request ID for Tracing

**Severity:** LOW
**Impact:** Difficult debugging and monitoring

**Fix:**

```typescript
// server/middleware/requestId.ts
import { v4 as uuidv4 } from 'uuid';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};
```

### 18. No Security.txt File

**Severity:** LOW
**Impact:** Security researchers cannot report vulnerabilities

**Fix:** Create `/public/.well-known/security.txt`:

```
Contact: security@atlantisevents.com
Expires: 2026-12-31T23:59:59.000Z
Preferred-Languages: en
Canonical: https://atlantisevents.com/.well-known/security.txt
```

### 19. Missing Dependency Vulnerability Scanning

**Severity:** LOW
**Impact:** Using vulnerable dependencies

**Fix:** Add to package.json:

```json
"scripts": {
  "security:audit": "npm audit --audit-level=moderate",
  "security:fix": "npm audit fix",
  "security:check": "npm run security:audit && snyk test"
}
```

---

## IMMEDIATE ACTION PLAN

### Priority 1 (Do Immediately):

1. **Remove ALL hardcoded credentials from package.json**
2. **Rotate all exposed keys and passwords**
3. **Remove fallback credentials from code**
4. **Implement fail-fast for missing environment variables**

### Priority 2 (Within 24 hours):

1. Replace all console.log with logger service
2. Fix XSS vulnerabilities (innerHTML usage)
3. Strengthen CSRF token generation
4. Add input validation to all endpoints

### Priority 3 (Within 1 week):

1. Implement Redis for rate limiting and sessions
2. Tighten CSP headers for production
3. Add comprehensive security headers
4. Set up dependency vulnerability scanning

### Priority 4 (Within 1 month):

1. Implement request tracing
2. Add security.txt file
3. Set up automated security testing in CI/CD
4. Conduct penetration testing

---

## Security Checklist for Developers

Before each deployment, verify:

- [ ] No hardcoded secrets in code
- [ ] All environment variables validated on startup
- [ ] No console.log statements in production code
- [ ] All user inputs validated with Zod
- [ ] CSRF protection enabled on state-changing endpoints
- [ ] Rate limiting configured appropriately
- [ ] Security headers properly set
- [ ] Error messages don't leak sensitive information
- [ ] Dependencies scanned for vulnerabilities
- [ ] Authentication required on admin endpoints
- [ ] Database queries use parameterization
- [ ] File uploads have size and type restrictions

---

## Monitoring & Alerting

Implement monitoring for:

- Failed authentication attempts (> 5 per minute)
- Rate limit violations (track by IP)
- 500 errors (immediate alert)
- Large request payloads (> 10MB)
- Suspicious patterns (SQL injection attempts)
- CSRF token failures

---

## Compliance Considerations

Ensure compliance with:

- GDPR (data protection)
- PCI DSS (if handling payments)
- CCPA (California privacy)
- LGPD (Brazil privacy)
- SOC 2 Type II (if required by enterprise clients)

---

## Conclusion

The application has a solid security foundation but requires immediate attention to critical issues, particularly the hardcoded credentials. Implementing the fixes in priority order will significantly improve the security posture.

**Next Steps:**

1. Rotate all compromised credentials immediately
2. Implement Priority 1 fixes today
3. Schedule security review after fixes
4. Consider security audit by external firm

---

_Report generated by Security Audit Team_
_For questions, contact: security@atlantisevents.com_
