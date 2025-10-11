import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import KokonutProfileDropdown from '@/components/ui/kokonut-profile-dropdown';

export default function NavigationBanner() {
  const { user, profile, signOut } = useSupabaseAuthContext();
  const [currentLocation, setLocation] = useLocation();

  const isAdminRoute = currentLocation.startsWith('/admin');

  const handleLogout = async () => {
    try {
      await signOut();
      // The signOut function already navigates to '/'
      // No need to call setLocation here
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleAdminNavigation = () => {
    const event = new CustomEvent('admin-nav', {
      detail: { action: 'toggle' },
    });
    window.dispatchEvent(event);
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
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {user && profile ? (
            <KokonutProfileDropdown
              user={user}
              profile={profile}
              onLogout={handleLogout}
              onNavigate={setLocation}
              className="touch-manipulation"
            />
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  Login
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
