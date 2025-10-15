import { useState, useEffect } from 'react';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUploadField } from '@/components/admin/ImageUploadField';

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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="admin-form-modal sm:max-w-3xl border-white/10 bg-gradient-to-b from-[#10192f] to-[#0f1629] rounded-[20px] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Ship Information</DialogTitle>
          </DialogHeader>

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
                  <Label className="text-xs font-semibold text-white/90">
                    Cruise Line <span className="text-cyan-400">*</span>
                  </Label>
                  <Input
                    placeholder="Enter cruise line"
                    value={formData.cruiseLineName}
                    onChange={e => handleInputChange('cruiseLineName', e.target.value)}
                    className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm transition-all focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
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
                          e.target.value ? parseInt(e.target.value) : undefined
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
                        handleInputChange(
                          'decks',
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
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

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 bg-white/4 border-[1.5px] border-white/10 text-white/75 hover:bg-white/8 hover:text-white/90 hover:border-white/20 rounded-lg transition-all"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-all"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
