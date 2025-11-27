import { useState, useCallback, ImgHTMLAttributes } from 'react';
import {
  ImagePreset,
  IMAGE_PRESETS,
  getOptimizedImageUrl,
  getPresetSrcSet,
  isSupabaseStorageUrl,
  ImageTransformOptions,
} from '@/lib/image-utils';
import { cn } from '@/lib/utils';

export interface OptimizedImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  /** The original image URL (Supabase Storage or external) */
  src: string;
  /** Preset size configuration */
  preset?: ImagePreset;
  /** Custom transformation options (overrides preset) */
  options?: ImageTransformOptions;
  /** Whether to generate retina srcset (default: true) */
  retina?: boolean;
  /** Fallback image URL if the main image fails to load */
  fallbackSrc?: string;
  /** Whether to show a blur placeholder while loading */
  showPlaceholder?: boolean;
  /** Custom placeholder color (default: bg-white/5) */
  placeholderClassName?: string;
}

/**
 * Optimized image component that automatically generates resized URLs
 * for Supabase Storage images with retina support and lazy loading.
 *
 * @example
 * ```tsx
 * // Using a preset
 * <OptimizedImage src={imageUrl} preset="card" alt="Event" />
 *
 * // Using custom options
 * <OptimizedImage
 *   src={imageUrl}
 *   options={{ width: 300, height: 200, quality: 85 }}
 *   alt="Custom"
 * />
 *
 * // With fallback
 * <OptimizedImage
 *   src={imageUrl}
 *   preset="thumbnail"
 *   fallbackSrc="/placeholder.jpg"
 *   alt="Profile"
 * />
 * ```
 */
export function OptimizedImage({
  src,
  preset,
  options,
  retina = true,
  fallbackSrc,
  showPlaceholder = false,
  placeholderClassName,
  className,
  alt = '',
  loading = 'lazy',
  onError,
  onLoad,
  style,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(showPlaceholder);
  const [hasError, setHasError] = useState(false);

  // Determine transformation options
  const transformOptions = options ?? (preset ? IMAGE_PRESETS[preset] : undefined);

  // Generate optimized URL
  const optimizedSrc = transformOptions ? getOptimizedImageUrl(src, transformOptions) : src;

  // Generate srcset for retina displays
  const srcSet =
    retina && preset && isSupabaseStorageUrl(src) ? getPresetSrcSet(src, preset) : undefined;

  // Get dimensions from preset or options for aspect ratio
  const width = transformOptions?.width ?? props.width;
  const height = transformOptions?.height ?? props.height;

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setIsLoading(false);
      onLoad?.(e);
    },
    [onLoad]
  );

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setHasError(true);
      setIsLoading(false);

      if (fallbackSrc && e.currentTarget.src !== fallbackSrc) {
        e.currentTarget.src = fallbackSrc;
        setHasError(false);
      }

      onError?.(e);
    },
    [fallbackSrc, onError]
  );

  // Use fallback if there's an error and no fallback was set
  const displaySrc = hasError && fallbackSrc ? fallbackSrc : optimizedSrc;

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{
        ...style,
        // Set aspect ratio if both dimensions are provided
        ...(width && height ? { aspectRatio: `${width}/${height}` } : {}),
      }}
    >
      {/* Placeholder */}
      {showPlaceholder && isLoading && (
        <div
          className={cn('absolute inset-0 animate-pulse', placeholderClassName ?? 'bg-white/5')}
        />
      )}

      {/* Image */}
      <img
        src={displaySrc}
        srcSet={!hasError ? srcSet : undefined}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-300',
          isLoading && showPlaceholder ? 'opacity-0' : 'opacity-100'
        )}
        width={width}
        height={height}
        {...props}
      />
    </div>
  );
}

/**
 * Simple image component that just applies URL optimization without extra features.
 * Use this when you need a basic <img> tag with optimized URL.
 */
export function SimpleOptimizedImage({
  src,
  preset,
  options,
  className,
  alt = '',
  loading = 'lazy',
  ...props
}: Omit<
  OptimizedImageProps,
  'retina' | 'fallbackSrc' | 'showPlaceholder' | 'placeholderClassName'
>) {
  const transformOptions = options ?? (preset ? IMAGE_PRESETS[preset] : undefined);
  const optimizedSrc = transformOptions ? getOptimizedImageUrl(src, transformOptions) : src;

  return <img src={optimizedSrc} alt={alt} loading={loading} className={className} {...props} />;
}

export default OptimizedImage;
