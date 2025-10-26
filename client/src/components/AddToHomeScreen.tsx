import { useState, useEffect } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function AddToHomeScreen() {
  const [showButton, setShowButton] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (already added to home screen)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(standalone);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Don't show button if already in standalone mode
    if (standalone) {
      setShowButton(false);
      return;
    }

    // For iOS devices, show button if not in standalone and using Safari
    if (iOS) {
      // Check if it's Safari (not other browsers on iOS)
      const isSafari =
        /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|OPiOS/.test(navigator.userAgent);
      setShowButton(isSafari);
    }

    // For Android/Desktop Chrome, listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also show button after app installed
    window.addEventListener('appinstalled', () => {
      setShowButton(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show iOS instructions
      setShowIOSInstructions(true);
    } else if (deferredPrompt) {
      // Show the install prompt on Chrome/Android
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowButton(false);
      }

      setDeferredPrompt(null);
    }
  };

  // Don't render if shouldn't show
  if (!showButton || isStandalone) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleInstallClick}
        variant="outline"
        size="sm"
        className="flex items-center gap-2 text-white border-white/20 bg-white/10 hover:bg-white/20 hover:border-white/30 transition-colors"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Add to Home Screen</span>
        <span className="sm:hidden">Install</span>
      </Button>

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
