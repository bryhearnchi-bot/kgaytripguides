// Vercel Serverless Function for Atlantis Trip Guides API
import express from 'express';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';

// Load environment variables
config();

const app = express();

// Enhanced CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Allow requests from Vercel domains, custom domains, and localhost
  const allowedOrigins = [
    'https://kgaytravelguides.vercel.app',
    'https://kgaytravelguides.netlify.app', // Keep compatibility
    /\.vercel\.app$/,
    /localhost/,
    /127\.0\.0\.1/
  ];

  const isAllowed = allowedOrigins.some(pattern => {
    if (typeof pattern === 'string') {
      return origin === pattern;
    }
    return pattern.test(origin || '');
  });

  if (isAllowed || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH,HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, Set-Cookie, X-Requested-With');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// Request logging for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      origin: req.headers.origin
    }
  });
  next();
});

// Health check endpoints
app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'Atlantis Trip Guides API running on Vercel',
    timestamp: new Date().toISOString(),
    environment: 'vercel-serverless',
    node_version: process.version
  });
});

app.get('/api', (req, res) => {
  res.json({
    ok: true,
    message: 'Atlantis Trip Guides API running on Vercel',
    timestamp: new Date().toISOString(),
    environment: 'vercel-serverless'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'vercel-serverless',
    node_version: process.version,
    database_url: process.env.DATABASE_URL ? 'configured' : 'missing'
  });
});

// Database connection test
app.get('/api/db-test', async (req, res) => {
  try {
    const { neon } = await import('@neondatabase/serverless');
    const client = neon(process.env.DATABASE_URL);
    await client`SELECT 1`;
    res.json({
      status: 'database_connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'database_error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Import and register routes
let routesLoaded = false;
let routeError = null;

const loadRoutes = async () => {
  if (routesLoaded || routeError) return;

  try {
    // Try different import paths for routes
    let registerRoutes;

    try {
      const routes = await import('../dist/routes.js');
      registerRoutes = routes.registerRoutes;
    } catch (e1) {
      try {
        const routes = await import('../server/routes.js');
        registerRoutes = routes.registerRoutes;
      } catch (e2) {
        // Compile routes on-the-fly for development
        const { build } = await import('esbuild');
        await build({
          entryPoints: ['server/routes.ts'],
          bundle: true,
          platform: 'node',
          format: 'esm',
          outfile: 'temp-routes.js',
          external: ['@neondatabase/serverless', 'drizzle-orm', 'express']
        });
        const routes = await import('../temp-routes.js');
        registerRoutes = routes.registerRoutes;
      }
    }

    if (registerRoutes) {
      await registerRoutes(app);
      routesLoaded = true;
      console.log('Routes loaded successfully');
    } else {
      throw new Error('registerRoutes function not found');
    }
  } catch (error) {
    console.error('Failed to load routes:', error);
    routeError = error;
  }
};

// Middleware to ensure routes are loaded
app.use('/api', async (req, res, next) => {
  if (routeError) {
    return res.status(500).json({
      error: 'Routes failed to load',
      message: routeError.message,
      timestamp: new Date().toISOString()
    });
  }

  if (!routesLoaded) {
    await loadRoutes();
  }

  if (routeError) {
    return res.status(500).json({
      error: 'Routes failed to load',
      message: routeError.message,
      timestamp: new Date().toISOString()
    });
  }

  next();
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    available_endpoints: [
      'GET /api',
      'GET /api/health',
      'GET /api/db-test',
      'GET /api/trips',
      'POST /api/auth/login'
    ]
  });
});

// Pre-load routes
loadRoutes().catch(console.error);

export default app;