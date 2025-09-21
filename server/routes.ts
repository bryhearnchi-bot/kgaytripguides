import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import {
  generalRateLimit,
  authRateLimit
} from "./middleware/rate-limiting";
import { doubleSubmitCsrf } from "./middleware/csrf";
import { validateVersion } from "./middleware/versioning";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import invitationRoutes from "./routes/invitation-routes";
import { registerAdminUsersRoutes } from "./routes/admin-users-routes";
import { registerTripRoutes } from "./routes/trips";
import { registerMediaRoutes } from "./routes/media";
import { registerLocationRoutes } from "./routes/locations";
import { registerPublicRoutes } from "./routes/public";
import { registerPerformanceRoutes } from "./routes/performance";
import { registerPartyThemeRoutes } from "./routes/party-themes";
import { setupSwaggerDocs } from "./openapi";

export async function registerRoutes(app: Express): Promise<Server> {
  // ============ MIDDLEWARE SETUP ============

  // Apply general rate limiting to all API routes
  app.use('/api', generalRateLimit);

  // API versioning support
  app.use('/api', validateVersion(['v1']));

  // CSRF protection for unsafe methods (exclude auth, invitation, and admin user routes)
  app.use('/api', (req, res, next) => {
    // Skip CSRF for auth routes, invitation routes, and admin user management routes
    const isAdminUserRoute = req.path.startsWith('/admin/users');

    if (req.path.startsWith('/auth/') ||
        req.path.startsWith('/admin/invitations') ||
        req.path.startsWith('/admin/users')) {
      return next();
    }
    return doubleSubmitCsrf()(req, res, next);
  });

  // ============ STATIC FILE SERVING ============
  // Serve cruise hero images from local filesystem
  app.use('/cruise-images', express.static('server/public/cruise-images', {
    maxAge: '24h', // Cache for 24 hours
    etag: false
  }));

  // Serve talent profile images from local filesystem
  app.use('/talent-images', express.static('server/public/talent-images', {
    maxAge: '24h',
    etag: false
  }));

  // Serve port images from local filesystem
  app.use('/port-images', express.static('server/public/port-images', {
    maxAge: '24h',
    etag: false
  }));

  // Serve party theme images from local filesystem
  app.use('/party-images', express.static('server/public/party-images', {
    maxAge: '24h',
    etag: false
  }));

  // Serve general images from uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
    maxAge: '7d',
    etag: true
  }));

  // ============ REGISTER MODULAR ROUTES ============

  // Register public/general routes (settings, search, dashboard, profile)
  registerPublicRoutes(app);

  // Register trip and cruise related routes
  registerTripRoutes(app);

  // Register media and talent related routes
  registerMediaRoutes(app);

  // Register location related routes (ports, ships, party templates)
  registerLocationRoutes(app);

  // Register party theme routes
  registerPartyThemeRoutes(app);

  // Register performance monitoring routes
  registerPerformanceRoutes(app);

  // ============ INVITATION SYSTEM ROUTES ============

  // Mount invitation routes
  app.use('/api', invitationRoutes);

  // ============ ADMIN USER MANAGEMENT ROUTES ============

  // Register admin user management routes
  registerAdminUsersRoutes(app);

  // ============ API DOCUMENTATION ============

  // Setup Swagger/OpenAPI documentation
  setupSwaggerDocs(app);

  // ============ ERROR HANDLING ============

  // 404 handler for API routes - maintains backwards compatibility
  app.use('/api/*', (req, res) => {
    // Use notFoundHandler for consistent error format
    notFoundHandler(req, res);
  });

  // Global error handler - provides standardized error responses
  // This must be the last middleware registered
  app.use(errorHandler);

  const httpServer = createServer(app);

  return httpServer;
}