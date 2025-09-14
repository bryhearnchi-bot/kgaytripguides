import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { securityHeaders, rateLimit } from "./middleware/security";
import { cdnHeaders } from "./lib/cdn";
import { performanceMonitoring, healthCheck, getMetrics, errorTracking, analytics } from "./lib/monitoring";

const app = express();

// Explicit health check endpoints with proper error handling
app.get('/healthz', healthCheck);

app.head('/healthz', (req, res) => {
  res.writeHead(200);
  res.end();
});

// Add explicit handlers for /api to prevent Vite from handling them
app.get('/api', (_req, res) => res.json({ ok: true, message: 'API is running' }));
app.head('/api', (_req, res) => res.sendStatus(200));

// Add monitoring endpoints
app.get('/api/metrics', getMetrics);
app.post('/api/analytics/track', (req, res) => {
  const { event, properties = {}, userId, sessionId } = req.body;
  analytics.track(event, properties, userId, sessionId);
  res.json({ success: true });
});

app.use(performanceMonitoring);
// Disabled CSP to allow all external images
// app.use(securityHeaders);
app.use(rateLimit());
app.use(cdnHeaders);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});



(async () => {
  const server = await registerRoutes(app);
  
  // Terminal 404 handler for unmatched API routes - prevents fallthrough to Vite
  app.all('/api/*', (_req, res) => res.status(404).json({ error: 'API route not found' }));
  
  app.use(errorTracking);
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
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
    log(`✅ Server ready and listening on port ${port}`);
    
    // Skip image migrations for now to avoid startup issues
    // TODO: Re-enable once Railway deployment is stable
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      log('Process terminated');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    log('SIGINT received, shutting down gracefully');
    server.close(() => {
      log('Process terminated');
      process.exit(0);
    });
  });
})().catch((error) => {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
});
