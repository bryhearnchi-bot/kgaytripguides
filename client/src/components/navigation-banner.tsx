import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import KokonutProfileDropdown from '@/components/ui/kokonut-profile-dropdown';
import { AddToHomeScreen } from '@/components/AddToHomeScreen';
import TimeFormatToggle from '@/components/TimeFormatToggle';
import { AboutKGayModal } from '@/components/AboutKGayModal';
import { useState, useEffect } from 'react';

export default function NavigationBanner() {
  const { user, profile, signOut } = useSupabaseAuthContext();
  const [currentLocation, setLocation] = useLocation();
  const [showEditTrip, setShowEditTrip] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const isAdminRoute = currentLocation.startsWith('/admin');
  const isLandingPage = currentLocation === '/';
  const isTripGuidePage = currentLocation.startsWith('/trip/');
  const showAboutButton = isLandingPage || isTripGuidePage;

  // Detect if app is running in standalone mode (installed as PWA)
  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkStandalone);

    return () => {
      mediaQuery.removeEventListener('change', checkStandalone);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      // The signOut function already navigates to '/'
      // No need to call setLocation here
    } catch (error) {
      // Error handling performed by signOut function
    }
  };

  const toggleAdminNavigation = () => {
    const event = new CustomEvent('admin-nav', {
      detail: { action: 'toggle' },
    });
    window.dispatchEvent(event);
  };

  // Listen for edit trip availability from TripGuide component
  useEffect(() => {
    const handleEditTripAvailable = (e: CustomEvent) => {
      setShowEditTrip(e.detail.available);
    };

    window.addEventListener('edit-trip-available', handleEditTripAvailable as EventListener);

    return () => {
      window.removeEventListener('edit-trip-available', handleEditTripAvailable as EventListener);
    };
  }, []);

  const handleEditTrip = () => {
    window.dispatchEvent(new CustomEvent('request-edit-trip'));
  };

  return (
    <div
      className={`text-white fixed z-[60] w-full top-0 left-0 right-0 ${isAdminRoute ? 'bg-[#10192f]' : 'bg-ocean-900 shadow-lg'}`}
    >
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
          {isStandalone ? (
            <div className="flex items-center gap-2 sm:gap-3 cursor-default">
              <img src="/logos/kgay-logo.jpg" alt="KGay Travel" className="h-6 sm:h-8 w-auto" />
              <span className="hidden text-sm font-semibold uppercase tracking-[0.3em] text-white sm:inline">
                KGay Travel Guides
              </span>
            </div>
          ) : (
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <img
                src="/logos/kgay-logo.jpg"
                alt="KGay Travel"
                className="h-6 sm:h-8 w-auto hover:opacity-90 transition"
              />
              <span className="hidden text-sm font-semibold uppercase tracking-[0.3em] text-white sm:inline">
                KGay Travel Guides
              </span>
            </Link>
          )}
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* About KGAY Travel button - shows on landing page and trip guide pages */}
          {showAboutButton && (
            <Button
              onClick={() => setShowAboutModal(true)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium text-[11px] px-2 !py-0 !h-[22px] !min-h-0 rounded-full shadow-sm hover:shadow-md transition-all whitespace-nowrap leading-[22px]"
            >
              About KGAY Travel
            </Button>
          )}

          {/* Add to Home Screen button - shows for all users if not in standalone mode */}
          <AddToHomeScreen />

          {/* Time Format Toggle - shows for non-logged-in users on non-admin pages */}
          {!user && !isAdminRoute && <TimeFormatToggle variant="banner" />}

          {user && profile && (
            <KokonutProfileDropdown
              user={user}
              profile={profile}
              onLogout={handleLogout}
              onNavigate={setLocation}
              onEditTrip={handleEditTrip}
              showEditTrip={showEditTrip}
              isAdminRoute={isAdminRoute}
              className="touch-manipulation"
            />
          )}
        </div>
      </div>

      {/* About KGAY Travel Modal */}
      <AboutKGayModal open={showAboutModal} onOpenChange={setShowAboutModal} />
    </div>
  );
}
