import { RefreshCw } from 'lucide-react';
import { useUpdate } from '@/context/UpdateContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function AppFooter() {
  const { lastUpdated, updateAvailable, isChecking, isAdminRoute, checkForUpdates, applyUpdate } =
    useUpdate();

  const handleRefreshClick = async () => {
    if (updateAvailable) {
      // Apply the waiting update
      applyUpdate();
    } else {
      // Check for updates manually
      await checkForUpdates();
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
    <footer
      className={cn(
        'w-full border-t py-2 flex justify-center',
        isAdminRoute ? 'border-[#10192f] bg-[#10192f]' : 'border-ocean-900 bg-ocean-900'
      )}
    >
      <div className="flex items-center gap-2 text-xs text-white/60">
        <span>Updated {formatLastUpdated(lastUpdated)}</span>
        <button
          onClick={handleRefreshClick}
          disabled={isChecking}
          className={cn(
            'relative p-1 rounded-full transition-colors',
            'hover:bg-white/10 active:bg-white/20',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
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
              'w-3 h-3 transition-all',
              isChecking && 'animate-spin text-blue-400',
              !isChecking && updateAvailable && 'text-green-400',
              !isChecking && !updateAvailable && 'text-white/60'
            )}
          />

          {/* Badge for update available */}
          {updateAvailable && !isChecking && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </button>
      </div>
    </footer>
  );
}
