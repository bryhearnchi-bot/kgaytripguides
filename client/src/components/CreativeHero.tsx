import React, { useState, useEffect } from 'react';

interface CreativeHeroProps {
  title: string;
  subtitle: string;
  description: string;
  upcomingTripsCount?: number;
}

export function CreativeHero({
  title,
  subtitle,
  description,
  upcomingTripsCount,
}: CreativeHeroProps) {
  // Three images that will rotate every 4 seconds
  const images = [
    'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/trips/drag_stars_ngd64u.jpg',
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=80&auto=format',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80&auto=format',
  ];

  const [imageIndex, setImageIndex] = useState(0);

  // Rotate to next image every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex(prev => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          {/* Left Side - Content */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            {/* Floating Stats Badge */}
            {upcomingTripsCount !== undefined && upcomingTripsCount > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm mb-4 border border-white/20">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                Upcoming trips: {upcomingTripsCount}
              </div>
            )}

            <div className="inline-block mb-4">
              <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-ocean-200 text-sm font-medium border border-white/20">
                {subtitle}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
              {title}
            </h1>

            <p className="text-ocean-100 text-base mb-8 max-w-xl leading-relaxed">{description}</p>
          </div>

          {/* Right Side - Rotating Image */}
          <div className="relative w-full aspect-[5/3] overflow-hidden rounded-2xl shadow-2xl border-4 border-white/20">
            <img
              key={imageIndex}
              src={images[imageIndex]}
              alt="Featured trip"
              className="absolute inset-0 w-full h-full object-cover animate-fade-in"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none"></div>

            {/* Dot indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setImageIndex(index)}
                  className={`transition-all rounded-full ${
                    index === imageIndex
                      ? 'w-8 h-2 bg-white'
                      : 'w-2 h-2 bg-white/50 hover:bg-white/70'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </section>
  );
}
