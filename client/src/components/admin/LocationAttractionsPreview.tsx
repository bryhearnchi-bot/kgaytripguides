import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { List } from 'lucide-react';

interface Attraction {
  id: number;
  locationId: number;
  name: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  websiteUrl?: string;
  orderIndex: number;
}

interface LocationAttractionsPreviewProps {
  locationId: number;
}

export function LocationAttractionsPreview({ locationId }: LocationAttractionsPreviewProps) {
  const { data: attractions = [], isLoading } = useQuery<Attraction[]>({
    queryKey: ['location-attractions', locationId],
    queryFn: async () => {
      const response = await api.get(`/api/locations/${locationId}/attractions`);
      if (!response.ok) throw new Error('Failed to fetch attractions');
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

  if (attractions.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
        <List className="h-8 w-8 text-white/30 mx-auto mb-2" />
        <p className="text-xs text-white/50">No attractions added yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
      {attractions.slice(0, 3).map(attraction => (
        <div key={attraction.id} className="flex items-start gap-2">
          <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{attraction.name}</p>
            {attraction.category && <p className="text-xs text-white/50">{attraction.category}</p>}
          </div>
        </div>
      ))}
      {attractions.length > 3 && (
        <p className="text-xs text-white/40 text-center pt-1">+{attractions.length - 3} more</p>
      )}
    </div>
  );
}
