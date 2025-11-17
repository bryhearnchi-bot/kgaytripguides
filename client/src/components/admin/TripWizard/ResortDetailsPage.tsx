import { useState, useEffect, useMemo } from 'react';
import { StandardDropdown } from '@/components/ui/dropdowns';
import { ResortPreview } from './ResortPreview';
import { ResortFormModal } from '@/components/admin/ResortFormModal';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function ResortDetailsPage() {
  const { state, setResortId, updateResortData } = useTripWizard();
  const queryClient = useQueryClient();
  const [selectedResortId, setSelectedResortId] = useState<number | null>(state.resortId || null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoadingResort, setIsLoadingResort] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [resorts, setResorts] = useState<any[]>([]);
  const [loadingResorts, setLoadingResorts] = useState(true);

  const resortData = state.resortData || {};
  const isEditMode = state.isEditMode;

  // Fetch resorts on mount
  useEffect(() => {
    const fetchResorts = async () => {
      try {
        setLoadingResorts(true);
        const response = await api.get('/api/resorts');
        if (response.ok) {
          const data = await response.json();
          setResorts(data);
        }
      } catch (error) {
        // Silently handle error
      } finally {
        setLoadingResorts(false);
      }
    };
    fetchResorts();
  }, []);

  // Initialize resort data if null
  useEffect(() => {
    if (!state.resortData) {
      updateResortData({
        name: '',
        location: '',
        city: '',
        state_province: '',
        country: '',
        country_code: '',
        locationId: undefined,
        resortCompanyId: undefined,
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
              location: resort.location || '',
              city: resort.city || '',
              state_province: resort.state_province || resort.stateProvince || '',
              country: resort.country || '',
              country_code: resort.country_code || resort.countryCode || '',
              locationId: resort.locationId,
              resortCompanyId: resort.resortCompanyId,
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
        .catch(error => {})
        .finally(() => {
          setIsLoadingResort(false);
        });
    }
  }, [selectedResortId, resortData.name, isLoadingResort, updateResortData]);

  const handleResortChange = (value: string | string[]) => {
    const resortId = Number(value);
    if (!resortId) return;

    const selectedResort = resorts.find(r => r.id === resortId);
    if (selectedResort) {
      setSelectedResortId(resortId);
      setResortId(resortId);
      updateResortData({
        name: selectedResort.name || '',
        location: selectedResort.location || '',
        city: selectedResort.city || '',
        state_province: selectedResort.state_province || selectedResort.stateProvince || '',
        country: selectedResort.country || '',
        country_code: selectedResort.country_code || selectedResort.countryCode || '',
        locationId: selectedResort.locationId,
        resortCompanyId: selectedResort.resortCompanyId,
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

  const handleCreateResort = async (name: string) => {
    // Open the ResortFormModal for full resort creation
    // The StandardDropdown fly-up will close, and ResortFormModal will open
    setShowCreateModal(true);
    // Return a placeholder - the actual creation and selection happens in ResortFormModal's onSuccess
    // StandardDropdown won't try to add this since ResortFormModal handles everything
    return Promise.resolve({ value: '', label: name });
  };

  // Determine whether to show preview
  const showPreview = selectedResortId && resortData?.name;

  // Memoize resort object to prevent unnecessary re-renders
  // This ensures the resort prop only changes when the actual data changes
  const memoizedResort = useMemo(() => {
    if (!selectedResortId) return null;
    return {
      id: selectedResortId,
      ...resortData,
    };
  }, [
    selectedResortId,
    resortData.name,
    resortData.location,
    resortData.city,
    resortData.state_province,
    resortData.country,
    resortData.country_code,
    resortData.locationId,
    resortData.resortCompanyId,
    resortData.capacity,
    resortData.numberOfRooms,
    resortData.imageUrl,
    resortData.description,
    resortData.propertyMapUrl,
    resortData.checkInTime,
    resortData.checkOutTime,
  ]);

  return (
    <div className="space-y-2.5 max-w-3xl mx-auto">
      {/* Resort Selector - Always show */}
      <StandardDropdown
        variant="single-search-add"
        label="Select Resort"
        placeholder="Select an existing resort or add new"
        searchPlaceholder="Search resorts..."
        emptyMessage="No resorts found"
        addLabel="Add New Resort"
        options={resorts.map(resort => ({
          value: resort.id.toString(),
          label: resort.name,
        }))}
        value={selectedResortId?.toString() || ''}
        onChange={handleResortChange}
        onCreateNew={handleCreateResort}
        disabled={loadingResorts}
        required
      />

      {/* Show loading state */}
      {isLoadingResort && (
        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-lg">
          <p className="text-white/60 text-sm">Loading resort details...</p>
        </div>
      )}

      {/* Show preview */}
      {!isLoadingResort && showPreview && (
        <ResortPreview
          key={refreshKey}
          resortData={resortData}
          resortId={selectedResortId}
          onEdit={() => setShowEditModal(true)}
        />
      )}

      {/* Resort Create Modal */}
      <ResortFormModal
        isOpen={showCreateModal}
        onOpenChange={setShowCreateModal}
        resort={null}
        onSuccess={async newResort => {
          // Refresh resorts list
          queryClient.invalidateQueries({ queryKey: ['resorts'] });
          const response = await api.get('/api/resorts');
          if (response.ok) {
            const data = await response.json();
            setResorts(data);
          }
          // Auto-select the newly created resort
          if (newResort && newResort.id) {
            setSelectedResortId(newResort.id);
            setResortId(newResort.id);
            updateResortData({
              name: newResort.name || '',
              locationId: newResort.locationId,
              resortCompanyId: newResort.resortCompanyId,
              locationName: newResort.location?.name || newResort.locationName || '',
              capacity: newResort.capacity,
              numberOfRooms: newResort.numberOfRooms || newResort.roomCount,
              imageUrl: newResort.imageUrl || '',
              description: newResort.description || '',
              propertyMapUrl: newResort.propertyMapUrl || '',
              checkInTime: newResort.checkInTime || '15:00',
              checkOutTime: newResort.checkOutTime || '11:00',
            });
          }
          setShowCreateModal(false);
        }}
      />

      {/* Resort Edit Modal */}
      <ResortFormModal
        isOpen={showEditModal}
        onOpenChange={setShowEditModal}
        resort={memoizedResort}
        onSuccess={updatedResort => {
          // Update local state with the new resort data
          if (updatedResort) {
            updateResortData({
              name: updatedResort.name || '',
              location: updatedResort.location || '',
              city: updatedResort.city || '',
              state_province: updatedResort.state_province || '',
              country: updatedResort.country || '',
              country_code: updatedResort.country_code || '',
              locationId: updatedResort.locationId,
              resortCompanyId: updatedResort.resortCompanyId,
              locationName: updatedResort.location?.name || updatedResort.locationName || '',
              capacity: updatedResort.capacity,
              numberOfRooms: updatedResort.numberOfRooms || updatedResort.roomCount,
              roomCount: updatedResort.numberOfRooms || updatedResort.roomCount,
              imageUrl: updatedResort.imageUrl || '',
              description: updatedResort.description || '',
              propertyMapUrl: updatedResort.propertyMapUrl || '',
              checkInTime: updatedResort.checkInTime || '15:00',
              checkOutTime: updatedResort.checkOutTime || '11:00',
            });
          }
          queryClient.invalidateQueries({ queryKey: ['resorts'] });
          setRefreshKey(prev => prev + 1); // Force ResortPreview to refresh
          setShowEditModal(false);
        }}
      />
    </div>
  );
}
