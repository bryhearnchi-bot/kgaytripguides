import { Link, useLocation } from 'wouter';
import { TreePalm, History, Star, Bell, User, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { useUpdate } from '@/context/UpdateContext';
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetPortal,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import Alerts from '@/pages/alerts';
import Settings from '@/pages/settings';

export default function NavigationBanner() {
  const [currentLocation, setLocation] = useLocation();
  const { user } = useSupabaseAuthContext();
  const { updateAvailable, isChecking, checkForUpdates, applyUpdate } = useUpdate();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
    // Check if desktop (xl+)
    if (window.innerWidth >= 1280) {
      setAlertsOpen(true);
    } else {
      handleNavigation('/alerts');
    }
  };

  const handleSettingsClick = () => {
    // Check if desktop (xl+)
    if (window.innerWidth >= 1280) {
      setSettingsOpen(true);
    } else {
      handleNavigation('/settings');
    }
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

  return (
    <>
      <div className="text-white fixed z-[60] w-full top-0 left-0 right-0 pt-[env(safe-area-inset-top)] bg-white/10 backdrop-blur-lg">
        <div className="px-3 sm:px-4 lg:px-8 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <img
                src="/logos/kgay-logo.jpg"
                alt="KGay Travel"
                className="h-6 sm:h-8 w-auto hover:opacity-90 transition"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white">
                  KGay Travel Guides
                </span>
                <Badge className="rounded-full bg-blue-500/30 text-white border-blue-400/50 text-[10px] px-2 py-0 font-semibold">
                  Interactive
                </Badge>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Button - Hidden on desktop */}
            <button
              onClick={handleRefreshClick}
              disabled={isChecking}
              className={cn(
                'relative h-10 w-10 rounded-full text-white transition-colors xl:hidden',
                'hover:bg-white/10 active:bg-white/20',
                'disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
              )}
              title={
                updateAvailable
                  ? 'Update available - tap to refresh'
                  : isChecking
                    ? 'Checking for updates...'
                    : 'Check for updates'
              }
            >
              <RefreshCw
                className={cn(
                  'w-5 h-5 transition-all',
                  isChecking && 'animate-spin text-blue-400',
                  !isChecking && updateAvailable && 'text-green-400',
                  !isChecking && !updateAvailable && 'text-white'
                )}
              />
              {/* Badge for update available */}
              {updateAvailable && !isChecking && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
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

      {/* Alerts Sheet - Desktop only */}
      <Sheet open={alertsOpen} modal={true} onOpenChange={setAlertsOpen}>
        <SheetPortal>
          <SheetContent
            side="right"
            className="w-[85%] sm:w-[480px] !top-[calc(env(safe-area-inset-top)+3.25rem)] !bottom-0 !h-auto !z-50 bg-[#001833] border-white/10 text-white overflow-y-auto [&>button]:top-4 !pt-2"
          >
            <VisuallyHidden>
              <SheetTitle>Trip Alerts</SheetTitle>
              <SheetDescription>View recent updates and announcements</SheetDescription>
            </VisuallyHidden>
            <div className="-mt-16">
              <Alerts />
            </div>
          </SheetContent>
        </SheetPortal>
      </Sheet>

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
              <Settings />
            </div>
          </SheetContent>
        </SheetPortal>
      </Sheet>
    </>
  );
}
