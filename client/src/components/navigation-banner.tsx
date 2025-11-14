import { Link, useLocation } from 'wouter';
import { TreePalm, History, Star, Bell, User, RefreshCw, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { useUpdate } from '@/context/UpdateContext';
import { useState, useEffect } from 'react';
import { useShare } from '@/hooks/useShare';
import { useToast } from '@/hooks/use-toast';
import { useUnreadAlerts } from '@/hooks/useUnreadAlerts';
import { FlyUpSheet } from '@/components/FlyUpSheet';
import Alerts from '@/pages/alerts';
import Settings from '@/pages/settings';

export default function NavigationBanner() {
  const [currentLocation, setLocation] = useLocation();
  const { user, profile } = useSupabaseAuthContext();
  const { updateAvailable, isChecking, checkForUpdates, applyUpdate } = useUpdate();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { shareContent } = useShare();
  const { toast } = useToast();
  const { unreadCount, refresh: refreshAlerts } = useUnreadAlerts();

  // Determine active tab based on current location
  const getActiveTab = () => {
    if (currentLocation === '/') return 'home';
    if (currentLocation === '/past-trips') return 'past';
    if (currentLocation === '/my-stuff') return 'mystuff';
    if (currentLocation === '/alerts') return 'alerts';
    if (currentLocation === '/settings') return 'settings';
    return null;
  };

  const activeTab = getActiveTab();

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  const handleAlertsClick = () => {
    // Always open sheet on mobile (no navigation)
    setAlertsOpen(true);
  };

  // Refresh alerts count when alerts sheet is closed
  useEffect(() => {
    if (!alertsOpen) {
      refreshAlerts();
    }
  }, [alertsOpen, refreshAlerts]);

  const handleSettingsClick = () => {
    // Always open sheet on mobile (no navigation)
    setSettingsOpen(true);
  };

  const handleRefreshClick = async () => {
    if (updateAvailable) {
      // Apply the waiting update
      applyUpdate();
    } else {
      // Check for updates manually
      await checkForUpdates();
    }
  };

  const handleShareClick = async () => {
    // Always use the current site's origin (works for localhost, dev, and production)
    const siteUrl = window.location.origin;

    try {
      await shareContent({
        title: 'KGay Travel Guides',
        text: 'Check out these amazing LGBTQ+ travel guides!',
        url: siteUrl,
        dialogTitle: 'Share KGay Travel Guides',
      });
    } catch (error) {
      // If share fails, copy to clipboard
      try {
        await navigator.clipboard.writeText(siteUrl);
        toast({
          title: 'Link copied!',
          description: 'App link copied to clipboard',
        });
      } catch (clipboardError) {
        console.error('Failed to share or copy:', error, clipboardError);
      }
    }
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
    <>
      <div className="text-white fixed z-[60] w-full top-0 left-0 right-0 pt-[env(safe-area-inset-top)] bg-white/30 backdrop-blur-lg">
        <div className="px-3 sm:px-4 lg:px-8 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <img
                src="/logos/kgay-logo.jpg"
                alt="KGay Travel"
                className="h-6 sm:h-8 w-auto hover:opacity-90 transition"
              />
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white">
                KGay Travel Guides
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Share Button - Mobile only */}
            <button
              onClick={handleShareClick}
              className={cn(
                'h-8 w-8 sm:h-10 sm:w-10 rounded-full text-black transition-colors xl:hidden',
                'hover:bg-white/10 active:bg-white/20',
                'flex items-center justify-center'
              )}
              title="Share KGay Travel Guides"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Alerts Button - Mobile only */}
            <button
              onClick={handleAlertsClick}
              className={cn(
                'relative h-8 w-8 sm:h-10 sm:w-10 rounded-full text-black transition-colors xl:hidden',
                'hover:bg-white/10 active:bg-white/20',
                'flex items-center justify-center'
              )}
              title="Alerts"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Settings Button - Mobile only */}
            <button
              onClick={handleSettingsClick}
              className={cn(
                'h-8 w-8 sm:h-10 sm:w-10 rounded-full text-black transition-colors xl:hidden',
                'hover:bg-white/10 active:bg-white/20',
                'flex items-center justify-center'
              )}
              title="Settings"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Desktop Navigation - Hidden on mobile/tablet */}
            <div className="hidden xl:flex items-center gap-1">
              {/* Trips */}
              <button
                onClick={() => handleNavigation('/')}
                className={cn(
                  'px-3 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2',
                  activeTab === 'home' ? 'bg-white/70 text-black' : 'text-white/70 hover:text-white'
                )}
              >
                <TreePalm className="w-4 h-4 flex-shrink-0" />
                <span>Trips</span>
              </button>

              {/* Past Trips */}
              <button
                onClick={() => handleNavigation('/past-trips')}
                className={cn(
                  'px-3 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2',
                  activeTab === 'past' ? 'bg-white/70 text-black' : 'text-white/70 hover:text-white'
                )}
              >
                <History className="w-4 h-4 flex-shrink-0" />
                <span>Past</span>
              </button>

              {/* My Stuff */}
              <button
                onClick={() => handleNavigation('/my-stuff')}
                className={cn(
                  'px-3 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2',
                  activeTab === 'mystuff'
                    ? 'bg-white/70 text-black'
                    : 'text-white/70 hover:text-white'
                )}
              >
                <Star className="w-4 h-4 flex-shrink-0" />
                <span>My Stuff</span>
              </button>

              {/* Alerts */}
              <button
                onClick={handleAlertsClick}
                className={cn(
                  'px-3 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2',
                  activeTab === 'alerts'
                    ? 'bg-white/70 text-black'
                    : 'text-white/70 hover:text-white'
                )}
              >
                <Bell className="w-4 h-4 flex-shrink-0" />
                <span>Alerts</span>
              </button>

              {/* Settings */}
              <button
                onClick={handleSettingsClick}
                className={cn(
                  'px-3 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2',
                  activeTab === 'settings'
                    ? 'bg-white/70 text-black'
                    : 'text-white/70 hover:text-white'
                )}
              >
                <User
                  className={cn(
                    'w-4 h-4 flex-shrink-0',
                    activeTab === 'settings' && user
                      ? 'fill-black stroke-black'
                      : user
                        ? 'fill-blue-600 stroke-blue-600'
                        : ''
                  )}
                />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Sheet - Fly-up (bottom sheet) */}
      <FlyUpSheet
        open={alertsOpen}
        onOpenChange={setAlertsOpen}
        onClose={refreshAlerts}
        icon={Bell}
        iconColor="text-amber-400"
        title="Alerts (All Trips)"
        accessibleTitle="Trip Alerts"
        accessibleDescription="View recent updates and announcements"
      >
        <Alerts />
      </FlyUpSheet>

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
        <Settings onNavigate={handleNavigateFromSheet} />
      </FlyUpSheet>
    </>
  );
}
