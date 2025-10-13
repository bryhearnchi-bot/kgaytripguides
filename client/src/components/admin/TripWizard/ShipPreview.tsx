import { Ship, Users, Layers, Map, Edit2, ExternalLink, Anchor, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';

interface ShipPreviewProps {
  shipData: any;
  shipId?: number | null;
  onEdit?: () => void;
}

interface Venue {
  id: number;
  name: string;
  venueTypeName?: string;
}

interface Amenity {
  id: number;
  name: string;
}

export function ShipPreview({ shipData, shipId, onEdit }: ShipPreviewProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch venues and amenities when ship ID is available
  useEffect(() => {
    const fetchShipRelations = async () => {
      // Use shipId prop if provided, otherwise try shipData.id
      const id = shipId ?? shipData?.id;
      if (!id) {
        setVenues([]);
        setAmenities([]);
        return;
      }

      setLoading(true);
      try {
        const [venuesResponse, amenitiesResponse] = await Promise.all([
          api.get(`/api/admin/ships/${id}/venues`),
          api.get(`/api/ships/${id}/amenities`),
        ]);

        if (venuesResponse.ok) {
          const venuesData = await venuesResponse.json();
          setVenues(venuesData);
        }

        if (amenitiesResponse.ok) {
          const amenitiesData = await amenitiesResponse.json();
          setAmenities(amenitiesData);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchShipRelations();
  }, [shipId, shipData?.id]);

  if (!shipData || !shipData.name) {
    return (
      <div className="p-4 bg-white/[0.02] border border-white/10 rounded-lg">
        <p className="text-white/60 text-sm">No ship data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ship className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Ship Information</h3>
        </div>
        {onEdit && (
          <Button
            type="button"
            onClick={onEdit}
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
          >
            <Edit2 className="w-3 h-3 mr-1" />
            Edit Ship
          </Button>
        )}
      </div>

      {/* Ship Preview Card */}
      <div className="p-4 bg-white/[0.02] border border-white/10 rounded-lg">
        <div className="flex gap-4">
          {/* Ship Image - Left Side */}
          {shipData.imageUrl && (
            <div className="w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-white/[0.02]">
              <img
                src={shipData.imageUrl}
                alt={shipData.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Ship Details - Right Side */}
          <div className="flex-1 grid grid-cols-2 gap-3">
            {/* Name and Cruise Line */}
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Ship Name</p>
              <p className="text-sm text-white font-medium">{shipData.name}</p>
              {shipData.cruiseLineName && (
                <p className="text-xs text-white/70 mt-0.5">{shipData.cruiseLineName}</p>
              )}
            </div>

            {/* Capacity */}
            {shipData.capacity && (
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Capacity</p>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-white/50" />
                  <p className="text-sm text-white">{shipData.capacity.toLocaleString()} guests</p>
                </div>
              </div>
            )}

            {/* Decks */}
            {shipData.decks && (
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Decks</p>
                <div className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-white/50" />
                  <p className="text-sm text-white">{shipData.decks} decks</p>
                </div>
              </div>
            )}

            {/* Deck Plans Link */}
            {shipData.deckPlansUrl && (
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">
                  Deck Plans
                </p>
                <a
                  href={shipData.deckPlansUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <Map className="w-3 h-3" />
                  <span>View Plans</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Description - Full Width Below */}
        {shipData.description && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Description</p>
            <p className="text-xs text-white/80 leading-relaxed">{shipData.description}</p>
          </div>
        )}

        {/* Venues and Amenities - Full Width Below */}
        {(venues.length > 0 || amenities.length > 0) && (
          <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-4">
            {/* Venues */}
            {venues.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Anchor className="w-3 h-3 text-cyan-400" />
                  <p className="text-[10px] text-white/50 uppercase tracking-wider">
                    Venues ({venues.length})
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {venues.map(venue => (
                    <span
                      key={venue.id}
                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-cyan-400/10 border border-cyan-400/20 text-xs text-cyan-300"
                    >
                      {venue.name} {venue.venueTypeName && `- ${venue.venueTypeName}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <p className="text-[10px] text-white/50 uppercase tracking-wider">
                    Amenities ({amenities.length})
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {amenities.map(amenity => (
                    <span
                      key={amenity.id}
                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-cyan-400/10 border border-cyan-400/20 text-xs text-cyan-300"
                    >
                      {amenity.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
