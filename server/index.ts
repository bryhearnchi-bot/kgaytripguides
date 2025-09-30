// Load environment variables first
import { config } from 'dotenv';
config();

// Validate critical environment variables on startup
function validateEnvironment() {
  const requiredVars = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SESSION_SECRET',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    console.error('\x1b[31m❌ FATAL: Missing required environment variables:\x1b[0m');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\n\x1b[33mℹ️  Create .env file from template:\x1b[0m');
    console.error('   cp .env.example .env');
    console.error('\n\x1b[33mℹ️  Then fill in your credentials from:\x1b[0m');
    console.error('   https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api\n');
    process.exit(1);
  }

  // Validate DATABASE_URL format
  if (!process.env.DATABASE_URL!.startsWith('postgresql://')) {
    console.error(
      '\x1b[31m❌ FATAL: DATABASE_URL must be a valid PostgreSQL connection string\x1b[0m'
    );
    process.exit(1);
  }

  // Validate SESSION_SECRET strength
  if (process.env.SESSION_SECRET!.length < 32) {
    console.error('\x1b[33m⚠️  WARNING: SESSION_SECRET should be at least 32 characters\x1b[0m');
    console.error('   Generate with: openssl rand -base64 32\n');
  }
}

// Run validation before starting server
validateEnvironment();

import express, { type Request, Response, NextFunction } from 'express';
import { type AuthenticatedRequest } from './auth';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { registerRoutes } from './routes';
import { setupVite, log } from './vite';
import { securityHeaders, rateLimit } from './middleware/security';
import { cdnHeaders } from './lib/cdn';

// New logging and monitoring imports
import { logger } from './logging/logger';
import { requestLogger, errorLogger } from './logging/middleware';
import { healthCheck, livenessProbe, readinessProbe, startupProbe } from './monitoring/health';
import { httpMetrics, metricsHandler } from './monitoring/metrics';

const app = express();

// Get __dirname equivalent in ES modules
let __dirname: string;
try {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} catch (e) {
  // Fallback for tsx runtime
  __dirname = path.join(process.cwd(), 'server');
}

// Health check endpoints - these come before logging middleware
app.get('/healthz', healthCheck);
app.get('/health', healthCheck); // Alternative health check path
app.get('/liveness', livenessProbe);
app.get('/readiness', readinessProbe);
app.get('/startup', startupProbe);

