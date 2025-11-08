import React, { memo, useEffect } from 'react';
import { Bell, X, Ship } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetPortal,
} from '@/components/ui/sheet';
import type { Update } from '@/types/trip-info';
import { formatDistanceToNow } from 'date-fns';
import { useLocation } from 'wouter';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface UpdateWithTrip extends Update {
  trip_name?: string;
  trip_slug?: string;
  start_date?: string;
}

interface GlobalNotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  updates: UpdateWithTrip[];
  onMarkAsRead: () => void;
}

export const GlobalNotificationsPanel = memo(function GlobalNotificationsPanel({
  open,
  onOpenChange,
  updates,
  onMarkAsRead,
}: GlobalNotificationsPanelProps) {
  const [, setLocation] = useLocation();
  const [lastReadTimestamp, setLastReadTimestamp] = React.useState<string | null>(null);

  // Load last read timestamp
  React.useEffect(() => {
    const stored = localStorage.getItem('global-notifications-last-read');
    setLastReadTimestamp(stored);
  }, []);

  useEffect(() => {
    if (open) {
      onMarkAsRead();
      // Update local timestamp to reflect the read state
      const now = new Date().toISOString();
      setLastReadTimestamp(now);
    }
  }, [open, onMarkAsRead]);

  // Check if an update is unread
  const isUnread = (update: UpdateWithTrip) => {
    if (!lastReadTimestamp) return true;
    return new Date(update.created_at) > new Date(lastReadTimestamp);
  };

  const handleUpdateClick = (update: UpdateWithTrip) => {
    if (update.trip_slug) {
      // Navigate to the trip page
      setLocation(`/trip/${update.trip_slug}`);
      onOpenChange(false);
    }
  };

  // Sort updates by newest first in pure chronological order
  const sortedUpdates = [...updates].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Group consecutive updates from the same trip
  const groupedUpdates: Array<{
    tripId: number;
    tripName: string;
    tripSlug: string;
    updates: UpdateWithTrip[];
  }> = [];

  sortedUpdates.forEach(update => {
    const lastGroup = groupedUpdates[groupedUpdates.length - 1];

    // If this update is from the same trip as the last group, add it to that group
    if (lastGroup && lastGroup.tripId === update.trip_id) {
      lastGroup.updates.push(update);
    } else {
      // Otherwise, create a new group
      groupedUpdates.push({
        tripId: update.trip_id,
        tripName: update.trip_name || 'Unknown Trip',
        tripSlug: update.trip_slug || '',
        updates: [update],
      });
    }
  });

  return (
    <Sheet open={open} modal={false}>
      <SheetPortal>
        {open && (
          <div
            className="fixed inset-0 top-[2.5rem] z-40 bg-black/80 animate-in fade-in-0"
            onClick={() => onOpenChange(false)}
          />
        )}
        <SheetContent
          side="right"
          className="w-[85%] sm:w-[400px] !top-[2.5rem] !bottom-0 !h-auto !z-50 bg-[#10192f] border-l border-white/10 text-white overflow-y-auto [&>button]:hidden"
        >
          <VisuallyHidden>
            <SheetTitle>Trip Updates</SheetTitle>
            <SheetDescription>
              View recent updates and announcements for your trips
            </SheetDescription>
          </VisuallyHidden>

          <div className="py-4 space-y-6">
            {/* Header */}
            <div className="px-4">
              <h2 className="text-base font-semibold text-white mb-2">Recent Updates</h2>
              <div className="border-b border-white/10"></div>
            </div>

            {updates.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white/60 mb-2">No updates yet</h3>
                <p className="text-sm text-white/40">You'll see trip announcements and news here</p>
              </div>
            ) : (
              <div className="space-y-3 px-2">
                {groupedUpdates.map((group, groupIndex) => (
                  <div key={`${group.tripId}-${groupIndex}`} className="space-y-1">
                    {/* Trip Header - shown once per consecutive group */}
                    <div className="flex items-center gap-2 px-2">
                      <Ship className="w-4 h-4 text-ocean-400 flex-shrink-0" />
                      <h3 className="text-sm font-semibold text-white flex-1 min-w-0 truncate">
                        {group.tripName}
                      </h3>
                    </div>

                    {/* All updates in this consecutive group */}
                    {group.updates.map(update => (
                      <div
                        key={update.id}
                        onClick={() => handleUpdateClick(update)}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-white group-hover:text-amber-300 transition-colors">
                                {update.custom_title || update.title}
                              </h4>
                              {isUnread(update) && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30 backdrop-blur-sm">
                                  unread
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/70 leading-relaxed">
                              {update.description}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-end">
                          <span className="text-xs text-white/50">
                            {formatDistanceToNow(new Date(update.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </SheetPortal>
    </Sheet>
  );
});
