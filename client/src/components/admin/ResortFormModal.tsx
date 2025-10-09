import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { AdminFormModal } from './AdminFormModal';
import { AmenitySelector } from './AmenitySelector';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploadField } from './ImageUploadField';
import { Building, Edit2, Plus, Palmtree, ChevronDown } from 'lucide-react';
import { LocationSearchBar } from './LocationSearchBar';
import { VenueManagementModal } from './VenueManagementModal';
import { Button } from '@/components/ui/button';
import { locationService, type LocationData } from '@/lib/location-service';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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
}

interface Venue {
  id: number;
  name: string;
  venueTypeName?: string;
  description?: string;
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
  const [venues, setVenues] = useState<Venue[]>([]);
  const [showVenueModal, setShowVenueModal] = useState(false);
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
      setVenues([]);
    }
  }, [resort, isOpen]);

  const loadResortRelations = async (resortId: number) => {
    try {
      const [amenitiesResponse, venuesResponse] = await Promise.all([
        api.get(`/api/resorts/${resortId}/amenities`),
        api.get(`/api/admin/resorts/${resortId}/venues`),
      ]);

      if (amenitiesResponse.ok && venuesResponse.ok) {
        const amenitiesData = await amenitiesResponse.json();
        const venuesData = await venuesResponse.json();

        setAmenityIds(amenitiesData.map((a: any) => a.id));
        setVenues(venuesData);
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

      // Update resort amenities
      await api.put(`/api/resorts/${resortId}/amenities`, { amenityIds });

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
          {/* Resort Amenities - now on top */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white/90">Resort Amenities</h3>
            <AmenitySelector
              selectedIds={amenityIds}
              onSelectionChange={setAmenityIds}
              disabled={loading}
              className="w-full"
            />
          </div>

          {/* Resort Venues - now on bottom with accordions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white/90">Resort Venues</h3>
              <div className="flex gap-2">
                {resort?.id && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowVenueModal(true)}
                      className="h-8 px-3 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Create Venue
                    </Button>
                    {venues.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowVenueModal(true)}
                        className="h-8 px-3 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit Venues
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Venue List Display - No container, grouped by type */}
            {venues.length > 0 ? (
              <Accordion type="multiple" className="w-full space-y-2">
                {Object.entries(
                  venues.reduce(
                    (acc, venue) => {
                      const type = venue.venueTypeName || 'Other';
                      if (!acc[type]) acc[type] = [];
                      acc[type].push(venue);
                      return acc;
                    },
                    {} as Record<string, typeof venues>
                  )
                ).map(([type, venuesInType]) => (
                  <AccordionItem
                    key={type}
                    value={type}
                    className="border border-white/10 rounded-lg bg-white/[0.02]"
                  >
                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Palmtree className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-medium text-white">{type}</span>
                        <span className="text-xs text-white/50">({venuesInType.length})</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-2">
                      <div className="space-y-2">
                        {venuesInType.map(venue => (
                          <div
                            key={venue.id}
                            className="flex items-start gap-2 p-2 bg-white/[0.02] rounded border border-white/5"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-white font-medium">{venue.name}</div>
                              {venue.description && (
                                <div className="text-xs text-white/50 mt-0.5 line-clamp-2">
                                  {venue.description}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-white/40">
                <Palmtree className="w-8 h-8 mb-2" />
                <p className="text-xs">
                  {resort?.id ? 'No venues added' : 'Save resort first to add venues'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Venue Management Modal */}
      {resort?.id && (
        <VenueManagementModal
          isOpen={showVenueModal}
          onOpenChange={setShowVenueModal}
          propertyId={resort.id}
          propertyType="resort"
          onSuccess={() => {
            // Refetch venues to update the display
            if (resort.id) {
              api.get(`/api/admin/resorts/${resort.id}/venues`).then(async response => {
                if (response.ok) {
                  const venuesData = await response.json();
                  setVenues(venuesData);
                }
              });
            }
          }}
        />
      )}
    </AdminFormModal>
  );
}
