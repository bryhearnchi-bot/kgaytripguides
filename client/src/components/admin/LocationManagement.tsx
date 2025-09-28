import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';
import { Textarea } from '../ui/textarea';
import { ResponsiveAdminTable } from './ResponsiveAdminTable';
import { StatusBadge } from './StatusBadge';
import { AdminFormModal } from './AdminFormModal';
import { ImageUploadField } from './ImageUploadField';
import { api } from '@/lib/api-client';
import { MapPin, Plus, Edit2, Trash2, Search, Globe } from 'lucide-react';


interface Location {
  id?: number;
  name: string;
  country: string;
  description?: string;
  imageUrl?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export default function LocationManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<Location>({
    name: '',
    country: '',
  });

  const handleModalOpenChange = (open: boolean) => {
    setShowAddModal(open);
    if (!open) {
      setEditingLocation(null);
      resetForm();
    }
  };

  // Fetch locations
  const { data: locations = [], isLoading } = useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await api.get('/api/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    }
  });

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (data: Location) => {
      const response = await api.post('/api/locations', data);
      if (!response.ok) throw new Error('Failed to create location');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setShowAddModal(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Location created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create location',
        variant: 'destructive',
      });
    }
  });

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async (data: Location) => {
      const response = await api.put(`/api/locations/${data.id}`, data);
      if (!response.ok) throw new Error('Failed to update location');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setEditingLocation(null);
      resetForm();
      toast({
        title: 'Success',
        description: 'Location updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update location',
        variant: 'destructive',
      });
    }
  });

  // Delete location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/api/locations/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete location');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast({
        title: 'Success',
        description: 'Location deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message.includes('Cannot delete')
          ? 'This location is used in trips and cannot be deleted'
          : 'Failed to delete location',
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      country: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLocation) {
      updateLocationMutation.mutate({ ...formData, id: editingLocation.id });
    } else {
      createLocationMutation.mutate(formData);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData(location);
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this location?')) {
      deleteLocationMutation.mutate(id);
    }
  };

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRegionIcon = (country: string) => {
    return <Globe className="h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
              <MapPin className="h-6 w-6" />
              Locations & Destinations
            </h1>
            <p className="text-sm text-white/60">Manage travel destinations across Atlantis sailings.</p>
          </div>
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search locations by name or country"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 rounded-full border-white/10 bg-white/10 pl-10 text-sm text-white placeholder:text-white/50 focus:border-[#22d3ee]/70"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
        <header className="flex flex-col gap-2 border-b border-white/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">All Locations ({filteredLocations.length})</h2>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Across all destinations</p>
          </div>
          <Button
            onClick={() => {
              setEditingLocation(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="rounded-full bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors min-w-[80px]"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Location
          </Button>
        </header>

        {filteredLocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-white/60">
            <MapPin className="h-10 w-10 text-white/30" />
            <p className="text-sm">{searchTerm ? 'No locations match your search.' : 'Get started by adding your first location.'}</p>
            {!searchTerm && (
              <Button
                onClick={() => {
                  setEditingLocation(null);
                  resetForm();
                  setShowAddModal(true);
                }}
                className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-4 py-2 text-sm text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Location
              </Button>
            )}
          </div>
        ) : (
          <ResponsiveAdminTable
            data={filteredLocations}
            columns={[
              {
                key: 'name',
                label: 'Location',
                priority: 'high',
                render: (_value, location) => (
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10">
                      {location.imageUrl ? (
                        <img
                          src={location.imageUrl}
                          alt={location.name}
                          className="h-full w-full rounded-xl object-cover"
                        />
                      ) : (
                        <MapPin className="h-5 w-5 text-white/70" />
                      )}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium text-white">{location.name}</p>
                      {location.description && (
                        <p className="text-xs text-white/60 line-clamp-2">{location.description}</p>
                      )}
                      {location.coordinates && (
                        <p className="text-xs text-white/40">
                          {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                key: 'country',
                label: 'Region',
                priority: 'medium',
                render: (value: string) => (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                    {getRegionIcon(value)}
                    <span>{value}</span>
                  </span>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                priority: 'medium',
                render: () => <StatusBadge variant="default">Active</StatusBadge>,
              },
            ]}
            actions={[
              {
                label: 'Edit Location',
                icon: <Edit2 className="h-4 w-4" />,
                onClick: handleEdit,
              },
              {
                label: 'Delete Location',
                icon: <Trash2 className="h-4 w-4" />,
                onClick: (location) => handleDelete(location.id!),
                variant: 'destructive',
              },
            ]}
            keyField="id"
            isLoading={isLoading}
            emptyMessage={searchTerm ? 'No locations match your search.' : 'Get started by adding your first location.'}
          />
        )}

        <footer className="border-t border-white/10 px-6 py-4 text-xs text-white/50">
          Showing {filteredLocations.length} location{filteredLocations.length === 1 ? '' : 's'}
        </footer>
      </section>

      {/* Add/Edit Modal */}
      <AdminFormModal
        isOpen={showAddModal}
        onOpenChange={handleModalOpenChange}
        title={editingLocation ? 'Edit Location' : 'Add New Location'}
        icon={<MapPin className="h-5 w-5" />}
        description="Enter the location information below"
        onSubmit={handleSubmit}
        primaryAction={{
          label: editingLocation ? 'Save Changes' : 'Create Location',
          loading: editingLocation ? updateLocationMutation.isPending : createLocationMutation.isPending,
          loadingLabel: editingLocation ? 'Saving...' : 'Creating...',
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => handleModalOpenChange(false),
        }}
        maxWidthClassName="max-w-3xl"
        contentClassName="grid grid-cols-1 lg:grid-cols-2 gap-5 max-h-[calc(85vh-180px)] overflow-y-auto"
      >
        {/* Basic Information */}
        <div className="space-y-2">
          <Label htmlFor="name">Location Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Enter location name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            required
            placeholder="Enter country name"
          />
        </div>

        {/* Description - spans full width */}
        <div className="lg:col-span-2 space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            placeholder="Describe this travel destination..."
          />
        </div>

        {/* Coordinates */}
        <div className="space-y-2">
          <Label htmlFor="lat">Latitude</Label>
          <Input
            id="lat"
            type="number"
            step="any"
            value={formData.coordinates?.lat?.toString() || ''}
            onChange={(e) => setFormData({
              ...formData,
              coordinates: {
                lat: parseFloat(e.target.value) || 0,
                lng: formData.coordinates?.lng || 0,
              },
            })}
            placeholder="e.g., 40.7128"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lng">Longitude</Label>
          <Input
            id="lng"
            type="number"
            step="any"
            value={formData.coordinates?.lng?.toString() || ''}
            onChange={(e) => setFormData({
              ...formData,
              coordinates: {
                lat: formData.coordinates?.lat || 0,
                lng: parseFloat(e.target.value) || 0,
              },
            })}
            placeholder="e.g., -74.0060"
          />
        </div>

        {/* Image Upload - spans full width */}
        <div className="lg:col-span-2 space-y-2">
          <Label htmlFor="imageUrl">Location Image</Label>
          <ImageUploadField
            label="Location Image"
            value={formData.imageUrl || ''}
            onChange={(url) => setFormData({ ...formData, imageUrl: url || '' })}
            imageType="locations"
            placeholder="No location image uploaded"
            disabled={savingLocation}
          />
        </div>
      </AdminFormModal>
    </div>
  );
}
