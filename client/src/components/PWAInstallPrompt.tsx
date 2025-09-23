import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface PWAInstallPromptProps {
  onClose?: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed/running as standalone
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
    };

    // Check if device is iOS
    const checkIOS = () => {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setIsIOS(ios);
    };

    // Check if PWA is already installed
    const checkInstalled = () => {
      if ('getInstalledRelatedApps' in navigator) {
        (navigator as any).getInstalledRelatedApps().then((relatedApps: any[]) => {
          setIsInstalled(relatedApps.length > 0);
        });
      }
    };

    checkStandalone();
    checkIOS();
    checkInstalled();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      setDeferredPrompt(e);

      // Don't show if already installed or in standalone mode
      if (!isInstalled && !isStandalone) {
        // Show after a delay to avoid being intrusive
        setTimeout(() => setShowPrompt(true), 5000);
      }
    };

    // Listen for successful app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled, isStandalone]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      await deferredPrompt.userChoice;

      // Clear the deferred prompt
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
    onClose?.();
  };

  // Don't show if already installed, in standalone mode, or no prompt available
  if (isInstalled || isStandalone || (!showPrompt && !isIOS)) {
    return null;
  }

  // iOS Install Instructions
  if (isIOS && !isStandalone) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <Smartphone className="w-6 h-6 mr-2" />
              <h3 className="font-semibold text-lg">Install Trip Guide</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-1"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-sm mb-4 text-blue-100">
            Add to your home screen for the best experience
          </p>

          <div className="space-y-3 text-sm">
            <div className="flex items-center">
              <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 text-xs font-bold">1</span>
              <span>Tap the share button <span className="bg-white/20 px-2 py-1 rounded">⬆</span> in Safari</span>
            </div>
            <div className="flex items-center">
              <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 text-xs font-bold">2</span>
              <span>Scroll down and tap "Add to Home Screen"</span>
            </div>
            <div className="flex items-center">
              <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 text-xs font-bold">3</span>
              <span>Tap "Add" to confirm</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20">
            <div className="text-xs text-blue-100">
              ✨ Works offline • 📱 Native app feel • 🔔 Push notifications
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Standard PWA Install Prompt (Chrome, Edge, etc.)
  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-lg shadow-lg">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <Download className="w-6 h-6 mr-2" />
            <h3 className="font-semibold text-lg">Install App</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 p-1"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-sm mb-4 text-green-100">
          Get the full experience with offline access and quick launch
        </p>

        <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
          <div className="text-center">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1">
              📱
            </div>
            <span>Fast Launch</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1">
              🔄
            </div>
            <span>Works Offline</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1">
              🔔
            </div>
            <span>Notifications</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 flex-1"
            onClick={handleClose}
          >
            Maybe Later
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="bg-white text-green-700 hover:bg-green-50 flex-1"
            onClick={handleInstallClick}
          >
            Install Now
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PWAInstallPrompt;