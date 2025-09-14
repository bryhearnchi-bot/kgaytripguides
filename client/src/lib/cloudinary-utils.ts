/**
 * Cloudinary utilities for ensuring all images use Cloudinary CDN
 * This enforces the rule that ALL images in the app should use Cloudinary
 */

const CLOUDINARY_CLOUD_NAME = 'dfqoebbyj';
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}`;

/**
 * Converts any image path to a Cloudinary URL
 * This ensures all images use Cloudinary, regardless of the input format
 */
export const getCloudinaryUrl = (
  imagePath: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | 'limit';
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    gravity?: 'face' | 'center' | 'north' | 'south' | 'east' | 'west';
    folder?: string;
  } = {}
): string => {
  // If it's already a Cloudinary URL, return as-is
  if (imagePath.includes('cloudinary.com')) {
    return imagePath;
  }

  // Default options
  const {
    width = 400,
    height = 400,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
    gravity = 'face',
    folder = 'cruise-app/general'
  } = options;

  // Build transformation string
  const transformations = [
    `c_${crop}`,
    `w_${width}`,
    `h_${height}`,
    `q_${quality}`,
    `f_${format}`,
    gravity ? `g_${gravity}` : null
  ].filter(Boolean).join(',');

  // Handle different input formats
  let publicId: string;

  if (imagePath.startsWith('/')) {
    // Local path like "/images/talent/artist.jpg"
    publicId = imagePath.replace(/^\/images\//, '').replace(/\.[^/.]+$/, '');
  } else if (imagePath.startsWith('http')) {
    // External URL - extract filename and use it as public ID
    const filename = imagePath.split('/').pop()?.split('.')[0] || 'unknown';
    publicId = `${folder}/${filename}`;
  } else {
    // Assume it's a public ID or filename
    publicId = imagePath.includes('/') ? imagePath : `${folder}/${imagePath}`;
  }

  return `${CLOUDINARY_BASE_URL}/image/upload/${transformations}/${publicId}`;
};

/**
 * Get Cloudinary URL specifically for talent images
 */
export const getTalentImageUrl = (publicId: string): string => {
  return getCloudinaryUrl(publicId, {
    width: 400,
    height: 400,
    crop: 'fill',
    gravity: 'face',
    folder: 'cruise-app/talent'
  });
};

/**
 * Get Cloudinary URL for event images
 */
export const getEventImageUrl = (publicId: string): string => {
  return getCloudinaryUrl(publicId, {
    width: 600,
    height: 400,
    crop: 'fill',
    gravity: 'center',
    folder: 'cruise-app/events'
  });
};

/**
 * Get Cloudinary URL for cruise/ship images
 */
export const getCruiseImageUrl = (publicId: string): string => {
  return getCloudinaryUrl(publicId, {
    width: 800,
    height: 450,
    crop: 'fill',
    gravity: 'center',
    folder: 'cruise-app/cruises'
  });
};

/**
 * Get Cloudinary URL for itinerary/port images
 */
export const getItineraryImageUrl = (publicId: string): string => {
  return getCloudinaryUrl(publicId, {
    width: 600,
    height: 400,
    crop: 'fill',
    gravity: 'center',
    folder: 'cruise-app/itinerary'
  });
};

/**
 * Default fallback image for when images fail to load
 */
export const getDefaultFallbackImage = (type: 'talent' | 'event' | 'cruise' | 'general' = 'general'): string => {
  const fallbackImages = {
    talent: 'cruise-app/defaults/default-performer',
    event: 'cruise-app/defaults/default-event',
    cruise: 'cruise-app/defaults/default-cruise',
    general: 'cruise-app/defaults/default-image'
  };

  return getCloudinaryUrl(fallbackImages[type], {
    width: 400,
    height: 400,
    crop: 'fill',
    gravity: 'center'
  });
};

/**
 * Enforce Cloudinary rule: Convert any image URL to Cloudinary
 * This is the main function that enforces the "all images must use Cloudinary" rule
 */
export const enforceCloudinary = (imageSrc: string, type: 'talent' | 'event' | 'cruise' | 'general' = 'general'): string => {
  if (!imageSrc) {
    return getDefaultFallbackImage(type);
  }

  // If it's already a Cloudinary URL, return as-is
  if (imageSrc.includes('cloudinary.com')) {
    return imageSrc;
  }

  // Convert to Cloudinary based on type
  switch (type) {
    case 'talent':
      return getTalentImageUrl(imageSrc);
    case 'event':
      return getEventImageUrl(imageSrc);
    case 'cruise':
      return getCruiseImageUrl(imageSrc);
    default:
      return getCloudinaryUrl(imageSrc);
  }
};