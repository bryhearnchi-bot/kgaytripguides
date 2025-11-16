import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
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
  displayName?: string;
  location?: string;
  country: string;
  city?: string;
  state_province?: string;
  country_code?: string;
  description?: string;
  imageUrl?: string;
}

export default function LocationsManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [showAttractionsModal, setShowAttractionsModal] = useState(false);
  const [showLGBTVenuesModal, setShowLGBTVenuesModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
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
      toast.success('Success', {
        description: 'Location created! You can now add attractions and venues.',
      });
    },
    onError: () => {
      toast.error('Error', {
        description: 'Failed to create location',
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
      toast.success('Success', {
        description: 'Location updated successfully',
      });
    },
    onError: () => {
      toast.error('Error', {
        description: 'Failed to update location',
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
      toast.success('Success', {
        description: 'Location deleted successfully',
      });
    },
    onError: () => {
      toast.error('Error', {
        description: 'Failed to delete location',
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

  // Reset to page 1 when search term changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLocations = filteredLocations.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4">
      {/* Header Section - Sticky with Safari fix */}
      <div className="safari-sticky-header sticky top-16 z-20 pb-[0.85rem] space-y-4">
        <div className="flex items-center justify-between px-1">
          <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold text-white">
            <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
            Locations
          </h1>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
              className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/15"
              aria-label="Search locations"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingLocation(null);
                resetForm();
                setShowAddModal(true);
              }}
              className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/15"
              aria-label="Add new location"
              title="Add New Location"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="relative px-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              value={searchTerm}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search locations..."
              className="h-11 rounded-full border-white/5 bg-white/10 pl-10 text-sm text-white placeholder:text-white/50 focus-visible:border-white/20 focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0 focus:border-white/20 focus:ring-1 focus:ring-white/10 focus:ring-offset-0 transition-all"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Subheader - Non-sticky, scrolls with content */}
      <div className="sm:hidden px-1">
        <h2 className="text-lg font-semibold text-white">All Locations</h2>
      </div>

      <section className="relative sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/5 sm:shadow-2xl sm:shadow-black/40 sm:backdrop-blur">
        <header className="hidden sm:flex flex-col gap-2 border-b border-white/10 px-3 sm:pl-6 sm:pr-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">All Locations</h2>
          </div>
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
            data={paginatedLocations}
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
          <footer className="border-t border-white/10 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-white/50">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredLocations.length)} of{' '}
                {filteredLocations.length} locations
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 px-3 rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNumber}
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePageChange(pageNumber)}
                          className={`h-8 w-8 rounded-full ${
                            currentPage === pageNumber
                              ? 'bg-white/15 text-white'
                              : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 px-3 rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </Button>
                </div>
              )}
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
          <Label htmlFor="displayName" className="text-white/80">
            Display Name
          </Label>
          <Input
            id="displayName"
            value={formData.displayName || ''}
            onChange={e => setFormData({ ...formData, displayName: e.target.value })}
            className="bg-white/5 border-white/10 text-white"
            placeholder="Optional: Override display name"
          />
          <p className="text-xs text-white/50">Leave empty to use the location name</p>
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
