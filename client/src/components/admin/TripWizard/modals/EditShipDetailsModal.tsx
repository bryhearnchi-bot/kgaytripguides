import { useState, useEffect } from 'react';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { AdminBottomSheet } from '@/components/admin/AdminBottomSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { StandardDropdown } from '@/components/ui/dropdowns';
import { Ship } from 'lucide-react';
import { api } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
    line-height: 1.375;
  }
  .admin-form-modal input::placeholder,
  .admin-form-modal textarea::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  .admin-form-modal input:focus,
  .admin-form-modal select:focus,
  .admin-form-modal textarea:focus {
    outline: none !important;
    border-color: rgba(34, 211, 238, 0.6) !important;
    background: rgba(34, 211, 238, 0.03) !important;
    box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.08) !important;
  }
`;

interface EditShipDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditShipDetailsModal({ open, onOpenChange }: EditShipDetailsModalProps) {
  const { state, updateShipData } = useTripWizard();
  const queryClient = useQueryClient();

  // Fetch cruise lines using React Query
  const { data: cruiseLines = [], isLoading: loadingCruiseLines } = useQuery<
    Array<{ id: number; name: string }>
  >({
    queryKey: ['cruise-lines'],
    queryFn: async () => {
      const response = await api.get('/api/admin/lookup-tables/cruise-lines');
      if (!response.ok) throw new Error('Failed to fetch cruise lines');
      const data = await response.json();
      return data.items || [];
    },
    enabled: open,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Local state for form
  const [formData, setFormData] = useState({
    name: state.shipData?.name || '',
    cruiseLineId: state.shipData?.cruiseLineId,
    cruiseLineName: state.shipData?.cruiseLineName || '',
    capacity: state.shipData?.capacity,
    decks: state.shipData?.decks,
    imageUrl: state.shipData?.imageUrl || '',
    description: state.shipData?.description || '',
    deckPlansUrl: state.shipData?.deckPlansUrl || '',
  });

  // Handle creating new cruise line
  const handleCreateCruiseLine = async (name: string) => {
    try {
      const response = await api.post('/api/admin/lookup-tables/cruise-lines', {
        name: name.trim(),
      });
      if (response.ok) {
        const newCruiseLine = await response.json();
        // Invalidate the query to refetch with the new cruise line
        queryClient.invalidateQueries({ queryKey: ['cruise-lines'] });
        const cruiseLineId = newCruiseLine.item?.id || newCruiseLine.id;
        const cruiseLineName = newCruiseLine.item?.name || newCruiseLine.name;
        setFormData(prev => ({ ...prev, cruiseLineId, cruiseLineName }));
        return { value: cruiseLineId.toString(), label: cruiseLineName };
      }
      throw new Error('Failed to create cruise line');
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error('Failed to create cruise line', { message: error.message });
      }
      throw error;
    }
  };

  useEffect(() => {
    if (open) {
      // Reset form data when modal opens
      setFormData({
        name: state.shipData?.name || '',
        cruiseLineId: state.shipData?.cruiseLineId,
        cruiseLineName: state.shipData?.cruiseLineName || '',
        capacity: state.shipData?.capacity,
        decks: state.shipData?.decks,
        imageUrl: state.shipData?.imageUrl || '',
        description: state.shipData?.description || '',
        deckPlansUrl: state.shipData?.deckPlansUrl || '',
      });
    }
  }, [open, state.shipData]);

  const handleInputChange = (field: string, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Update context with form data
    updateShipData(formData);
    onOpenChange(false);
  };

  return (
    <>
      <style>{modalFieldStyles}</style>
      <AdminBottomSheet
        isOpen={open}
        onOpenChange={onOpenChange}
        title="Edit Ship Information"
        description="Edit ship details"
        icon={<Ship className="h-5 w-5 text-white" />}
        onSubmit={e => {
          e.preventDefault();
          handleSave();
        }}
        primaryAction={{
          label: 'Save Changes',
          type: 'submit',
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => onOpenChange(false),
        }}
        maxWidthClassName="max-w-3xl"
      >
        <div className="space-y-2.5 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Left Column */}
            <div className="space-y-2.5">
              {/* Ship Name */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-white/90">
                  Ship Name <span className="text-cyan-400">*</span>
                </Label>
                <Input
                  placeholder="Enter ship name"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm transition-all focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
                />
              </div>

              {/* Cruise Line */}
              <div className="space-y-1">
                <StandardDropdown
                  variant="single-search-add"
                  label="Cruise Line"
                  placeholder="Select a cruise line"
                  searchPlaceholder="Search cruise lines..."
                  emptyMessage="No cruise lines found"
                  addLabel="Add New Cruise Line"
                  options={cruiseLines.map(cl => ({
                    value: cl.id.toString(),
                    label: cl.name,
                  }))}
                  value={formData.cruiseLineId?.toString() || ''}
                  onChange={value => {
                    const cruiseLineId = value ? Number(value) : undefined;
                    const selectedCruiseLine = cruiseLines.find(cl => cl.id === cruiseLineId);
                    setFormData(prev => ({
                      ...prev,
                      cruiseLineId,
                      cruiseLineName: selectedCruiseLine?.name || '',
                    }));
                  }}
                  onCreateNew={handleCreateCruiseLine}
                  disabled={loadingCruiseLines}
                  required={true}
                />
              </div>

              {/* Capacity and Decks Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Capacity */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-white/90">Capacity</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.capacity || ''}
                    onChange={e =>
                      handleInputChange(
                        'capacity',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm transition-all focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
                  />
                  <p className="text-[10px] text-white/50 mt-0.5">Maximum passengers</p>
                </div>

                {/* Number of Decks */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-white/90">Decks</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.decks || ''}
                    onChange={e =>
                      handleInputChange('decks', e.target.value ? parseInt(e.target.value) : null)
                    }
                    className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm transition-all focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
                  />
                  <p className="text-[10px] text-white/50 mt-0.5">Total number of decks</p>
                </div>
              </div>

              {/* Deck Plans URL */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-white/90">Deck Plans URL</Label>
                <Input
                  placeholder="https://example.com/deck-plans"
                  value={formData.deckPlansUrl}
                  onChange={e => handleInputChange('deckPlansUrl', e.target.value)}
                  className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm transition-all focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
                />
                <p className="text-[10px] text-white/50 mt-0.5">
                  Link to ship deck plans or layout
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-2.5">
              {/* Ship Image */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-white/90">Ship Image</Label>
                <ImageUploadField
                  label="Ship Image"
                  value={formData.imageUrl}
                  onChange={url => handleInputChange('imageUrl', url)}
                  imageType="ships"
                  placeholder="No ship image uploaded"
                />
                <p className="text-[10px] text-white/50 mt-0.5">High-quality image of the ship</p>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-white/90">
                  Description <span className="text-cyan-400">*</span>
                </Label>
                <Textarea
                  placeholder="Enter ship description..."
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  rows={7}
                  className="px-3 py-2 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm leading-snug transition-all resize-vertical focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
                />
                <p className="text-[10px] text-white/50 mt-0.5">
                  Describe the ship's features, amenities, and atmosphere
                </p>
              </div>
            </div>
          </div>
        </div>
      </AdminBottomSheet>
    </>
  );
}
