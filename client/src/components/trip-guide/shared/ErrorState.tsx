import React, { memo, useCallback } from 'react';
import { Ship } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ErrorState = memo(function ErrorState() {
  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center text-white">
        <Ship className="h-16 w-16 mx-auto mb-4 text-red-400" />
        <h2 className="text-2xl font-bold mb-2">Unable to load trip guide</h2>
        <p className="text-lg mb-4">Please try refreshing the page</p>
        <Button
          onClick={handleRefresh}
          className="bg-gray-100/20 hover:bg-gray-100/30 text-white border border-white/20"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
});
