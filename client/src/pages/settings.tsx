import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  User,
  Shield,
  Edit,
  LogOut,
  Download,
  Info,
  Clock,
  Plus,
  Share,
  RefreshCw,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { useTimeFormat } from '@/contexts/TimeFormatContext';
import { AboutKGayModal } from '@/components/AboutKGayModal';
import { cn } from '@/lib/utils';
import { useUpdate } from '@/context/UpdateContext';
import { format } from 'date-fns';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface SettingsProps {
  showEditTrip?: boolean;
  onEditTrip?: () => void;
  onNavigate?: (path: string) => void;
}

export default function Settings({
  showEditTrip: showEditTripProp,
  onEditTrip,
  onNavigate,
}: SettingsProps = {}) {
  const [, setLocation] = useLocation();
  const [showEditTripFromEvent, setShowEditTripFromEvent] = useState(false);

  // Use prop if provided, otherwise use event-based state
  const showEditTrip = showEditTripProp !== undefined ? showEditTripProp : showEditTripFromEvent;
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const { user, profile, signOut } = useSupabaseAuthContext();
  const { timeFormat, toggleTimeFormat } = useTimeFormat();
  const { lastUpdated, updateAvailable, isChecking, checkForUpdates, applyUpdate } = useUpdate();

  // Get the first name for display
  const displayName = profile?.name?.first || user?.email?.split('@')[0] || 'User';
  const fullDisplayName = profile?.name?.full || displayName;
  const initials = fullDisplayName
    .split(' ')
    .map((name: string) => name[0])
    .filter((char: string | undefined) => char)
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Detect install prompt availability
  useEffect(() => {
    // Check if already in standalone mode (already added to home screen)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(standalone);

    // Don't show button if already in standalone mode
    if (standalone) {
      setShowInstallButton(false);
      return;
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // For iOS devices, show button if not in standalone and using Safari
    if (iOS) {
      const isSafari =
        /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|OPiOS/.test(navigator.userAgent);
      setShowInstallButton(isSafari);
    }

    // For Android/Desktop Chrome, listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also show button after app installed
    window.addEventListener('appinstalled', () => {
      setShowInstallButton(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Listen for edit trip availability from TripGuide component (for event-based mode)
  useEffect(() => {
    const handleEditTripAvailable = (e: CustomEvent) => {
      setShowEditTripFromEvent(e.detail.available);
    };

    window.addEventListener('edit-trip-available', handleEditTripAvailable as EventListener);

    return () => {
      window.removeEventListener('edit-trip-available', handleEditTripAvailable as EventListener);
    };
  }, []);

  const handleEditTrip = () => {
    // Use prop callback if provided, otherwise use event system
    if (onEditTrip) {
      onEditTrip();
    } else {
      window.dispatchEvent(new CustomEvent('request-edit-trip'));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setLocation('/');
    } catch (error) {
      // Error handling performed by signOut function
    }
  };

  const handleNavigate = (path: string) => {
    // Use callback if provided (Sheet mode), otherwise navigate normally
    if (onNavigate) {
      onNavigate(path);
    } else {
      setLocation(path);
    }
  };

  const handleLoginClick = () => {
    // Only set return URL if we're on the standalone settings page, not in a trip page Sheet
    if (onNavigate) {
      // In Sheet mode - don't set return URL, user will stay on current page
      // The onNavigate callback will close the Sheet and navigate
      handleNavigate('/admin');
    } else {
      // Standalone settings page - return here after login
      sessionStorage.setItem('login-return-url', '/settings');
      handleNavigate('/admin');
    }
  };

  const handleTimeFormatToggle = () => {
    toggleTimeFormat();
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

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show iOS instructions
      setShowIOSInstructions(true);
    } else if (deferredPrompt) {
      // Show the install prompt on Chrome/Android
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowInstallButton(false);
      }

      setDeferredPrompt(null);
    }
  };

  const formatLastUpdated = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 1440) {
      // Less than 24 hours - show time
      return format(date, 'h:mm a');
    } else {
      // Older - show date and time
      return format(date, 'MMM d, h:mm a');
    }
  };

  return (
    <>
      <div className="min-h-screen text-white">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="mt-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-4 h-4 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Settings</h3>
              <div className="flex-1 h-px bg-white/20 ml-3"></div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {/* User Profile Section (when logged in) */}
            {user && profile ? (
              <>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 focus:outline-none focus:ring-0 focus:border-white/10">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 focus:outline-none focus:ring-0">
                      <AvatarImage src={profile?.avatarUrl || user.avatar_url} alt={displayName} />
                      <AvatarFallback className="bg-gradient-to-br from-ocean-500 to-blue-500 text-white text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-base font-semibold text-white">{fullDisplayName}</p>
                      {profile?.role && (
                        <p className="text-xs text-ocean-300 capitalize">
                          {profile.role.replace('_', ' ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* My Stuff Section - When Logged In */}
                <div className="space-y-1">
                  <button
                    disabled
                    className="w-full flex items-center gap-2 p-2.5 rounded-lg hover:bg-white/10 transition-colors text-left opacity-60 cursor-not-allowed"
                  >
                    <Star className="h-5 w-5 text-ocean-300" />
                    <span className="text-sm font-medium">My Stuff</span>
                    <Badge className="rounded-full bg-amber-500/20 text-amber-300 border-amber-400/30 text-[10px] px-2 py-0 font-semibold ml-auto">
                      Coming Soon
                    </Badge>
                  </button>
                </div>

                <Separator className="bg-white/10" />

                {/* Navigation Links */}
                <div className="space-y-1">
                  {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                    <button
                      onClick={() => handleNavigate('/admin/trips')}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/10 transition-colors text-left"
                    >
                      <Shield className="h-5 w-5 text-ocean-300" />
                      <span className="text-sm font-medium">Admin Panel</span>
                    </button>
                  )}

                  {showEditTrip &&
                    (profile?.role === 'super_admin' ||
                      profile?.role === 'content_manager' ||
                      profile?.role === 'admin') && (
                      <button
                        onClick={handleEditTrip}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/10 transition-colors text-left"
                      >
                        <Edit className="h-5 w-5 text-ocean-300" />
                        <span className="text-sm font-medium">Edit Trip</span>
                      </button>
                    )}
                </div>
              </>
            ) : (
              <>
                {/* Login Button - When Logged Out (at top where profile would be) */}
                <button
                  onClick={handleLoginClick}
                  className="w-full flex items-center gap-3 p-3.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-left"
                >
                  <User className="h-5 w-5 text-white" />
                  <span className="text-sm font-medium">Login</span>
                </button>

                <Separator className="bg-white/10" />
              </>
            )}

            {/* Time Format Toggle */}
            <button
              onClick={handleTimeFormatToggle}
              className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-ocean-300" />
                <span className="text-sm font-medium">Time Format</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white/60">
                  {timeFormat === '24h' ? '24H' : 'AM/PM'}
                </span>
                {/* Toggle Switch */}
                <div
                  className={cn(
                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                    timeFormat === '24h' ? 'bg-ocean-500' : 'bg-white/40'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full transition-transform bg-white shadow-sm',
                      timeFormat === '24h' ? 'translate-x-5' : 'translate-x-0.5'
                    )}
                  />
                </div>
              </div>
            </button>

            <Separator className="bg-white/10" />

            {/* Quick Actions */}
            <div className="space-y-1.5">
              {/* Add to Home Screen - conditionally shown */}
              {showInstallButton && (
                <button
                  onClick={handleInstallClick}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <Download className="h-5 w-5 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">Add to Home Screen</span>
                </button>
              )}

              {/* About KGAY Travel */}
              <button
                onClick={() => setShowAboutModal(true)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/10 transition-colors text-left"
              >
                <Info className="h-5 w-5 text-orange-400" />
                <span className="text-sm font-medium text-orange-400">About KGAY Travel</span>
              </button>
            </div>

            {/* Sign Out (when logged in) */}
            {user && (
              <>
                <Separator className="bg-white/10" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <LogOut className="h-5 w-5 text-red-400" />
                  <span className="text-sm font-medium text-red-400">Sign Out</span>
                </button>
              </>
            )}

            {/* Last Updated & Refresh Button - After Sign Out, centered */}
            <div className="flex items-center justify-center gap-2 py-3">
              <span className="text-xs text-white/50">
                Updated {formatLastUpdated(lastUpdated)}
              </span>
              <button
                onClick={handleRefreshClick}
                disabled={isChecking}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition-colors disabled:opacity-50"
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
                    'w-3.5 h-3.5 transition-all',
                    isChecking && 'animate-spin text-blue-400',
                    !isChecking && updateAvailable && 'text-green-400',
                    !isChecking && !updateAvailable && 'text-blue-400'
                  )}
                />
                <span className="text-[10px] font-medium text-blue-400">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* About KGAY Travel Modal */}
      <AboutKGayModal open={showAboutModal} onOpenChange={setShowAboutModal} />

      {/* iOS Instructions Dialog */}
      <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <DialogContent className="sm:max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Download className="h-6 w-6 text-blue-400" />
              </div>
              Add to Home Screen
            </DialogTitle>
            <DialogDescription className="text-white/60 text-base">
              Install this app for quick access and offline support
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-6">
            {/* Step 1 - With animated icon */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-base font-bold shadow-lg">
                1
              </div>
              <div className="flex-1 pt-1">
                <p className="text-base leading-relaxed">
                  Tap the{' '}
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-blue-500/20 mx-1 animate-pulse">
                    <Share className="h-4 w-4 text-blue-400" />
                  </span>{' '}
                  <strong className="text-blue-400">Share</strong> button
                </p>
                <p className="text-sm text-white/50 mt-1">Located at the bottom of Safari</p>
              </div>
            </div>

            {/* Visual separator */}
            <div className="flex items-center gap-2 px-12">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="text-white/30">↓</div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>

            {/* Step 2 - With icon */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-base font-bold shadow-lg">
                2
              </div>
              <div className="flex-1 pt-1">
                <p className="text-base leading-relaxed">
                  Scroll down and tap{' '}
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-blue-500/20 mx-1">
                    <Plus className="h-4 w-4 text-blue-400" />
                  </span>{' '}
                  <strong className="text-blue-400">Add to Home Screen</strong>
                </p>
                <p className="text-sm text-white/50 mt-1">You may need to scroll to find it</p>
              </div>
            </div>

            {/* Visual separator */}
            <div className="flex items-center gap-2 px-12">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="text-white/30">↓</div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-base font-bold shadow-lg">
                3
              </div>
              <div className="flex-1 pt-1">
                <p className="text-base leading-relaxed">
                  Tap <strong className="text-blue-400">Add</strong>
                </p>
                <p className="text-sm text-white/50 mt-1">In the top right corner</p>
              </div>
            </div>

            {/* Benefits card */}
            <div className="mt-6 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="text-2xl">✨</div>
                <div>
                  <p className="text-sm font-semibold text-blue-300 mb-1">Quick Access</p>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Launch instantly from your home screen. Works offline and loads faster!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setShowIOSInstructions(false)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg"
            >
              Got it, thanks!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
