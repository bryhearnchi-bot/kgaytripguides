import { useLocation } from 'wouter';
import { Home, History, Star, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function BottomNavigation() {
  const [currentLocation, setLocation] = useLocation();
  const { user, profile } = useSupabaseAuthContext();

  // Get user initials for avatar
  const displayName = profile?.name?.first || user?.email?.split('@')[0] || 'User';
  const fullDisplayName = profile?.name?.full || displayName;
  const initials = fullDisplayName
    .split(' ')
    .map((name: string) => name[0])
    .filter((char: string | undefined) => char)
    .join('')
    .toUpperCase()
    .slice(0, 2);

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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none">
      <div
        className="flex justify-center px-4 pb-4"
        style={{ paddingBottom: 'max(16px, calc(env(safe-area-inset-bottom) + 8px))' }}
      >
        <nav className="bg-white/10 backdrop-blur-lg rounded-full p-1 inline-flex gap-1 border border-white/20 pointer-events-auto">
          {/* Home */}
          <button
            onClick={() => handleNavigation('/')}
            className={cn(
              'px-3 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 min-w-[44px] min-h-[44px]',
              activeTab === 'home' ? 'bg-white text-ocean-900' : 'text-white/70 hover:text-white'
            )}
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            {activeTab === 'home' && <span>Home</span>}
          </button>

          {/* Past Trips */}
          <button
            onClick={() => handleNavigation('/past-trips')}
            className={cn(
              'px-3 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 min-w-[44px] min-h-[44px]',
              activeTab === 'past' ? 'bg-white text-ocean-900' : 'text-white/70 hover:text-white'
            )}
          >
            <History className="w-4 h-4 flex-shrink-0" />
            {activeTab === 'past' && <span>Past</span>}
          </button>

          {/* My Stuff */}
          <button
            onClick={() => handleNavigation('/my-stuff')}
            className={cn(
              'px-3 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 min-w-[44px] min-h-[44px]',
              activeTab === 'mystuff' ? 'bg-white text-ocean-900' : 'text-white/70 hover:text-white'
            )}
          >
            <Star className="w-4 h-4 flex-shrink-0" />
            {activeTab === 'mystuff' && <span>My Stuff</span>}
          </button>

          {/* Alerts */}
          <button
            onClick={() => handleNavigation('/alerts')}
            className={cn(
              'px-3 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 min-w-[44px] min-h-[44px]',
              activeTab === 'alerts' ? 'bg-white text-ocean-900' : 'text-white/70 hover:text-white'
            )}
          >
            <Bell className="w-4 h-4 flex-shrink-0" />
            {activeTab === 'alerts' && <span>Alerts</span>}
          </button>

          {/* Settings */}
          <button
            onClick={() => handleNavigation('/settings')}
            className={cn(
              'px-3 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 min-w-[44px] min-h-[44px]',
              activeTab === 'settings'
                ? 'bg-white text-ocean-900'
                : 'text-white/70 hover:text-white'
            )}
          >
            {user ? (
              <Avatar className="w-5 h-5 flex-shrink-0 border border-white/30">
                <AvatarImage src={profile?.avatar || undefined} alt={fullDisplayName} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-[9px] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            ) : (
              <User className="w-4 h-4 flex-shrink-0" />
            )}
          </button>
        </nav>
      </div>
    </div>
  );
}
