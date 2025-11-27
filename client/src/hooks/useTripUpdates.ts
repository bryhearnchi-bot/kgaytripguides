import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Update } from '@/types/trip-info';

interface UseTripUpdatesOptions {
  enabled?: boolean;
}

/**
 * Hook to fetch trip updates using React Query.
 * Per CLAUDE.md: "React Query staleTime: 5 minutes"
 *
 * @param tripId - The trip ID to fetch updates for
 * @param options - Optional configuration
 * @returns Query result with updates data
 */
export function useTripUpdates(tripId: number | undefined, options: UseTripUpdatesOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['trip-updates', tripId],
    queryFn: async (): Promise<Update[]> => {
      if (!tripId) return [];

      const response = await api.get(`/api/trips/${tripId}/updates`);
      if (!response.ok) {
        throw new Error('Failed to fetch trip updates');
      }
      return response.json();
    },
    enabled: enabled && !!tripId,
    staleTime: 5 * 60 * 1000, // 5 minutes per CLAUDE.md
  });
}

/**
 * Transform updates for display in the OverviewTab.
 * Converts raw Update objects to the format expected by the UI.
 */
export function transformUpdatesForDisplay(updates: Update[]) {
  return updates.map(update => ({
    id: update.id,
    timestamp: new Date(update.created_at).toLocaleDateString(),
    title: update.custom_title || update.title,
    description: update.description,
    type: update.update_type.includes('new')
      ? ('new' as const)
      : update.update_type.includes('updated')
        ? ('update' as const)
        : ('info' as const),
  }));
}
