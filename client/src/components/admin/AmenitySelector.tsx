import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import {
  MultiSelectWithCreate,
  MultiSelectItem,
  type MultiSelectMenuVariant,
} from './MultiSelectWithCreate';
import { AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { OceanInput } from '@/components/ui/ocean-input';
import { OceanTextarea } from '@/components/ui/ocean-textarea';

// Trip Wizard style guide for modal inputs
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
    font-family: inherit;
    line-height: 1.375;
  }
  .admin-form-modal input::placeholder,
  .admin-form-modal textarea::placeholder,
  .admin-form-modal select::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  .admin-form-modal input:focus,
  .admin-form-modal select:focus,
  .admin-form-modal textarea:focus {
    outline: none !important;
    border-color: rgba(34, 211, 238, 0.6) !important;
    background: rgba(34, 211, 238, 0.03) !important;
    box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.08) !important;
    --tw-ring-offset-width: 0px !important;
    --tw-ring-width: 0px !important;
  }
  .admin-form-modal label {
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 4px;
    display: block;
  }
`;

interface Amenity {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AmenitySelectorProps {
  selectedIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
  disabled?: boolean;
  className?: string;
  menuVariant?: MultiSelectMenuVariant;
  wizardMode?: boolean; // When true, start with empty list and only show created amenities
}

interface CreateAmenityFormData {
  name: string;
  description: string;
}

export function AmenitySelector({
  selectedIds,
  onSelectionChange,
  disabled = false,
  className,
  menuVariant = 'compact',
  wizardMode = false,
}: AmenitySelectorProps) {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(!wizardMode); // Don't show loading in wizard mode
  const [error, setError] = useState<string | null>(null);
  const portalContainerRef = React.useRef<HTMLDivElement>(null);

  // Create amenity modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAmenityFormData>({
    name: '',
    description: '',
  });

  const fetchAmenities = async () => {
    // In wizard mode, don't fetch amenities from API - start with empty list
    if (wizardMode) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/amenities');

      if (!response.ok) {
        throw new Error(`Failed to fetch amenities: ${response.status}`);
      }

      const data = await response.json();
      setAmenities(data);
    } catch (error) {
      console.error('Error fetching amenities:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch amenities');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAmenity = async (name: string) => {
    // Open the modal with the name pre-filled
    setCreateForm({
      name: name.trim(),
      description: '',
    });
    setShowCreateModal(true);
  };

  const submitCreateAmenity = async () => {
    if (!createForm.name.trim()) {
      return;
    }

    try {
      setCreating(true);
      const response = await api.post('/api/amenities', {
        name: createForm.name.trim(),
        description: createForm.description.trim() || null,
      });

      if (!response.ok) {
        throw new Error(`Failed to create amenity: ${response.status}`);
      }

      const newAmenity = await response.json();

      // Add the new amenity to the list
      setAmenities(prev => [...prev, newAmenity]);

      // Auto-select the newly created amenity
      onSelectionChange([...selectedIds, newAmenity.id]);

      // Reset form and close modal
      setCreateForm({ name: '', description: '' });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating amenity:', error);
      // You could show an error toast here
    } finally {
      setCreating(false);
    }
  };

  const cancelCreateAmenity = () => {
    setCreateForm({ name: '', description: '' });
    setShowCreateModal(false);
  };

  useEffect(() => {
    fetchAmenities();
  }, []);

  // Convert amenities to MultiSelectItem format
  const items: MultiSelectItem[] = amenities.map(amenity => ({
    id: amenity.id,
    name: amenity.name,
    description: amenity.description,
  }));

  // Custom render function for amenity items
  const renderAmenityItem = (item: MultiSelectItem) => (
    <div className="font-medium text-white truncate">{item.name}</div>
  );

  // Show error state
  if (error) {
    return (
      <div className={`rounded-md border border-red-200 bg-red-50 p-4 ${className}`}>
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading amenities</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchAmenities}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Type conversion wrapper for onSelectionChange
  const handleSelectionChange = (selectedIds: (number | string)[]) => {
    onSelectionChange(selectedIds as number[]);
  };

  return (
    <div className={className} ref={portalContainerRef}>
      <style>{modalFieldStyles}</style>
      <MultiSelectWithCreate
        items={items}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        onCreate={handleCreateAmenity}
        renderItem={renderAmenityItem}
        placeholder="Select amenities..."
        createButtonText="Create Amenity"
        searchPlaceholder="Search amenities..."
        disabled={disabled}
        loading={loading}
        menuVariant={menuVariant}
        displaySelectedBelow={true}
        maxItems={99}
        container={portalContainerRef.current ?? undefined}
      />
      {loading && <p className="mt-2 text-sm text-gray-500">Loading amenities...</p>}

      {/* Create Amenity Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="admin-form-modal sm:max-w-md border-white/10 bg-gradient-to-b from-[#10192f] to-[#0f1629] rounded-[20px] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Amenity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Amenity Name *</label>
              <OceanInput
                placeholder="Enter amenity name"
                value={createForm.name}
                onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                disabled={creating}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Description (Optional)</label>
              <OceanTextarea
                placeholder="Enter amenity description"
                value={createForm.description}
                onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                disabled={creating}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={cancelCreateAmenity}
              disabled={creating}
              className="h-9 px-4 bg-white/4 border-[1.5px] border-white/10 text-white/75 hover:bg-white/8 hover:text-white/90 hover:border-white/20 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitCreateAmenity}
              disabled={creating || !createForm.name.trim()}
              className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create Amenity'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
