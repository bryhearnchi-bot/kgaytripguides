import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AdminBottomSheet } from '@/components/admin/AdminBottomSheet';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { LocationSearchBar } from '@/components/admin/LocationSearchBar';
import { api } from '@/lib/api-client';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';

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
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface LocationFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingLocation?: Location | null;
  onSuccess?: (location: Location) => void;
}

export function LocationFormModal({
  isOpen,
  onOpenChange,
  editingLocation = null,
  onSuccess,
}: LocationFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Location>({
    name: '',
    location: '',
    country: '',
    city: '',
    state_province: '',
    country_code: '',
  });

  // Load location data when editing
  useEffect(() => {
    if (editingLocation && isOpen) {
      setFormData(editingLocation);
    } else if (!editingLocation && isOpen) {
      resetForm();
    }
  }, [editingLocation, isOpen]);

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

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (data: Location) => {
      const response = await api.post('/api/locations', data, { requireAuth: true });
      if (!response.ok) throw new Error('Failed to create location');
      return response.json();
    },
    onSuccess: (newLocation: Location) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      onOpenChange(false);
      resetForm();
      if (onSuccess) {
        onSuccess(newLocation);
      }
      toast.success('Success', {
        description: 'Location created successfully',
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
      const response = await api.put(`/api/locations/${data.id}`, data, { requireAuth: true });
      if (!response.ok) throw new Error('Failed to update location');
      return response.json();
    },
    onSuccess: (updatedLocation: Location) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(updatedLocation);
      }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLocation && editingLocation.id) {
      updateLocationMutation.mutate({ ...formData, id: editingLocation.id });
    } else {
      createLocationMutation.mutate(formData);
    }
  };

  return (
    <AdminBottomSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
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
      contentClassName="grid gap-4 w-full max-w-full"
      maxHeight="85vh"
    >
      <div className="space-y-2 w-full max-w-full">
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
    </AdminBottomSheet>
  );
}
