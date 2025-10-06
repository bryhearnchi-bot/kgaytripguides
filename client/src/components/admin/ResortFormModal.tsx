import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { AdminFormModal } from './AdminFormModal';
import { AmenitySelector } from './AmenitySelector';
import { VenueSelector } from './VenueSelector';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploadField } from './ImageUploadField';
import { Building } from 'lucide-react';
import { LocationSearchBar } from './LocationSearchBar';
import { locationService, type LocationData } from '@/lib/location-service';

interface Resort {
  id?: number;
  name: string;
  location: string;
  city?: string;
  state_province?: string;
  country?: string;
  country_code?: string;
  capacity?: number;
  roomCount?: number;
  imageUrl?: string;
  description?: string;
  propertyMapUrl?: string;
  checkInTime?: string;
  checkOutTime?: string;
}

interface ResortWithRelations extends Resort {
  amenityIds: number[];
  venueIds: number[];
}

interface ResortFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  resort?: Resort | null;
  onSuccess: (savedResort?: any) => void;
}

interface FormData {
  name: string;
  location: string;
  city: string;
  state_province: string;
  country: string;
  country_code: string;
  capacity: string;
  roomCount: string;
  imageUrl: string;
  description: string;
  propertyMapUrl: string;
  checkInTime: string;
  checkOutTime: string;
}

