import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Search,
  Globe,
  Save
} from 'lucide-react';

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

  // Fetch locations
  const { data: locations = [], isLoading } = useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await fetch('/api/locations', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    }
  });

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (data: Location) => {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
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
      const response = await fetch(`/api/locations/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
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
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
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
            <h1 className="text-2xl font-semibold text-white">Locations & Destinations</h1>
            <p className="text-sm text-white/60">Manage travel destinations across Atlantis sailings.</p>
          </div>
          <Button
            onClick={() => {
              setEditingLocation(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 hover:from-[#38e0f6] hover:to-[#3b82f6]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search locations by name or country"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 rounded-full border-white/10 bg-white/10 pl-10 text-sm text-white placeholder:text-white/50 focus:border-[#22d3ee]/70"
            />
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-white/60">
            <Button variant="ghost" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">
              Active
            </Button>
            <Button variant="ghost" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">
              Region
            </Button>
            <Button variant="ghost" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">
              Type
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
        <header className="flex flex-col gap-2 border-b border-white/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">All Locations ({filteredLocations.length})</h2>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Across all destinations</p>
          </div>
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
          <div className="overflow-x-auto">
            <Table className="min-w-full text-sm text-white/80">
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10">
                  <TableHead className="text-white/60">Location</TableHead>
                  <TableHead className="text-white/60">Region</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  <TableHead className="text-right text-white/60">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocations.map((location) => (
                  <TableRow key={location.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="py-5">
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
                        <div className="space-y-1">
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
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                        {getRegionIcon(location.country)}
                        <span>{location.country}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#34d399]/15 px-3 py-1 text-xs font-medium text-[#34d399]">Active</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(location)}
                          className="h-8 w-8 rounded-full border border-white/15 bg-white/5 p-0 text-white/80 hover:bg-white/10"
                          title="Edit Location"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(location.id!)}
                          className="h-8 w-8 rounded-full border border-[#fb7185]/30 bg-[#fb7185]/10 p-0 text-[#fb7185] hover:bg-[#fb7185]/20"
                          title="Delete Location"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <footer className="border-t border-white/10 px-6 py-4 text-xs text-white/50">
          Showing {filteredLocations.length} location{filteredLocations.length === 1 ? '' : 's'}
        </footer>
      </section>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10 bg-[#0f172a] text-white">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </DialogTitle>
            <DialogDescription>
              Enter the location information below
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2">
                <Label htmlFor="name">Location Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Location description..."
                />
              </div>

              <div>
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
                      lng: formData.coordinates?.lng || 0
                    }
                  })}
                  placeholder="e.g., 40.7128"
                />
              </div>

              <div>
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
                      lng: parseFloat(e.target.value) || 0
                    }
                  })}
                  placeholder="e.g., -74.0060"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl || ''}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingLocation(null);
                  resetForm();
                }}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-6"
                disabled={createLocationMutation.isPending || updateLocationMutation.isPending}
              >
                <Save className="mr-2" size={16} />
                {editingLocation ? 'Save Changes' : 'Create Location'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}