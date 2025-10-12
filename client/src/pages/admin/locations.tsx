import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { EnhancedLocationsTable } from '@/components/admin/EnhancedLocationsTable';
import { AdminFormModal } from '@/components/admin/AdminFormModal';
import { api } from '@/lib/api-client';
import { MapPin, Plus, PlusSquare, Edit2, Trash2, Search, Globe } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { LocationSearchBar } from '@/components/admin/LocationSearchBar';
import { locationService, type LocationData } from '@/lib/location-service';
import { LocationAttractionsPreview } from '@/components/admin/LocationAttractionsPreview';
import { LocationLGBTVenuesPreview } from '@/components/admin/LocationLGBTVenuesPreview';
import { LocationAttractionsModal } from '@/components/admin/LocationAttractionsModal';
import { LocationLGBTVenuesModal } from '@/components/admin/LocationLGBTVenuesModal';

interface Location {
  id?: number;
  name: string;
  location?: string;
  country: string;
  city?: string;
  state_province?: string;
  country_code?: string;
  description?: string;
  imageUrl?: string;
}

export default function LocationsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [showAttractionsModal, setShowAttractionsModal] = useState(false);
  const [showLGBTVenuesModal, setShowLGBTVenuesModal] = useState(false);
  const [formData, setFormData] = useState<Location>({
    name: '',
    location: '',
    country: '',
    city: '',
    state_province: '',
    country_code: '',
  });

  const handleModalOpenChange = (open: boolean) => {
    setShowAddModal(open);
    if (!open && !showAttractionsModal && !showLGBTVenuesModal) {
      // Only clear state if we're not opening another modal
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
    },
  });

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (data: Location) => {
      const response = await api.post('/api/locations', data);
      if (!response.ok) throw new Error('Failed to create location');
      return response.json();
    },
    onSuccess: (newLocation: Location) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });

      // Set the newly created location as editingLocation so attractions/venues sections appear
      setEditingLocation(newLocation);
      setFormData(newLocation);

      // Keep modal open to allow adding attractions/venues
      toast({
        title: 'Success',
        description: 'Location created! You can now add attractions and venues.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create location',
        variant: 'destructive',
      });
    },
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
      setShowAddModal(false);
      setEditingLocation(null);
      resetForm();
      toast({
        title: 'Success',
        description: 'Location updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update location',
        variant: 'destructive',
      });
    },
  });

  // Delete location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/api/locations/${id}`);
      if (!response.ok) throw new Error('Failed to delete location');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast({
        title: 'Success',
        description: 'Location deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete location',
        variant: 'destructive',
      });
    },
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLocation) {
      updateLocationMutation.mutate({ ...formData, id: editingLocation.id });
    } else {
      createLocationMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      country: '',
      city: '',
      state_province: '',
      country_code: '',
    });
  };

  const filteredLocations = locations.filter(
    location =>
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 px-4 sm:px-6 py-4 sm:py-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold text-white">
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <span>Locations</span>
            </h1>
            <p className="text-xs sm:text-sm text-white/60 mt-1">Manage destinations and venues</p>
          </div>
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search locations..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-10 sm:h-11 rounded-full border-white/10 bg-white/10 pl-10 text-sm text-white placeholder:text-white/50 focus:border-[#22d3ee]/70"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
        <header className="flex flex-col gap-2 border-b border-white/10 pl-6 pr-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">All Locations</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingLocation(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="h-4 w-4 rounded-xl border border-white/15 bg-blue-500/10 text-white/80 hover:bg-blue-500/15"
            title="Add New Location"
          >
            <PlusSquare className="h-5 w-5 text-blue-400/80" />
          </Button>
        </header>

        {filteredLocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-white/60">
            <MapPin className="h-10 w-10 text-white/30" />
            <p className="text-sm">
              {searchTerm
                ? 'No locations match your search.'
                : 'Get started by adding your first location.'}
            </p>
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
          <EnhancedLocationsTable
            data={filteredLocations}
            columns={[
              {
                key: 'image',
                label: '',
                priority: 'high',
                sortable: false,
                resizable: false,
                width: 80,
                minWidth: 80,
                maxWidth: 80,
                render: (_value, location) => (
                  <div className="flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10">
                      {location.imageUrl ? (
                        <img
                          src={location.imageUrl}
                          alt={location.name}
                          className="h-full w-full rounded-xl object-cover"
                        />
                      ) : (
                        <MapPin className="h-6 w-6 text-white/70" />
                      )}
                    </div>
                  </div>
                ),
              },
              {
                key: 'name',
                label: 'Location',
                priority: 'high',
                sortable: true,
                minWidth: 200,
                render: value => <p className="font-bold text-xs text-white">{value}</p>,
              },
              {
                key: 'location',
                label: 'Location',
                priority: 'high',
                sortable: true,
                minWidth: 200,
                render: (value, location) => (
                  <span className="text-xs text-white/80">
                    {value || location.country || 'No location'}
                  </span>
                ),
              },
              {
                key: 'description',
                label: 'Description',
                priority: 'medium',
                sortable: false,
                minWidth: 250,
                render: value => (
                  <span className="text-white/70 line-clamp-2">{value || 'No description'}</span>
                ),
              },
            ]}
            actions={[
              {
                label: 'Edit Location',
                icon: <Edit2 className="h-4 w-4" />,
                onClick: location => {
                  // Small delay to ensure dropdown closes first
                  setTimeout(() => handleEdit(location), 50);
                },
              },
              {
                label: 'Delete Location',
                icon: <Trash2 className="h-4 w-4" />,
                onClick: location => {
                  setTimeout(() => handleDelete(location.id!), 50);
                },
                variant: 'destructive',
              },
            ]}
            keyField="id"
            isLoading={isLoading}
            emptyMessage={
              searchTerm
                ? 'No locations match your search.'
                : 'Get started by adding your first location.'
            }
          />
        )}

        {filteredLocations.length > 0 && (
          <footer className="flex items-center justify-between border-t border-white/10 px-6 py-4">
            <div className="text-xs text-white/50">
              Showing {filteredLocations.length} of {locations.length} locations
            </div>
          </footer>
        )}
      </section>

      {/* Location Form Modal */}
      <AdminFormModal
        isOpen={showAddModal}
        onOpenChange={handleModalOpenChange}
        title={editingLocation ? 'Edit Location' : 'Add New Location'}
        icon={<MapPin className="h-5 w-5" />}
        description={
          editingLocation?.id && !formData.id
            ? 'Location details saved. Add attractions and venues below.'
            : editingLocation
              ? 'Update location details'
              : 'Create a new destination'
        }
        onSubmit={handleSubmit}
        primaryAction={
          editingLocation?.id
            ? {
                label: 'Save Changes',
                loading: updateLocationMutation.isPending,
                loadingLabel: 'Saving...',
              }
            : {
                label: 'Create Location',
                loading: createLocationMutation.isPending,
                loadingLabel: 'Creating...',
              }
        }
        secondaryAction={{
          label: editingLocation?.id ? 'Done' : 'Cancel',
          onClick: () => handleModalOpenChange(false),
        }}
        contentClassName="grid gap-4"
        maxWidthClassName="max-w-2xl"
      >
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white/80">
            Location Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        <div className="space-y-2">
          <LocationSearchBar
            label="Location"
            placeholder="Search for city, state, or country..."
            value={{
              city: formData.city || '',
              state: formData.state_province || '',
              country: formData.country || '',
              countryCode: formData.country_code || '',
            }}
            onChange={location => {
              setFormData({
                ...formData,
                location: location.formatted || '',
                city: location.city || '',
                state_province: location.state || '',
                country: location.country || '',
                country_code: location.countryCode || '',
              });
            }}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-white/80">
            Description
          </Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="bg-white/5 border-white/10 text-white"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl" className="text-white/80">
            Location Image
          </Label>
          <ImageUploadField
            label="Location Image"
            value={formData.imageUrl || ''}
            onChange={url => setFormData({ ...formData, imageUrl: url || '' })}
            imageType="locations"
            placeholder="No location image uploaded"
            disabled={
              editingLocation ? updateLocationMutation.isPending : createLocationMutation.isPending
            }
          />
        </div>

        {/* Attractions & LGBT Venues Preview - always show, but disable if location not saved */}
        <>
          <div className="h-px bg-white/10 my-4" />

          {/* Attractions Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white/90">Attractions</Label>
              <Button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  // Small delay to allow modal to close properly
                  setTimeout(() => setShowAttractionsModal(true), 100);
                }}
                variant="ghost"
                size="sm"
                disabled={!editingLocation?.id}
                className="h-7 px-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Edit
              </Button>
            </div>
            {editingLocation?.id ? (
              <LocationAttractionsPreview locationId={editingLocation.id} />
            ) : (
              <div className="p-4 border border-white/10 rounded-lg bg-white/5 text-center">
                <p className="text-sm text-white/50">Save location first to add attractions</p>
              </div>
            )}
          </div>

          {/* LGBT Venues Preview */}
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <Label className="text-white/90">LGBT-Friendly Venues</Label>
              <Button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  // Small delay to allow modal to close properly
                  setTimeout(() => setShowLGBTVenuesModal(true), 100);
                }}
                variant="ghost"
                size="sm"
                disabled={!editingLocation?.id}
                className="h-7 px-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Edit
              </Button>
            </div>
            {editingLocation?.id ? (
              <LocationLGBTVenuesPreview locationId={editingLocation.id} />
            ) : (
              <div className="p-4 border border-white/10 rounded-lg bg-white/5 text-center">
                <p className="text-sm text-white/50">
                  Save location first to add LGBT-friendly venues
                </p>
              </div>
            )}
          </div>
        </>
      </AdminFormModal>

      {/* Attractions Modal */}
      {editingLocation && editingLocation.id && (
        <LocationAttractionsModal
          isOpen={showAttractionsModal}
          onOpenChange={open => {
            setShowAttractionsModal(open);
            if (!open) {
              // Clear editing state when closing
              setEditingLocation(null);
              resetForm();
            }
          }}
          locationId={editingLocation.id}
          locationName={editingLocation.name}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ['location-attractions', editingLocation.id],
            });
          }}
        />
      )}

      {/* LGBT Venues Modal */}
      {editingLocation && editingLocation.id && (
        <LocationLGBTVenuesModal
          isOpen={showLGBTVenuesModal}
          onOpenChange={open => {
            setShowLGBTVenuesModal(open);
            if (!open) {
              // Clear editing state when closing
              setEditingLocation(null);
              resetForm();
            }
          }}
          locationId={editingLocation.id}
          locationName={editingLocation.name}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ['location-lgbt-venues', editingLocation.id],
            });
          }}
        />
      )}
    </div>
  );
}
