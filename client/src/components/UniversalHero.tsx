import React from "react";

interface UniversalHeroProps {
  variant: 'landing' | 'trip';
  tripImageUrl?: string;
  title: string;
  subtitle: string;
  additionalInfo?: string;
  tabSection: React.ReactNode;
}

export function UniversalHero({
  variant,
  tripImageUrl,
  title,
  subtitle,
  additionalInfo,
  tabSection
}: UniversalHeroProps) {
  return (
    <header className="relative overflow-hidden text-white fixed top-[18px] left-0 right-0 z-40 h-[250px]">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        {variant === 'landing' ? (
          // Wave pattern background for landing page
          <div className="cruise-gradient wave-pattern bg-ocean-600 w-full h-full"></div>
        ) : (
          // Trip image background for trip guide
          tripImageUrl ? (
            <img
              src={tripImageUrl}
              alt="Trip Hero"
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src="/images/ships/resilient-lady-hero.jpg"
              alt="Default Trip Ship"
              className="w-full h-full object-cover"
            />
          )
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20 z-10"></div>
      </div>

      {/* Content Layer */}
      <div className="relative z-20 h-full flex flex-col">
        {/* Flexible spacer to center title */}
        <div className="flex-1"></div>

        {/* Title Section - Centered between top and tabs */}
        <div className="flex-shrink-0 text-center">
          <div className="inline-block bg-white/10 backdrop-blur-sm rounded-xl px-8 py-6 border border-white/20 shadow-lg">
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">
              {title}
            </h1>
            {subtitle && (
              <p className="text-white/90 text-lg font-medium drop-shadow-md">
                {subtitle}
              </p>
            )}
            {additionalInfo && (
              <p className="text-white/80 text-base font-medium drop-shadow-md mt-2">
                {additionalInfo}
              </p>
            )}
          </div>
        </div>

        {/* Flexible spacer to center title */}
        <div className="flex-1"></div>

        {/* Tab Section - 18px from bottom */}
        <div className="flex-shrink-0 px-4 pb-[18px]">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center">
              {tabSection}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}