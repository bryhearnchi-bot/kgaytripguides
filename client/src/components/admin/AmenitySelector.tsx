import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { StandardDropdown } from '@/components/ui/dropdowns';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ADMIN_MODAL_FIELD_STYLES } from '@/lib/adminStyles';

interface Amenity {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AmenitySelectorProps {
  selectedIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
  disabled?: boolean;
  className?: string;
  wizardMode?: boolean; // When true, start with empty list and only show created amenities
}

export function AmenitySelector({
  selectedIds,
  onSelectionChange,
  disabled = false,
  className,
  wizardMode = false,
}: AmenitySelectorProps) {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(!wizardMode); // Don't show loading in wizard mode
  const [error, setError] = useState<string | null>(null);
  const fetchedAmenityIdsRef = React.useRef<Set<number>>(new Set());

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
      setError(error instanceof Error ? error.message : 'Failed to fetch amenities');
    } finally {
      setLoading(false);
    }
  };

  // Create amenity handler for StandardDropdown
  const handleCreateAmenity = async (name: string): Promise<{ value: string; label: string }> => {
    try {
      const response = await api.post(
        '/api/amenities',
        {
          name: name.trim(),
        },
        { requireAuth: true }
      );

      if (!response.ok) {
        throw new Error(`Failed to create amenity: ${response.status}`);
      }

      const newAmenity = await response.json();

      // Add the new amenity to the list
      setAmenities(prev => [...prev, newAmenity]);

      // Mark this amenity as fetched
      fetchedAmenityIdsRef.current.add(newAmenity.id);

      // Auto-select the newly created amenity
      onSelectionChange([...selectedIds, newAmenity.id]);

      return { value: newAmenity.id.toString(), label: newAmenity.name };
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to create amenity',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchAmenities();
  }, []); // Only fetch on mount

  // When in wizard mode and selectedIds change (e.g., from draft restoration),
  // ensure those amenities are in the list
  useEffect(() => {
    if (wizardMode && selectedIds.length > 0) {
      // Check if we need to fetch any amenities we haven't fetched yet
      const missingIds = selectedIds.filter(id => !fetchedAmenityIdsRef.current.has(id));

      if (missingIds.length > 0) {
        // Fetch all amenities and filter to the ones we need
        api.get('/api/amenities').then(async response => {
          if (response.ok) {
            const allAmenities = await response.json();
            const missingAmenities = allAmenities.filter((a: Amenity) => missingIds.includes(a.id));
            if (missingAmenities.length > 0) {
              setAmenities(prev => [...prev, ...missingAmenities]);
              // Mark these IDs as fetched
              missingAmenities.forEach((a: Amenity) => fetchedAmenityIdsRef.current.add(a.id));
            }
          }
        });
      }
    }
  }, [selectedIds, wizardMode]);

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

  return (
    <div className={className}>
      <style>{ADMIN_MODAL_FIELD_STYLES}</style>
      <StandardDropdown
        variant="multi-search-add"
        placeholder="Select amenities..."
        searchPlaceholder="Search amenities..."
        emptyMessage="No amenities found"
        addLabel="Add New Amenity"
        options={amenities.map(amenity => ({
          value: amenity.id.toString(),
          label: amenity.name,
        }))}
        value={selectedIds.map(id => id.toString())}
        onChange={value => {
          const ids = (value as string[]).map(id => Number(id));
          onSelectionChange(ids);
        }}
        onCreateNew={handleCreateAmenity}
        disabled={disabled || loading}
      />
      {loading && <p className="mt-2 text-sm text-white/60">Loading amenities...</p>}
    </div>
  );
}
