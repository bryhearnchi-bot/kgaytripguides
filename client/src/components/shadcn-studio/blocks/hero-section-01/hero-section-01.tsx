import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';

interface ItineraryImage {
  imageUrl?: string;
  locationName?: string;
  port?: string;
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
  // Split trip name into words
  const words = tripName.split(' ');
  const firstWord = words[0];
  const remainingWords = words.slice(1).join(' ');

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

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Greek Isles cruise images (from locations table)
  const greekImages = [
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/athens-greece.png',
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/santorini-greece.png',
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/kusadasi-turkey.png',
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/istanbul-turkey.png',
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/mykonos-greece.png',
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/iraklion-crete.png',
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/alexandria-egypt.png',
  ];

  // Halloween cruise images (from locations table)
  const halloweenImages = [
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/miami-1.webp',
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/key-west.png',
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-3e8a6ad5-dff9-47b9-8559-4f59c071b785.jpg', // Puerto Plata
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-545c03d8-168e-4fb7-b351-b56051b83a0c.jpg', // Grand Turk
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/bimini.avif',
  ];

  // Hong Kong to Singapore cruise images (from itinerary table)
  const hongKongImages = [
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-cda156ea-cc8a-4e0c-bc46-c20fda1486f1.jpg', // Hong Kong
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-db73e1a1-1bd3-42b0-8d52-a8e069f194e0.jpg', // Halong Bay
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-7801fc25-0d2e-447e-ba5d-8eaadd494ade.jpg', // Chan May
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-37d542fa-acc3-467f-9308-17ea92cf9d81.jpg', // Phu My
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-b6595f31-90dc-4238-92f8-f7297d4af4ee.jpg', // Bangkok
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-40448315-a849-405f-bca3-4703c9a8f251.jpg', // Ko Samui
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-e7545ce4-aa9d-4f2c-9953-1d3c75fd07f3.jpg', // Singapore
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-63abf100-e259-4480-8d0d-13fa0d21f3d3.jpg', // Hanoi
  ];

  // Tahiti cruise images (from locations table)
  const tahitiImages = [
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-17245acc-fa05-4232-8781-4bef3c34ab2d.jpg', // Papeete
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-f94c7de5-554e-4fc8-a9f1-1a2f0f96d592.jpg', // Moorea
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-08f630a0-be59-4a3f-8d57-966b2e0ff9ff.jpg', // Bora Bora
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-2caa2223-e8f8-4c8e-a3f0-7be8d00c7cdb.jpg', // Raiatea
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-60e72a89-fc00-4828-9582-5bdc1e99f31b.jpg', // Huahine
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-8d34661c-97b5-4748-8095-b5830ffa2c20.jpg', // Rangiroa
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-bb018b6b-bb96-4da2-b763-fb95755fc3c4.jpg', // Fakarava
  ];

  // Tropical Americas cruise images (from locations table)
  const tropicalAmericasImages = [
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-d2a6b93e-d1e9-4154-ab2e-f0fec5cc3645.jpg', // Costa Maya
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-7231eca8-1549-40be-9326-2509647262bd.jpg', // Puerto Limon
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-9fcc43a7-2816-437e-8183-e20cbb2b456f.jpg', // Colon
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-06d21593-7a21-4225-b73f-3974bd6895ce.jpg', // Cartagena
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-92dbb981-c39f-4061-b664-511c42bd4276.jpg', // Oranjestad
  ];

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

  const isDragstarCruise = slug === 'drag-stars-at-sea';
  const isHalloweenCruise = slug === 'halloween-carribean-cruise';
  const isGreekCruise = slug === 'greek-isles-egypt-med-cruise';
  const isHongKongCruise = slug === 'hong-kong-to-singapore-cruise-2025';
  const isTahitiCruise = slug === 'new-years-tahiti-cruise-2025';
  const isTropicalAmericasCruise = slug === 'tropical-americas-2026';

  // Extract images from itinerary (prioritize itinerary-specific images)
  // Filter out entries without images and entries that are just sea days
  const dynamicImages = itinerary
    .filter(item => item.imageUrl && item.imageUrl.trim() !== '')
    .map(item => item.imageUrl!);

