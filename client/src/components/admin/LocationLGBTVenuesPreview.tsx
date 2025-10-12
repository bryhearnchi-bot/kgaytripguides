import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Building2 } from 'lucide-react';

interface LGBTVenue {
  id: number;
  locationId: number;
  name: string;
  venueType?: string;
  description?: string;
  address?: string;
  imageUrl?: string;
  websiteUrl?: string;
  orderIndex: number;
}

interface LocationLGBTVenuesPreviewProps {
  locationId: number;
}

export function LocationLGBTVenuesPreview({ locationId }: LocationLGBTVenuesPreviewProps) {
  const { data: venues = [], isLoading } = useQuery<LGBTVenue[]>({
    queryKey: ['location-lgbt-venues', locationId],
    queryFn: async () => {
      const response = await api.get(`/api/locations/${locationId}/lgbt-venues`);
      if (!response.ok) throw new Error('Failed to fetch LGBT venues');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-white/20 rounded w-3/4"></div>
          <div className="h-3 bg-white/15 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
        <Building2 className="h-8 w-8 text-white/30 mx-auto mb-2" />
        <p className="text-xs text-white/50">No LGBT-friendly venues added yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
      {venues.slice(0, 3).map(venue => (
        <div key={venue.id} className="flex items-start gap-2">
          <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{venue.name}</p>
            {venue.venueType && <p className="text-xs text-white/50">{venue.venueType}</p>}
          </div>
        </div>
      ))}
      {venues.length > 3 && (
        <p className="text-xs text-white/40 text-center pt-1">+{venues.length - 3} more</p>
      )}
    </div>
  );
}
