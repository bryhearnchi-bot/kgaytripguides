import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
// CRITICAL: Health checks must be the very first thing, before any middleware
// This ensures health checks work even if other middleware has issues
app.get('/healthz', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

app.head('/healthz', (req, res) => {
  res.writeHead(200);
  res.end();
});

app.get('/health', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

app.head('/health', (req, res) => {
  res.writeHead(200);
  res.end();
});

// Handle root path - ALWAYS return OK for health checks
app.get('/', (req, res, next) => {
  // Always return OK for any GET request to root - deployment health checks need this
  return res.status(200).send('OK');
});

app.head('/', (req, res) => {
  res.status(200).end();
});

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

// API health check for internal use
app.get('/api/health', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

app.head('/api/health', (req, res) => {
  res.writeHead(200);
  res.end();
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
  
  // Start server and ensure it's ready to handle requests immediately
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`✅ Server ready and listening on port ${port}`);
    log(`🚀 Health checks available at /healthz and /health`);
    
    // Skip production seeding in deployment to avoid blocking health checks
    if (process.env.NODE_ENV === 'production') {
      log('🚀 Production environment - server started successfully');
      log('⚡ Health checks are ready for deployment verification');
    }
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
