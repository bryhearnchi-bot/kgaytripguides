import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
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

// Health check endpoints - registered immediately before async operations
// Both /healthz and GET / for Replit's default health checks
app.get('/healthz', (req, res) => {
  // Respond immediately without any processing delays
  res.status(200).send('OK');
});

// Add GET / handler for Replit's default health checks
// This responds with 200 for health checks without interfering with SPA
app.get('/', (req, res, next) => {
  // If this is a health check request (no accept headers for HTML), return 200 immediately
  if (req.headers['user-agent'] && req.headers['user-agent'].includes('HealthChecker')) {
    return res.status(200).send('OK');
  }
  // Also handle HEAD requests for health checks
  if (req.method === 'HEAD') {
    return res.status(200).end();
  }
  // Otherwise, pass to the next handler (SPA)
  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Note: HEAD requests are now handled in the GET / handler above

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Run production seeding asynchronously AFTER server starts listening
    // This ensures health checks can respond immediately
    if (process.env.NODE_ENV === 'production') {
      log('Production environment detected - starting background seeding...');
      // Use setImmediate to run seeding on next tick, allowing health checks to respond first
      setImmediate(async () => {
        try {
          const module = await import('./production-seed.ts');
          if (module.seedProduction) {
            await module.seedProduction();
            log('Production seeding completed successfully');
          }
        } catch (error) {
          console.error('Production seeding failed:', error);
          // Don't crash server if seeding fails - just log the error
        }
      });
    }
  });
})();
