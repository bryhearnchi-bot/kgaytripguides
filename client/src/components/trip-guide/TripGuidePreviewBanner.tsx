import React from 'react';
import { Eye, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TripGuidePreviewBannerProps {
  isApproving: boolean;
  onApprove: () => void;
}

export const TripGuidePreviewBanner = React.memo(function TripGuidePreviewBanner({
  isApproving,
  onApprove,
}: TripGuidePreviewBannerProps) {
  return (
    <div className="bg-amber-500/10 border-y border-amber-400/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-white">Preview Mode</h3>
              <p className="text-xs text-white/70">Not live yet</p>
            </div>
          </div>
          <Button
            onClick={onApprove}
            disabled={isApproving}
            className="h-10 px-4 sm:px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all disabled:opacity-40 w-full sm:w-auto"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">
              {isApproving ? 'Approving...' : 'Approve & Publish'}
            </span>
            <span className="sm:hidden">{isApproving ? 'Approving...' : 'Approve'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
});
