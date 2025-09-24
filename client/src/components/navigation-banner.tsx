import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useSupabaseAuthContext } from "@/contexts/SupabaseAuthContext";
import KokonutProfileDropdown from "@/components/ui/kokonut-profile-dropdown";

export default function NavigationBanner() {
  const { user, profile, signOut } = useSupabaseAuthContext();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await signOut();
      // The signOut function already navigates to '/'
      // No need to call setLocation here
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="bg-ocean-900 text-white shadow-lg fixed z-[60] w-full top-0 left-0 right-0">
      <div className="px-3 sm:px-4 lg:px-8 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/">
            <img
              src="/logos/atlantis-logo.png"
              alt="Atlantis Events"
              className="h-5 sm:h-6 w-auto hover:opacity-80 transition-opacity cursor-pointer"
            />
          </Link>
          <a href="https://kgaytravel.com/" target="_blank" rel="noopener noreferrer">
            <img
              src="/logos/kgay-logo.jpg"
              alt="KGay Travel"
              className="h-6 sm:h-8 w-auto hover:opacity-80 transition-opacity"
            />
          </a>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <KokonutProfileDropdown
            user={user || { id: 'demo', email: 'demo@atlantis.com', avatar_url: '' }}
            profile={profile || { full_name: 'Demo User', role: 'admin', status: 'active' }}
            onLogout={handleLogout}
            onNavigate={setLocation}
            className="touch-manipulation"
          />
        </div>
      </div>
    </div>
  );
}