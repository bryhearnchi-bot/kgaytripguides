import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { AdminBottomSheet } from './AdminBottomSheet';
import { AmenitySelector } from './AmenitySelector';
import { StandardDropdown } from '@/components/ui/dropdowns';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploadField } from './ImageUploadField';
import { Ship as ShipIcon, Edit2, Plus, Anchor, ChevronDown } from 'lucide-react';
import { VenueManagementModal } from './VenueManagementModal';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface Ship {
  id?: number;
  name: string;
  cruiseLine?: string; // Deprecated - kept for backward compatibility
  cruiseLineId?: number | null;
  capacity?: number;
  decks?: number;
  imageUrl?: string;
  deckPlansUrl?: string;
  description?: string;
}

interface ShipWithRelations extends Ship {
  amenityIds: number[];
}

interface Venue {
  id: number;
  name: string;
  venueTypeName?: string;
  description?: string;
}

interface ShipFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  ship?: Ship | null;
  onSuccess: (savedShip?: any) => void;
}

interface FormData {
  name: string;
  cruiseLineId: number | null;
  capacity: string;
  decks: string;
  imageUrl: string;
  deckPlansUrl: string;
  description: string;
}

export function ShipFormModal({ isOpen, onOpenChange, ship, onSuccess }: ShipFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [amenityIds, setAmenityIds] = useState<number[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [pendingVenues, setPendingVenues] = useState<
    Array<{ name: string; venueTypeId: number; description?: string }>
  >([]);
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    cruiseLineId: null,
    capacity: '',
    decks: '',
    imageUrl: '',
    deckPlansUrl: '',
    description: '',
  });

  // Cruise lines for dropdown
  const [cruiseLines, setCruiseLines] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingCruiseLines, setLoadingCruiseLines] = useState(true);

  const isEditing = !!ship;

  // Fetch cruise lines when modal opens
  useEffect(() => {
    const fetchCruiseLines = async () => {
      try {
        setLoadingCruiseLines(true);
        const response = await api.get('/api/admin/lookup-tables/cruise-lines');
        if (response.ok) {
          const data = await response.json();
          setCruiseLines(data.items || []);
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error('Failed to fetch cruise lines', { message: error.message });
        }
      } finally {
        setLoadingCruiseLines(false);
      }
    };

    if (isOpen) {
      fetchCruiseLines();
    }
  }, [isOpen]);

  // Handle creating new cruise line
  const handleCreateCruiseLine = async (name: string) => {
    try {
      const response = await api.post('/api/admin/lookup-tables/cruise-lines', {
        name: name.trim(),
      });
      if (response.ok) {
        const newCruiseLine = await response.json();
        setCruiseLines(prev => [...prev, newCruiseLine.item || newCruiseLine]);
        return {
          value: (newCruiseLine.item?.id || newCruiseLine.id).toString(),
          label: newCruiseLine.item?.name || newCruiseLine.name,
        };
      }
      throw new Error('Failed to create cruise line');
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error('Failed to create cruise line', { message: error.message });
      }
      throw error;
    }
  };

  // Load ship data when editing
  useEffect(() => {
    // CRITICAL: Only run when modal is actually open
    // This prevents the form from resetting when the modal is closed
    if (!isOpen) {
      return;
    }

    if (ship) {
      setFormData({
        name: ship.name || '',
        cruiseLineId: ship.cruiseLineId || null,
        capacity: ship.capacity?.toString() || '',
        decks: ship.decks?.toString() || '',
        imageUrl: ship.imageUrl || '',
        deckPlansUrl: ship.deckPlansUrl || '',
        description: ship.description || '',
      });

      // Load ship's amenities and venues
      if (ship.id) {
        loadShipRelations(ship.id);
      } else {
      }
    } else {
      // Reset form for new ship
      setFormData({
        name: '',
        cruiseLineId: null,
        capacity: '',
        decks: '',
        imageUrl: '',
        deckPlansUrl: '',
        description: '',
      });
      setAmenityIds([]);
      setVenues([]);
      setPendingVenues([]); // Clear pending venues for new ship
    }
  }, [ship, isOpen]);

  const loadShipRelations = async (shipId: number) => {
    try {
      if (!shipId) {
        return;
      }

      const [amenitiesResponse, venuesResponse] = await Promise.all([
        api.get(`/api/ships/${shipId}/amenities`, { requireAuth: true }),
        api.get(`/api/admin/ships/${shipId}/venues`),
      ]);

      if (amenitiesResponse.ok && venuesResponse.ok) {
        const amenitiesData = await amenitiesResponse.json();
        const venuesData = await venuesResponse.json();

        const amenityIdsToSet = amenitiesData.map((a: any) => a.id);

        setAmenityIds(amenityIdsToSet);
        setVenues(venuesData);
      }
    } catch (error) {}
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenVenueModal = () => {
    // Always open the modal - we'll handle pending vs saved venues inside
    setShowVenueModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.cruiseLineId) {
      return;
    }

    try {
      setLoading(true);

      // Prepare ship data
      const shipData = {
        name: formData.name.trim(),
        cruiseLineId: formData.cruiseLineId,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        decks: formData.decks ? parseInt(formData.decks) : null,
        imageUrl: formData.imageUrl.trim() || null,
        deckPlansUrl: formData.deckPlansUrl.trim() || null,
        description: formData.description.trim() || null,
      };

      let shipResponse;
      if (isEditing && ship) {
        // Update existing ship - requireAuth ensures Authorization header is sent
        shipResponse = await api.put(`/api/ships/${ship.id}`, shipData, { requireAuth: true });
      } else {
        // Create new ship - requireAuth ensures Authorization header is sent
        shipResponse = await api.post('/api/ships', shipData, { requireAuth: true });
      }

      if (!shipResponse.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} ship`);
      }

      const savedShip = await shipResponse.json();
      const shipId = savedShip.id;

      // Update ship amenities - requireAuth ensures Authorization header is sent
      const amenitiesResponse = await api.put(
        `/api/ships/${shipId}/amenities`,
        { amenityIds },
        { requireAuth: true }
      );

      if (!amenitiesResponse.ok) {
        const errorData = await amenitiesResponse.json().catch(() => ({}));
        throw new Error('Failed to update ship amenities');
      }

      // If we have pending venues (for new ships), save them now
      if (!isEditing && pendingVenues.length > 0) {
        for (const venue of pendingVenues) {
          try {
            await api.post(`/api/admin/ships/${shipId}/venues`, venue);
          } catch (venueError) {
            // Continue with other venues even if one fails
          }
        }
      }

      // CRITICAL FIX: Wait a tiny bit to ensure the amenities request fully completes
      // before triggering callbacks that might close the modal
      await new Promise(resolve => setTimeout(resolve, 100));

      onSuccess(savedShip);
      onOpenChange(false);
    } catch (error) {
      // You could show an error toast here
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminBottomSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Ship' : 'Add New Ship'}
      description={
        isEditing
          ? 'Update ship information and amenities'
          : 'Create a new ship with amenities and venues'
      }
      icon={<ShipIcon className="h-5 w-5" />}
      onSubmit={handleSubmit}
      primaryAction={{
        label: isEditing ? 'Update Ship' : 'Create Ship',
        type: 'submit',
        loading,
        loadingLabel: isEditing ? 'Updating...' : 'Creating...',
        disabled: !formData.name.trim() || !formData.cruiseLineId,
      }}
      contentClassName="py-4"
      maxHeight="85vh"
      sidePanel={true}
      sidePanelWidth="600px"
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
                onChange={e => handleInputChange('name', e.target.value)}
                className="admin-form-modal h-8"
              />
            </div>

            <div className="space-y-0.5">
              <StandardDropdown
                variant="single-search-add"
                label="Cruise Line"
                placeholder="Select a cruise line"
                searchPlaceholder="Search cruise lines..."
                emptyMessage="No cruise lines found"
                addLabel="Add New Cruise Line"
                options={cruiseLines.map(cl => ({
                  value: cl.id.toString(),
                  label: cl.name,
                }))}
                value={formData.cruiseLineId?.toString() || ''}
                onChange={value =>
                  setFormData(prev => ({ ...prev, cruiseLineId: value ? Number(value) : null }))
                }
                onCreateNew={handleCreateCruiseLine}
                disabled={loading || loadingCruiseLines}
                required={true}
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="space-y-0.5">
                <label className="text-xs font-medium text-white/90">Capacity</label>
                <Input
                  type="number"
                  placeholder="3000"
                  value={formData.capacity}
                  onChange={e => handleInputChange('capacity', e.target.value)}
                  className="admin-form-modal h-8"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-xs font-medium text-white/90">Decks</label>
                <Input
                  type="number"
                  placeholder="12"
                  value={formData.decks}
                  onChange={e => handleInputChange('decks', e.target.value)}
                  className="admin-form-modal h-8"
                />
              </div>
            </div>

            <div className="space-y-0.5">
              <label className="text-xs font-medium text-white/90">Ship Image</label>
              <ImageUploadField
                label="Ship Image"
                value={formData.imageUrl}
                onChange={url => handleInputChange('imageUrl', url || '')}
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
                onChange={e => handleInputChange('deckPlansUrl', e.target.value)}
                className="admin-form-modal h-8"
              />
            </div>

            <div className="space-y-0.5">
              <label className="text-xs font-medium text-white/90">Description</label>
              <Textarea
                placeholder="Enter ship description..."
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                className="admin-form-modal"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Amenities & Venues */}
        <div className="space-y-2">
          {/* Spacing to align with Ship Name */}
          <div style={{ height: '1.275rem' }}></div>

          <div className="space-y-3">
            {/* Ship Amenities - now on top */}
            <div className="space-y-0.5">
              <label className="text-xs font-medium text-white/90">Ship Amenities</label>
              <AmenitySelector
                selectedIds={amenityIds}
                onSelectionChange={setAmenityIds}
                disabled={loading}
                className="w-full"
              />
            </div>

            {/* Ship Venues - now on bottom with accordions */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-xs font-medium text-white/90">Ship Venues</label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenVenueModal}
                    disabled={loading}
                    className="h-6 px-2 text-[10px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 disabled:opacity-50"
                    title={!ship?.id ? 'Save ship first, then add venues' : 'Create new venue'}
                  >
                    <Plus className="w-2.5 h-2.5 mr-1" />
                    Create
                  </Button>
                  {ship?.id && venues.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowVenueModal(true)}
                      className="h-6 px-2 text-[10px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                    >
                      <Edit2 className="w-2.5 h-2.5 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              {/* Venue List Display - No container, grouped by type */}
              {venues.length > 0 ? (
                <Accordion type="multiple" className="w-full space-y-1">
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
                          <Anchor className="w-3 h-3 text-cyan-400" />
                          <span className="text-xs font-medium text-white">{type}</span>
                          <span className="text-[10px] text-white/50">({venuesInType.length})</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-2">
                        <div className="space-y-1">
                          {venuesInType.map(venue => (
                            <div
                              key={venue.id}
                              className="flex items-start gap-2 p-1.5 bg-white/[0.02] rounded border border-white/5"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-white font-medium">{venue.name}</div>
                                {venue.description && (
                                  <div className="text-[10px] text-white/50 mt-0.5 line-clamp-2">
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
                <div className="flex flex-col items-center justify-center py-6 text-white/40">
                  <Anchor className="w-6 h-6 mb-2" />
                  {ship?.id ? (
                    <p className="text-[10px]">No venues added</p>
                  ) : pendingVenues.length > 0 ? (
                    <div className="text-center px-4">
                      <p className="text-[11px] font-semibold text-cyan-400/80 mb-1">
                        {pendingVenues.length} venue{pendingVenues.length !== 1 ? 's' : ''} ready to
                        save
                      </p>
                      <p className="text-[9px] text-white/50">
                        Venues will be created when you save the ship
                      </p>
                    </div>
                  ) : (
                    <div className="text-center px-4">
                      <p className="text-[10px] font-medium text-white/60 mb-1">
                        Click "Create" to add venues
                      </p>
                      <p className="text-[9px] text-white/40">
                        Venues will appear here after you save the ship
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Venue Management Modal */}
      <VenueManagementModal
        isOpen={showVenueModal}
        onOpenChange={setShowVenueModal}
        propertyId={ship?.id || 0}
        propertyType="ship"
        pendingMode={!ship?.id}
        initialPendingVenues={pendingVenues}
        onPendingVenuesChange={setPendingVenues}
        onSuccess={() => {
          // Refetch venues to update the display (only for existing ships)
          if (ship?.id) {
            api.get(`/api/admin/ships/${ship.id}/venues`).then(async response => {
              if (response.ok) {
                const venuesData = await response.json();
                setVenues(venuesData);
              }
            });
          }
        }}
      />
    </AdminBottomSheet>
  );
}
