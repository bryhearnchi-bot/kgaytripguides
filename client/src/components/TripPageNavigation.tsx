import React from 'react';
import { ArrowLeft, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { useHaptics } from '@/hooks/useHaptics';
import { ShareMenu } from '@/components/ShareMenu';

interface TripPageNavigationProps {
  charterCompanyLogo?: string | null;
  charterCompanyName?: string | null;
  tripType?: 'cruise' | 'resort' | null;
  tripSlug?: string | null;
  tripName?: string | null;
}

/**
 * TripPageNavigation - Custom navigation bar for direct trip page URLs
 *
 * Features:
 * - Back button (arrow) instead of X
 * - Charter company logo in center
 * - Trip type badge
 * - Frosted glass background matching fly-up menu
 * - Only shown on mobile/tablet (hidden on xl+)
 */
export function TripPageNavigation({
  charterCompanyLogo = null,
  charterCompanyName = null,
  tripType = null,
  tripSlug = null,
  tripName = null,
}: TripPageNavigationProps) {
  const [, setLocation] = useLocation();
  const haptics = useHaptics();

  const handleBack = () => {
    haptics.light();
    setLocation('/');
  };

  return (
    <div className="xl:hidden fixed top-0 left-0 right-0 z-[10000] pt-[env(safe-area-inset-top)] bg-white/10 backdrop-blur-lg">
      <div className="px-3 sm:px-4 py-2 flex items-center justify-between">
        {/* Left side - Back button */}
        <button
          onClick={handleBack}
          className="text-white hover:text-white/70 transition-colors p-2"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Center - Charter logo and badge */}
        <div className="flex items-center gap-2">
          {charterCompanyLogo && (
            <img
              src={charterCompanyLogo}
              alt={charterCompanyName || 'Charter Company'}
              className={`w-auto object-contain ${
                charterCompanyName?.toLowerCase().includes('atlantis')
                  ? 'h-5'
                  : charterCompanyName?.toLowerCase().includes('drag')
                    ? 'h-6'
                    : 'h-6'
              }`}
              loading="lazy"
            />
          )}
          <Badge className="rounded-full bg-blue-500/30 text-white border-blue-400/50 text-[10px] px-2 py-0 font-semibold whitespace-nowrap">
            {tripType === 'cruise'
              ? 'Interactive Cruise Guide'
              : tripType === 'resort'
                ? 'Interactive Resort Guide'
                : 'Interactive Travel Guide'}
          </Badge>
        </div>

        {/* Right side - Share button */}
        {tripSlug && tripName && (
          <ShareMenu tripSlug={tripSlug} tripName={tripName}>
            {({ onClick, isOpen }) => (
              <button
                onClick={() => {
                  haptics.light();
                  onClick();
                }}
                className="text-white hover:text-white/70 transition-colors p-2"
                aria-label="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
            )}
          </ShareMenu>
        )}
      </div>
    </div>
  );
}
