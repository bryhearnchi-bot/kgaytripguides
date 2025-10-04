import { Ship } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { ShipSelector } from '@/components/admin/ShipSelector';
import { useTripWizard } from '@/contexts/TripWizardContext';

export function ShipDetailsPage() {
  const { state, setShipId, updateShipData, setCurrentPage } = useTripWizard();
  const [selectedShipId, setSelectedShipId] = useState<number | null>(state.shipId || null);

  // Initialize ship data if null (only once on mount)
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

  // Sync selectedShipId with state.shipId when resuming a draft
  useEffect(() => {
    if (state.shipId && selectedShipId !== state.shipId) {
      setSelectedShipId(state.shipId);
    }
  }, [state.shipId]);

  const shipData = state.shipData || {};

  const handleShipSelection = (shipId: number | null, selectedShip?: any) => {
    setSelectedShipId(shipId);
    // Update wizard state with ship ID
    setShipId(shipId);

    // If a ship was selected, populate all fields
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

  return (
    <div className="space-y-2.5">
      {/* Two-Column Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left Column */}
        <div className="space-y-2.5">
          {/* Ship Selector - Select existing or add new */}
          <ShipSelector
            label="Select Ship"
            selectedId={selectedShipId}
            onSelectionChange={handleShipSelection}
            placeholder="Select an existing ship or add new"
            required
          />

          {/* Capacity and Decks Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Capacity */}
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

            {/* Number of Decks */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-white/90">Decks</Label>
              <Input
                type="number"
                placeholder="0"
                value={shipData.decks || ''}
                onChange={e =>
                  handleInputChange('decks', e.target.value ? parseInt(e.target.value) : undefined)
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

      {/* Info Notice */}
      <div className="mt-4 p-3 rounded-lg bg-cyan-400/5 border border-cyan-400/20">
        <p className="text-[11px] text-white/70 leading-relaxed">
          <span className="font-semibold text-cyan-400">Tip:</span> Select an existing ship from the
          dropdown or click "Add New Ship" to create a new one. All ship details below are
          automatically populated when you select a ship, and you can edit them for this specific
          trip.
        </p>
      </div>
    </div>
  );
}
