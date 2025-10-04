import type { Express, Request, Response } from 'express';
import express from 'express';
import { createServer, type Server } from 'http';
import path from 'path';
import { generalRateLimit, authRateLimit } from './middleware/rate-limiting';
import { doubleSubmitCsrf } from './middleware/csrf';
import { validateVersion } from './middleware/versioning';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import invitationRoutes from './routes/invitation-routes';
import { registerAdminUsersRoutes } from './routes/admin-users-routes';
import { registerAdminLookupTablesRoutes } from './routes/admin-lookup-tables-routes';
import { registerTripRoutes } from './routes/trips';
import { registerTripWizardRoutes } from './routes/trip-wizard';
import { registerMediaRoutes } from './routes/media';
import { registerLocationRoutes } from './routes/locations';
import { registerPublicRoutes } from './routes/public';
import { registerPerformanceRoutes } from './routes/performance';
import { registerPartyThemeRoutes } from './routes/party-themes';
import { registerTripInfoSectionRoutes } from './routes/trip-info-sections';
import { registerAdminSequenceRoutes } from './routes/admin-sequences';

export async function registerRoutes(app: Express): Promise<Server> {
  // ============ MIDDLEWARE SETUP ============

  // Apply general rate limiting to all API routes
  app.use('/api', generalRateLimit);

  // API versioning support
  app.use('/api', validateVersion(['v1']));

  // CSRF protection for unsafe methods
  app.use('/api', (req, res, next) => {
    // Skip CSRF for auth routes
    if (req.path.startsWith('/auth/')) {
      return next();
    }

    // Skip CSRF for all admin routes when using Bearer token authentication
    // This includes: /admin/users, /admin/invitations, and operations on /ports, /ships, /party-themes
    // Bearer token authentication (Supabase Auth) provides sufficient security for admin operations
    const authHeader = req.headers.authorization;
    const hasBearerToken = authHeader?.startsWith('Bearer ');

    // Debug logging for CSRF middleware
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      // CSRF debug information available if needed
    }

    if (hasBearerToken) {
      // For authenticated requests with Bearer token, skip CSRF
      // The Supabase Auth token is sufficient security
      return next();
    }

    // Apply CSRF protection for non-authenticated requests (cookie-based sessions)
    return doubleSubmitCsrf()(req, res, next);
  });

  // ============ STATIC FILE SERVING ============
  // Serve app images from single bucket with folders
  app.use(
    '/app-images',
    express.static('server/public/app-images', {
      maxAge: '24h', // Cache for 24 hours
      etag: false,
    })
  );

  // Backward compatibility redirects for old image paths
  app.use('/cruise-images', (req: Request, res: Response) => {
    return res.redirect(301, `/app-images/trips${req.url}`);
  });

  app.use('/talent-images', (req: Request, res: Response) => {
    return res.redirect(301, `/app-images/talent${req.url}`);
  });

  app.use('/port-images', (req: Request, res: Response) => {
    return res.redirect(301, `/app-images/locations${req.url}`);
  });

  app.use('/party-images', (req: Request, res: Response) => {
    return res.redirect(301, `/app-images/parties${req.url}`);
  });

  app.use('/ship-images', (req: Request, res: Response) => {
    return res.redirect(301, `/app-images/ships${req.url}`);
  });

  // Serve general images from uploads directory
  app.use(
    '/uploads',
    express.static(path.join(process.cwd(), 'uploads'), {
      maxAge: '7d',
      etag: true,
    })
  );

  // Serve logos from logos directory
  app.use(
    '/logos',
    express.static(path.join(process.cwd(), 'logos'), {
      maxAge: '30d',
      etag: true,
    })
  );

  // ============ REGISTER MODULAR ROUTES ============

  // Authentication routes now handled by Supabase Auth

  // Register public/general routes (settings, search, dashboard, profile)
  registerPublicRoutes(app);

  // Register trip and cruise related routes
  registerTripRoutes(app);
  registerTripWizardRoutes(app);

  // Register media and talent related routes
  registerMediaRoutes(app);

  // Register location related routes (ports, ships, party templates)
  registerLocationRoutes(app);

  // Register party theme routes
  registerPartyThemeRoutes(app);

  // Register trip info section routes
  registerTripInfoSectionRoutes(app);

  // Register performance monitoring routes
  registerPerformanceRoutes(app);

  // ============ INVITATION SYSTEM ROUTES ============

  // Mount invitation routes
  app.use('/api', invitationRoutes);

  // ============ ADMIN USER MANAGEMENT ROUTES ============

  // Register admin user management routes
  // Debug middleware for admin users routes
  app.use('/api/admin/users', (req, res, next) => {
    console.log('🔍 ADMIN USERS ROUTE HIT:', req.method, req.url, req.query);
    next();
  });

  registerAdminUsersRoutes(app);

  // Register admin lookup tables management routes
  registerAdminLookupTablesRoutes(app);

  // Register admin database sequence management routes
  registerAdminSequenceRoutes(app);

  // ============ ERROR HANDLING ============

  // 404 handler for API routes - maintains backwards compatibility
  app.use('/api/*', (req: Request, res: Response) => {
    // Use notFoundHandler for consistent error format
    return notFoundHandler(req, res);
  });

  // Global error handler - provides standardized error responses
  // This must be the last middleware registered
  app.use(errorHandler);

  const httpServer = createServer(app);

  return httpServer;
}
