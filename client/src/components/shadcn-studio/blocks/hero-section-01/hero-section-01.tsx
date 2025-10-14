import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';

interface HeroSectionProps {
  tripName?: string;
  tripDescription?: string;
  tripType?: 'cruise' | 'resort' | null;
  charterCompanyLogo?: string | null;
  charterCompanyName?: string | null;
  slug?: string;
}

const HeroSection = ({
  tripName = 'Your Next Adventure',
  tripDescription = 'An exciting adventure awaits',
  tripType = null,
  charterCompanyLogo = null,
  charterCompanyName = null,
  slug = '',
}: HeroSectionProps) => {
  // Split trip name into words
  const words = tripName.split(' ');
  const firstWord = words[0];
  const remainingWords = words.slice(1).join(' ');

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

  // Select the appropriate image set
  const images = isHalloweenCruise ? halloweenImages : greekImages;

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
          {isHalloweenCruise && <span className="text-3xl">🎃</span>}
        </h1>

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
          {isHalloweenCruise && <span className="text-4xl sm:text-5xl lg:text-6xl">🎃</span>}
        </h1>

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