export function ResortFormModal({ isOpen, onOpenChange, resort, onSuccess }: ResortFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [amenityIds, setAmenityIds] = useState<number[]>([]);
  const [venueIds, setVenueIds] = useState<number[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    location: '',
    city: '',
    state_province: '',
    country: '',
    country_code: '',
    capacity: '',
    roomCount: '',
    imageUrl: '',
    description: '',
    propertyMapUrl: '',
    checkInTime: '',
    checkOutTime: '',
  });

  const isEditing = !!resort;

  // Load resort data when editing
  useEffect(() => {
    if (resort && isOpen) {
      // Parse existing location if it's in old format
      const locationData = resort.city
        ? {
            city: resort.city,
            state_province: resort.state_province || '',
            country: resort.country || '',
            country_code: resort.country_code || '',
          }
        : locationService.parseLocationString(resort.location || '');

      setFormData({
        name: resort.name || '',
        location: resort.location || '',
        city: 'city' in locationData ? locationData.city || '' : '',
        state_province: 'state_province' in locationData ? locationData.state_province || '' : '',
        country: locationData.country || '',
        country_code: 'country_code' in locationData ? locationData.country_code || '' : '',
        capacity: resort.capacity?.toString() || '',
        roomCount: resort.roomCount?.toString() || '',
        imageUrl: resort.imageUrl || '',
        description: resort.description || '',
        propertyMapUrl: resort.propertyMapUrl || '',
        checkInTime: resort.checkInTime || '',
        checkOutTime: resort.checkOutTime || '',
      });

      // Load resort's amenities and venues
      if (resort.id) {
        loadResortRelations(resort.id);
      }
    } else if (!resort) {
      // Reset form for new resort
      setFormData({
        name: '',
        location: '',
        city: '',
        state_province: '',
        country: '',
        country_code: '',
        capacity: '',
        roomCount: '',
        imageUrl: '',
        description: '',
        propertyMapUrl: '',
        checkInTime: '',
        checkOutTime: '',
      });
      setAmenityIds([]);
      setVenueIds([]);
    }
  }, [resort, isOpen]);

  const loadResortRelations = async (resortId: number) => {
    try {
      const [amenitiesResponse, venuesResponse] = await Promise.all([
        api.get(`/api/resorts/${resortId}/amenities`),
        api.get(`/api/resorts/${resortId}/venues`),
      ]);

      if (amenitiesResponse.ok && venuesResponse.ok) {
        const amenitiesData = await amenitiesResponse.json();
        const venuesData = await venuesResponse.json();

        setAmenityIds(amenitiesData.map((a: any) => a.id));
        setVenueIds(venuesData.map((v: any) => v.id));
      }
    } catch (error) {
      console.error('Error loading resort relations:', error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.country.trim()) {
      return;
    }

    try {
      setLoading(true);

      // Prepare resort data with new location fields
      const resortData = {
        name: formData.name.trim(),
        location: locationService.formatLocation({
          city: formData.city,
          state: formData.state_province,
          country: formData.country,
        }),
        city: formData.city.trim() || null,
        state_province: formData.state_province.trim() || null,
        country: formData.country.trim(),
        country_code: formData.country_code.trim() || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        roomCount: formData.roomCount ? parseInt(formData.roomCount) : null,
        imageUrl: formData.imageUrl.trim() || null,
        description: formData.description.trim() || null,
        propertyMapUrl: formData.propertyMapUrl.trim() || null,
        checkInTime: formData.checkInTime.trim() || null,
        checkOutTime: formData.checkOutTime.trim() || null,
      };

      let resortResponse;
      if (isEditing && resort) {
        // Update existing resort
        resortResponse = await api.put(`/api/resorts/${resort.id}`, resortData);
      } else {
        // Create new resort
        resortResponse = await api.post('/api/resorts', resortData);
      }

      if (!resortResponse.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} resort`);
      }

      const savedResort = await resortResponse.json();
      const resortId = savedResort.id;

      // Update resort relationships
      await Promise.all([
        api.put(`/api/resorts/${resortId}/amenities`, { amenityIds }),
        api.put(`/api/resorts/${resortId}/venues`, { venueIds }),
      ]);

      onSuccess(savedResort);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving resort:', error);
      // You could show an error toast here
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminFormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Resort' : 'Add New Resort'}
      description={
        isEditing
          ? 'Update resort information and amenities'
          : 'Create a new resort with amenities and venues'
      }
      icon={<Building className="h-5 w-5" />}
      onSubmit={handleSubmit}
      primaryAction={{
        label: isEditing ? 'Update Resort' : 'Create Resort',
        type: 'submit',
        loading,
        loadingLabel: isEditing ? 'Updating...' : 'Creating...',
        disabled: !formData.name.trim() || !formData.country.trim(),
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: () => onOpenChange(false),
        variant: 'outline',
      }}
      maxWidthClassName="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white/90 mb-3">Basic Information</h3>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-white/90">Resort Name *</label>
              <Input
                placeholder="Enter resort name"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className="admin-form-modal"
              />
            </div>

            <div className="space-y-1">
              <LocationSearchBar
                label="Location"
                placeholder="Search for city, state, or country..."
                value={{
                  city: formData.city,
                  state: formData.state_province,
                  country: formData.country,
                  countryCode: formData.country_code,
                }}
                onChange={location => {
                  setFormData({
                    ...formData,
                    city: location.city || '',
                    state_province: location.state || '',
                    country: location.country || '',
                    country_code: location.countryCode || '',
                  });
                }}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/90">Capacity</label>
                <Input
                  type="number"
                  placeholder="500"
                  value={formData.capacity}
                  onChange={e => handleInputChange('capacity', e.target.value)}
                  className="admin-form-modal"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-white/90">Rooms</label>
                <Input
                  type="number"
                  placeholder="250"
                  value={formData.roomCount}
                  onChange={e => handleInputChange('roomCount', e.target.value)}
                  className="admin-form-modal"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/90">Check-in</label>
                <Input
                  placeholder="15:00"
                  value={formData.checkInTime}
                  onChange={e => handleInputChange('checkInTime', e.target.value)}
                  className="admin-form-modal"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-white/90">Check-out</label>
                <Input
                  placeholder="11:00"
                  value={formData.checkOutTime}
                  onChange={e => handleInputChange('checkOutTime', e.target.value)}
                  className="admin-form-modal"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/90">Resort Image</label>
              <ImageUploadField
                label="Resort Image"
                value={formData.imageUrl}
                onChange={url => handleInputChange('imageUrl', url || '')}
                imageType="resorts"
                placeholder="No resort image uploaded"
                disabled={loading}
                className="admin-form-modal"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/90">Property Map URL</label>
              <Input
                placeholder="https://example.com/property-map.pdf"
                value={formData.propertyMapUrl}
                onChange={e => handleInputChange('propertyMapUrl', e.target.value)}
                className="admin-form-modal"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/90">Description</label>
              <Textarea
                placeholder="Enter resort description..."
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                className="admin-form-modal"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Amenities & Venues */}
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white/90">Resort Amenities</h3>
            <AmenitySelector
              selectedIds={amenityIds}
              onSelectionChange={setAmenityIds}
              disabled={loading}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white/90">Resort Venues</h3>
            <VenueSelector
              selectedIds={venueIds}
              onSelectionChange={setVenueIds}
              disabled={loading}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </AdminFormModal>
  );
}
