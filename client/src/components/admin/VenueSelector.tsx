import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { MultiSelectWithCreate, MultiSelectItem } from './MultiSelectWithCreate';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
}: VenueSelectorProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueTypes, setVenueTypes] = useState<VenueType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create venue modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateVenueFormData>({
    name: '',
    venueTypeId: '',
    description: '',
  });

  const fetchData = async () => {
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
      console.error('Error fetching data:', error);
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

      // Auto-select the newly created venue
      onSelectionChange([...selectedIds, newVenue.id]);

      // Reset form and close modal
      setCreateForm({ name: '', venueTypeId: '', description: '' });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating venue:', error);
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
  }, []);

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
      <div>
        <div className="font-medium text-gray-900">{item.name}</div>
        <div className="text-sm text-gray-500">
          {venue?.venueTypeName}
          {venue?.description && ` • ${venue.description}`}
        </div>
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
            <h3 className="text-sm font-medium text-red-800">
              Error loading venues
            </h3>
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
    <div className={className}>
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
      />
      {loading && (
        <p className="mt-2 text-sm text-gray-500">Loading venues...</p>
      )}

      {/* Create Venue Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Venue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Venue Name *
              </label>
              <Input
                placeholder="Enter venue name"
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Venue Type *
              </label>
              <Select
                value={createForm.venueTypeId}
                onValueChange={(value) => setCreateForm(prev => ({ ...prev, venueTypeId: value }))}
                disabled={creating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select venue type" />
                </SelectTrigger>
                <SelectContent>
                  {venueTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <Textarea
                placeholder="Enter venue description"
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                disabled={creating}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={cancelCreateVenue}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={submitCreateVenue}
              disabled={creating || !createForm.name.trim() || !createForm.venueTypeId}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {creating ? 'Creating...' : 'Create Venue'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}