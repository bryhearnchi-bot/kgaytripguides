import { Label } from '@/components/ui/label';
import { VenueSelector } from '@/components/admin/VenueSelector';
import { AmenitySelector } from '@/components/admin/AmenitySelector';
import { Tip } from '@/components/ui/tip';
import { useTripWizard } from '@/contexts/TripWizardContext';

export function ResortVenuesAmenitiesPage() {
  const { state, setVenueIds, setAmenityIds } = useTripWizard();

  const handleVenueChange = (selectedIds: number[]) => {
    setVenueIds(selectedIds);
  };

  const handleAmenityChange = (selectedIds: number[]) => {
    setAmenityIds(selectedIds);
  };

  return (
    <div className="space-y-2.5">
      {/* Single Column Layout */}
      <div className="space-y-4">
        {/* Venues Section */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-white/90">Resort Venues</Label>
          <p className="text-[10px] text-white/50 mb-2">
            Select or create venues available at this resort (dining, entertainment, recreation,
            etc.)
          </p>
          <VenueSelector
            selectedIds={state.venueIds}
            onSelectionChange={handleVenueChange}
            menuVariant="default"
            wizardMode={true}
          />
        </div>

        {/* Amenities Section */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-white/90">Resort Amenities</Label>
          <p className="text-[10px] text-white/50 mb-2">
            Select or create amenities available to guests (WiFi, pool, gym, spa, etc.)
          </p>
          <AmenitySelector
            selectedIds={state.amenityIds}
            onSelectionChange={handleAmenityChange}
            menuVariant="default"
          />
        </div>
      </div>

      {/* Info Notice */}
      <Tip label="AI Tip">
        If you imported data from a URL or PDF, the AI Assistant can help identify venues and
        amenities mentioned in the source material. You can also create new venues and amenities by
        typing and clicking "Create".
      </Tip>
    </div>
  );
}
