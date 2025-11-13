import { useLocation } from 'wouter';
import { TreePalm, History, Star, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import MyStuff from '@/pages/my-stuff';
import Alerts from '@/pages/alerts';
import Settings from '@/pages/settings';
import { useUnreadAlerts } from '@/hooks/useUnreadAlerts';

export default function BottomNavigation() {
  const [currentLocation, setLocation] = useLocation();
  const { user, profile } = useSupabaseAuthContext();
  const navRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [openSheet, setOpenSheet] = useState<'mystuff' | 'alerts' | 'settings' | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // Get unread alerts count (all trips)
  const { unreadCount, refresh: refreshAlerts } = useUnreadAlerts();

  // Sheet swipe state
  const [sheetTouchStart, setSheetTouchStart] = useState<number | null>(null);
  const [sheetTouchEnd, setSheetTouchEnd] = useState<number | null>(null);

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
    { id: 'mystuff', path: '/my-stuff' },
    { id: 'alerts', path: '/alerts' },
    { id: 'settings', path: '/settings' },
  ];

  // Determine active tab based on current location
  const getActiveTab = () => {
    if (currentLocation === '/') return 'home';
    if (currentLocation === '/my-stuff') return 'mystuff';
    if (currentLocation === '/alerts') return 'alerts';
    if (currentLocation === '/settings') return 'settings';
    return null;
  };

  const activeTab = getActiveTab();

  const handleNavigation = (path: string, sheetId?: 'mystuff' | 'alerts' | 'settings') => {
    if (sheetId) {
      setOpenSheet(sheetId);
    } else {
      setLocation(path);
    }
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

  // Sheet swipe handlers
  const onSheetTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const scrollableParent = target.closest('.overflow-y-auto');

    // Only allow swipe-to-close if we're at the top of scrolled content or on non-scrollable area
    if (scrollableParent && scrollableParent.scrollTop > 0) {
      setSheetTouchStart(null);
      return;
    }

    setSheetTouchEnd(null);
    setSheetTouchStart(e.targetTouches[0].clientY);
  };

  const onSheetTouchMove = (e: React.TouchEvent) => {
    if (sheetTouchStart === null) return;
    setSheetTouchEnd(e.targetTouches[0].clientY);
  };

  const onSheetTouchEnd = () => {
    if (!sheetTouchStart || !sheetTouchEnd) return;

    const distance = sheetTouchStart - sheetTouchEnd;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isDownSwipe) {
      // Swipe down - close the sheet
      setOpenSheet(null);
    }

    // Reset state
    setSheetTouchStart(null);
    setSheetTouchEnd(null);
  };

  // Handle scroll to show/hide navigation
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;

    if (!ticking.current) {
      window.requestAnimationFrame(() => {
        // Prevent hiding during iOS Safari bounce (negative scroll)
        if (currentScrollY < 0) {
          ticking.current = false;
          return;
        }

        // Only hide if scrolled more than 10px
        if (currentScrollY < 10) {
          setIsVisible(true);
        } else if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
          // Scrolling down - require more scroll distance to hide
          setIsVisible(false);
        } else if (currentScrollY < lastScrollY.current) {
          // Scrolling up
          setIsVisible(true);
        }

        lastScrollY.current = currentScrollY;
        ticking.current = false;
      });

      ticking.current = true;
    }
  }, []);

  useEffect(() => {
    // Reset visibility when component mounts
    setIsVisible(true);
    lastScrollY.current = window.scrollY;

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // Refresh alerts count when alerts sheet is closed
  useEffect(() => {
    if (openSheet !== 'alerts') {
      // Refresh alerts count after closing alerts sheet
      refreshAlerts();
    }
  }, [openSheet, refreshAlerts]);

  return (
    <>
      {/* PREVIOUS DESIGN (Rounded Pill) - Commented out for easy revert
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
          ... buttons ...
        </nav>
      </div>
      */}

      {/* NEW DESIGN - Facebook-style full-width bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 xl:hidden">
        <nav
          ref={navRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className={cn(
            'bg-white/30 backdrop-blur-lg border-t border-white/30 transition-transform duration-300 ease-in-out',
            !isVisible && 'translate-y-full'
          )}
          style={{
            transform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 100%, 0)',
            willChange: 'transform',
            paddingBottom: 'var(--nav-bottom-padding, 0px)',
          }}
        >
          <div className="flex items-center justify-around max-w-2xl mx-auto px-2 pt-1.5">
            {/* Trips */}
            <button
              onClick={() => handleNavigation('/')}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-all duration-200 min-w-[60px] text-black"
            >
              <TreePalm className="w-[24px] h-[24px]" strokeWidth={2} />
              <span className="text-[10px] font-medium">Trips</span>
            </button>

            {/* My Stuff */}
            <button
              onClick={() => handleNavigation('/my-stuff', 'mystuff')}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-all duration-200 min-w-[60px] text-black"
            >
              <Star className="w-[24px] h-[24px]" strokeWidth={2} />
              <span className="text-[10px] font-medium">My Stuff</span>
            </button>

            {/* Alerts */}
            <button
              onClick={() => handleNavigation('/alerts', 'alerts')}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-all duration-200 min-w-[60px] text-black relative"
            >
              <div className="relative">
                <Bell className="w-[24px] h-[24px]" strokeWidth={2} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">Alerts</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => handleNavigation('/settings', 'settings')}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-all duration-200 min-w-[60px] text-black"
            >
              <User className="w-[24px] h-[24px]" strokeWidth={2} />
              <span className="text-[10px] font-medium">Settings</span>
            </button>
          </div>
        </nav>
      </div>

      {/* My Stuff Sheet */}
      <Sheet open={openSheet === 'mystuff'} onOpenChange={open => !open && setOpenSheet(null)}>
        <SheetContent
          side="bottom"
          className="h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] bg-[#002147] border-white/10 text-white p-0 rounded-t-3xl overflow-hidden [&>button]:top-2 [&>button]:right-2 [&>button]:w-12 [&>button]:h-12"
          onTouchStart={onSheetTouchStart}
          onTouchMove={onSheetTouchMove}
          onTouchEnd={onSheetTouchEnd}
        >
          <VisuallyHidden>
            <SheetTitle>My Stuff</SheetTitle>
            <SheetDescription>View your saved trips, favorites, and bookmarks</SheetDescription>
          </VisuallyHidden>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative h-full overflow-y-auto pt-4">
            <div className="[&>div]:pt-0 [&>div]:min-h-0">
              <MyStuff />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Alerts Sheet */}
      <Sheet open={openSheet === 'alerts'} onOpenChange={open => !open && setOpenSheet(null)}>
        <SheetContent
          side="bottom"
          className="h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] bg-[#002147] border-white/10 text-white p-0 rounded-t-3xl overflow-hidden [&>button]:top-2 [&>button]:right-2 [&>button]:w-12 [&>button]:h-12"
          onTouchStart={onSheetTouchStart}
          onTouchMove={onSheetTouchMove}
          onTouchEnd={onSheetTouchEnd}
        >
          <VisuallyHidden>
            <SheetTitle>Trip Alerts</SheetTitle>
            <SheetDescription>View trip updates and notifications</SheetDescription>
          </VisuallyHidden>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative h-full overflow-y-auto pt-4">
            <div className="[&>div]:pt-0 [&>div]:min-h-0">
              <Alerts />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Settings Sheet */}
      <Sheet open={openSheet === 'settings'} onOpenChange={open => !open && setOpenSheet(null)}>
        <SheetContent
          side="bottom"
          className="h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] bg-[#002147] border-white/10 text-white p-0 rounded-t-3xl overflow-hidden [&>button]:top-2 [&>button]:right-2 [&>button]:w-12 [&>button]:h-12"
          onTouchStart={onSheetTouchStart}
          onTouchMove={onSheetTouchMove}
          onTouchEnd={onSheetTouchEnd}
        >
          <VisuallyHidden>
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>Manage your profile and app preferences</SheetDescription>
          </VisuallyHidden>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative h-full overflow-y-auto pt-4">
            <div className="[&>div]:pt-0 [&>div]:min-h-0">
              <Settings
                onNavigate={path => {
                  setOpenSheet(null);
                  setLocation(path);
                }}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
