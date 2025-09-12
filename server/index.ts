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

// Multiple health check endpoints for maximum compatibility
// These must respond instantly without any processing delays

// Primary health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

app.head('/healthz', (req, res) => {
  res.status(200).end();
});

// Alternative health check endpoints
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.head('/health', (req, res) => {
  res.status(200).end();
});

// API health check
app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

app.head('/api/health', (req, res) => {
  res.status(200).end();
});

// Root path health check - handle deployment health checks
app.get('/', (req, res, next) => {
  // Check if this looks like a health check request
  const userAgent = req.headers['user-agent'] || '';
  const acceptHeader = req.headers.accept || '';
  
  // Common health check patterns
  const isHealthCheck = 
    userAgent.includes('HealthChecker') ||
    userAgent.includes('kube-probe') ||
    userAgent.includes('curl') ||
    userAgent.includes('wget') ||
    userAgent.startsWith('Go-http-client') ||
    acceptHeader === '*/*' ||
    acceptHeader === '' ||
    !acceptHeader;

  if (isHealthCheck) {
    return res.status(200).send('OK');
  }
  
  // Otherwise, pass to SPA handler
  next();
});

// Always handle HEAD requests to root immediately
app.head('/', (req, res) => {
  res.status(200).end();
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
      
      // Use setTimeout with a small delay to ensure health checks work first
      setTimeout(async () => {
        try {
          log('Starting production database seeding...');
          const module = await import('./production-seed.ts');
          if (module.seedProduction) {
            await module.seedProduction();
            log('✅ Production seeding completed successfully');
          }
        } catch (error) {
          console.error('❌ Production seeding failed:', error);
          console.error('Server will continue running without seeded data');
          // Don't crash server if seeding fails - just log the error
        }
      }, 100); // Small delay to let health checks establish first
    }
  });
})();
