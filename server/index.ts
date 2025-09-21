import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { securityHeaders, rateLimit } from "./middleware/security";
import { cdnHeaders } from "./lib/cdn";

// New logging and monitoring imports
import { logger } from "./logging/logger";
import { requestLogger, errorLogger } from "./logging/middleware";
import { healthCheck, livenessProbe, readinessProbe, startupProbe } from "./monitoring/health";
import { httpMetrics, metricsHandler } from "./monitoring/metrics";

const app = express();

// Health check endpoints - these come before logging middleware
app.get('/healthz', healthCheck);
app.get('/health', healthCheck); // Alternative health check path
app.get('/liveness', livenessProbe);
app.get('/readiness', readinessProbe);
app.get('/startup', startupProbe);

app.head('/healthz', (req, res) => {
  res.writeHead(200);
  res.end();
});

// Metrics endpoint
app.get('/metrics', metricsHandler);
app.get('/api/metrics', metricsHandler);

// Add explicit handlers for /api to prevent Vite from handling them
app.get('/api', (_req, res) => res.json({ ok: true, message: 'API is running' }));
app.head('/api', (_req, res) => res.sendStatus(200));

// Apply security headers first
app.use(securityHeaders);
app.use(rateLimit());
app.use(cdnHeaders);

// Add HTTP metrics collection
app.use(httpMetrics);

// Add request logging middleware
app.use(requestLogger);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());



(async () => {
  const server = await registerRoutes(app);
  
  // Terminal 404 handler for unmatched API routes - prevents fallthrough to Vite
  app.all('/api/*', (_req, res) => res.status(404).json({ error: 'API route not found' }));

  // Add error logging middleware
  app.use(errorLogger);

  // Global error handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log error if not already logged
    if (!res.headersSent) {
      logger.error('Unhandled error in request', err, {
        method: req.method,
        path: req.path,
        statusCode: status,
      });
    }

    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // Static file serving configuration
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '3001', 10);

  // Start server and keep it running
  server.listen(port, "0.0.0.0", async () => {
    logger.info(`Server ready and listening on port ${port}`, {
      port,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    });

    // Skip image migrations for now to avoid startup issues
    // TODO: Re-enable once Railway deployment is stable
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });
})().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
