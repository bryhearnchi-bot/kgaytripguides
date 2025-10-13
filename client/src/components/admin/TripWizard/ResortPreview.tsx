import {
  Building2,
  Users,
  Bed,
  MapPin,
  Clock,
  Edit2,
  ExternalLink,
  Palmtree,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';

interface ResortPreviewProps {
  resortData: any;
  resortId?: number | null;
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

export function ResortPreview({ resortData, resortId, onEdit }: ResortPreviewProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch venues and amenities when resort ID is available
  useEffect(() => {
    const fetchResortRelations = async () => {
      // Use resortId prop if provided, otherwise try resortData.id
      const id = resortId ?? resortData?.id;
      if (!id) {
        setVenues([]);
        setAmenities([]);
        return;
      }

      setLoading(true);
      try {
        const [venuesResponse, amenitiesResponse] = await Promise.all([
          api.get(`/api/admin/resorts/${id}/venues`),
          api.get(`/api/resorts/${id}/amenities`),
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

    fetchResortRelations();
  }, [resortId, resortData?.id]);

  if (!resortData || !resortData.name) {
    return (
      <div className="p-4 bg-white/[0.02] border border-white/10 rounded-lg">
        <p className="text-white/60 text-sm">No resort data available</p>
      </div>
    );
  }

  // Format time for display
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-3">
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Resort Information</h3>
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
            Edit Resort
          </Button>
        )}
      </div>

      {/* Resort Preview Card */}
      <div className="p-4 bg-white/[0.02] border border-white/10 rounded-lg">
        <div className="flex gap-4">
          {/* Resort Image - Left Side */}
          {resortData.imageUrl && (
            <div className="w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-white/[0.02]">
              <img
                src={resortData.imageUrl}
                alt={resortData.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Resort Details - Right Side */}
          <div className="flex-1 grid grid-cols-2 gap-3">
            {/* Name and Location */}
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Resort Name</p>
              <p className="text-sm text-white font-medium">{resortData.name}</p>
              {resortData.locationName && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="w-2.5 h-2.5 text-white/50" />
                  <p className="text-xs text-white/70">{resortData.locationName}</p>
                </div>
              )}
            </div>

            {/* Capacity */}
            {resortData.capacity && (
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Capacity</p>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-white/50" />
                  <p className="text-sm text-white">
                    {resortData.capacity.toLocaleString()} guests
                  </p>
                </div>
              </div>
            )}

            {/* Number of Rooms */}
            {resortData.numberOfRooms && (
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Rooms</p>
                <div className="flex items-center gap-1">
                  <Bed className="w-3 h-3 text-white/50" />
                  <p className="text-sm text-white">{resortData.numberOfRooms} rooms</p>
                </div>
              </div>
            )}

            {/* Check-in/Check-out Times */}
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">
                Check-in/out
              </p>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-white/50" />
                <p className="text-sm text-white">
                  {formatTime(resortData.checkInTime)} / {formatTime(resortData.checkOutTime)}
                </p>
              </div>
            </div>

            {/* Property Map Link */}
            {resortData.propertyMapUrl && (
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">
                  Property Map
                </p>
                <a
                  href={resortData.propertyMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <MapPin className="w-3 h-3" />
                  <span>View Map</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Description - Full Width Below */}
        {resortData.description && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Description</p>
            <p className="text-xs text-white/80 leading-relaxed">{resortData.description}</p>
          </div>
        )}

        {/* Venues and Amenities - Full Width Below */}
        {(venues.length > 0 || amenities.length > 0) && (
          <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-4">
            {/* Venues */}
            {venues.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Palmtree className="w-3 h-3 text-cyan-400" />
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
