import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Globe,
  Anchor,
  Navigation,
  Filter,
  Download,
  Upload,
  BarChart3,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { ImageUpload } from './ImageUpload';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../lib/supabase';
import type { Location } from '../../types/api';
// CSRF token not needed with Bearer authentication

interface LocationStatistics {
  total: number;
  byType: Record<string, number>;
  byRegion: Record<string, number>;
  byCountry: Record<string, number>;
}

interface LocationManagementProps {
  onSelectLocation?: (location: Location) => void;
  showSelectMode?: boolean;
  allowInlineCreate?: boolean;
}

const LOCATION_TYPES = [
  { value: 'port', label: 'Port of Call', icon: Anchor },
  { value: 'sea_day', label: 'Sea Day', icon: Navigation },
  { value: 'embark', label: 'Embarkation', icon: Upload },
  { value: 'disembark', label: 'Disembarkation', icon: Download },
];

const REGIONS = [
  'Mediterranean',
  'Caribbean',
  'Northern Europe',
  'Alaska',
  'Asia',
  'Australia & New Zealand',
  'South America',
  'Transatlantic',
  'Other'
];

export default function LocationManagement({
  onSelectLocation,
  showSelectMode = false,
  allowInlineCreate = false
}: LocationManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session, profile } = useSupabaseAuth();
  const canDelete = (role?: string) => role && ['admin', 'content_manager', 'super_admin'].includes(role);

  // Fetch locations with search and filters
  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations', searchQuery, selectedType, selectedRegion],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedType) params.append('type', selectedType);
      if (selectedRegion) params.append('region', selectedRegion);

      // Get fresh session token
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/locations?${params.toString()}`, {
        credentials: 'include',
        headers,
      });
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    },
  });

  // Fetch location statistics
  const { data: stats } = useQuery({
    queryKey: ['location-stats'],
    queryFn: async () => {
      // Get fresh session token
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/locations/stats', {
        credentials: 'include',
        headers,
      });
      if (!response.ok) throw new Error('Failed to fetch location statistics');
      return response.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (locationData: Partial<Location>) => {
      // Get fresh session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
        body: JSON.stringify(locationData),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create location' }));
        throw new Error(error.error || 'Failed to create location');
      }
      return response.json();
    },
    onSuccess: (newLocation) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['location-stats'] });
      setShowCreateDialog(false);
      setEditingLocation(null);
      toast({
        title: "Location Added",
        description: `${newLocation.name} has been added to the location database.`,
      });

      if (showSelectMode && onSelectLocation) {
        onSelectLocation(newLocation);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create location.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...locationData }: Partial<Location> & { id: number }) => {
      // Get fresh session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/locations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
        body: JSON.stringify(locationData),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to update location' }));
        throw new Error(error.error || 'Failed to update location');
      }
      return response.json();
    },
    onSuccess: (updatedLocation) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['location-stats'] });
      setEditingLocation(null);
      toast({
        title: "Location Updated",
        description: `${updatedLocation.name} has been updated.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update location.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      // Get fresh session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to delete location' }));
        throw new Error(error.error || 'Failed to delete location');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['location-stats'] });
      toast({
        title: "Location Deleted",
        description: "Location has been deleted from the database.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete location.",
        variant: "destructive",
      });
    },
  });

  // Filter locations based on search and filters
  const filteredLocations = useMemo(() => {
    return locations.filter(location => {
      const matchesSearch = !searchQuery ||
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (location.country && location.country.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = !selectedType; // Location type filtering removed since schema doesn't have port_type
      const matchesRegion = true; // Region field removed from schema

      return matchesSearch && matchesType && matchesRegion;
    });
  }, [locations, searchQuery, selectedType, selectedRegion]);

  const handleSubmit = (formData: Partial<Location>) => {
    if (editingLocation) {
      updateMutation.mutate({ ...formData, id: editingLocation.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const LocationForm = ({ location, onSubmit, onCancel }: {
    location?: Location | null;
    onSubmit: (data: Partial<Location>) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState<Partial<Location>>({
      name: location?.name || '',
      country: location?.country || '',
      description: location?.description || '',
      imageUrl: location?.imageUrl || '',
      coordinates: location?.coordinates || null,
    });

    const handleCoordinatesChange = (lat: string, lng: string) => {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (!isNaN(latitude) && !isNaN(longitude)) {
        setFormData(prev => ({
          ...prev,
          coordinates: { lat: latitude, lng: longitude }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          coordinates: null
        }));
      }
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Location Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter location name"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Country *</label>
            <Input
              value={formData.country}
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              placeholder="Enter country"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Region</label>
            <Select
              value={formData.region || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map(region => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Location Type *</label>
            <Select
              value="port"
              onValueChange={() => {}} // Disabled since schema doesn't have port_type
              disabled
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Latitude</label>
            <Input
              type="number"
              step="any"
              value={formData.coordinates?.lat || ''}
              onChange={(e) => handleCoordinatesChange(e.target.value, formData.coordinates?.lng?.toString() || '')}
              placeholder="e.g., 40.7128"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Longitude</label>
            <Input
              type="number"
              step="any"
              value={formData.coordinates?.lng || ''}
              onChange={(e) => handleCoordinatesChange(formData.coordinates?.lat?.toString() || '', e.target.value)}
              placeholder="e.g., -74.0060"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Location description, attractions, etc."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Location Image</label>
          <ImageUpload
            imageType="itinerary"
            onImageChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url || '' }))}
            currentImageUrl={formData.imageUrl}
            label="Location Image"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={() => onSubmit(formData)}
            disabled={!formData.name || !formData.country || createMutation.isPending || updateMutation.isPending}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {editingLocation ? 'Update Location' : 'Create Location'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  const LocationCard = ({ location }: { location: Location }) => {
    const locationType = LOCATION_TYPES[0]; // Default to port since schema doesn't have port_type
    const Icon = locationType?.icon || Anchor;

    return (
      <Card className="group hover:shadow-lg transition-all duration-200 border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">{location.name}</CardTitle>
            </div>
            <Badge variant="default">
              {locationType?.label || 'Port'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {location.imageUrl && (
            <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={location.imageUrl}
                alt={location.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Globe className="w-4 h-4" />
              <span>{location.country || 'N/A'}</span>
              {location.region && (
                <>
                  <span>•</span>
                  <span>{location.region}</span>
                </>
              )}
            </div>

            {location.coordinates && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>
                  {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                </span>
              </div>
            )}

            {location.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {location.description}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            {showSelectMode ? (
              <Button
                onClick={() => onSelectLocation?.(location)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Select Location
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingLocation(location)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMutation.mutate(location.id)}
                  className="text-red-600 hover:text-red-700"
                  title="Delete Location (Admins & Content Managers)"
                  disabled={!canDelete((profile as any)?.role)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const StatsDialog = () => (
    <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Location Statistics
          </DialogTitle>
        </DialogHeader>

        {stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Locations</div>
                </CardContent>
              </Card>

              {Object.entries(stats.byType).map(([type, count]) => {
                const locationType = LOCATION_TYPES.find(t => t.value === type);
                const Icon = locationType?.icon || Anchor;
                return (
                  <Card key={type}>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Icon className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="text-xl font-bold">{count}</div>
                      <div className="text-xs text-gray-600">{locationType?.label}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">By Region</h4>
                <div className="space-y-2">
                  {Object.entries(stats.byRegion).map(([region, count]) => (
                    <div key={region} className="flex justify-between">
                      <span className="text-sm">{region}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Top Countries</h4>
                <div className="space-y-2">
                  {Object.entries(stats.byCountry)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 8)
                    .map(([country, count]) => (
                    <div key={country} className="flex justify-between">
                      <span className="text-sm">{country}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header with Ocean Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              Location Management
            </h1>
            <p className="text-blue-100 mt-1">
              Manage cruise destinations, ports of call, and sea days
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowStatsDialog(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Statistics
            </Button>
            {!showSelectMode && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search locations, countries, or regions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'bg-blue-50 border-blue-200' : ''}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Location Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {LOCATION_TYPES.map(type => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Region</label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All regions</SelectItem>
                  {REGIONS.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedType('');
                  setSelectedRegion('');
                  setSearchQuery('');
                }}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredLocations.length} of {locations.length} locations
        </span>
        {(selectedType || selectedRegion || searchQuery) && (
          <span>Filters active</span>
        )}
      </div>

      {/* Location Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-32 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredLocations.length === 0 ? (
        <Card className="p-8 text-center">
          <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No locations found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedType || selectedRegion
              ? "No locations match your current filters."
              : "Get started by adding your first location."
            }
          </p>
          {!showSelectMode && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Location
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
        </div>
      )}

      {/* Create Location Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
          </DialogHeader>
          <LocationForm
            onSubmit={handleSubmit}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Location Dialog */}
      <Dialog open={!!editingLocation} onOpenChange={(open) => !open && setEditingLocation(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
          </DialogHeader>
          <LocationForm
            location={editingLocation}
            onSubmit={handleSubmit}
            onCancel={() => setEditingLocation(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Statistics Dialog */}
      <StatsDialog />
    </div>
  );
}