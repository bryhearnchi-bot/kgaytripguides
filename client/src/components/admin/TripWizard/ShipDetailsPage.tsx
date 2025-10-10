import { useState, useEffect, useMemo } from 'react';
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoadingShip, setIsLoadingShip] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const shipData = state.shipData || {};
  const isEditMode = state.isEditMode;

  // Initialize ship data if null
  useEffect(() => {
    if (!state.shipData) {
      updateShipData({
        name: '',
        cruiseLineId: undefined,
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
        .get(`/api/ships/${selectedShipId}`)
        .then(response => response.json())
        .then(ship => {
          if (ship) {
            updateShipData({
              name: ship.name || '',
              cruiseLineId: ship.cruiseLineId,
              cruiseLineName: ship.cruiseLineName || '',
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
    // If shipId is null, user wants to create a new ship
    if (shipId === null) {
      setShowCreateModal(true);
      return;
    }

    setSelectedShipId(shipId);
    setShipId(shipId);

    if (selectedShip) {
      updateShipData({
        name: selectedShip.name || '',
        cruiseLineId: selectedShip.cruiseLineId,
        cruiseLineName: selectedShip.cruiseLineName || '',
        capacity: selectedShip.capacity,
        decks: selectedShip.decks,
        imageUrl: selectedShip.imageUrl || '',
        description: selectedShip.description || '',
        deckPlansUrl: selectedShip.deckPlansUrl || '',
      });
    }
  };

  // Determine whether to show preview
  const showPreview = selectedShipId && shipData?.name;

  // Memoize ship object to prevent unnecessary re-renders
  // This ensures the ship prop only changes when the actual data changes
  const memoizedShip = useMemo(() => {
    if (!selectedShipId) return null;
    return {
      id: selectedShipId,
      ...shipData,
    };
  }, [
    selectedShipId,
    shipData.name,
    shipData.cruiseLineId,
    shipData.cruiseLineName,
    shipData.capacity,
    shipData.decks,
    shipData.imageUrl,
    shipData.description,
    shipData.deckPlansUrl,
  ]);

  return (
    <div className="space-y-2.5">
      {/* Ship Selector - Always show */}
      <ShipSelector
        label="Select Ship"
        selectedId={selectedShipId}
        onSelectionChange={handleShipSelection}
        onCreateNew={() => setShowCreateModal(true)}
        placeholder="Select an existing ship or add new"
        required
      />

      {/* Show loading state */}
      {isLoadingShip && (
        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-lg">
          <p className="text-white/60 text-sm">Loading ship details...</p>
        </div>
      )}

      {/* Show preview */}
      {!isLoadingShip && showPreview && (
        <ShipPreview
          key={refreshKey}
          shipData={shipData}
          shipId={selectedShipId}
          onEdit={() => setShowEditModal(true)}
        />
      )}

      {/* Ship Create Modal */}
      <ShipFormModal
        isOpen={showCreateModal}
        onOpenChange={setShowCreateModal}
        ship={null}
        onSuccess={newShip => {
          // Auto-select the newly created ship
          if (newShip && newShip.id) {
            setSelectedShipId(newShip.id);
            setShipId(newShip.id);
            updateShipData({
              name: newShip.name || '',
              cruiseLineId: newShip.cruiseLineId,
              cruiseLineName: newShip.cruiseLineName || '',
              capacity: newShip.capacity,
              decks: newShip.decks,
              imageUrl: newShip.imageUrl || '',
              description: newShip.description || '',
              deckPlansUrl: newShip.deckPlansUrl || '',
            });
          }
          queryClient.invalidateQueries({ queryKey: ['ships'] });
          setShowCreateModal(false);
        }}
      />

      {/* Ship Edit Modal */}
      <ShipFormModal
        isOpen={showEditModal}
        onOpenChange={setShowEditModal}
        ship={memoizedShip}
        onSuccess={updatedShip => {
          // Update local state with the new ship data
          if (updatedShip) {
            updateShipData({
              name: updatedShip.name || '',
              cruiseLineId: updatedShip.cruiseLineId,
              cruiseLineName: updatedShip.cruiseLineName || '',
              capacity: updatedShip.capacity,
              decks: updatedShip.decks,
              imageUrl: updatedShip.imageUrl || '',
              description: updatedShip.description || '',
              deckPlansUrl: updatedShip.deckPlansUrl || '',
            });
          }
          queryClient.invalidateQueries({ queryKey: ['ships'] });
          setRefreshKey(prev => prev + 1); // Force ShipPreview to refresh
          setShowEditModal(false);
        }}
      />
    </div>
  );
}