  // Select the appropriate image set
  // Priority: 1) Dynamic itinerary images, 2) Hardcoded cruise-specific images
  const images =
    dynamicImages.length > 0
      ? dynamicImages
      : isHalloweenCruise
        ? halloweenImages
        : isHongKongCruise
          ? hongKongImages
          : isTahitiCruise
            ? tahitiImages
            : isTropicalAmericasCruise
              ? tropicalAmericasImages
              : greekImages;

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
    <section className="flex flex-1 flex-col gap-8 overflow-x-hidden pt-4 sm:pt-8 lg:pt-12">
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
        </div>

        <h1 className="text-2xl leading-[1.29167] font-bold text-balance text-white flex items-end justify-center gap-3 flex-wrap w-full px-2">
          {isHalloweenCruise && <span className="text-3xl">🎃</span>}
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
                <path
                  d="M1.11716 10.428C39.7835 4.97282 75.9074 2.70494 114.894 1.98894C143.706 1.45983 175.684 0.313587 204.212 3.31596C209.925 3.60546 215.144 4.59884 221.535 5.74551"
                  stroke="url(#paint0_linear_10365_68643)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear_10365_68643"
                    x1="18.8541"
                    y1="3.72033"
                    x2="42.6487"
                    y2="66.6308"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="var(--primary)" />
                    <stop offset="1" stopColor="var(--primary-foreground)" />
                  </linearGradient>
                </defs>
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
        </div>

