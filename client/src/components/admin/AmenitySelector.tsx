import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { StandardDropdown } from '@/components/ui/dropdowns';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

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
      const response = await api.post('/api/amenities', {
        name: name.trim(),
      });

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
      <style>{modalFieldStyles}</style>
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
