import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { MultiSelectWithCreate, MultiSelectItem } from './MultiSelectWithCreate';
import { AlertCircle } from 'lucide-react';

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
}

export function AmenitySelector({
  selectedIds,
  onSelectionChange,
  disabled = false,
  className,
}: AmenitySelectorProps) {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAmenities = async () => {
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

  const createAmenity = async (name: string) => {
    try {
      const response = await api.post('/api/amenities', {
        name: name.trim(),
        description: null
      });

      if (!response.ok) {
        throw new Error(`Failed to create amenity: ${response.status}`);
      }

      const newAmenity = await response.json();

      // Add the new amenity to the list
      setAmenities(prev => [...prev, newAmenity]);

      // Auto-select the newly created amenity
      onSelectionChange([...selectedIds, newAmenity.id]);
    } catch (error) {
      console.error('Error creating amenity:', error);
      throw error; // Re-throw to let MultiSelectWithCreate handle the error state
    }
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
    <div>
      <div className="font-medium text-gray-900">{item.name}</div>
      {item.description && (
        <div className="text-sm text-gray-500">{item.description}</div>
      )}
    </div>
  );

  // Show error state
  if (error) {
    return (
      <div className={`rounded-md border border-red-200 bg-red-50 p-4 ${className}`}>
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading amenities
            </h3>
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
    <div className={className}>
      <MultiSelectWithCreate
        items={items}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        onCreate={createAmenity}
        renderItem={renderAmenityItem}
        placeholder="Select amenities..."
        createButtonText="Create Amenity"
        searchPlaceholder="Search amenities..."
        disabled={disabled}
        loading={loading}
      />
      {loading && (
        <p className="mt-2 text-sm text-gray-500">Loading amenities...</p>
      )}
    </div>
  );
}