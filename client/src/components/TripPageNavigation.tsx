import React, { useState } from 'react';
import {
  ArrowLeft,
  Share2,
  LayoutDashboard,
  Map,
  CalendarDays,
  Star,
  Info,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useHaptics } from '@/hooks/useHaptics';
import { ShareMenu } from '@/components/ShareMenu';
import { cn } from '@/lib/utils';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { useLocation } from 'wouter';
import {
  Sheet,
  SheetContent,
  SheetPortal,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import Settings from '@/pages/settings';

interface TripPageNavigationProps {
  charterCompanyLogo?: string | null;
  charterCompanyName?: string | null;
  tripType?: 'cruise' | 'resort' | null;
  tripSlug?: string | null;
  tripName?: string | null;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isCruise?: boolean;
}

/**
 * TripPageNavigation - Custom navigation bar for direct trip page URLs
 *
 * Features:
 * - Back button (arrow) instead of X
 * - Charter company logo in center on mobile, left on desktop
 * - Trip type badge
 * - Desktop: expanded menu items (Overview, Itinerary, Events, Talent, Info)
 * - Frosted glass background matching fly-up menu
 * - Shown on all screen sizes
 */
export function TripPageNavigation({
  charterCompanyLogo = null,
  charterCompanyName = null,
  tripType = null,
  tripSlug = null,
  tripName = null,
  activeTab,
  onTabChange,
  isCruise,
}: TripPageNavigationProps) {
  const haptics = useHaptics();
  const { user, profile } = useSupabaseAuthContext();
  const [, setLocation] = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Check if user can edit trips (on a trip page with admin rights)
  const canEditTrip =
    profile?.role && ['super_admin', 'content_manager', 'admin'].includes(profile.role);

  const handleBack = () => {
    haptics.light();
    // Use browser history to go back to previous page (landing or past-trips)
    window.history.back();
  };

  const handleSettingsClick = () => {
    haptics.light();
    setSettingsOpen(true);
  };

  const handleEditTrip = () => {
    // Dispatch event for trip-guide component to open the modal
    window.dispatchEvent(new CustomEvent('request-edit-trip'));
    // Close settings sheet
    setSettingsOpen(false);
  };

  const handleNavigateFromSheet = (path: string) => {
    // Close the Sheet first
    setSettingsOpen(false);
    // Then navigate after a brief delay to allow Sheet to close
    setTimeout(() => {
      setLocation(path);
    }, 100);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] pt-[env(safe-area-inset-top)] bg-white/10 backdrop-blur-lg">
      <div className="px-3 sm:px-4 py-2 flex items-center justify-between">
        {/* Left side - Back button + Logo/Badge (logo/badge only on desktop) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="text-white hover:text-white/70 transition-colors p-2"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Logo and badge - Center on mobile, left on desktop */}
          <div className="hidden xl:flex items-center gap-2">
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
        </div>

        {/* Center - Charter logo and badge (mobile only) */}
        <div className="flex xl:hidden items-center gap-2">
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

        {/* Right side - Menu items (desktop only) + Share button */}
        <div className="flex items-center gap-1">
          {/* Desktop Menu Items */}
          {activeTab && onTabChange && (
            <div className="hidden xl:flex items-center gap-1 mr-2">
              <button
                onClick={() => {
                  haptics.light();
                  onTabChange('overview');
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium',
                  activeTab === 'overview'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => {
                  haptics.light();
                  onTabChange('itinerary');
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium',
                  activeTab === 'itinerary'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                <Map className="w-4 h-4" />
                <span>Itinerary</span>
              </button>

              <button
                onClick={() => {
                  haptics.light();
                  onTabChange('events');
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium',
                  activeTab === 'events'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                <CalendarDays className="w-4 h-4" />
                <span>Events</span>
              </button>

              <button
                onClick={() => {
                  haptics.light();
                  onTabChange('talent');
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium',
                  activeTab === 'talent'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                <Star className="w-4 h-4" />
                <span>Talent</span>
              </button>

              <button
                onClick={() => {
                  haptics.light();
                  onTabChange('info');
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium',
                  activeTab === 'info'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                <Info className="w-4 h-4" />
                <span>Info</span>
              </button>

              <button
                onClick={handleSettingsClick}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium',
                  settingsOpen
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                <User
                  className={cn(
                    'w-4 h-4',
                    settingsOpen && user
                      ? 'fill-white stroke-white'
                      : user
                        ? 'fill-blue-600 stroke-blue-600'
                        : ''
                  )}
                />
                <span>Settings</span>
              </button>
            </div>
          )}

          {/* Share button */}
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

      {/* Settings Sheet - Desktop only */}
      <Sheet open={settingsOpen} modal={true} onOpenChange={setSettingsOpen}>
        <SheetPortal>
          <SheetContent
            side="right"
            className="w-[85%] sm:w-[480px] !top-[calc(env(safe-area-inset-top)+3.25rem)] !bottom-0 !h-auto !z-50 bg-[#001833] border-white/10 text-white overflow-y-auto [&>button]:top-4 !pt-2"
          >
            <VisuallyHidden>
              <SheetTitle>Settings</SheetTitle>
              <SheetDescription>Manage your preferences and account settings</SheetDescription>
            </VisuallyHidden>
            <div className="-mt-16">
              <Settings
                showEditTrip={canEditTrip}
                onEditTrip={handleEditTrip}
                onNavigate={handleNavigateFromSheet}
              />
            </div>
          </SheetContent>
        </SheetPortal>
      </Sheet>
    </div>
  );
}
