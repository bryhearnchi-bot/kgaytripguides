import { useState, useEffect } from 'react';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { VenueSelector } from '@/components/admin/VenueSelector';
import { AmenitySelector } from '@/components/admin/AmenitySelector';
import { Tip } from '@/components/ui/tip';

const modalFieldStyles = `
  .admin-form-modal input,
  .admin-form-modal select,
  .admin-form-modal textarea {
    height: 40px;
    padding: 0 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 1.5px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    color: white;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  .admin-form-modal textarea {
    height: auto;
    padding: 8px 12px;
    resize: vertical;
    line-height: 1.375;
  }
  .admin-form-modal input::placeholder,
  .admin-form-modal textarea::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  .admin-form-modal input:focus,
  .admin-form-modal select:focus,
  .admin-form-modal textarea:focus {
    outline: none !important;
    border-color: rgba(34, 211, 238, 0.6) !important;
    background: rgba(34, 211, 238, 0.03) !important;
    box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.08) !important;
  }
`;

interface EditVenuesAmenitiesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditVenuesAmenitiesModal({ open, onOpenChange }: EditVenuesAmenitiesModalProps) {
  const { state, setVenueIds, setAmenityIds } = useTripWizard();

  // Local state for form
  const [formData, setFormData] = useState({
    venueIds: state.venueIds,
    amenityIds: state.amenityIds,
  });

  useEffect(() => {
    if (open) {
      // Reset form data when modal opens
      setFormData({
        venueIds: state.venueIds,
        amenityIds: state.amenityIds,
      });
    }
  }, [open, state.venueIds, state.amenityIds]);

  const handleVenueChange = (selectedIds: number[]) => {
    setFormData(prev => ({ ...prev, venueIds: selectedIds }));
  };

  const handleAmenityChange = (selectedIds: number[]) => {
    setFormData(prev => ({ ...prev, amenityIds: selectedIds }));
  };

  const handleSave = () => {
    // Update context with form data
    setVenueIds(formData.venueIds);
    setAmenityIds(formData.amenityIds);
    onOpenChange(false);
  };

  const isCruise = state.tripType === 'cruise';
  const venueLabel = isCruise ? 'Ship Venues' : 'Resort Venues';
  const amenityLabel = isCruise ? 'Ship Amenities' : 'Resort Amenities';
  const venueDescription = isCruise
    ? 'Select or create venues available on the ship (dining rooms, theaters, lounges, clubs, etc.)'
    : 'Select or create venues available at this resort (dining, entertainment, recreation, etc.)';
  const amenityDescription = isCruise
    ? 'Select or create amenities available to passengers (WiFi, pools, fitness center, spa, etc.)'
    : 'Select or create amenities available to guests (WiFi, pool, gym, spa, etc.)';

  return (
    <>
      <style>{modalFieldStyles}</style>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="admin-form-modal sm:max-w-3xl border-white/10 bg-gradient-to-b from-[#10192f] to-[#0f1629] rounded-[20px] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Venues & Amenities</DialogTitle>
          </DialogHeader>

          <div className="space-y-2.5 py-4">
            {/* Single Column Layout */}
            <div className="space-y-4">
              {/* Venues Section */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-white/90">{venueLabel}</Label>
                <p className="text-[10px] text-white/50 mb-2">{venueDescription}</p>
                <VenueSelector
                  selectedIds={formData.venueIds}
                  onSelectionChange={handleVenueChange}
                  menuVariant="default"
                  wizardMode={true}
                />
              </div>

              {/* Amenities Section */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-white/90">{amenityLabel}</Label>
                <p className="text-[10px] text-white/50 mb-2">{amenityDescription}</p>
                <AmenitySelector
                  selectedIds={formData.amenityIds}
                  onSelectionChange={handleAmenityChange}
                  menuVariant="default"
                />
              </div>
            </div>

            {/* Info Notice */}
            <Tip label="AI Tip">
              {isCruise
                ? "If you imported data from a URL or PDF, the AI Assistant can help identify ship venues and amenities. You can also search cruisemapper.com or the cruise line's website for detailed ship information."
                : 'If you imported data from a URL or PDF, the AI Assistant can help identify venues and amenities mentioned in the source material. You can also create new venues and amenities by typing and clicking "Create".'}
            </Tip>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 bg-white/4 border-[1.5px] border-white/10 text-white/75 hover:bg-white/8 hover:text-white/90 hover:border-white/20 rounded-lg transition-all"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-all"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
