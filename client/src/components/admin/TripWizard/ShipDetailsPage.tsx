import { Ship } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { ShipSelector } from '@/components/admin/ShipSelector';
import { ShipPreview } from './ShipPreview';
import { ShipFormModal } from '@/components/admin/ShipFormModal';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function ShipDetailsPage() {
  console.log('ShipDetailsPage rendering - PREVIEW VERSION');
  const { state, setShipId, updateShipData } = useTripWizard();
  const queryClient = useQueryClient();
  const [selectedShipId, setSelectedShipId] = useState<number | null>(state.shipId || null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoadingShip, setIsLoadingShip] = useState(false);

  const shipData = state.shipData || {};
  const isEditMode = state.isEditMode;

  // Initialize ship data if null
  useEffect(() => {
    if (!state.shipData) {
      updateShipData({
        name: '',
        cruiseLine: '',
        capacity: undefined,
        decks: undefined,
        imageUrl: '',
        description: '',
        deckPlansUrl: '',
      });
    }
  }, []);

  // Sync with state.shipId when it changes
  useEffect(() => {
    if (state.shipId !== selectedShipId) {
      setSelectedShipId(state.shipId);
    }
  }, [state.shipId, selectedShipId]);

  // Fetch ship details when we have a shipId but no name
  useEffect(() => {
    if (selectedShipId && !shipData.name && !isLoadingShip) {
      setIsLoadingShip(true);
      api
        .get('/api/ships')
        .then(response => response.json())
        .then(ships => {
          const ship = ships.find((s: any) => s.id === selectedShipId);
          if (ship) {
            updateShipData({
              name: ship.name || '',
              cruiseLine: ship.cruiseLine || '',
              capacity: ship.capacity,
              decks: ship.decks,
              imageUrl: ship.imageUrl || '',
              description: ship.description || '',
              deckPlansUrl: ship.deckPlansUrl || '',
            });
          }
        })
        .catch(error => {
          console.error('Error fetching ship:', error);
        })
        .finally(() => {
          setIsLoadingShip(false);
        });
    }
  }, [selectedShipId, shipData.name, isLoadingShip, updateShipData]);

  const handleShipSelection = (shipId: number | null, selectedShip?: any) => {
    setSelectedShipId(shipId);
    setShipId(shipId);

    if (selectedShip) {
      updateShipData({
        name: selectedShip.name || '',
        cruiseLine: selectedShip.cruiseLine || '',
        capacity: selectedShip.capacity,
        decks: selectedShip.decks,
        imageUrl: selectedShip.imageUrl || '',
        description: selectedShip.description || '',
        deckPlansUrl: selectedShip.deckPlansUrl || '',
      });
    }
  };

  const handleInputChange = (field: string, value: string | number | null) => {
    updateShipData({ [field]: value });
  };

  // Determine whether to show preview or input fields
  const showPreview = selectedShipId && shipData?.name;

  return (
    <div className="space-y-2.5">
      {/* Ship Selector - Always show */}
      <ShipSelector
        label="Select Ship"
        selectedId={selectedShipId}
        onSelectionChange={handleShipSelection}
        placeholder="Select an existing ship or add new"
        required
      />

      {/* Show loading state */}
      {isLoadingShip && (
        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-lg">
          <p className="text-white/60 text-sm">Loading ship details...</p>
        </div>
      )}

      {/* Show preview or input fields */}
      {!isLoadingShip && (
        <>
          {showPreview ? (
            <ShipPreview shipData={shipData} onEdit={() => setShowEditModal(true)} />
          ) : (
            // Show input fields for new ship
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Left Column */}
              <div className="space-y-2.5">
                {/* Capacity and Decks Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-white/90">Capacity</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={shipData.capacity || ''}
                      onChange={e =>
                        handleInputChange(
                          'capacity',
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm transition-all focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
                    />
                    <p className="text-[10px] text-white/50 mt-0.5">Max passengers</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-white/90">Decks</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={shipData.decks || ''}
                      onChange={e =>
                        handleInputChange(
                          'decks',
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm transition-all focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
                    />
                    <p className="text-[10px] text-white/50 mt-0.5">Number of decks</p>
                  </div>
                </div>

                {/* Deck Plans URL */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-white/90">Deck Plans URL</Label>
                  <Input
                    placeholder="https://example.com/deck-plans"
                    value={shipData.deckPlansUrl || ''}
                    onChange={e => handleInputChange('deckPlansUrl', e.target.value)}
                    className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm transition-all focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
                  />
                  <p className="text-[10px] text-white/50 mt-0.5">
                    Link to ship's deck plans (e.g., from cruisemapper.com)
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-2.5">
                {/* Ship Image */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-white/90">Ship Image</Label>
                  <ImageUploadField
                    label="Ship Image"
                    value={shipData.imageUrl || ''}
                    onChange={url => handleInputChange('imageUrl', url)}
                    imageType="ships"
                    placeholder="No ship image uploaded"
                  />
                  <p className="text-[10px] text-white/50 mt-0.5">
                    High-quality image of the cruise ship
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-white/90">
                    Description <span className="text-cyan-400">*</span>
                  </Label>
                  <Textarea
                    placeholder="Enter ship description..."
                    value={shipData.description || ''}
                    onChange={e => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="px-3 py-2 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm leading-snug transition-all resize-vertical focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
                  />
                  <p className="text-[10px] text-white/50 mt-0.5">
                    Describe the ship's features, amenities, and unique characteristics
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Ship Edit Modal */}
      <ShipFormModal
        isOpen={showEditModal}
        onOpenChange={setShowEditModal}
        ship={{
          id: selectedShipId!,
          ...shipData,
        }}
        onSuccess={updatedShip => {
          // Update local state with the new ship data
          if (updatedShip) {
            updateShipData({
              name: updatedShip.name || '',
              cruiseLine: updatedShip.cruiseLine || '',
              capacity: updatedShip.capacity,
              decks: updatedShip.decks,
              imageUrl: updatedShip.imageUrl || '',
              description: updatedShip.description || '',
              deckPlansUrl: updatedShip.deckPlansUrl || '',
            });
          }
          queryClient.invalidateQueries({ queryKey: ['ships'] });
          setShowEditModal(false);
        }}
      />
    </div>
  );
}
