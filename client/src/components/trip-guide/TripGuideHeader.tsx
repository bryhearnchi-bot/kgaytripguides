import React from 'react';
import { AlertCircle } from 'lucide-react';

interface TripGuideHeaderProps {
  tripName: string;
  tripDates: string | null;
}

export const TripGuideHeader = React.memo(function TripGuideHeader({
  tripName,
  tripDates,
}: TripGuideHeaderProps) {
  const words = tripName.split(' ');
  const firstWord = words[0];
  const remainingWords = words.slice(1).join(' ');

  return (
    <div className="pt-4 pb-0">
      <div className="mx-auto max-w-3xl px-4 text-center">
        {/* Trip Name */}
        <h1 className="text-2xl leading-tight font-bold text-white flex items-end justify-center gap-3 flex-wrap sm:text-3xl lg:text-4xl">
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
                  <linearGradient id="rainbow-gradient-sticky" x1="0%" y1="0%" x2="100%" y2="0%">
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
                  stroke="url(#rainbow-gradient-sticky)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>{' '}
            {remainingWords}
          </span>
        </h1>

        {/* Trip Dates */}
        {tripDates && (
          <p className="text-white/60 text-xs font-medium mt-2 sm:text-sm">{tripDates}</p>
        )}

        {/* Pre-embarkation Disclaimer */}
        <div className="flex items-center justify-center gap-1.5 text-amber-300/70 text-[10px] mt-2">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <p>Pre-embarkation info only. Check your cruise line app for latest updates.</p>
        </div>
      </div>
    </div>
  );
});
