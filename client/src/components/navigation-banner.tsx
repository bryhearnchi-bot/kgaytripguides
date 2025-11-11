import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Menu, RefreshCw, ArrowLeft } from 'lucide-react';
import NavigationDrawer from '@/components/NavigationDrawer';
import { useState } from 'react';
import { useUpdate } from '@/context/UpdateContext';
import { cn } from '@/lib/utils';

export default function NavigationBanner() {
  const [currentLocation] = useLocation();
  const [showDrawer, setShowDrawer] = useState(false);
  const { updateAvailable, isChecking, checkForUpdates, applyUpdate } = useUpdate();

  const isAdminRoute = currentLocation.startsWith('/admin');
  const isTripRoute = currentLocation.startsWith('/trip/');

  const handleDrawerOpenChange = (open: boolean) => {
    setShowDrawer(open);
  };

  const toggleAdminNavigation = () => {
    const event = new CustomEvent('admin-nav', {
      detail: { action: 'toggle' },
    });
    window.dispatchEvent(event);
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
    <div className="text-white fixed z-[60] w-full top-0 left-0 right-0 pt-[env(safe-area-inset-top)] bg-white/10 backdrop-blur-lg">
      <div className="px-3 sm:px-4 lg:px-8 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          {isAdminRoute && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleAdminNavigation}
              className="mr-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1222] focus-visible:ring-white/40 lg:hidden"
              aria-label="Open admin navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          {isTripRoute && (
            <Link href="/">
              <button
                type="button"
                className="inline-flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/15 transition-colors"
                aria-label="Back to home"
              >
                <ArrowLeft className="h-[18px] w-[18px] sm:h-[22px] sm:w-[22px]" />
              </button>
            </Link>
          )}
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

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshClick}
            disabled={isChecking}
            className={cn(
              'relative h-10 w-10 rounded-full text-white transition-colors',
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
          <NavigationDrawer isOpen={showDrawer} onOpenChange={handleDrawerOpenChange} />
        </div>
      </div>
    </div>
  );
}
