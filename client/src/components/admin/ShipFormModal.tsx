import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { AdminFormModal } from './AdminFormModal';
import { AmenitySelector } from './AmenitySelector';
import { VenueSelector } from './VenueSelector';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploadField } from './ImageUploadField';
import { Ship as ShipIcon } from 'lucide-react';

interface Ship {
  id: number;
  name: string;
  cruiseLine: string;
  capacity?: number;
  decks?: number;
  imageUrl?: string;
  deckPlansUrl?: string;
  description?: string;
}

interface ShipWithRelations extends Ship {
  amenityIds: number[];
  venueIds: number[];
}

interface ShipFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  ship?: Ship | null;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  cruiseLine: string;
  capacity: string;
  decks: string;
  imageUrl: string;
  deckPlansUrl: string;
  description: string;
}

export function ShipFormModal({ isOpen, onOpenChange, ship, onSuccess }: ShipFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [amenityIds, setAmenityIds] = useState<number[]>([]);
  const [venueIds, setVenueIds] = useState<number[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    cruiseLine: '',
    capacity: '',
    decks: '',
    imageUrl: '',
    deckPlansUrl: '',
    description: '',
  });

  const isEditing = !!ship;

  // Load ship data when editing
  useEffect(() => {
    if (ship && isOpen) {
      setFormData({
        name: ship.name || '',
        cruiseLine: ship.cruiseLine || '',
        capacity: ship.capacity?.toString() || '',
        decks: ship.decks?.toString() || '',
        imageUrl: ship.imageUrl || '',
        deckPlansUrl: ship.deckPlansUrl || '',
        description: ship.description || '',
      });

      // Load ship's amenities and venues
      loadShipRelations(ship.id);
    } else if (!ship) {
      // Reset form for new ship
      setFormData({
        name: '',
        cruiseLine: '',
        capacity: '',
        decks: '',
        imageUrl: '',
        deckPlansUrl: '',
        description: '',
      });
      setAmenityIds([]);
      setVenueIds([]);
    }
  }, [ship, isOpen]);

  const loadShipRelations = async (shipId: number) => {
    try {
      if (!shipId) {
        console.error('No ship ID provided for loading relations');
        return;
      }

      const [amenitiesResponse, venuesResponse] = await Promise.all([
        api.get(`/api/ships/${shipId}/amenities`),
        api.get(`/api/ships/${shipId}/venues`),
      ]);

      if (amenitiesResponse.ok && venuesResponse.ok) {
        const amenitiesData = await amenitiesResponse.json();
        const venuesData = await venuesResponse.json();

        setAmenityIds(amenitiesData.map((a: any) => a.id));
        setVenueIds(venuesData.map((v: any) => v.id));
      }
    } catch (error) {
      console.error('Error loading ship relations:', error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.cruiseLine.trim()) {
      return;
    }
    try {
      setLoading(true);

      // Prepare ship data
      const shipData = {
        name: formData.name.trim(),
        cruiseLine: formData.cruiseLine.trim(),
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        decks: formData.decks ? parseInt(formData.decks) : null,
        imageUrl: formData.imageUrl.trim() || null,
        deckPlansUrl: formData.deckPlansUrl.trim() || null,
        description: formData.description.trim() || null,
      };

      let shipResponse;
      if (isEditing && ship) {
        // Update existing ship
        shipResponse = await api.put(`/api/ships/${ship.id}`, shipData);
      } else {
        // Create new ship
        shipResponse = await api.post('/api/ships', shipData);
      }

      if (!shipResponse.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} ship`);
      }

      const savedShip = await shipResponse.json();
      const shipId = savedShip.id;

      // Update ship relationships
      await Promise.all([
        api.put(`/api/ships/${shipId}/amenities`, { amenityIds }),
        api.put(`/api/ships/${shipId}/venues`, { venueIds }),
      ]);

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving ship:', error);
      // You could show an error toast here
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminFormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Ship' : 'Add New Ship'}
      description={isEditing ? 'Update ship information and amenities' : 'Create a new ship with amenities and venues'}
      icon={<ShipIcon className="h-5 w-5" />}
      onSubmit={handleSubmit}
      primaryAction={{
        label: isEditing ? 'Update Ship' : 'Create Ship',
        type: 'submit',
        loading,
        loadingLabel: isEditing ? 'Updating...' : 'Creating...',
        disabled: !formData.name.trim() || !formData.cruiseLine.trim()
      }}
      maxWidthClassName="max-w-4xl"
      contentClassName="py-4"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Basic Information */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white/90 mb-1">Basic Information</h3>

          <div className="space-y-1.5">
            <div className="space-y-0.5">
              <label className="text-xs font-medium text-white/90">Ship Name *</label>
              <Input
                placeholder="Enter ship name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="admin-form-modal h-8"
              />
            </div>

            <div className="space-y-0.5">
              <label className="text-xs font-medium text-white/90">Cruise Line *</label>
              <Input
                placeholder="Enter cruise line"
                value={formData.cruiseLine}
                onChange={(e) => handleInputChange('cruiseLine', e.target.value)}
                className="admin-form-modal h-8"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="space-y-0.5">
                <label className="text-xs font-medium text-white/90">Capacity</label>
                <Input
                  type="number"
                  placeholder="3000"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', e.target.value)}
                  className="admin-form-modal h-8"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-xs font-medium text-white/90">Decks</label>
                <Input
                  type="number"
                  placeholder="12"
                  value={formData.decks}
                  onChange={(e) => handleInputChange('decks', e.target.value)}
                  className="admin-form-modal h-8"
                />
              </div>
            </div>

            <div className="space-y-0.5">
              <label className="text-xs font-medium text-white/90">Ship Image</label>
              <ImageUploadField
                label="Ship Image"
                value={formData.imageUrl}
                onChange={(url) => handleInputChange('imageUrl', url || '')}
                imageType="ships"
                placeholder="No ship image uploaded"
                disabled={loading}
                className="admin-form-modal"
              />
            </div>

            <div className="space-y-0.5">
              <label className="text-xs font-medium text-white/90">Deck Plans URL</label>
              <Input
                placeholder="https://example.com/deck-plans.pdf"
                value={formData.deckPlansUrl}
                onChange={(e) => handleInputChange('deckPlansUrl', e.target.value)}
                className="admin-form-modal h-8"
              />
            </div>

            <div className="space-y-0.5">
              <label className="text-xs font-medium text-white/90">Description</label>
              <Textarea
                placeholder="Enter ship description..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="admin-form-modal"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Venues & Amenities */}
        <div className="space-y-2">
          {/* Spacing to align with Ship Name */}
          <div style={{ height: '1.275rem' }}></div>

          <div className="space-y-1.5">
            {/* Ship Venues - aligned with Ship Name on left */}
            <div className="space-y-0.5">
              <label className="text-xs font-medium text-white/90">Ship Venues</label>
              <VenueSelector
                selectedIds={venueIds}
                onSelectionChange={setVenueIds}
                disabled={loading}
                className="w-full"
              />
            </div>

            {/* Spacing to align with Ship Image URL - after Cruise Line and Capacity/Decks/Built */}
            <div className="space-y-1.5">
              <div style={{ height: '1.975rem' }}></div> {/* Cruise Line height */}
              <div style={{ height: '1.975rem' }}></div> {/* Capacity/Decks/Built height */}
            </div>

            {/* Ship Amenities - aligned with Ship Image URL on left */}
            <div className="space-y-0.5">
              <label className="text-xs font-medium text-white/90">Ship Amenities</label>
              <AmenitySelector
                selectedIds={amenityIds}
                onSelectionChange={setAmenityIds}
                disabled={loading}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </AdminFormModal>
  );
}