import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import { Share2 } from 'lucide-react';
import { useShare } from '@/hooks/useShare';
import { useHaptics } from '@/hooks/useHaptics';
import { isNative } from '@/lib/capacitor';

interface ItineraryImage {
  imageUrl?: string;
  locationName?: string;
  port?: string;
  locationTypeName?: string;
  itineraryImageUrl?: string;
  locationImageUrl?: string;
}

interface HeroSectionProps {
  tripName?: string;
  tripDescription?: string;
  tripType?: 'cruise' | 'resort' | null;
  charterCompanyLogo?: string | null;
  charterCompanyName?: string | null;
  slug?: string;
  startDate?: string;
  endDate?: string;
  itinerary?: ItineraryImage[]; // NEW: Dynamic itinerary images
}

const HeroSection = ({
  tripName = 'Your Next Adventure',
  tripDescription = 'An exciting adventure awaits',
  tripType = null,
  charterCompanyLogo = null,
  charterCompanyName = null,
  slug = '',
  startDate,
  endDate,
  itinerary = [], // NEW: Accept itinerary prop
}: HeroSectionProps) => {
  const { shareTrip } = useShare();
  const haptics = useHaptics();

  // Split trip name into words
  const words = tripName.split(' ');
  const firstWord = words[0];
  const remainingWords = words.slice(1).join(' ');

  // Handle share button click
  const handleShare = async () => {
    haptics.light();
    await shareTrip({ name: tripName, slug: slug || '' });
  };

  // Format trip dates
  const formatTripDates = () => {
    if (!startDate || !endDate) return null;

    // Parse dates (YYYY-MM-DD format) - extract just the date part if there's a timestamp
    const startDateStr = startDate.split('T')[0];
    const endDateStr = endDate.split('T')[0];

    const startParts = startDateStr.split('-');
    const startYear = Number(startParts[0] ?? 2025);
    const startMonth = Number(startParts[1] ?? 1);
    const startDay = Number(startParts[2] ?? 1);
    const endParts = endDateStr.split('-');
    const endYear = Number(endParts[0] ?? 2025);
    const endMonth = Number(endParts[1] ?? 1);
    const endDay = Number(endParts[2] ?? 1);

    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);

    const formatOptions: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };
    const startFormatted = start.toLocaleDateString('en-US', formatOptions);
    const endFormatted = end.toLocaleDateString('en-US', formatOptions);

    // If same month and year, show "Month Day - Day, Year"
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      const monthYear = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endDay}, ${start.getFullYear()}`;
    }

    // Otherwise show full dates
    return `${startFormatted} - ${endFormatted}`;
  };

  const tripDates = formatTripDates();

  /**
   * Build carousel images dynamically based on trip type and itinerary data
   *
   * For Cruise Trips:
   * 1. Collect itinerary images from port stops (Embarkation, Disembarkation, Port, Overnight types)
   * 2. If < 6 images, add location fallback images for ports without itinerary images
   * 3. If still < 6, add BOTH images for ports that have both itinerary + location images
   * 4. If still < 6, add sea day images as last resort
   *
   * For Resort Trips:
   * 1. Collect schedule images only (no location fallbacks)
   *
   * @param itinerary - Array of itinerary/schedule items
   * @param tripType - 'cruise' or 'resort'
   * @returns Array of image URLs (minimum 6 for carousel)
   */
  const buildCarouselImages = (
    itinerary: ItineraryImage[],
    tripType: 'cruise' | 'resort' | null
  ): string[] => {
    const MIN_IMAGES = 6;
    const images: string[] = [];

    if (tripType === 'resort') {
      // Resort trips: Only use schedule images (no location fallbacks per user requirement)
      itinerary.forEach(item => {
        if (item.imageUrl && item.imageUrl.trim() !== '') {
          images.push(item.imageUrl);
        }
      });
      return images;
    }

    // Cruise trips: Implement priority logic

    // Separate port stops from sea days
    const portStops = itinerary.filter(item => {
      const typeName = item.locationTypeName?.toLowerCase() || '';
      return !typeName.includes('sea day');
    });

    const seaDays = itinerary.filter(item => {
      const typeName = item.locationTypeName?.toLowerCase() || '';
      return typeName.includes('sea day');
    });

    // Priority 1: Itinerary-specific images from port stops
    portStops.forEach(item => {
      if (item.itineraryImageUrl && item.itineraryImageUrl.trim() !== '') {
        images.push(item.itineraryImageUrl);
      } else if (item.imageUrl && item.imageUrl.trim() !== '') {
        // Fallback to imageUrl if itineraryImageUrl doesn't exist
        images.push(item.imageUrl);
      }
    });

    // Priority 2: Location fallback images for ports without itinerary images
    if (images.length < MIN_IMAGES) {
      portStops.forEach(item => {
        const hasItineraryImage = item.itineraryImageUrl && item.itineraryImageUrl.trim() !== '';
        if (!hasItineraryImage && item.locationImageUrl && item.locationImageUrl.trim() !== '') {
          images.push(item.locationImageUrl);
        }
      });
    }

    // Priority 3: Add BOTH images for ports that have both (only if still need more)
    if (images.length < MIN_IMAGES) {
      portStops.forEach(item => {
        const hasItineraryImage = item.itineraryImageUrl && item.itineraryImageUrl.trim() !== '';
        const hasLocationImage = item.locationImageUrl && item.locationImageUrl.trim() !== '';

        if (hasItineraryImage && hasLocationImage) {
          // Add location image as well (itinerary image already added in Priority 1)
          images.push(item.locationImageUrl!);
        }
      });
    }

    // Priority 4: Sea day images as last resort
    if (images.length < MIN_IMAGES) {
      seaDays.forEach(item => {
        if (item.imageUrl && item.imageUrl.trim() !== '') {
          images.push(item.imageUrl);
        }
      });
    }

    // Remove duplicates while preserving order
    return Array.from(new Set(images));
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // LEGACY: Hardcoded images removed - now using dynamic buildCarouselImages() logic
  // All cruise images are now pulled from database (itinerary + locations tables)

  // Dragstar cruise artist images - all square with varying sizes
  const dragstarImages = [
    {
      url: 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/talent/alyssa_ecvvvx.jpg',
      name: 'Alyssa Edwards',
      size: 16.2, // rem
    },
    {
      url: 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/talent/bianca_jh9ojg.jpg',
      name: 'Bianca del Rio',
      size: 13.5,
    },
    {
      url: 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/talent/bob_sl4ox8.jpg',
      name: 'Bob the Drag Queen',
      size: 18,
    },
    {
      url: 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/talent/jackie_eheucy.jpg',
      name: 'Jackie Cox',
      size: 14.4,
    },
    {
      url: 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/talent/plasma_g6ajyj.jpg',
      name: 'Plasma',
      size: 15.3,
    },
    {
      url: 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/talent/sugar_vpd0ut.jpg',
      name: 'Spice',
      size: 12.6,
    },
    {
      url: 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/talent/sugar_vpd0ut.jpg',
      name: 'Sugar',
      size: 17.1,
    },
    {
      url: 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/talent/trinity_pxalyq.jpg',
      name: 'Trinity the Tuck',
      size: 15.8,
    },
  ];

  // Size variants for visual variety in desktop carousel
  const sizeVariants = [
    { height: '16.2rem', width: '21.6rem' }, // Standard
    { height: '14.4rem', width: '19.2rem' }, // Shorter
    { height: '18rem', width: '24rem' }, // Taller/wider
    { height: '15.3rem', width: '20.4rem' }, // Medium
    { height: '13.5rem', width: '18rem' }, // Small
    { height: '17.1rem', width: '22.8rem' }, // Tall
    { height: '15.8rem', width: '21rem' }, // Medium-tall
    { height: '12.6rem', width: '16.8rem' }, // Very small
  ];

  const isDragstarCruise = slug === 'drag-stars-at-sea';

  // Build carousel images dynamically based on trip type and itinerary data
  const dynamicImages = buildCarouselImages(itinerary, tripType);

  // Use dynamic images - no more hardcoded fallbacks
  const images = dynamicImages;

  useEffect(() => {
    if (scrollRef.current) {
      const width = scrollRef.current.scrollWidth / 2;
      setScrollWidth(width);
    }
  }, []);

  // Rotate images on mobile
  useEffect(() => {
    const imageCount = isDragstarCruise ? dragstarImages.length : images.length;
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % imageCount);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [isDragstarCruise, images.length, dragstarImages.length]);

  return (
    <section
      className={`flex flex-1 flex-col gap-8 overflow-x-hidden ${isNative ? 'pt-32' : 'pt-20'} sm:pt-20 lg:pt-20`}
    >
      {/* Hero Content - Mobile */}
      <div className="sm:hidden mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 text-center pb-6">
        <div className="flex items-center justify-center gap-2.5 pt-3 flex-wrap w-full">
          {/* Charter Logo - Left side */}
          {charterCompanyLogo && (
            <img
              src={charterCompanyLogo}
              alt={charterCompanyName || 'Charter Company'}
              className={`w-auto object-contain ${charterCompanyName?.toLowerCase().includes('drag') ? 'h-12' : 'h-8'}`}
              loading="lazy"
            />
          )}
          <Badge className="rounded-full bg-blue-500/30 text-white border-blue-400/50 text-xs whitespace-nowrap">
            {tripType === 'cruise'
              ? 'Interactive Cruise Guide'
              : tripType === 'resort'
                ? 'Interactive Resort Guide'
                : 'Interactive Travel Guide'}
          </Badge>
          <Badge className="rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-400/50 text-xs font-semibold whitespace-nowrap px-2.5 py-0.5">
            BETA
          </Badge>
        </div>

        <h1 className="text-2xl leading-[1.29167] font-bold text-balance text-white flex items-end justify-center gap-3 flex-wrap w-full px-2">
          <span>
            <span className="relative">
              {firstWord}
              <svg
                width="223"
                height="12"
                viewBox="0 0 223 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-x-0 bottom-0 w-full translate-y-1/2"
              >
                <defs>
                  <linearGradient id="rainbow-gradient-mobile" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="16.67%" stopColor="#f97316" />
                    <stop offset="33.33%" stopColor="#eab308" />
                    <stop offset="50%" stopColor="#22c55e" />
                    <stop offset="66.67%" stopColor="#3b82f6" />
                    <stop offset="83.33%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                <path
                  d="M1.11716 10.428C39.7835 4.97282 75.9074 2.70494 114.894 1.98894C143.706 1.45983 175.684 0.313587 204.212 3.31596C209.925 3.60546 215.144 4.59884 221.535 5.74551"
                  stroke="url(#rainbow-gradient-mobile)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>{' '}
            {remainingWords}
          </span>
        </h1>

        {/* Trip Dates - Mobile */}
        {tripDates && <p className="text-white/60 text-xs font-medium -mt-4">{tripDates}</p>}

        {/* Mobile carousel/image display */}
        <div className="relative w-full max-w-xs aspect-square overflow-hidden rounded-lg">
          {isDragstarCruise
            ? /* Single rotating image for Drag Cruise - Mobile */
              dragstarImages.map((img, index) => (
                <img
                  key={img.url}
                  src={img.url}
                  alt={img.name}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                    index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                  loading="lazy"
                />
              ))
            : /* Single rotating image for other trips - Mobile */
              images.map((img, index) => (
                <img
                  key={img}
                  src={img}
                  alt={`Destination ${index + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                    index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                  loading="lazy"
                />
              ))}
        </div>
      </div>

      {/* Hero Content - Desktop/Tablet */}
      <div className="hidden sm:flex mx-auto max-w-3xl flex-col items-center gap-8 px-4 text-center sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          {/* Charter Logo - Left side */}
          {charterCompanyLogo && (
            <img
              src={charterCompanyLogo}
              alt={charterCompanyName || 'Charter Company'}
              className={`w-auto object-contain ${charterCompanyName?.toLowerCase().includes('drag') ? 'h-12' : 'h-8'}`}
              loading="lazy"
            />
          )}
          <Badge className="rounded-full bg-blue-500/30 text-white border-blue-400/50">
            {tripType === 'cruise'
              ? 'Interactive Cruise Guide'
              : tripType === 'resort'
                ? 'Interactive Resort Guide'
                : 'Interactive Travel Guide'}
          </Badge>
          <Badge className="rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-400/50 text-xs font-semibold whitespace-nowrap px-2.5 py-0.5">
            BETA
          </Badge>
        </div>

        <h1 className="text-2xl leading-[1.29167] font-bold text-balance sm:text-3xl lg:text-4xl text-white flex items-end justify-center gap-3 flex-wrap">
          <span>
            <span className="relative">
              {firstWord}
              <svg
                width="223"
                height="12"
                viewBox="0 0 223 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-x-0 bottom-0 w-full translate-y-1/2"
              >
                <defs>
                  <linearGradient id="rainbow-gradient-desktop" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="16.67%" stopColor="#f97316" />
                    <stop offset="33.33%" stopColor="#eab308" />
                    <stop offset="50%" stopColor="#22c55e" />
                    <stop offset="66.67%" stopColor="#3b82f6" />
                    <stop offset="83.33%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                <path
                  d="M1.11716 10.428C39.7835 4.97282 75.9074 2.70494 114.894 1.98894C143.706 1.45983 175.684 0.313587 204.212 3.31596C209.925 3.60546 215.144 4.59884 221.535 5.74551"
                  stroke="url(#rainbow-gradient-desktop)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>{' '}
            {remainingWords}
          </span>
        </h1>

        {/* Trip Dates - Desktop/Tablet */}
        {tripDates && <p className="text-white/60 text-sm font-medium -mt-6">{tripDates}</p>}

        <p className="text-white">{tripDescription}</p>
      </div>

      {/* Scrolling Images - Desktop/Tablet only */}
      <div className="relative w-full overflow-hidden hidden sm:block">
        <div
          ref={scrollRef}
          className="flex items-end animate-scroll"
          style={{ width: 'fit-content' }}
        >
          {isDragstarCruise ? (
            <>
              {/* First set of 8 Dragstar artist images - all square but varying sizes */}
              {dragstarImages.map(img => (
                <img
                  key={img.url}
                  src={img.url}
                  alt={img.name}
                  className="object-cover flex-shrink-0 mx-2 rounded-lg"
                  style={{
                    height: `${img.size}rem`,
                    width: `${img.size}rem`,
                  }}
                  loading="lazy"
                />
              ))}
              {/* Duplicate set for seamless loop */}
              {dragstarImages.map(img => (
                <img
                  key={`${img.url}-duplicate`}
                  src={img.url}
                  alt={img.name}
                  className="object-cover flex-shrink-0 mx-2 rounded-lg"
                  style={{
                    height: `${img.size}rem`,
                    width: `${img.size}rem`,
                  }}
                  loading="lazy"
                />
              ))}
            </>
          ) : (
            <>
              {/* Dynamic images from database with varying sizes */}
              {images.map((img, index) => {
                const sizeVariant = sizeVariants[index % sizeVariants.length];
                return (
                  <img
                    key={img}
                    src={img}
                    alt={`Destination ${index + 1}`}
                    className="object-cover flex-shrink-0 mx-2 rounded-lg"
                    style={{
                      height: sizeVariant.height,
                      width: sizeVariant.width,
                    }}
                    loading="lazy"
                  />
                );
              })}
              {/* Duplicate set for seamless loop */}
              {images.map((img, index) => {
                const sizeVariant = sizeVariants[index % sizeVariants.length];
                return (
                  <img
                    key={`${img}-duplicate`}
                    src={img}
                    alt={`Destination ${index + 1}`}
                    className="object-cover flex-shrink-0 mx-2 rounded-lg"
                    style={{
                      height: sizeVariant.height,
                      width: sizeVariant.width,
                    }}
                    loading="lazy"
                  />
                );
              })}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-${scrollWidth}px);
          }
        }

        @keyframes scrollMobile {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: scroll 75s linear infinite;
          display: flex;
        }

        .animate-scroll-mobile {
          animation: scrollMobile 10s linear infinite;
          display: flex;
        }

        /* Hide scrollbar but keep scroll functionality */
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