        <h1 className="text-2xl leading-[1.29167] font-bold text-balance sm:text-3xl lg:text-4xl text-white flex items-end justify-center gap-3 flex-wrap">
          {isHalloweenCruise && <span className="text-4xl sm:text-5xl lg:text-6xl">🎃</span>}
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
                <path
                  d="M1.11716 10.428C39.7835 4.97282 75.9074 2.70494 114.894 1.98894C143.706 1.45983 175.684 0.313587 204.212 3.31596C209.925 3.60546 215.144 4.59884 221.535 5.74551"
                  stroke="url(#paint0_linear_10365_68643)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear_10365_68643"
                    x1="18.8541"
                    y1="3.72033"
                    x2="42.6487"
                    y2="66.6308"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="var(--primary)" />
                    <stop offset="1" stopColor="var(--primary-foreground)" />
                  </linearGradient>
                </defs>
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
          ) : isHalloweenCruise ? (
            <>
              {/* First set of 5 Halloween images */}
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/miami-1.webp"
                alt="Miami, FL"
                className="h-[16.2rem] w-[21.6rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/key-west.png"
                alt="Key West, FL"
                className="h-[14.4rem] w-[19.2rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-3e8a6ad5-dff9-47b9-8559-4f59c071b785.jpg"
                alt="Puerto Plata"
                className="h-[18rem] w-[24rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-545c03d8-168e-4fb7-b351-b56051b83a0c.jpg"
                alt="Grand Turk"
                className="h-[15.3rem] w-[20.4rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/bimini.avif"
                alt="Bimini"
                className="h-[13.5rem] w-[18rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              {/* Duplicate set for seamless loop */}
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/miami-1.webp"
                alt="Miami, FL"
                className="h-[16.2rem] w-[21.6rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/key-west.png"
                alt="Key West, FL"
                className="h-[14.4rem] w-[19.2rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-3e8a6ad5-dff9-47b9-8559-4f59c071b785.jpg"
                alt="Puerto Plata"
                className="h-[18rem] w-[24rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-545c03d8-168e-4fb7-b351-b56051b83a0c.jpg"
                alt="Grand Turk"
                className="h-[15.3rem] w-[20.4rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/bimini.avif"
                alt="Bimini"
                className="h-[13.5rem] w-[18rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
            </>
          ) : isHongKongCruise ? (
            <>
              {/* First set of 8 Hong Kong to Singapore images */}
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-cda156ea-cc8a-4e0c-bc46-c20fda1486f1.jpg"
                alt="Hong Kong"
                className="h-[16.2rem] w-[21.6rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-db73e1a1-1bd3-42b0-8d52-a8e069f194e0.jpg"
                alt="Halong Bay"
                className="h-[14.4rem] w-[19.2rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-7801fc25-0d2e-447e-ba5d-8eaadd494ade.jpg"
                alt="Chan May"
                className="h-[18rem] w-[24rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-37d542fa-acc3-467f-9308-17ea92cf9d81.jpg"
                alt="Phu My"
                className="h-[15.3rem] w-[20.4rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-b6595f31-90dc-4238-92f8-f7297d4af4ee.jpg"
                alt="Bangkok"
                className="h-[13.5rem] w-[18rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-40448315-a849-405f-bca3-4703c9a8f251.jpg"
                alt="Ko Samui"
                className="h-[17.1rem] w-[22.8rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-e7545ce4-aa9d-4f2c-9953-1d3c75fd07f3.jpg"
                alt="Singapore"
                className="h-[15.8rem] w-[21rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-63abf100-e259-4480-8d0d-13fa0d21f3d3.jpg"
                alt="Hanoi"
                className="h-[12.6rem] w-[18rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              {/* Duplicate set for seamless loop */}
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-cda156ea-cc8a-4e0c-bc46-c20fda1486f1.jpg"
                alt="Hong Kong"
                className="h-[16.2rem] w-[21.6rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-db73e1a1-1bd3-42b0-8d52-a8e069f194e0.jpg"
                alt="Halong Bay"
                className="h-[14.4rem] w-[19.2rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-7801fc25-0d2e-447e-ba5d-8eaadd494ade.jpg"
                alt="Chan May"
                className="h-[18rem] w-[24rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-37d542fa-acc3-467f-9308-17ea92cf9d81.jpg"
                alt="Phu My"
                className="h-[15.3rem] w-[20.4rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-b6595f31-90dc-4238-92f8-f7297d4af4ee.jpg"
                alt="Bangkok"
                className="h-[13.5rem] w-[18rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-40448315-a849-405f-bca3-4703c9a8f251.jpg"
                alt="Ko Samui"
                className="h-[17.1rem] w-[22.8rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-e7545ce4-aa9d-4f2c-9953-1d3c75fd07f3.jpg"
                alt="Singapore"
                className="h-[15.8rem] w-[21rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/general/general-63abf100-e259-4480-8d0d-13fa0d21f3d3.jpg"
                alt="Hanoi"
                className="h-[12.6rem] w-[18rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
            </>
          ) : isTahitiCruise ? (
            <>
              {/* First set of 7 Tahiti images */}
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-17245acc-fa05-4232-8781-4bef3c34ab2d.jpg"
                alt="Papeete"
                className="h-[16.2rem] w-[21.6rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-f94c7de5-554e-4fc8-a9f1-1a2f0f96d592.jpg"
                alt="Moorea"
                className="h-[14.4rem] w-[19.2rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-08f630a0-be59-4a3f-8d57-966b2e0ff9ff.jpg"
                alt="Bora Bora"
                className="h-[18rem] w-[24rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-2caa2223-e8f8-4c8e-a3f0-7be8d00c7cdb.jpg"
                alt="Raiatea"
                className="h-[15.3rem] w-[20.4rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-60e72a89-fc00-4828-9582-5bdc1e99f31b.jpg"
                alt="Huahine"
                className="h-[13.5rem] w-[18rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-8d34661c-97b5-4748-8095-b5830ffa2c20.jpg"
                alt="Rangiroa"
                className="h-[17.1rem] w-[22.8rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-bb018b6b-bb96-4da2-b763-fb95755fc3c4.jpg"
                alt="Fakarava"
                className="h-[15.8rem] w-[21rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              {/* Duplicate set for seamless loop */}
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-17245acc-fa05-4232-8781-4bef3c34ab2d.jpg"
                alt="Papeete"
                className="h-[16.2rem] w-[21.6rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-f94c7de5-554e-4fc8-a9f1-1a2f0f96d592.jpg"
                alt="Moorea"
                className="h-[14.4rem] w-[19.2rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-08f630a0-be59-4a3f-8d57-966b2e0ff9ff.jpg"
                alt="Bora Bora"
                className="h-[18rem] w-[24rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-2caa2223-e8f8-4c8e-a3f0-7be8d00c7cdb.jpg"
                alt="Raiatea"
                className="h-[15.3rem] w-[20.4rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-60e72a89-fc00-4828-9582-5bdc1e99f31b.jpg"
                alt="Huahine"
                className="h-[13.5rem] w-[18rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-8d34661c-97b5-4748-8095-b5830ffa2c20.jpg"
                alt="Rangiroa"
                className="h-[17.1rem] w-[22.8rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-bb018b6b-bb96-4da2-b763-fb95755fc3c4.jpg"
                alt="Fakarava"
                className="h-[15.8rem] w-[21rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
            </>
          ) : isTropicalAmericasCruise ? (
            <>
              {/* First set of 5 Tropical Americas images */}
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-d2a6b93e-d1e9-4154-ab2e-f0fec5cc3645.jpg"
                alt="Costa Maya"
                className="h-[16.2rem] w-[21.6rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-7231eca8-1549-40be-9326-2509647262bd.jpg"
                alt="Puerto Limon"
                className="h-[14.4rem] w-[19.2rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-9fcc43a7-2816-437e-8183-e20cbb2b456f.jpg"
                alt="Colon"
                className="h-[18rem] w-[24rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-06d21593-7a21-4225-b73f-3974bd6895ce.jpg"
                alt="Cartagena"
                className="h-[12.6rem] w-[16.8rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-92dbb981-c39f-4061-b664-511c42bd4276.jpg"
                alt="Oranjestad"
                className="h-[15.3rem] w-[20.4rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              {/* Duplicate set for seamless loop */}
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-d2a6b93e-d1e9-4154-ab2e-f0fec5cc3645.jpg"
                alt="Costa Maya"
                className="h-[16.2rem] w-[21.6rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-7231eca8-1549-40be-9326-2509647262bd.jpg"
                alt="Puerto Limon"
                className="h-[14.4rem] w-[19.2rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-9fcc43a7-2816-437e-8183-e20cbb2b456f.jpg"
                alt="Colon"
                className="h-[18rem] w-[24rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-06d21593-7a21-4225-b73f-3974bd6895ce.jpg"
                alt="Cartagena"
                className="h-[12.6rem] w-[16.8rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/locations/locations-92dbb981-c39f-4061-b664-511c42bd4276.jpg"
                alt="Oranjestad"
                className="h-[15.3rem] w-[20.4rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
            </>
          ) : (
            <>
              {/* First set of 7 Greek images */}
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/athens-greece.png"
                alt="Athens, Greece"
                className="h-[12.6rem] w-[18rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/santorini-greece.png"
                alt="Santorini, Greece"
                className="h-[16.2rem] w-[21.6rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/kusadasi-turkey.png"
                alt="Kuşadası, Turkey"
                className="h-[14.4rem] w-[16.2rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/istanbul-turkey.png"
                alt="Istanbul, Turkey"
                className="h-[18rem] w-[19.8rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/mykonos-greece.png"
                alt="Mykonos, Greece"
                className="h-[15rem] w-[20rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/iraklion-crete.png"
                alt="Iraklion, Crete"
                className="h-[13.5rem] w-[14.4rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/alexandria-egypt.png"
                alt="Alexandria, Egypt"
                className="h-[15.3rem] w-[23.4rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              {/* Duplicate set for seamless loop */}
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/athens-greece.png"
                alt="Athens, Greece"
                className="h-[12.6rem] w-[18rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/santorini-greece.png"
                alt="Santorini, Greece"
                className="h-[16.2rem] w-[21.6rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/kusadasi-turkey.png"
                alt="Kuşadası, Turkey"
                className="h-[14.4rem] w-[16.2rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/istanbul-turkey.png"
                alt="Istanbul, Turkey"
                className="h-[18rem] w-[19.8rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/mykonos-greece.png"
                alt="Mykonos, Greece"
                className="h-[15rem] w-[20rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/iraklion-crete.png"
                alt="Iraklion, Crete"
                className="h-[13.5rem] w-[14.4rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
              <img
                src="https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/itinerary/alexandria-egypt.png"
                alt="Alexandria, Egypt"
                className="h-[15.3rem] w-[23.4rem] object-cover flex-shrink-0 mx-2 rounded-lg"
                loading="lazy"
              />
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
