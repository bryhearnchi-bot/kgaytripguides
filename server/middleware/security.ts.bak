import { Request, Response, NextFunction } from 'express';

// Security middleware for setting various security headers
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Content Security Policy
  const cspDirectives = {
    'default-src': ["'self'", "https:"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Vite in development
      "'unsafe-eval'", // Required for development
      "https:"
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for CSS-in-JS libraries
      "https:"
    ],
    'font-src': [
      "'self'",
      "https:"
    ],
    'img-src': [
      "'self'",
      "data:",
      "blob:",
      "https:" // Allow all HTTPS images
    ],
    'connect-src': [
      "'self'",
      "https:"
    ],
    'media-src': ["'self'", "https:"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"]
  };

  // Build CSP header string
  const csp = Object.entries(cspDirectives)
    .map(([directive, sources]) => {
      if (sources.length === 0) return directive;
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');

  res.setHeader('Content-Security-Policy', csp);

  // X-Frame-Options - Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // X-Content-Type-Options - Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-XSS-Protection - Enable XSS filtering (legacy but still useful)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy - Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy - Control browser features
  res.setHeader('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', '));

  // Strict-Transport-Security - Force HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // X-Powered-By - Remove Express fingerprinting
  res.removeHeader('X-Powered-By');

  // Cache-Control for security-sensitive endpoints
  if (req.path.startsWith('/api/admin') || req.path.includes('login') || req.path.includes('auth')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

// Rate limiting middleware (basic implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const key = `${ip}:${req.path}`;

    let record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      rateLimitStore.set(key, record);
      return next();
    }

    record.count++;

    if (record.count > maxRequests) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
      return;
    }

    next();
  };
};

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000); // Clean up every 10 minutes