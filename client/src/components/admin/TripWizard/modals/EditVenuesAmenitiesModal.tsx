import { useState, useEffect } from 'react';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { AdminBottomSheet } from '@/components/admin/AdminBottomSheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { StandardDropdown } from '@/components/ui/dropdowns';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { AmenitySelector } from '@/components/admin/AmenitySelector';
import { Tip } from '@/components/ui/tip';
import { MapPin } from 'lucide-react';

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

  const [venues, setVenues] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);

  useEffect(() => {
    if (open) {
      // Reset form data when modal opens
      setFormData({
        venueIds: state.venueIds,
        amenityIds: state.amenityIds,
      });
      fetchVenues();
    }
  }, [open, state.venueIds, state.amenityIds, state.tripType, state.shipId, state.resortId]);

  const fetchVenues = async () => {
    try {
      setLoadingVenues(true);
      const isCruise = state.tripType === 'cruise';
      const endpoint = isCruise
        ? `/api/admin/ships/${state.shipId}/venues`
        : `/api/admin/resorts/${state.resortId}/venues`;
      const response = await api.get(endpoint);
      const data = await response.json();
      setVenues(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to load venues',
      });
    } finally {
      setLoadingVenues(false);
    }
  };

  const handleCreateVenue = async (name: string) => {
    try {
      const isCruise = state.tripType === 'cruise';
      const endpoint = isCruise
        ? `/api/admin/ships/${state.shipId}/venues`
        : `/api/admin/resorts/${state.resortId}/venues`;
      const response = await api.post(endpoint, {
        name: name.trim(),
        venueTypeId: 1, // Default type
      });
      if (response.ok) {
        const newVenue = await response.json();
        setVenues(prev => [...prev, newVenue]);
        return { value: newVenue.id.toString(), label: newVenue.name };
      }
      throw new Error('Failed to create venue');
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to create venue',
      });
      throw error;
    }
  };

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
      <AdminBottomSheet
        isOpen={open}
        onOpenChange={onOpenChange}
        title="Edit Venues & Amenities"
        description="Edit venues and amenities"
        icon={<MapPin className="h-5 w-5 text-white" />}
        onSubmit={e => {
          e.preventDefault();
          handleSave();
        }}
        primaryAction={{
          label: 'Save Changes',
          type: 'submit',
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => onOpenChange(false),
        }}
        maxWidthClassName="max-w-3xl"
      >
        <div className="space-y-2.5 py-4">
          {/* Single Column Layout */}
          <div className="space-y-4">
            {/* Venues Section */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-white/90">{venueLabel}</Label>
              <p className="text-[10px] text-white/50 mb-2">{venueDescription}</p>
              <StandardDropdown
                variant="multi-search-add"
                placeholder="Select venues..."
                searchPlaceholder="Search venues..."
                emptyMessage="No venues found"
                addLabel="Add New Venue"
                options={venues.map(venue => ({
                  value: venue.id.toString(),
                  label: venue.name,
                }))}
                value={formData.venueIds.map(id => id.toString())}
                onChange={value => {
                  const ids = (value as string[]).map(id => Number(id));
                  handleVenueChange(ids);
                }}
                onCreateNew={handleCreateVenue}
                disabled={loadingVenues}
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
      </AdminBottomSheet>
    </>
  );
}
