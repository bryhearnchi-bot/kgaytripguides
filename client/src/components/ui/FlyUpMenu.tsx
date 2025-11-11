import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface FlyUpMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  variant?: 'full' | 'half';
  className?: string;
  charterCompanyLogo?: string | null;
  charterCompanyName?: string | null;
  tripType?: 'cruise' | 'resort' | null;
  bottomNavigation?: React.ReactNode;
}

/**
 * FlyUpMenu - A full-screen or half-screen overlay component for mobile and tablet
 *
 * Variants:
 * - 'full': Takes over the entire viewport including navigation
 * - 'half': Takes up bottom half with rounded top corners
 *
 * Features:
 * - Slide-up animation
 * - Close button (X) in top-right
 * - Oxford Blue (#002147) background
 * - Mobile and tablet optimized
 */
export function FlyUpMenu({
  open,
  onOpenChange,
  children,
  variant = 'full',
  className,
  charterCompanyLogo = null,
  charterCompanyName = null,
  tripType = null,
  bottomNavigation = null,
}: FlyUpMenuProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;

      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = '';
        document.body.style.height = '';
      };
    }
  }, [open]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop for half variant */}
      {variant === 'half' && (
        <div
          className="fixed inset-0 bg-black/50 z-[9998] animate-in fade-in duration-200"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Custom Navigation Header - Rendered OUTSIDE scrollable container so it stays fixed */}
      <div className="xl:hidden fixed top-0 left-0 right-0 z-[10000] pt-[env(safe-area-inset-top)] bg-white/10 backdrop-blur-lg">
        <div className="px-3 sm:px-4 py-2 flex items-center justify-between">
          {/* Left side - Close button (X only) */}
          <button
            onClick={() => onOpenChange(false)}
            className="text-white hover:text-white/70 transition-colors p-2"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
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

          {/* Right side - Empty spacer for balance */}
          <div className="w-9"></div>
        </div>
      </div>

      {/* Desktop close button - Rendered OUTSIDE scrollable container */}
      <button
        onClick={() => onOpenChange(false)}
        className={cn(
          'hidden xl:block fixed z-[10000] p-3 rounded-full',
          'bg-white/10 backdrop-blur-lg border border-white/20',
          'hover:bg-white/20 transition-colors',
          'text-white',
          // Position based on variant
          variant === 'full' ? 'top-4 right-4' : 'top-4 right-4'
        )}
        aria-label="Close"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main fly-up container */}
      <div
        className={cn(
          'fixed z-[9999] bg-[#002147] overflow-auto',
          // Full variant - covers entire screen
          variant === 'full' && ['inset-0', 'animate-in slide-in-from-bottom duration-300'],
          // Half variant - bottom half with rounded top
          variant === 'half' && [
            'bottom-0 left-0 right-0 h-[50vh]',
            'rounded-t-3xl border-t border-white/20',
            'animate-in slide-in-from-bottom duration-300',
          ],
          className
        )}
      >
        {/* 30% black overlay for darkening effect - matching landing page */}
        <div className="fixed inset-0 bg-black/30 pointer-events-none z-0" />

        {/* Content */}
        <div
          className={cn(
            'w-full h-full relative z-10',
            variant === 'half' && 'pt-12' // Extra padding for half variant
          )}
        >
          {children}
        </div>
      </div>

      {/* Bottom Navigation - Rendered OUTSIDE the overflow-auto container so it stays truly fixed */}
      {bottomNavigation && bottomNavigation}
    </>
  );
}
