import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import type { Update } from '@/types/trip-info';

interface UpdateWithTrip extends Update {
  trip_name?: string;
  trip_slug?: string;
  start_date?: string;
}

/**
 * Hook to get unread alert counts
 * @param tripSlug - Optional trip slug to filter alerts for a specific trip
 * @returns Object with unreadCount and a refresh function
 */
export function useUnreadAlerts(tripSlug?: string) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadTimestamp, setLastReadTimestamp] = useState<string | null>(null);
  const { user } = useSupabaseAuthContext();

  // Fetch last read timestamp
  const fetchLastRead = useCallback(async () => {
    if (user) {
      const { data, error } = await supabase
        .from('user_notification_reads')
        .select('last_read_at')
        .maybeSingle();

      if (error) {
        logger.error('Error fetching user notification read status', error);
        return null;
      }
      return data?.last_read_at || null;
    } else {
      return localStorage.getItem('global-notifications-last-read');
    }
  }, [user]);

  // Fetch updates and calculate unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      // Fetch last read timestamp
      const lastRead = await fetchLastRead();
      setLastReadTimestamp(lastRead);

      // Fetch updates
      let endpoint = '/api/updates/all';

      // If tripSlug is provided, we need to get the trip ID first
      if (tripSlug) {
        const tripResponse = await api.get(`/api/trips/${tripSlug}/complete`);
        if (tripResponse.ok) {
          const tripData = await tripResponse.json();
          endpoint = `/api/trips/${tripData.trip.id}/updates`;
        } else {
          // If we can't get trip data, fall back to all updates
          logger.warn('Could not fetch trip data for slug', { tripSlug });
        }
      }

      const response = await api.get(endpoint);

      if (response.ok) {
        const updates: UpdateWithTrip[] = await response.json();

        // Count unread updates
        const unread = updates.filter(update => {
          if (!lastRead) return true;
          return new Date(update.created_at) > new Date(lastRead);
        }).length;

        setUnreadCount(unread);
      }
    } catch (error) {
      logger.error('Error fetching unread alerts', error instanceof Error ? error : undefined);
    }
  }, [tripSlug, fetchLastRead]);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Set up polling for updates every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    refresh: fetchUnreadCount,
  };
}
