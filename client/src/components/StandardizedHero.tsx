import React from 'react';
import { getOptimizedImageUrl, IMAGE_PRESETS } from '@/lib/image-utils';

interface StandardizedHeroProps {
  variant: 'landing' | 'trip';
  tripImageUrl?: string;
  children: React.ReactNode;
}

export function StandardizedHero({ variant, tripImageUrl, children }: StandardizedHeroProps) {
  // Optimize hero images for faster loading
  const optimizedHeroUrl = tripImageUrl
    ? getOptimizedImageUrl(tripImageUrl, IMAGE_PRESETS.hero)
    : undefined;

  return (
    <header className="relative overflow-hidden text-white fixed top-0 left-0 right-0 z-40 pt-[15px] pb-[24px]">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20 z-10"></div>
        {variant === 'landing' ? (
          // Wave pattern background for landing page
          <div className="cruise-gradient wave-pattern bg-ocean-600 w-full h-full"></div>
        ) : // Trip image background for trip guide
        optimizedHeroUrl ? (
          <img src={optimizedHeroUrl} alt="Trip Hero" className="w-full h-full object-cover" />
        ) : (
          <img
            src="/images/ships/resilient-lady-hero.jpg"
            alt="Default Trip Ship"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Content with frosted glass background */}
      <div className="relative z-20">
        <div className="max-w-7xl mx-auto px-4 py-1">
          <div className="w-full">{children}</div>
        </div>
      </div>
    </header>
  );
}
