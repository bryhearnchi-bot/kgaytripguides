import { useState, useEffect } from 'react';
import { Building2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LocationSelector } from '@/components/admin/LocationSelector';
import { ResortSelector } from '@/components/admin/ResortSelector';
import { ResortPreview } from './ResortPreview';
import { ResortFormModal } from '@/components/admin/ResortFormModal';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { TimePicker } from '@/components/ui/time-picker';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function ResortDetailsPage() {
  console.log('ResortDetailsPage rendering - PREVIEW VERSION');
  const { state, setResortId, updateResortData } = useTripWizard();
  const queryClient = useQueryClient();
  const [selectedResortId, setSelectedResortId] = useState<number | null>(state.resortId || null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoadingResort, setIsLoadingResort] = useState(false);

  const resortData = state.resortData || {};
  const isEditMode = state.isEditMode;

  // Initialize resort data if null
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
        checkInTime: '15:00',
        checkOutTime: '11:00',
      });
    }
  }, []);

  // Sync with state.resortId when it changes
  useEffect(() => {
    if (state.resortId !== selectedResortId) {
      setSelectedResortId(state.resortId);
    }
  }, [state.resortId, selectedResortId]);

  // Fetch resort details when we have a resortId but no name
  useEffect(() => {
    if (selectedResortId && !resortData.name && !isLoadingResort) {
      setIsLoadingResort(true);
      api
        .get('/api/resorts')
        .then(response => response.json())
        .then(resorts => {
          const resort = resorts.find((r: any) => r.id === selectedResortId);
          if (resort) {
            updateResortData({
              name: resort.name || '',
              locationId: resort.locationId,
              locationName: resort.location || '',
              capacity: resort.capacity,
              numberOfRooms: resort.numberOfRooms || resort.roomCount,
              imageUrl: resort.imageUrl || '',
              description: resort.description || '',
              propertyMapUrl: resort.propertyMapUrl || '',
              checkInTime: resort.checkInTime || '15:00',
              checkOutTime: resort.checkOutTime || '11:00',
            });
          }
        })
        .catch(error => {
          console.error('Error fetching resort:', error);
        })
        .finally(() => {
          setIsLoadingResort(false);
        });
    }
  }, [selectedResortId, resortData.name, isLoadingResort, updateResortData]);

  const handleResortSelection = (resortId: number | null, selectedResort?: any) => {
    setSelectedResortId(resortId);
    setResortId(resortId);

    if (selectedResort) {
      updateResortData({
        name: selectedResort.name || '',
        locationId: selectedResort.locationId,
        locationName: selectedResort.location?.name || selectedResort.locationName || '',
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

  const handleInputChange = (field: string, value: string | number | null) => {
    updateResortData({ [field]: value });
  };

  // Determine whether to show preview or input fields
  const showPreview = selectedResortId && resortData?.name;

  return (
    <div className="space-y-2.5">
      {/* Resort Selector - Always show */}
      <ResortSelector
        label="Select Resort"
        selectedId={selectedResortId}
        onSelectionChange={handleResortSelection}
        placeholder="Select an existing resort or add new"
        required
      />

      {/* Show loading state */}
      {isLoadingResort && (
        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-lg">
          <p className="text-white/60 text-sm">Loading resort details...</p>
        </div>
      )}

      {/* Show preview or input fields */}
      {!isLoadingResort && (
        <>
          {showPreview ? (
            <ResortPreview resortData={resortData} onEdit={() => setShowEditModal(true)} />
          ) : (
            // Show input fields for new resort
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Left Column */}
              <div className="space-y-2.5">
                {/* Capacity and Rooms Grid */}
                <div className="grid grid-cols-2 gap-2">
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

                {/* Check-in and Check-out Times */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-white/90">Check-in Time</Label>
                    <TimePicker
                      value={resortData.checkInTime || '15:00'}
                      onChange={value => handleInputChange('checkInTime', value)}
                      placeholder="15:00"
                    />
                  </div>

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
                  <p className="text-[10px] text-white/50 mt-0.5">
                    High-quality image of the resort
                  </p>
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
          )}
        </>
      )}

      {/* Resort Edit Modal */}
      <ResortFormModal
        isOpen={showEditModal}
        onOpenChange={setShowEditModal}
        resort={{
          id: selectedResortId!,
          ...resortData,
        }}
        onSuccess={updatedResort => {
          // Update local state with the new resort data
          if (updatedResort) {
            updateResortData({
              name: updatedResort.name || '',
              locationId: updatedResort.locationId,
              locationName: updatedResort.location?.name || updatedResort.locationName || '',
              capacity: updatedResort.capacity,
              numberOfRooms: updatedResort.numberOfRooms || updatedResort.roomCount,
              imageUrl: updatedResort.imageUrl || '',
              description: updatedResort.description || '',
              propertyMapUrl: updatedResort.propertyMapUrl || '',
              checkInTime: updatedResort.checkInTime || '15:00',
              checkOutTime: updatedResort.checkOutTime || '11:00',
            });
          }
          queryClient.invalidateQueries({ queryKey: ['resorts'] });
          setShowEditModal(false);
        }}
      />
    </div>
  );
}
