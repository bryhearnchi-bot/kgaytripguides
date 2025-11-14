import { useEffect, useState, useCallback } from 'react';
import { Bell, Ship } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLocation } from 'wouter';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api-client';
import type { Update } from '@/types/trip-info';

interface UpdateWithTrip extends Update {
  trip_name?: string;
  trip_slug?: string;
  start_date?: string;
}

interface AlertsProps {
  tripSlug?: string;
  tripId?: number;
}

export default function Alerts({ tripSlug, tripId }: AlertsProps = {}) {
  const [, setLocation] = useLocation();
  const [updates, setUpdates] = useState<UpdateWithTrip[]>([]);
  const [lastReadTimestamp, setLastReadTimestamp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useSupabaseAuthContext();

  // Fetch updates - either for specific trip or all trips
  const fetchUpdates = useCallback(async () => {
    try {
      setIsLoading(true);
      let endpoint = '/api/updates/all';

      // If tripId is provided directly, use it (faster, no extra API call)
      if (tripId) {
        endpoint = `/api/trips/${tripId}/updates`;
      }
      // Otherwise, if tripSlug is provided, fetch trip-specific updates
      else if (tripSlug) {
        const tripResponse = await api.get(`/api/trips/${tripSlug}/complete`);
        if (tripResponse.ok) {
          const tripData = await tripResponse.json();
          endpoint = `/api/trips/${tripData.trip.id}/updates`;
        }
      }

      const response = await api.get(endpoint);
      if (response.ok) {
        const data = await response.json();
        setUpdates(data);
      }
    } catch (error) {
      console.error('Error fetching updates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tripSlug, tripId]);

  // Load last read timestamp
  useEffect(() => {
    const fetchLastRead = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('user_notification_reads')
          .select('last_read_at')
          .maybeSingle();

        if (error) {
          console.error('Error fetching user notification read status:', error);
        } else if (data) {
          setLastReadTimestamp(data.last_read_at);
        }
      } else {
        const stored = localStorage.getItem('global-notifications-last-read');
        setLastReadTimestamp(stored);
      }
    };

    fetchLastRead();
    fetchUpdates();
  }, [user, fetchUpdates]);

  // Mark all as read on mount
  useEffect(() => {
    const now = new Date().toISOString();
    setLastReadTimestamp(now);

    if (user) {
      supabase
        .from('user_notification_reads')
        .upsert(
          {
            user_id: user.id,
            last_read_at: now,
          },
          {
            onConflict: 'user_id',
          }
        )
        .then(({ error }) => {
          if (error) {
            console.error('Error updating user notification read status:', error);
          }
        });
    } else {
      localStorage.setItem('global-notifications-last-read', now);
    }
  }, [user]);

  // Check if an update is unread
  const isUnread = (update: UpdateWithTrip) => {
    if (!lastReadTimestamp) return true;
    return new Date(update.created_at) > new Date(lastReadTimestamp);
  };

  const handleUpdateClick = (update: UpdateWithTrip) => {
    if (update.trip_slug) {
      setLocation(`/trip/${update.trip_slug}`);
    }
  };

  // Sort updates by newest first
  const sortedUpdates = [...updates].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Group consecutive updates from the same trip (only if not filtered by trip)
  const groupedUpdates: Array<{
    tripId: number;
    tripName: string;
    tripSlug: string;
    updates: UpdateWithTrip[];
  }> = [];

  // Only group by trip if we're showing all trips
  if (!tripSlug && !tripId) {
    sortedUpdates.forEach(update => {
      const lastGroup = groupedUpdates[groupedUpdates.length - 1];

      if (lastGroup && lastGroup.tripId === update.trip_id) {
        lastGroup.updates.push(update);
      } else {
        groupedUpdates.push({
          tripId: update.trip_id,
          tripName: update.trip_name || 'Unknown Trip',
          tripSlug: update.trip_slug || '',
          updates: [update],
        });
      }
    });
  } else {
    // If filtered by trip, show all updates without grouping
    if (sortedUpdates.length > 0) {
      groupedUpdates.push({
        tripId: sortedUpdates[0].trip_id,
        tripName: '', // Don't show trip name when filtered
        tripSlug: sortedUpdates[0].trip_slug || '',
        updates: sortedUpdates,
      });
    }
  }

  return (
    <>
      {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/40 mx-auto mb-4"></div>
            <p className="text-sm text-white/40">Loading alerts...</p>
          </div>
        ) : updates.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-20 h-20 text-white/20 mx-auto mb-6" />
            <h3 className="text-xl font-medium text-white/60 mb-3">No updates yet</h3>
            <p className="text-sm text-white/40">You'll see trip announcements and news here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedUpdates.map((group, groupIndex) => (
              <div key={`${group.tripId}-${groupIndex}`} className="space-y-3">
                {/* Trip Header - only show if not filtered by trip */}
                {!tripSlug && !tripId && (
                  <div className="flex items-center gap-2 px-2">
                    <Ship className="w-5 h-5 text-ocean-400 flex-shrink-0" />
                    <h3 className="text-base font-semibold text-white flex-1 min-w-0 truncate">
                      {group.tripName}
                    </h3>
                  </div>
                )}

                {/* Updates in this group */}
                {group.updates.map(update => (
                  <div
                    key={update.id}
                    onClick={() => handleUpdateClick(update)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-base font-medium text-white group-hover:text-amber-300 transition-colors">
                            {update.custom_title || update.title}
                          </h4>
                          {isUnread(update) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30 backdrop-blur-sm">
                              unread
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed">
                          {update.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-end">
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
    </>
  );
}
