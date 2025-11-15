import React, { useState } from 'react';
import {
  ArrowLeft,
  Share2,
  Bell,
  Edit,
  LayoutDashboard,
  Map,
  CalendarDays,
  Star,
  Info,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useHaptics } from '@/hooks/useHaptics';
import { useShare } from '@/hooks/useShare';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { useLocation } from 'wouter';
import { FlyUpSheet } from '@/components/FlyUpSheet';
import Settings from '@/pages/settings';
import Alerts from '@/pages/alerts';
import { useUnreadAlerts } from '@/hooks/useUnreadAlerts';
import { isPWA } from '@/lib/capacitor';

interface TripPageNavigationProps {
  charterCompanyLogo?: string | null;
  charterCompanyName?: string | null;
  tripType?: 'cruise' | 'resort' | null;
  tripSlug?: string | null;
  tripName?: string | null;
  tripId?: number | null;
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
  tripId = null,
  activeTab,
  onTabChange,
  isCruise,
}: TripPageNavigationProps) {
  const haptics = useHaptics();
  const { user, profile } = useSupabaseAuthContext();
  const [, setLocation] = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { shareContent } = useShare();
  const { toast } = useToast();

  // Get unread alerts count for this specific trip
  const { unreadCount, refresh: refreshAlerts } = useUnreadAlerts(tripSlug || undefined);

  // Check if user can edit trips (on a trip page with admin rights)
  const canEditTrip =
    profile?.role && ['super_admin', 'content_manager', 'admin'].includes(profile.role);

  const handleBack = () => {
    haptics.light();

    // In PWA mode, use window.location to ensure iOS maintains PWA context
    if (isPWA()) {
      // Use window.location.href to force a full navigation that iOS recognizes
      // This prevents iOS from showing browser chrome
      window.location.href = '/?pwa=true';
      return;
    }

    // Non-PWA: use wouter for normal navigation
    setLocation('/');
  };

  const handleShareClick = async () => {
    if (!tripSlug || !tripName) return;

    // Always use the current site's origin (works for localhost, dev, and production)
    const tripUrl = `${window.location.origin}/trip/${tripSlug}`;

    try {
      await shareContent({
        title: tripName,
        text: `Check out this amazing LGBTQ+ travel guide: ${tripName}`,
        url: tripUrl,
        dialogTitle: `Share ${tripName}`,
      });
    } catch (error) {
      // If share fails, copy to clipboard
      try {
        await navigator.clipboard.writeText(tripUrl);
        toast({
          title: 'Link copied!',
          description: 'Trip guide link copied to clipboard',
        });
      } catch (clipboardError) {
        console.error('Failed to share or copy:', error, clipboardError);
      }
    }
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
    <div className="fixed top-0 left-0 right-0 z-[10000] pt-[env(safe-area-inset-top)] bg-[#002147]/90 backdrop-blur-lg">
      <div className="px-3 sm:px-4 lg:px-8 py-2 flex items-center justify-between">
        {/* Left side - Back button + Logo/Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleBack}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Logo and badge - Always on left side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {charterCompanyLogo && (
              <img
                src={charterCompanyLogo}
                alt={charterCompanyName || 'Charter Company'}
                className="h-5 sm:h-7 w-auto object-contain"
                loading="lazy"
              />
            )}
            <Badge className="rounded-full bg-blue-500/30 text-white border-blue-400/50 text-[10px] px-2 py-0 font-semibold whitespace-nowrap">
              {tripType === 'cruise'
                ? 'Cruise Guide'
                : tripType === 'resort'
                  ? 'Resort Guide'
                  : 'Travel Guide'}
            </Badge>
          </div>
        </div>

        {/* Right side - Mobile buttons + Desktop menu items */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile buttons - Edit, Share, Alerts, Settings (hidden on desktop) */}
          <div className="flex items-center gap-1 sm:gap-2 xl:hidden">
            {/* Edit button - Only for admins/content managers */}
            {canEditTrip && (
              <button
                onClick={() => {
                  haptics.light();
                  handleEditTrip();
                }}
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full text-white transition-colors hover:bg-white/10 active:bg-white/20 flex items-center justify-center"
                aria-label="Edit Trip"
              >
                <Edit className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* Share button */}
            {tripSlug && tripName && (
              <button
                onClick={() => {
                  haptics.light();
                  handleShareClick();
                }}
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full text-white transition-colors hover:bg-white/10 active:bg-white/20 flex items-center justify-center"
                aria-label="Share"
              >
                <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* Alerts button */}
            <button
              onClick={() => {
                haptics.light();
                setAlertsOpen(true);
              }}
              className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full text-white transition-colors hover:bg-white/10 active:bg-white/20 flex items-center justify-center"
              aria-label="Alerts"
            >
              <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Settings button */}
            <button
              onClick={() => {
                haptics.light();
                setSettingsOpen(true);
              }}
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full text-white transition-colors hover:bg-white/10 active:bg-white/20 flex items-center justify-center"
              aria-label="Settings"
            >
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Desktop Menu Items */}
          {activeTab && onTabChange && (
            <div className="hidden xl:flex items-center gap-1">
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
                <LayoutDashboard
                  className={cn('w-5 h-5', activeTab === 'overview' && '!text-blue-400')}
                />
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
                <Map className={cn('w-5 h-5', activeTab === 'itinerary' && '!text-blue-400')} />
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
                <CalendarDays
                  className={cn('w-5 h-5', activeTab === 'events' && '!text-blue-400')}
                />
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
                <Star className={cn('w-5 h-5', activeTab === 'talent' && '!text-blue-400')} />
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
                <Info className={cn('w-5 h-5', activeTab === 'info' && '!text-blue-400')} />
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
                    activeTab === 'settings' && '!text-blue-400',
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
        </div>
      </div>

      {/* Settings Sheet - Fly-up (bottom sheet) */}
      <FlyUpSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        icon={User}
        iconColor="text-blue-400"
        title="Settings"
        accessibleTitle="Settings"
        accessibleDescription="Manage your preferences and account settings"
      >
        <Settings
          showEditTrip={canEditTrip}
          onEditTrip={handleEditTrip}
          onNavigate={handleNavigateFromSheet}
        />
      </FlyUpSheet>

      {/* Alerts Sheet - Fly-up (bottom sheet) */}
      <FlyUpSheet
        open={alertsOpen}
        onOpenChange={setAlertsOpen}
        onClose={refreshAlerts}
        icon={Bell}
        iconColor="text-amber-400"
        title={`Alerts${tripSlug || tripId ? ' (This Trip)' : ' (All Trips)'}`}
        accessibleTitle="Trip Alerts"
        accessibleDescription="View trip updates and notifications"
      >
        <Alerts tripId={tripId || undefined} tripSlug={tripSlug || undefined} />
      </FlyUpSheet>
    </div>
  );
}
