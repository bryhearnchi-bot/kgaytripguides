import express, { type Express } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer, createLogger } from 'vite';
import { type Server } from 'http';
import viteConfig from '../vite.config';
import { nanoid } from 'nanoid';
import { logger } from './logging/logger';
import { getSupabaseAdmin } from './supabase-admin';

const viteLogger = createLogger();

export function log(message: string, source = 'express') {
  // Use the new structured logger
  logger.info(message, { source });
}

/**
 * Injects trip-specific meta tags into the HTML template for iOS sharing and PWA support
 * This ensures that when users share or add to home screen, they get trip-specific info
 */
async function injectTripMetaTags(template: string, url: string): Promise<string> {
  // Check if this is a trip page
  const tripMatch = url.match(/^\/trip\/([^/?#]+)/);
  if (!tripMatch) {
    return template; // Not a trip page, return unchanged
  }

  const slug = tripMatch[1];

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Fetch trip data from database
    const { data, error } = await supabaseAdmin
      .from('trips')
      .select(
        `
        id,
        name,
        slug,
        description,
        hero_image_url,
        start_date,
        end_date,
        charter_companies (
          name
        )
      `
      )
      .eq('slug', slug)
      .eq('is_active', true)
      .in('trip_status_id', [1, 2, 5]) // Upcoming, Current, or Preview
      .single();

    if (error || !data) {
      logger.warn('Failed to fetch trip for meta tag injection', { slug, error });
      return template; // Return unchanged if trip not found
    }

    const trip = {
      ...data,
      charter_company_name: (data as any).charter_companies?.name || null,
    };

    // Format dates for display
    let dateRange = '';
    if (trip.start_date && trip.end_date) {
      const startDate = new Date(trip.start_date);
      const endDate = new Date(trip.end_date);
      const startMonth = startDate.toLocaleString('en-US', { month: 'short' });
      const endMonth = endDate.toLocaleString('en-US', { month: 'short' });
      const startDay = startDate.getUTCDate();
      const endDay = endDate.getUTCDate();
      const year = startDate.getUTCFullYear();

      if (startMonth === endMonth) {
        dateRange = `${startMonth} ${startDay}-${endDay}, ${year}`;
      } else {
        dateRange = `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
      }
    }

    // Use absolute URLs for social sharing (required for og:image)
    const siteUrl = process.env.SITE_URL || 'http://localhost:3001';
    const tripUrl = `${siteUrl}/trip/${slug}`;
    const description =
      trip.description || `Join us for ${trip.name}${dateRange ? ` • ${dateRange}` : ''}`;

    // Handle both absolute URLs (from Supabase) and relative URLs
    const heroImage = trip.hero_image_url || '/images/default-trip-hero.jpg';
    const imageUrl = heroImage.startsWith('http') ? heroImage : `${siteUrl}${heroImage}`;

    const shortName = trip.name.length > 12 ? trip.name.substring(0, 12) : trip.name;

    // Build meta tags to inject
    const metaTags = `
    <!-- Trip-specific meta tags (server-injected for iOS sharing) -->
    <title>${trip.name} | KGay Travel Guides</title>
    <meta name="description" content="${description.replace(/"/g, '&quot;')}" />

    <!-- iOS PWA meta tags -->
    <meta name="apple-mobile-web-app-start-url" content="/trip/${slug}" />
    <meta name="apple-mobile-web-app-title" content="${shortName}" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />

    <!-- Open Graph / Social Sharing - MUST use absolute URLs -->
    <meta property="og:title" content="${trip.name}" />
    <meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${tripUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="KGay Travel Guides" />

    <!-- Twitter Card - MUST use absolute URLs -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${trip.name}" />
    <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${imageUrl}" />

    <!-- Canonical URL -->
    <link rel="canonical" href="${tripUrl}" />
    `;

    // CRITICAL: Remove the default manifest link to avoid conflicts
    // iOS will use the first manifest it finds
    template = template.replace(/<link rel="manifest" href="\/manifest\.json" \/>/g, '');

    // CRITICAL: Also remove any manifest links that might have been added by client-side code
    template = template.replace(/<link rel="manifest"[^>]*>/g, '');

    // Now inject the trip-specific manifest as the ONLY manifest
    const manifestLink = `<link rel="manifest" href="/api/trips/${slug}/manifest.json" />`;

    // Inject trip meta tags and manifest before closing </head> tag
    template = template.replace('</head>', `${metaTags}\n    ${manifestLink}\n  </head>`);

    return template;
  } catch (error) {
    logger.error('Error injecting trip meta tags', error);
    return template; // Return unchanged on error
  }
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: 'custom',
  });

  // Wrap Vite middleware to never process /api paths
  app.use((req, res, next) => {
    const p = req.path || req.originalUrl;
    if (p === '/api' || p.startsWith('/api/')) return next();
    return vite.middlewares(req, res, next);
  });

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;

    // Skip API routes - let them be handled by the API route handlers
    if (url === '/api' || url.startsWith('/api/')) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(import.meta.dirname, '..', 'client', 'index.html');

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, 'utf-8');
      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);

      // Inject trip-specific meta tags for iOS sharing and PWA support
      template = await injectTripMetaTags(template, url);

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In production, look for build files in the correct location
  const distPath =
    process.env.NODE_ENV === 'production'
      ? path.resolve(import.meta.dirname, '..', 'dist', 'public')
      : path.resolve(import.meta.dirname, 'public');

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Explicitly serve PWA files with correct MIME types to avoid HTML fallthrough
  app.get('/manifest.json', (_req, res) => {
    res.type('application/manifest+json');
    res.sendFile(path.resolve(distPath, 'manifest.json'));
  });

  app.get('/sw.js', (_req, res) => {
    res.setHeader('Service-Worker-Allowed', '/');
    res.type('application/javascript');
    res.sendFile(path.resolve(distPath, 'sw.js'));
  });

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  // Inject trip-specific meta tags for iOS sharing and PWA support
  app.use('*', async (req, res) => {
    const indexPath = path.resolve(distPath, 'index.html');
    let template = await fs.promises.readFile(indexPath, 'utf-8');

    // Inject trip-specific meta tags if this is a trip page
    template = await injectTripMetaTags(template, req.originalUrl);

    res.status(200).set({ 'Content-Type': 'text/html' }).send(template);
  });
}
