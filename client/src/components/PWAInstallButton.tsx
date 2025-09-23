import React, { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PWAInstallButtonProps {
  tripName?: string;
  tripSlug?: string;
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

const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ tripName, tripSlug }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check device and installation status
    const checkStatus = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);

      setIsStandalone(standalone);
      setIsIOS(ios);

      // Show install button for iOS or when we have a deferred prompt
      setCanInstall(ios || deferredPrompt !== null);
    };

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    checkStatus();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // For browsers that support the install prompt
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;

      setDeferredPrompt(null);
      setCanInstall(false);
    } else if (isIOS) {
      // For iOS, we'll show instructions in a modal/alert
      const instructions = `To install "${tripName || 'Trip Guide'}":

1. Tap the Share button (⬆️) in Safari
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add" to install

This will create a dedicated app just for this trip!`;

      alert(instructions);
    }
  };

  // Don't show if already installed/standalone or can't install
  if (isInstalled || isStandalone || !canInstall) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleInstallClick}
      className="text-white hover:bg-white/20 flex items-center gap-1"
      title={`Install ${tripName || 'Trip Guide'} app`}
    >
      {isIOS ? (
        <Smartphone className="w-4 h-4" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">Install</span>
    </Button>
  );
};

export default PWAInstallButton;