import type { Express, Request, Response } from 'express';
import { getSupabaseAdmin } from '../supabase-admin';
import { logger } from '../logging/logger';

/**
 * Registers PWA (Progressive Web App) related routes
 * Handles dynamic manifest generation for trip-specific PWA installations
 */
export function registerPWARoutes(app: Express): void {
  /**
   * GET /api/trips/:slug/manifest.json
   * Generates a trip-specific PWA manifest for scoped installations
   * When a user adds a trip to their home screen, this manifest ensures:
   * - The app opens directly to that trip
   * - Navigation is scoped to just that trip (no home page access)
   * - Trip-specific branding (name, icons, colors)
   */
  app.get('/api/trips/:slug/manifest.json', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
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
          theme_color,
          background_color,
          charter_companies (
            name,
            logo_url
          )
        `
        )
        .eq('slug', slug)
        .eq('is_active', true)
        .in('trip_status_id', [3, 5])
        .single();

      if (error || !data) {
        logger.error('Failed to fetch trip for manifest', { slug, error });
        return res.status(404).json({ error: 'Trip not found' });
      }

      const trip = {
        ...data,
        charter_company_name: (data as any).charter_companies?.name || null,
        charter_company_logo: (data as any).charter_companies?.logo_url || null,
      };

      // Determine icon set based on trip
      // For DragStars cruise, use dragstars icons; otherwise use default kgay icons
      const isDragStars = slug === 'drag-stars-at-sea';
      const iconPrefix = isDragStars ? 'dragstars' : 'icon';

      // Generate trip-specific manifest
      const manifest = {
        name: trip.name,
        short_name: trip.name.length > 12 ? trip.name.substring(0, 12) : trip.name,
        description: trip.description || `Travel guide for ${trip.name}`,
        start_url: `/trip/${slug}`,
        scope: `/trip/${slug}`,
        display: 'standalone',
        background_color: trip.background_color || '#1e40af',
        theme_color: trip.theme_color || '#1e40af',
        orientation: 'portrait-primary',
        lang: 'en',
        categories: ['travel', 'entertainment', 'lifestyle', 'lgbtq'],
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        icons: [
          {
            src: `/images/icons/${iconPrefix}-72x72.png`,
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: `/images/icons/${iconPrefix}-96x96.png`,
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: `/images/icons/${iconPrefix}-128x128.png`,
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: `/images/icons/${iconPrefix}-144x144.png`,
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: `/images/icons/${iconPrefix}-152x152.png`,
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: `/images/icons/${iconPrefix}-192x192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: `/images/icons/${iconPrefix}-384x384.png`,
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: `/images/icons/${iconPrefix}-512x512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        // No shortcuts for scoped PWA - user should stay within this trip
        shortcuts: [],
        related_applications: [],
        prefer_related_applications: false,
      };

      // Set proper headers
      res.setHeader('Content-Type', 'application/manifest+json');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

      return res.json(manifest);
    } catch (error) {
      logger.error('Failed to generate trip manifest', error, {
        slug: req.params.slug,
      });
      return res.status(500).json({
        error: 'Failed to generate manifest',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/trips/:slug/metadata
   * Returns Open Graph and social sharing metadata for a trip
   * Used to dynamically populate meta tags when sharing trip links
   */
  app.get('/api/trips/:slug/metadata', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const supabaseAdmin = getSupabaseAdmin();

      // Fetch trip data with relevant social sharing info
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
        .in('trip_status_id', [3, 5])
        .single();

      if (error || !data) {
        logger.error('Failed to fetch trip metadata', { slug, error });
        return res.status(404).json({ error: 'Trip not found' });
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

      // Build metadata object
      const metadata = {
        title: trip.name,
        description:
          trip.description || `Join us for ${trip.name}${dateRange ? ` • ${dateRange}` : ''}`,
        image: trip.hero_image_url || '/images/default-trip-hero.jpg',
        url: `/trip/${slug}`,
        type: 'website',
        siteName: 'K-GAY Travel Guides',
        // Twitter card specific
        twitterCard: 'summary_large_image',
        twitterTitle: trip.name,
        twitterDescription:
          trip.description || `Join us for ${trip.name}${dateRange ? ` • ${dateRange}` : ''}`,
        twitterImage: trip.hero_image_url || '/images/default-trip-hero.jpg',
      };

      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      return res.json(metadata);
    } catch (error) {
      logger.error('Failed to fetch trip metadata', error, {
        slug: req.params.slug,
      });
      return res.status(500).json({
        error: 'Failed to fetch metadata',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
