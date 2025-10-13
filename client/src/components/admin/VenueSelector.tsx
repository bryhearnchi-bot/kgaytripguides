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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

interface Venue {
  id: number;
  name: string;
  venueTypeId: number;
  venueTypeName?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface VenueType {
  id: number;
  name: string;
}

interface VenueSelectorProps {
  selectedIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
  disabled?: boolean;
  className?: string;
  menuVariant?: MultiSelectMenuVariant;
  wizardMode?: boolean; // When true, start with empty list and only show created venues
}

interface CreateVenueFormData {
  name: string;
  venueTypeId: string;
  description: string;
}

export function VenueSelector({
  selectedIds,
  onSelectionChange,
  disabled = false,
  className,
  menuVariant = 'compact',
  wizardMode = false,
}: VenueSelectorProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueTypes, setVenueTypes] = useState<VenueType[]>([]);
  const [loading, setLoading] = useState(!wizardMode); // Don't show loading in wizard mode
  const [error, setError] = useState<string | null>(null);

  // Create venue modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateVenueFormData>({
    name: '',
    venueTypeId: '',
    description: '',
  });
  const portalContainerRef = React.useRef<HTMLDivElement>(null);
  const fetchedVenueIdsRef = React.useRef<Set<number>>(new Set());

  const fetchData = async () => {
    // In wizard mode, only fetch venue types (venues are fetched on-demand via useEffect)
    if (wizardMode) {
      setLoading(false);
      try {
        // Fetch venue types for the create modal
        const venueTypesResponse = await api.get('/api/venue-types');
        if (!venueTypesResponse.ok) {
          throw new Error(`Failed to fetch venue types: ${venueTypesResponse.status}`);
        }
        const venueTypesData = await venueTypesResponse.json();
        setVenueTypes(venueTypesData);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch venue types');
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch venues and venue types in parallel
      const [venuesResponse, venueTypesResponse] = await Promise.all([
        api.get('/api/venues'),
        api.get('/api/venue-types'),
      ]);

      if (!venuesResponse.ok) {
        throw new Error(`Failed to fetch venues: ${venuesResponse.status}`);
      }
      if (!venueTypesResponse.ok) {
        throw new Error(`Failed to fetch venue types: ${venueTypesResponse.status}`);
      }

      const venuesData = await venuesResponse.json();
      const venueTypesData = await venueTypesResponse.json();

      setVenues(venuesData);
      setVenueTypes(venueTypesData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVenue = async (name: string) => {
    // Open the modal with the name pre-filled
    setCreateForm({
      name: name.trim(),
      venueTypeId: '',
      description: '',
    });
    setShowCreateModal(true);
  };

  const submitCreateVenue = async () => {
    if (!createForm.name.trim() || !createForm.venueTypeId) {
      return;
    }

    try {
      setCreating(true);
      const response = await api.post('/api/venues', {
        name: createForm.name.trim(),
        venueTypeId: parseInt(createForm.venueTypeId),
        description: createForm.description.trim() || null,
      });

      if (!response.ok) {
        throw new Error(`Failed to create venue: ${response.status}`);
      }

      const newVenue = await response.json();

      // Add the new venue to the list
      setVenues(prev => [...prev, newVenue]);

      // Mark this venue as fetched
      fetchedVenueIdsRef.current.add(newVenue.id);

      // Auto-select the newly created venue
      onSelectionChange([...selectedIds, newVenue.id]);

      // Reset form and close modal
      setCreateForm({ name: '', venueTypeId: '', description: '' });
      setShowCreateModal(false);
    } catch (error) {
      // You could show an error toast here
    } finally {
      setCreating(false);
    }
  };

  const cancelCreateVenue = () => {
    setCreateForm({ name: '', venueTypeId: '', description: '' });
    setShowCreateModal(false);
  };

  useEffect(() => {
    fetchData();
  }, []); // Only fetch on mount

  // When in wizard mode and selectedIds change (e.g., from draft restoration),
  // ensure those venues are in the list
  useEffect(() => {
    if (wizardMode && selectedIds.length > 0) {
      // Check if we need to fetch any venues we haven't fetched yet
      const missingIds = selectedIds.filter(id => !fetchedVenueIdsRef.current.has(id));

      if (missingIds.length > 0) {
        // Fetch all venues and filter to the ones we need
        api.get('/api/venues').then(async response => {
          if (response.ok) {
            const allVenues = await response.json();
            const missingVenues = allVenues.filter((v: Venue) => missingIds.includes(v.id));
            if (missingVenues.length > 0) {
              setVenues(prev => [...prev, ...missingVenues]);
              // Mark these IDs as fetched
              missingVenues.forEach((v: Venue) => fetchedVenueIdsRef.current.add(v.id));
            }
          }
        });
      }
    }
  }, [selectedIds, wizardMode]);

  // Convert venues to MultiSelectItem format with venue type info
  const items: MultiSelectItem[] = venues.map(venue => ({
    id: venue.id,
    name: venue.name,
    description: venue.venueTypeName,
  }));

  // Custom render function for venue items
  const renderVenueItem = (item: MultiSelectItem) => {
    const venue = venues.find(v => v.id === item.id);
    return (
      <div className="font-medium text-white truncate">
        {item.name}
        {venue?.venueTypeName && (
          <span className="text-sm text-white/60 ml-2">• {venue.venueTypeName}</span>
        )}
      </div>
    );
  };

  // Show error state
  if (error) {
    return (
      <div className={`rounded-md border border-red-200 bg-red-50 p-4 ${className}`}>
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading venues</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchData}
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
        onCreate={handleCreateVenue}
        renderItem={renderVenueItem}
        placeholder="Select venues..."
        createButtonText="Create Venue"
        searchPlaceholder="Search venues..."
        disabled={disabled}
        loading={loading}
        menuVariant={menuVariant}
        displaySelectedBelow={true}
        maxItems={99}
        container={portalContainerRef.current ?? undefined}
      />
      {loading && <p className="mt-2 text-sm text-gray-500">Loading venues...</p>}

      {/* Create Venue Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="admin-form-modal sm:max-w-md border-white/10 bg-gradient-to-b from-[#10192f] to-[#0f1629] rounded-[20px] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Venue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Venue Name *</label>
              <OceanInput
                placeholder="Enter venue name"
                value={createForm.name}
                onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                disabled={creating}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Venue Type *</label>
              <Select
                value={createForm.venueTypeId}
                onValueChange={value => setCreateForm(prev => ({ ...prev, venueTypeId: value }))}
                disabled={creating}
              >
                <SelectTrigger className="w-full h-10 px-3 font-normal bg-white/[0.04] border border-white/10 rounded-[10px] text-white text-sm hover:bg-white/[0.06] hover:border-white/10 transition-all focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:border-cyan-400/60 focus-visible:bg-cyan-400/[0.03] focus-visible:shadow-[0_0_0_3px_rgba(34,211,238,0.08)] disabled:opacity-40 disabled:cursor-not-allowed data-[placeholder]:text-white/50">
                  <SelectValue placeholder="Select venue type" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a1628] border border-white/10 shadow-xl p-1">
                  {venueTypes.map(type => (
                    <SelectItem
                      key={type.id}
                      value={type.id.toString()}
                      className="px-3 py-2.5 cursor-pointer rounded-md transition-colors text-white/90 hover:bg-cyan-400/10 hover:text-white focus:bg-cyan-400/10 focus:text-white data-[state=checked]:bg-cyan-400/10 data-[state=checked]:text-white"
                    >
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Description (Optional)</label>
              <OceanTextarea
                placeholder="Enter venue description"
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
              onClick={cancelCreateVenue}
              disabled={creating}
              className="h-9 px-4 bg-white/4 border-[1.5px] border-white/10 text-white/75 hover:bg-white/8 hover:text-white/90 hover:border-white/20 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitCreateVenue}
              disabled={creating || !createForm.name.trim() || !createForm.venueTypeId}
              className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create Venue'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
