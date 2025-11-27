import { useState, useEffect } from 'react';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { AdminBottomSheet } from '@/components/admin/AdminBottomSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LocationSelector } from '@/components/admin/LocationSelector';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { TimePicker } from '@/components/ui/time-picker';
import { Building2 } from 'lucide-react';

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

interface EditResortDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditResortDetailsModal({ open, onOpenChange }: EditResortDetailsModalProps) {
  const { state, updateResortData } = useTripWizard();

  // Local state for form
  const [formData, setFormData] = useState({
    name: state.resortData?.name || '',
    locationId: state.resortData?.locationId,
    capacity: state.resortData?.capacity,
    numberOfRooms: state.resortData?.numberOfRooms,
    imageUrl: state.resortData?.imageUrl || '',
    description: state.resortData?.description || '',
    propertyMapUrl: state.resortData?.propertyMapUrl || '',
    checkInTime: state.resortData?.checkInTime || '15:00',
    checkOutTime: state.resortData?.checkOutTime || '11:00',
  });

  useEffect(() => {
    if (open) {
      // Reset form data when modal opens
      setFormData({
        name: state.resortData?.name || '',
        locationId: state.resortData?.locationId,
        capacity: state.resortData?.capacity,
        numberOfRooms: state.resortData?.numberOfRooms,
        imageUrl: state.resortData?.imageUrl || '',
        description: state.resortData?.description || '',
        propertyMapUrl: state.resortData?.propertyMapUrl || '',
        checkInTime: state.resortData?.checkInTime || '15:00',
        checkOutTime: state.resortData?.checkOutTime || '11:00',
      });
    }
  }, [open, state.resortData]);

  const handleLocationChange = (locationId: number | null, _locationName?: string | null) => {
    setFormData(prev => ({ ...prev, locationId: locationId ?? undefined }));
  };

  const handleInputChange = (field: string, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Update context with form data
    updateResortData(formData);
    onOpenChange(false);
  };

  return (
    <>
      <style>{modalFieldStyles}</style>
      <AdminBottomSheet
        isOpen={open}
        onOpenChange={onOpenChange}
        title="Edit Resort Information"
        description="Edit resort details"
        icon={<Building2 className="h-5 w-5 text-white" />}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Left Column */}
            <div className="space-y-2.5">
              {/* Resort Name */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-white/90">
                  Resort Name <span className="text-cyan-400">*</span>
                </Label>
                <Input
                  placeholder="Enter resort name"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm transition-all focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
                />
              </div>

              {/* Location */}
              <LocationSelector
                label="Location"
                selectedId={formData.locationId ?? null}
                onSelectionChange={handleLocationChange}
                placeholder="Select resort location..."
                required
                wizardMode={true}
              />

              {/* Capacity and Rooms Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Capacity */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-white/90">Capacity</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.capacity || ''}
                    onChange={e =>
                      handleInputChange(
                        'capacity',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm transition-all focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
                  />
                </div>

                {/* Number of Rooms */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-white/90">Rooms</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.numberOfRooms || ''}
                    onChange={e =>
                      handleInputChange(
                        'numberOfRooms',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm transition-all focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
                  />
                </div>
              </div>

              {/* Check-in and Check-out Times Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Check-in Time */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-white/90">Check-in Time</Label>
                  <TimePicker
                    value={formData.checkInTime}
                    onChange={value => handleInputChange('checkInTime', value)}
                    placeholder="15:00"
                  />
                </div>

                {/* Check-out Time */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-white/90">Check-out Time</Label>
                  <TimePicker
                    value={formData.checkOutTime}
                    onChange={value => handleInputChange('checkOutTime', value)}
                    placeholder="11:00"
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-2.5">
              {/* Resort Image */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-white/90">Resort Image</Label>
                <ImageUploadField
                  label="Resort Image"
                  value={formData.imageUrl}
                  onChange={url => handleInputChange('imageUrl', url)}
                  imageType="resorts"
                  placeholder="No resort image uploaded"
                />
                <p className="text-[10px] text-white/50 mt-0.5">High-quality image of the resort</p>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-white/90">
                  Description <span className="text-cyan-400">*</span>
                </Label>
                <Textarea
                  placeholder="Enter resort description..."
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="px-3 py-2 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm leading-snug transition-all resize-vertical focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
                />
                <p className="text-[10px] text-white/50 mt-0.5">
                  Describe the resort's features, amenities, and atmosphere
                </p>
              </div>

              {/* Property Map URL */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-white/90">Property Map URL</Label>
                <Input
                  placeholder="https://example.com/property-map.pdf"
                  value={formData.propertyMapUrl}
                  onChange={e => handleInputChange('propertyMapUrl', e.target.value)}
                  className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm transition-all focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
                />
                <p className="text-[10px] text-white/50 mt-0.5">
                  Link to resort property map or floor plan
                </p>
              </div>
            </div>
          </div>
        </div>
      </AdminBottomSheet>
    </>
  );
}
