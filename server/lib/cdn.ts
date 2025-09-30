import { Request, Response, NextFunction } from 'express';

// CDN configuration
const CDN_CONFIG = {
  // Supabase Storage as primary CDN for images
  supabaseStorage: process.env.SUPABASE_URL
    ? `${process.env.SUPABASE_URL}/storage/v1/object/public`
    : '',
  jsDelivr: 'https://cdn.jsdelivr.net',
  unpkg: 'https://unpkg.com',
  googleFonts: 'https://fonts.googleapis.com',
  googleFontsStatic: 'https://fonts.gstatic.com',
};

// Asset types that should be served from CDN
const CDN_ASSET_TYPES = {
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'],
  fonts: ['woff', 'woff2', 'ttf', 'otf', 'eot'],
  scripts: ['js', 'mjs'],
  styles: ['css'],
  documents: ['pdf'],
};

// Get CDN URL for an asset based on its type and path
export const getCDNUrl = (assetPath: string, assetType?: string): string => {
  const extension = assetPath.split('.').pop()?.toLowerCase();

  if (!extension) return assetPath;

  // Route to appropriate CDN based on file type
  if (CDN_ASSET_TYPES.images.includes(extension)) {
    // For images, use Supabase Storage as primary CDN
    if (CDN_CONFIG.supabaseStorage) {
      // If it's already a Supabase URL, return as-is
      if (assetPath.includes('/storage/v1/object/public/')) {
        return assetPath;
      }
      // Otherwise construct Supabase Storage URL
      return `${CDN_CONFIG.supabaseStorage}/images${assetPath}`;
    }
    return assetPath;
  }

  if (CDN_ASSET_TYPES.fonts.includes(extension)) {
    // For fonts, use Google Fonts or font CDN
    return `${CDN_CONFIG.googleFontsStatic}${assetPath}`;
  }

  if (CDN_ASSET_TYPES.scripts.includes(extension) || CDN_ASSET_TYPES.styles.includes(extension)) {
    // For JS/CSS, use jsDelivr or similar
    return `${CDN_CONFIG.jsDelivr}${assetPath}`;
  }

  // Fallback to original path for unknown types
  return assetPath;
};

// Middleware to set CDN headers for cacheable assets
export const cdnHeaders = (req: Request, res: Response, next: NextFunction) => {
  const extension = req.path.split('.').pop()?.toLowerCase();

  if (!extension) {
    return next();
  }

  const allAssetTypes = [
    ...CDN_ASSET_TYPES.images,
    ...CDN_ASSET_TYPES.fonts,
    ...CDN_ASSET_TYPES.scripts,
    ...CDN_ASSET_TYPES.styles,
    ...CDN_ASSET_TYPES.documents,
  ];

  if (allAssetTypes.includes(extension)) {
    // Set aggressive caching for static assets
    const cacheMaxAge = getCacheMaxAge(extension);

    res.setHeader('Cache-Control', `public, max-age=${cacheMaxAge}, immutable`);
    res.setHeader('ETag', generateETag(req.path));

    // Add CDN-specific headers
    res.setHeader('X-CDN-Cache', 'MISS');
    res.setHeader('Vary', 'Accept-Encoding');

    // Set CORS headers for cross-origin asset requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control');
  }

  next();
};

// Get cache duration based on asset type
const getCacheMaxAge = (extension: string): number => {
  // 1 year for fonts and images (they're usually versioned)
  if (CDN_ASSET_TYPES.fonts.includes(extension) || CDN_ASSET_TYPES.images.includes(extension)) {
    return 365 * 24 * 60 * 60; // 1 year
  }

  // 1 month for CSS/JS (may change more frequently)
  if (CDN_ASSET_TYPES.scripts.includes(extension) || CDN_ASSET_TYPES.styles.includes(extension)) {
    return 30 * 24 * 60 * 60; // 1 month
  }

  // 1 week for documents
  if (CDN_ASSET_TYPES.documents.includes(extension)) {
    return 7 * 24 * 60 * 60; // 1 week
  }

  // Default: 1 day
  return 24 * 60 * 60;
};

// Simple ETag generation (in production, use a more sophisticated approach)
const generateETag = (path: string): string => {
  return `"${Buffer.from(path).toString('base64')}"`;
};

// Preload critical assets
export const generatePreloadHeaders = (criticalAssets: string[]): string[] => {
  return criticalAssets.map(asset => {
    const extension = asset.split('.').pop()?.toLowerCase();
    let asType = 'fetch';

    if (extension && CDN_ASSET_TYPES.images.includes(extension)) {
      asType = 'image';
    } else if (extension && CDN_ASSET_TYPES.fonts.includes(extension)) {
      asType = 'font';
    } else if (extension && CDN_ASSET_TYPES.styles.includes(extension)) {
      asType = 'style';
    } else if (extension && CDN_ASSET_TYPES.scripts.includes(extension)) {
      asType = 'script';
    }

    const cdnUrl = getCDNUrl(asset);
    return `<${cdnUrl}>; rel=preload; as=${asType}${asType === 'font' ? '; crossorigin' : ''}`;
  });
};

// Asset optimization utilities
export const optimizeAssetUrl = (
  url: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpg' | 'png';
  }
): string => {
  // Supabase Storage provides automatic image optimization via transform parameters
  if (!options) return getCDNUrl(url);

  const { width, height, quality = 80, format } = options;
  const cdnUrl = getCDNUrl(url);

  // Supabase Storage transformation parameters
  if (cdnUrl.includes('/storage/v1/object/public/')) {
    const params: string[] = [];
    if (width) params.push(`width=${width}`);
    if (height) params.push(`height=${height}`);
    if (quality) params.push(`quality=${quality}`);
    if (format) params.push(`format=${format}`);

    if (params.length > 0) {
      // Supabase uses render endpoint for transformations
      return `${cdnUrl.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')}?${params.join('&')}`;
    }
  }

  return cdnUrl;
};

// Environment-specific CDN configuration
export const getCDNConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    enabled: isProduction || process.env.FORCE_CDN === 'true',
    baseUrl: process.env.CDN_BASE_URL || CDN_CONFIG.supabaseStorage,
    imageCDN: process.env.IMAGE_CDN_URL || CDN_CONFIG.supabaseStorage,
    staticCDN: process.env.STATIC_CDN_URL || CDN_CONFIG.jsDelivr,
    fontCDN: process.env.FONT_CDN_URL || CDN_CONFIG.googleFonts,
  };
};