app.head('/healthz', (req: AuthenticatedRequest, res: Response) => {
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

// Add HTTP compression for all responses
app.use(
  compression({
    filter: (req: AuthenticatedRequest, res: Response) => {
      // Don't compress responses with this request header
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Use compression for all other requests
      return compression.filter(req, res);
    },
    // Compression level (0-9, where 6 is default balance of speed/compression)
    level: 6,
    // Only compress responses larger than 1KB
    threshold: 1024,
  })
);

// Add HTTP metrics collection
app.use(httpMetrics);

// Add request logging middleware
app.use(requestLogger);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Serve PWA files early in production
if (process.env.NODE_ENV === 'production') {
  // Use process.cwd() for reliable path resolution in production
  const distPath = path.join(process.cwd(), 'dist', 'public');
  const clientPublicPath = path.join(process.cwd(), 'client', 'public');

  // Log the path for debugging
  logger.info('Serving static files from:', { distPath, clientPublicPath, cwd: process.cwd() });

  // Memory profiling endpoint
  app.get('/api/debug/memory', (_req, res) => {
    const usage = process.memoryUsage();
    const formatBytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

    res.json({
      memory: {
        rss: formatBytes(usage.rss),
        heapTotal: formatBytes(usage.heapTotal),
        heapUsed: formatBytes(usage.heapUsed),
        external: formatBytes(usage.external),
        arrayBuffers: formatBytes(usage.arrayBuffers),
      },
      percentages: {
        heapUsedPercent: `${((usage.heapUsed / usage.heapTotal) * 100).toFixed(2)}%`,
      },
      uptime: `${Math.floor(process.uptime())}s`,
      nodeVersion: process.version,
      platform: process.platform,
    });
  });

  // Debug endpoint to check file paths and existence
  app.get('/api/debug/paths', (_req, res) => {
    try {
      const manifestDistPath = path.join(distPath, 'manifest.json');
      const swDistPath = path.join(distPath, 'sw.js');
      const manifestClientPath = path.join(clientPublicPath, 'manifest.json');
      const swClientPath = path.join(clientPublicPath, 'sw.js');
      const assetsPath = path.join(distPath, 'assets');

      const getDirectoryContents = (dirPath: string) => {
        try {
          if (!fs.existsSync(dirPath)) {
            return { exists: false, files: [] };
          }
          const files = fs.readdirSync(dirPath);
          return {
            exists: true,
            fileCount: files.length,
            files: files.slice(0, 20),
            sampleFiles: files.filter(f => f.endsWith('.css') || f.endsWith('.js')).slice(0, 5),
          };
        } catch (error) {
          return { exists: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      };

      res.json({
        cwd: process.cwd(),
        nodeEnv: process.env.NODE_ENV,
        paths: {
          dist: {
            path: distPath,
            exists: fs.existsSync(distPath),
            manifest: {
              path: manifestDistPath,
              exists: fs.existsSync(manifestDistPath),
            },
            sw: {
              path: swDistPath,
              exists: fs.existsSync(swDistPath),
            },
            assets: getDirectoryContents(assetsPath),
          },
          client: {
            path: clientPublicPath,
            exists: fs.existsSync(clientPublicPath),
            manifest: {
              path: manifestClientPath,
              exists: fs.existsSync(manifestClientPath),
            },
            sw: {
              path: swClientPath,
              exists: fs.existsSync(swClientPath),
            },
          },
        },
        distRoot: getDirectoryContents(distPath),
        envVars: {
          NODE_ENV: process.env.NODE_ENV,
          PORT: process.env.PORT,
          DATABASE_URL: process.env.DATABASE_URL ? '✓ Set' : '✗ Missing',
          SUPABASE_URL: process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing',
          SESSION_SECRET: process.env.SESSION_SECRET ? '✓ Set' : '✗ Missing',
        },
      });
    } catch (error) {
      logger.error('Debug endpoint error', error);
      res.status(500).json({
        error: 'Failed to get debug info',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Explicitly serve PWA files with correct MIME types
  app.get('/manifest.json', (_req, res) => {
    let manifestPath = path.join(distPath, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      // Fallback to client/public during runtime if file missing in dist
      manifestPath = path.join(clientPublicPath, 'manifest.json');
    }
    res.type('application/manifest+json');
    res.sendFile(manifestPath, err => {
      if (err) {
        logger.error('Failed to serve manifest.json', {
          error: err.message,
          code: (err as any).code,
          path: manifestPath,
          exists: fs.existsSync(manifestPath),
          distExists: fs.existsSync(distPath),
          clientExists: fs.existsSync(clientPublicPath),
          cwd: process.cwd(),
          stack: err.stack,
        });
        res.status(500).json({ error: 'Failed to load manifest.json', details: err.message });
      }
    });
  });

  app.get('/sw.js', (_req, res) => {
    let swPath = path.join(distPath, 'sw.js');
    if (!fs.existsSync(swPath)) {
      swPath = path.join(clientPublicPath, 'sw.js');
    }
    res.setHeader('Service-Worker-Allowed', '/');
    res.type('application/javascript');
    res.sendFile(swPath, err => {
      if (err) {
        logger.error('Failed to serve sw.js', {
          error: err.message,
          code: (err as any).code,
          path: swPath,
          exists: fs.existsSync(swPath),
          distExists: fs.existsSync(distPath),
          clientExists: fs.existsSync(clientPublicPath),
          cwd: process.cwd(),
          stack: err.stack,
        });
        res.status(500).send('// Service worker failed to load');
      }
    });
  });

  // Serve other static assets from dist/public with error handling
  app.use(
    express.static(distPath, {
      setHeaders: (res, filePath) => {
        // Set proper cache headers
        if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
      fallthrough: true,
      dotfiles: 'ignore',
    })
  );

  // Log if dist directory doesn't exist
  if (!fs.existsSync(distPath)) {
    logger.error('CRITICAL: dist/public directory does not exist', {
      distPath,
      cwd: process.cwd(),
      dirContents: fs.readdirSync(process.cwd()).slice(0, 20),
    });
  }
}

(async () => {
  const server = await registerRoutes(app);

  // Terminal 404 handler for unmatched API routes - prevents fallthrough to Vite
  app.all('/api/*', (_req, res) => res.status(404).json({ error: 'API route not found' }));

  // Add error logging middleware
  app.use(errorLogger);

  // Global error handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

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
  if (app.get('env') === 'development') {
    await setupVite(app, server);
  } else {
    // In production, add the fallback to index.html for client-side routing
    const distPath = path.join(process.cwd(), 'dist', 'public');
    app.use('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = parseInt(process.env.PORT || '3001', 10);

  // Start server and keep it running
  server.listen(port, '0.0.0.0', async () => {
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
})().catch(error => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
