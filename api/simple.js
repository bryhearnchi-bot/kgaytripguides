// Simplified Vercel Serverless Function
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check endpoints
  if (req.url === '/api' || req.url === '/api/') {
    return res.json({
      ok: true,
      message: 'Atlantis Trip Guides API running on Vercel',
      timestamp: new Date().toISOString(),
      environment: 'vercel-serverless'
    });
  }

  if (req.url === '/api/health') {
    return res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: 'vercel-serverless',
      database_url: process.env.DATABASE_URL ? 'configured' : 'missing'
    });
  }

  // Simple database test
  if (req.url === '/api/db-test') {
    try {
      const { neon } = await import('@neondatabase/serverless');
      const client = neon(process.env.DATABASE_URL);
      await client`SELECT 1`;
      return res.json({
        status: 'database_connected',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({
        status: 'database_error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Basic trips endpoint
  if (req.url === '/api/trips' && req.method === 'GET') {
    try {
      const { neon } = await import('@neondatabase/serverless');
      const client = neon(process.env.DATABASE_URL);
      const trips = await client`SELECT * FROM cruises ORDER BY "startDate" DESC`;
      return res.json(trips);
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to fetch trips',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // 404 for unmatched routes
  return res.status(404).json({
    error: 'Route not found',
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
}