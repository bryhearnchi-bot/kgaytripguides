import { useState, useEffect } from 'react';
import { Building2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LocationSelector } from '@/components/admin/LocationSelector';
import { ResortSelector } from '@/components/admin/ResortSelector';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { TimePicker } from '@/components/ui/time-picker';
import { useTripWizard } from '@/contexts/TripWizardContext';

export function ResortDetailsPage() {
  const { state, setResortId, updateResortData, setCurrentPage } = useTripWizard();
  const [selectedResortId, setSelectedResortId] = useState<number | null>(state.resortId || null);

  // Initialize resort data if null (only once on mount)
  useEffect(() => {
    if (!state.resortData) {
      updateResortData({
        name: '',
        locationId: undefined,
        capacity: undefined,
        numberOfRooms: undefined,
        imageUrl: '',
        description: '',
        propertyMapUrl: '',
        checkInTime: '15:00', // Default check-in time
        checkOutTime: '11:00', // Default check-out time
      });
    }
  }, []);

  // Sync selectedResortId with state.resortId when resuming a draft
  useEffect(() => {
    if (state.resortId && selectedResortId !== state.resortId) {
      setSelectedResortId(state.resortId);
    }
  }, [state.resortId]);

  const resortData = state.resortData || {};

  const handleResortSelection = (resortId: number | null, selectedResort?: any) => {
    setSelectedResortId(resortId);
    // Update wizard state with resort ID
    setResortId(resortId);

    // If a resort was selected, populate all fields
    if (selectedResort) {
      updateResortData({
        name: selectedResort.name || '',
        locationId: selectedResort.locationId,
        capacity: selectedResort.capacity,
        numberOfRooms: selectedResort.numberOfRooms || selectedResort.roomCount,
        imageUrl: selectedResort.imageUrl || '',
        description: selectedResort.description || '',
        propertyMapUrl: selectedResort.propertyMapUrl || '',
        checkInTime: selectedResort.checkInTime || '15:00',
        checkOutTime: selectedResort.checkOutTime || '11:00',
      });
    }
  };

  const handleLocationChange = (locationId: number | null) => {
    updateResortData({ locationId: locationId ?? undefined });
  };

  const handleInputChange = (field: string, value: string | number | null) => {
    updateResortData({ [field]: value });
  };

  return (
    <div className="space-y-2.5">
      {/* Two-Column Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left Column */}
        <div className="space-y-2.5">
          {/* Resort Selector - Select existing or add new */}
          <ResortSelector
            label="Select Resort"
            selectedId={selectedResortId}
            onSelectionChange={handleResortSelection}
            placeholder="Select an existing resort or add new"
            required
          />

          {/* Capacity and Rooms Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Capacity */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-white/90">Capacity</Label>
              <Input
                type="number"
                placeholder="0"
                value={resortData.capacity || ''}
                onChange={e =>
                  handleInputChange(
                    'capacity',
                    e.target.value ? parseInt(e.target.value) : undefined
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
                value={resortData.numberOfRooms || ''}
                onChange={e =>
                  handleInputChange(
                    'numberOfRooms',
                    e.target.value ? parseInt(e.target.value) : undefined
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
                value={resortData.checkInTime || '15:00'}
                onChange={value => handleInputChange('checkInTime', value)}
                placeholder="15:00"
              />
            </div>

            {/* Check-out Time */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-white/90">Check-out Time</Label>
              <TimePicker
                value={resortData.checkOutTime || '11:00'}
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
              value={resortData.imageUrl || ''}
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
              value={resortData.description || ''}
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
              value={resortData.propertyMapUrl || ''}
              onChange={e => handleInputChange('propertyMapUrl', e.target.value)}
              className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm transition-all focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
            />
            <p className="text-[10px] text-white/50 mt-0.5">
              Link to resort property map or floor plan
            </p>
          </div>
        </div>
      </div>

      {/* Info Notice */}
      <div className="mt-4 p-3 rounded-lg bg-cyan-400/5 border border-cyan-400/20">
        <p className="text-[11px] text-white/70 leading-relaxed">
          <span className="font-semibold text-cyan-400">Tip:</span> Select an existing resort from
          the dropdown or click "Add New Resort" to create a new one. All resort details below are
          automatically populated when you select a resort, and you can edit them for this specific
          trip.
        </p>
      </div>
    </div>
  );
}
