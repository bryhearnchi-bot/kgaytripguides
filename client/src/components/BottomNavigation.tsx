import { useLocation } from 'wouter';
import { TreePalm, History, Star, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRef, useState, useEffect } from 'react';

export default function BottomNavigation() {
  const [currentLocation, setLocation] = useLocation();
  const { user, profile } = useSupabaseAuthContext();
  const navRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

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

  // Tab order for swiping
  const tabs = [
    { id: 'home', path: '/' },
    { id: 'past', path: '/past-trips' },
    { id: 'mystuff', path: '/my-stuff' },
    { id: 'alerts', path: '/alerts' },
    { id: 'settings', path: '/settings' },
  ];

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

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);

    if (isLeftSwipe && currentIndex < tabs.length - 1) {
      // Swipe left - go to next tab
      handleNavigation(tabs[currentIndex + 1].path);
    } else if (isRightSwipe && currentIndex > 0) {
      // Swipe right - go to previous tab
      handleNavigation(tabs[currentIndex - 1].path);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 xl:hidden pointer-events-none">
      <div
        className="flex justify-center px-4 pb-4"
        style={{ paddingBottom: 'max(16px, calc(env(safe-area-inset-bottom) + 8px))' }}
      >
        <nav
          ref={navRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="bg-white/35 backdrop-blur-lg rounded-full p-1 inline-flex gap-1 border border-white/20 pointer-events-auto"
        >
          {/* Trips */}
          <button
            onClick={() => handleNavigation('/')}
            className={cn(
              'px-3 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 min-w-[44px] min-h-[44px]',
              activeTab === 'home' ? 'bg-white/60 text-black' : 'text-black hover:text-black/80'
            )}
          >
            <TreePalm className="w-4 h-4 flex-shrink-0" />
            {/* Tablet: Always show label. Mobile: Only show if active */}
            <span
              className={cn(
                'animate-in fade-in slide-in-from-left-2 duration-200',
                'hidden md:inline', // Always show on tablet
                activeTab === 'home' && 'inline md:inline' // Show on mobile only if active
              )}
            >
              Trips
            </span>
          </button>

          {/* Past Trips */}
          <button
            onClick={() => handleNavigation('/past-trips')}
            className={cn(
              'px-3 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 min-w-[44px] min-h-[44px]',
              activeTab === 'past' ? 'bg-white/60 text-black' : 'text-black hover:text-black/80'
            )}
          >
            <History className="w-4 h-4 flex-shrink-0" />
            <span
              className={cn(
                'animate-in fade-in slide-in-from-left-2 duration-200',
                'hidden md:inline',
                activeTab === 'past' && 'inline md:inline'
              )}
            >
              Past
            </span>
          </button>

          {/* My Stuff */}
          <button
            onClick={() => handleNavigation('/my-stuff')}
            className={cn(
              'px-3 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 min-w-[44px] min-h-[44px]',
              activeTab === 'mystuff' ? 'bg-white/60 text-black' : 'text-black hover:text-black/80'
            )}
          >
            <Star className="w-4 h-4 flex-shrink-0" />
            <span
              className={cn(
                'animate-in fade-in slide-in-from-left-2 duration-200',
                'hidden md:inline',
                activeTab === 'mystuff' && 'inline md:inline'
              )}
            >
              My Stuff
            </span>
          </button>

          {/* Alerts */}
          <button
            onClick={() => handleNavigation('/alerts')}
            className={cn(
              'px-3 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 min-w-[44px] min-h-[44px]',
              activeTab === 'alerts' ? 'bg-white/60 text-black' : 'text-black hover:text-black/80'
            )}
          >
            <Bell className="w-4 h-4 flex-shrink-0" />
            <span
              className={cn(
                'animate-in fade-in slide-in-from-left-2 duration-200',
                'hidden md:inline',
                activeTab === 'alerts' && 'inline md:inline'
              )}
            >
              Alerts
            </span>
          </button>

          {/* Settings */}
          <button
            onClick={() => handleNavigation('/settings')}
            className={cn(
              'px-3 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 min-w-[44px] min-h-[44px]',
              activeTab === 'settings' ? 'bg-white/60 text-black' : 'text-black hover:text-black/80'
            )}
          >
            <User className={cn('w-5 h-5 flex-shrink-0', user ? 'fill-black stroke-black' : '')} />
            <span
              className={cn(
                'animate-in fade-in slide-in-from-left-2 duration-200',
                'hidden md:inline',
                activeTab === 'settings' && 'inline md:inline'
              )}
            >
              Settings
            </span>
          </button>
        </nav>
      </div>
    </div>
  );
}
