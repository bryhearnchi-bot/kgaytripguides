import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Explicit health check endpoints - fast and reliable
app.get('/healthz', (req, res) => {
  req.setTimeout(5000); // 5 second timeout
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

app.head('/healthz', (req, res) => {
  res.writeHead(200);
  res.end();
});

// Health check endpoint for GET requests
app.get('/', (req, res) => {
  req.setTimeout(5000); // 5 second timeout
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
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



(async () => {
  const server = await registerRoutes(app);
  
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

  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Start server first, then run migrations
  server.listen(port, "0.0.0.0", async () => {
    log(`✅ Server ready and listening on port ${port}`);
    
    // Run migrations after server is ready
    try {
      // Move migration logic here if it exists
    } catch (error) {
      console.error('Migration failed:', error);
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
