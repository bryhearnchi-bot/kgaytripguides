import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

// CSRF Token Store (in production, use Redis or database)
interface CSRFTokenStore {
  get(sessionId: string): Promise<string | null>;
  set(sessionId: string, token: string, ttl?: number): Promise<void>;
  delete(sessionId: string): Promise<void>;
}

// In-memory store for development
class InMemoryCSRFStore implements CSRFTokenStore {
  private store = new Map<string, { token: string; expires: number }>();

  async get(sessionId: string): Promise<string | null> {
    const entry = this.store.get(sessionId);
    if (!entry || entry.expires < Date.now()) {
      this.store.delete(sessionId);
      return null;
    }
    return entry.token;
  }

  async set(sessionId: string, token: string, ttl = 3600000): Promise<void> {
    this.store.set(sessionId, {
      token,
      expires: Date.now() + ttl
    });
  }

  async delete(sessionId: string): Promise<void> {
    this.store.delete(sessionId);
  }
}

// CSRF Configuration
interface CSRFConfig {
  tokenStore?: CSRFTokenStore;
  tokenHeader?: string;
  cookieName?: string;
  ignoreMethods?: string[];
  secret?: string;
  sessionKey?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

const defaultConfig: Required<CSRFConfig> = {
  tokenStore: new InMemoryCSRFStore(),
  tokenHeader: 'x-csrf-token',
  cookieName: '_csrf',
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  secret: process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
  sessionKey: 'sessionId',
  httpOnly: false, // Allow JS access for AJAX requests
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
};

// Generate cryptographically secure token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Create HMAC hash for token validation
function createTokenHash(token: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(token).digest('hex');
}

// Verify token hash
function verifyToken(token: string, hash: string, secret: string): boolean {
  const expectedHash = createTokenHash(token, secret);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
}

// Get session ID from request
function getSessionId(req: Request, sessionKey: string): string {
  // Try to get from user session first
  const user = (req as any).user;
  if (user?.id) {
    return `user:${user.id}`;
  }

  // Fall back to IP + User-Agent for anonymous sessions
  const userAgent = req.get('User-Agent') || 'unknown';
  return crypto.createHash('sha256')
    .update(`${req.ip}:${userAgent}`)
    .digest('hex');
}

// CSRF Protection Middleware
export function csrfProtection(config: CSRFConfig = {}) {
  const finalConfig = { ...defaultConfig, ...config };

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = getSessionId(req, finalConfig.sessionKey);
      const method = req.method.toUpperCase();

      // Skip CSRF check for safe methods
      if (finalConfig.ignoreMethods.includes(method)) {
        // Generate and set token for safe methods
        await generateAndSetToken(req, res, sessionId, finalConfig);
        return next();
      }

      // Check for CSRF token in unsafe methods
      const tokenFromHeader = req.get(finalConfig.tokenHeader);
      const tokenFromBody = req.body?._csrf;
      const tokenFromQuery = req.query._csrf as string;

      const providedToken = tokenFromHeader || tokenFromBody || tokenFromQuery;

      if (!providedToken) {
        return res.status(403).json({
          error: 'CSRF token missing',
          message: 'CSRF token required for this request'
        });
      }

      // Verify token
      const storedTokenHash = await finalConfig.tokenStore.get(sessionId);
      if (!storedTokenHash || !verifyToken(providedToken, storedTokenHash, finalConfig.secret)) {
        return res.status(403).json({
          error: 'CSRF token invalid',
          message: 'Invalid or expired CSRF token'
        });
      }

      // Token is valid, continue
      next();
    } catch (error) {
      console.error('CSRF protection error:', error);
      res.status(500).json({
        error: 'CSRF protection error',
        message: 'Internal error during CSRF validation'
      });
    }
  };
}

// Generate and set CSRF token
async function generateAndSetToken(
  req: Request,
  res: Response,
  sessionId: string,
  config: Required<CSRFConfig>
) {
  const token = generateToken();
  const tokenHash = createTokenHash(token, config.secret);

  // Store token hash
  await config.tokenStore.set(sessionId, tokenHash);

  // Set token in cookie
  res.cookie(config.cookieName, token, {
    httpOnly: config.httpOnly,
    secure: config.secure,
    sameSite: config.sameSite,
    maxAge: 3600000 // 1 hour
  });

  // Also provide token in response for programmatic access
  res.locals.csrfToken = token;
}

// Middleware to generate CSRF token for safe requests
export function csrfTokenGenerator(config: CSRFConfig = {}) {
  const finalConfig = { ...defaultConfig, ...config };

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = getSessionId(req, finalConfig.sessionKey);
      await generateAndSetToken(req, res, sessionId, finalConfig);
      next();
    } catch (error) {
      console.error('CSRF token generation error:', error);
      next();
    }
  };
}

// Get CSRF token endpoint
export function csrfTokenEndpoint(config: CSRFConfig = {}) {
  const finalConfig = { ...defaultConfig, ...config };

  return async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req, finalConfig.sessionKey);
      const token = generateToken();
      const tokenHash = createTokenHash(token, finalConfig.secret);

      // Store token hash
      await finalConfig.tokenStore.set(sessionId, tokenHash);

      res.json({
        csrfToken: token,
        cookieName: finalConfig.cookieName,
        headerName: finalConfig.tokenHeader
      });
    } catch (error) {
      console.error('CSRF token endpoint error:', error);
      res.status(500).json({
        error: 'Failed to generate CSRF token'
      });
    }
  };
}

// Double submit cookie pattern (alternative approach)
export function doubleSubmitCsrf(config: Partial<CSRFConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };

  return (req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toUpperCase();

    // Skip for safe methods
    if (finalConfig.ignoreMethods.includes(method)) {
      // Generate token for safe methods
      const token = generateToken();
      res.cookie(finalConfig.cookieName, token, {
        httpOnly: false, // Must be accessible to JS
        secure: finalConfig.secure,
        sameSite: finalConfig.sameSite,
        maxAge: 3600000
      });
      res.locals.csrfToken = token;
      return next();
    }

    // For unsafe methods, verify double submit
    const cookieToken = req.cookies[finalConfig.cookieName];
    const headerToken = req.get(finalConfig.tokenHeader) || req.body?._csrf;

    if (!cookieToken || !headerToken) {
      return res.status(403).json({
        error: 'CSRF token missing',
        message: 'CSRF token required in both cookie and header/body'
      });
    }

    if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
      return res.status(403).json({
        error: 'CSRF token mismatch',
        message: 'Cookie and header/body CSRF tokens do not match'
      });
    }

    next();
  };
}

// Utility to check if request is CSRF protected
export function isCSRFProtected(req: Request): boolean {
  return !['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase());
}

// Export store interfaces for custom implementations
export { CSRFTokenStore, InMemoryCSRFStore };