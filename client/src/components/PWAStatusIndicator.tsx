import React from 'react';
import { Smartphone, Monitor, Globe } from 'lucide-react';
import { useServiceWorker } from '@/hooks/useServiceWorker';

const PWAStatusIndicator: React.FC = () => {
  const { isStandalone, isInstalled } = useServiceWorker();

  if (!isStandalone && !isInstalled) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-40">
      <div className="bg-blue-600 text-white px-2 py-1 rounded-full shadow-lg flex items-center">
        {isStandalone ? (
          <>
            <Smartphone className="w-3 h-3 mr-1" />
            <span className="text-xs font-medium">PWA</span>
          </>
        ) : (
          <>
            <Globe className="w-3 h-3 mr-1" />
            <span className="text-xs font-medium">Web</span>
          </>
        )}
      </div>
    </div>
  );
};

export default PWAStatusIndicator;