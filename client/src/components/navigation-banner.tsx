import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import NavigationDrawer from '@/components/NavigationDrawer';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GlobalNotificationBell } from '@/components/GlobalNotificationBell';
import { GlobalNotificationsPanel } from '@/components/GlobalNotificationsPanel';
import type { Update } from '@/types/trip-info';
import { api } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';

interface UpdateWithTrip extends Update {
  trip_name?: string;
  trip_slug?: string;
  start_date?: string;
}

export default function NavigationBanner() {
  const [currentLocation] = useLocation();
  const [isStandalone, setIsStandalone] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [updates, setUpdates] = useState<UpdateWithTrip[]>([]);
  const [lastReadTimestamp, setLastReadTimestamp] = useState<string | null>(null);

  const isAdminRoute = currentLocation.startsWith('/admin');

  // Fetch all updates
  const fetchUpdates = useCallback(async () => {
    try {
      const response = await api.get('/api/updates/all');
      if (response.ok) {
        const data = await response.json();
        setUpdates(data);
      }
    } catch (error) {
      console.error('Error fetching global updates:', error);
    }
  }, []);

  const handleNotificationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Toggle notification panel
    const newState = !showNotifications;
    setShowNotifications(newState);

    // Close drawer if opening notifications
    if (newState && showDrawer) {
      setShowDrawer(false);
    }

    // Fetch fresh updates when opening notification panel
    if (newState) {
      fetchUpdates();
    }
  };

  const handleDrawerOpenChange = (open: boolean) => {
    // Close notifications when opening drawer
    if (open && showNotifications) {
      setShowNotifications(false);
    }
    setShowDrawer(open);
  };

  // Load last read timestamp from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('global-notifications-last-read');
    setLastReadTimestamp(stored);
  }, []);

  // Fetch all updates on mount and every 5 minutes
  useEffect(() => {
    fetchUpdates();

    // Refresh updates every 5 minutes
    const interval = setInterval(fetchUpdates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchUpdates]);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('updates-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'updates',
        },
        async payload => {
          // When a new update is inserted, fetch its full details with trip info
          const newUpdate = payload.new as Update;

          try {
            // Fetch the trip details for this update
            const { data: trip } = await supabase
              .from('trips')
              .select('id, slug, name, start_date')
              .eq('id', newUpdate.trip_id)
              .single();

            // Add the new update with trip details to the beginning of the list
            const updateWithTrip: UpdateWithTrip = {
              ...newUpdate,
              trip_name: trip?.name,
              trip_slug: trip?.slug,
              start_date: trip?.start_date,
            };

            setUpdates(prev => [updateWithTrip, ...prev]);
          } catch (error) {
            console.error('Error fetching trip details for new update:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Check if there are unread notifications
  const hasUnread = useMemo(() => {
    if (!updates || updates.length === 0) return false;
    if (!lastReadTimestamp) return updates.length > 0;

    return updates.some(update => new Date(update.created_at) > new Date(lastReadTimestamp));
  }, [updates, lastReadTimestamp]);

  // Mark notifications as read
  const handleMarkAsRead = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem('global-notifications-last-read', now);
    setLastReadTimestamp(now);
  }, []);

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

  const toggleAdminNavigation = () => {
    const event = new CustomEvent('admin-nav', {
      detail: { action: 'toggle' },
    });
    window.dispatchEvent(event);
  };

  return (
    <div
      className={`text-white fixed z-[60] w-full top-0 left-0 right-0 pt-[env(safe-area-inset-top)] ${isAdminRoute ? 'bg-[#10192f]' : 'bg-ocean-900 shadow-lg'}`}
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
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white">
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
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white">
                KGay Travel Guides
              </span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <GlobalNotificationBell
            updatesCount={updates.length}
            hasUnread={hasUnread}
            onClick={handleNotificationClick}
          />
          <NavigationDrawer isOpen={showDrawer} onOpenChange={handleDrawerOpenChange} />
        </div>
      </div>

      {/* Global Notifications Panel */}
      <GlobalNotificationsPanel
        open={showNotifications}
        onOpenChange={setShowNotifications}
        updates={updates}
        onMarkAsRead={handleMarkAsRead}
      />
    </div>
  );
}
