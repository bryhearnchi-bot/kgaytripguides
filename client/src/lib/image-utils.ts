/**
 * Image optimization utilities for Supabase Storage transformations
 *
 * Supabase Storage supports on-the-fly image transformations via URL parameters.
 * This module provides utilities to generate optimized image URLs.
 *
 * @see https://supabase.com/docs/guides/storage/serving/image-transformations
 */

const SUPABASE_URL = 'https://bxiiodeyqvqqcgzzqzvt.supabase.co';
const STORAGE_PATH = '/storage/v1/object/public/';
const RENDER_PATH = '/storage/v1/render/image/public/';

export type ImagePreset = 'thumbnail' | 'card' | 'profile' | 'modal' | 'hero' | 'full';

export type ResizeMode = 'cover' | 'contain' | 'fill';

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  resize?: ResizeMode;
}

interface PresetConfig extends Required<Omit<ImageTransformOptions, 'resize'>> {
  resize: ResizeMode;
}

/**
 * Preset configurations for common image sizes
 */
export const IMAGE_PRESETS: Record<ImagePreset, PresetConfig> = {
  thumbnail: {
    width: 80,
    height: 80,
    quality: 70,
    resize: 'cover',
  },
  card: {
    width: 400,
    height: 300,
    quality: 80,
    resize: 'cover',
  },
  profile: {
    width: 200,
    height: 200,
    quality: 80,
    resize: 'cover',
  },
  modal: {
    width: 600,
    height: 600,
    quality: 85,
    resize: 'cover',
  },
  hero: {
    width: 1200,
    height: 800,
    quality: 85,
    resize: 'cover',
  },
  full: {
    width: 1920,
    height: 1280,
    quality: 90,
    resize: 'cover',
  },
};

/**
 * Check if a URL is a Supabase Storage URL that can be transformed
 */
export function isSupabaseStorageUrl(url: string): boolean {
  if (!url) return false;
  return url.includes(SUPABASE_URL) && url.includes('/storage/v1/');
}

/**
 * Extract the bucket and path from a Supabase Storage URL
 */
function extractStoragePath(url: string): string | null {
  if (!isSupabaseStorageUrl(url)) return null;

  // Handle both /object/public/ and /render/image/public/ paths
  const objectMatch = url.match(/\/storage\/v1\/(?:object|render\/image)\/public\/(.+)/);
  if (objectMatch && objectMatch[1]) {
    // Remove any existing query parameters
    return objectMatch[1].split('?')[0] ?? null;
  }

  return null;
}

/**
 * Generate an optimized image URL using Supabase Storage transformations
 *
 * @param originalUrl - The original Supabase Storage URL
 * @param options - Transformation options (width, height, quality, resize)
 * @returns Optimized URL with transformation parameters
 *
 * @example
 * ```typescript
 * // Custom dimensions
 * getOptimizedImageUrl(url, { width: 400, height: 300, quality: 80 });
 *
 * // Using a preset
 * getOptimizedImageUrl(url, IMAGE_PRESETS.card);
 * ```
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  options: ImageTransformOptions = {}
): string {
  if (!originalUrl) return '';

  // If not a Supabase URL, return as-is
  const storagePath = extractStoragePath(originalUrl);
  if (!storagePath) return originalUrl;

  const params = new URLSearchParams();

  if (options.width) {
    params.set('width', options.width.toString());
  }
  if (options.height) {
    params.set('height', options.height.toString());
  }
  if (options.quality) {
    params.set('quality', options.quality.toString());
  }
  if (options.resize) {
    params.set('resize', options.resize);
  }

  const queryString = params.toString();
  const transformUrl = `${SUPABASE_URL}${RENDER_PATH}${storagePath}`;

  return queryString ? `${transformUrl}?${queryString}` : transformUrl;
}

/**
 * Generate an optimized image URL using a preset
 *
 * @param originalUrl - The original Supabase Storage URL
 * @param preset - The preset name to use
 * @returns Optimized URL with preset transformation parameters
 *
 * @example
 * ```typescript
 * getPresetImageUrl(url, 'thumbnail'); // 80x80, quality 70
 * getPresetImageUrl(url, 'hero');      // 1200x800, quality 85
 * ```
 */
export function getPresetImageUrl(originalUrl: string, preset: ImagePreset): string {
  return getOptimizedImageUrl(originalUrl, IMAGE_PRESETS[preset]);
}

/**
 * Generate a srcset string for responsive images
 *
 * @param originalUrl - The original Supabase Storage URL
 * @param options - Base transformation options
 * @param multipliers - Array of size multipliers (default: [1, 2] for standard and retina)
 * @returns srcset string for use in img or source elements
 *
 * @example
 * ```typescript
 * // Standard + retina
 * getSrcSet(url, { width: 400, quality: 80 });
 * // Returns: "url?width=400 1x, url?width=800 2x"
 *
 * // Custom multipliers
 * getSrcSet(url, { width: 400, quality: 80 }, [1, 1.5, 2, 3]);
 * ```
 */
export function getSrcSet(
  originalUrl: string,
  options: ImageTransformOptions,
  multipliers: number[] = [1, 2]
): string {
  if (!originalUrl || !isSupabaseStorageUrl(originalUrl)) return '';

  return multipliers
    .map(mult => {
      const scaledOptions: ImageTransformOptions = {
        ...options,
        width: options.width ? Math.round(options.width * mult) : undefined,
        height: options.height ? Math.round(options.height * mult) : undefined,
      };
      const url = getOptimizedImageUrl(originalUrl, scaledOptions);
      return `${url} ${mult}x`;
    })
    .join(', ');
}

/**
 * Generate srcset for a preset with retina support
 *
 * @param originalUrl - The original Supabase Storage URL
 * @param preset - The preset name to use
 * @returns srcset string for use in img or source elements
 */
export function getPresetSrcSet(originalUrl: string, preset: ImagePreset): string {
  return getSrcSet(originalUrl, IMAGE_PRESETS[preset]);
}
