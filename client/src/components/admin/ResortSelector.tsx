import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { AlertCircle, Check, ChevronDown, Plus, XIcon, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LocationSelector } from './LocationSelector';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

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

interface Resort {
  id: number;
  name: string;
  location: string;
  locationId?: number;
  city?: string;
  stateProvince?: string;
  country?: string;
  countryCode?: string;
  capacity?: number;
  numberOfRooms?: number;
  imageUrl?: string;
  propertyMapUrl?: string;
  checkInTime?: string;
  checkOutTime?: string;
  description?: string;
}

interface ResortSelectorProps {
  selectedId?: number | null;
  onSelectionChange: (resortId: number | null, resortData?: Resort) => void;
  onCreateNew?: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

interface CreateResortFormData {
  name: string;
  locationId: number | null;
  capacity: string;
  numberOfRooms: string;
  checkInTime: string;
  checkOutTime: string;
  imageUrl: string;
  propertyMapUrl: string;
  description: string;
}

export function ResortSelector({
  selectedId,
  onSelectionChange,
  onCreateNew,
  disabled = false,
  className,
  label = 'Resort',
  placeholder = 'Select a resort or add new',
  required = false,
}: ResortSelectorProps) {
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const portalContainerRef = React.useRef<HTMLDivElement>(null);

  // Create resort modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateResortFormData>({
    name: '',
    locationId: null,
    capacity: '',
    numberOfRooms: '',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    imageUrl: '',
    propertyMapUrl: '',
    description: '',
  });

  const fetchResorts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/resorts');

      if (!response.ok) {
        throw new Error(`Failed to fetch resorts: ${response.status}`);
      }

      const data = await response.json();
      setResorts(data);
    } catch (error) {
      console.error('Error fetching resorts:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch resorts');
    } finally {
      setLoading(false);
    }
  };

  const submitCreateResort = async () => {
    if (!createForm.name.trim() || !createForm.locationId) {
      return;
    }

    try {
      setCreating(true);
      const response = await api.post('/api/resorts', {
        name: createForm.name.trim(),
        locationId: createForm.locationId,
        capacity: createForm.capacity ? parseInt(createForm.capacity) : null,
        numberOfRooms: createForm.numberOfRooms ? parseInt(createForm.numberOfRooms) : null,
        checkInTime: createForm.checkInTime || null,
        checkOutTime: createForm.checkOutTime || null,
        imageUrl: createForm.imageUrl.trim() || null,
        propertyMapUrl: createForm.propertyMapUrl.trim() || null,
        description: createForm.description.trim() || null,
      });

      if (!response.ok) {
        throw new Error(`Failed to create resort: ${response.status}`);
      }

      const newResort = await response.json();

      // Add the new resort to the list
      setResorts(prev => [...prev, newResort]);

      // Auto-select the newly created resort and pass full resort data
      onSelectionChange(newResort.id, newResort);

      // Reset form and close modal
      setCreateForm({
        name: '',
        locationId: null,
        capacity: '',
        numberOfRooms: '',
        checkInTime: '15:00',
        checkOutTime: '11:00',
        imageUrl: '',
        propertyMapUrl: '',
        description: '',
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating resort:', error);
    } finally {
      setCreating(false);
    }
  };

  const cancelCreateResort = () => {
    setCreateForm({
      name: '',
      locationId: null,
      capacity: '',
      numberOfRooms: '',
      checkInTime: '15:00',
      checkOutTime: '11:00',
      imageUrl: '',
      propertyMapUrl: '',
      description: '',
    });
    setShowCreateModal(false);
  };

  const handleCreateNew = () => {
    setIsPopoverOpen(false);
    if (onCreateNew) {
      onCreateNew();
    } else {
      // Fallback to built-in modal if no callback provided
      setShowCreateModal(true);
    }
  };

  const selectResort = (resort: Resort) => {
    if (disabled) return;
    onSelectionChange(resort.id, resort);
    setIsPopoverOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onSelectionChange(null);
  };

  useEffect(() => {
    fetchResorts();
  }, []);

  useEffect(() => {
    if (!isPopoverOpen) {
      setSearchValue('');
    }
  }, [isPopoverOpen]);

  // Get selected resort
  const selectedResort = resorts.find(resort => resort.id === selectedId);

  // Build display description for each resort
  const getResortDescription = (resort: Resort) => {
    const parts = [];
    if (resort.city) parts.push(resort.city);
    if (resort.country) parts.push(resort.country);
    return parts.join(', ') || resort.location || '';
  };

  // Filter resorts based on search
  const filteredResorts = React.useMemo(() => {
    if (!searchValue) return resorts;
    const search = searchValue.toLowerCase();
    return resorts.filter(
      resort =>
        resort.name.toLowerCase().includes(search) ||
        resort.location?.toLowerCase().includes(search) ||
        resort.city?.toLowerCase().includes(search) ||
        resort.country?.toLowerCase().includes(search)
    );
  }, [resorts, searchValue]);

  // Show error state
  if (error) {
    return (
      <div className={`rounded-md border border-red-200 bg-red-50 p-4 ${className}`}>
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading resorts</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchResorts}
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
    <div className={className} ref={portalContainerRef}>
      <style>{modalFieldStyles}</style>
      {label && (
        <Label className="text-xs font-semibold text-white/90 mb-1 block">
          {label} {required && <span className="text-cyan-400">*</span>}
        </Label>
      )}

      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
            disabled={disabled || loading}
            role="combobox"
            aria-expanded={isPopoverOpen}
            className={cn(
              'flex p-2 rounded-[10px] border min-h-[40px] h-auto items-center justify-between',
              'bg-white/[0.04] border border-white/10 hover:bg-white/[0.06]',
              'transition-all duration-200 w-full text-left',
              'focus-visible:outline-none focus-visible:border-cyan-400/60',
              'focus-visible:bg-cyan-400/[0.03]',
              'focus-visible:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]',
              disabled && 'opacity-40 cursor-not-allowed'
            )}
          >
            {selectedResort ? (
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-white truncate">
                  <span className="font-medium">{selectedResort.name}</span>
                  <span className="text-white/60 ml-2">
                    • {getResortDescription(selectedResort)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <XIcon
                    className="h-4 w-4 text-white/60 hover:text-white/80 cursor-pointer"
                    onClick={handleClear}
                  />
                  <Separator orientation="vertical" className="h-4" />
                  <ChevronDown className="h-4 w-4 text-white/60" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-white/40">
                  {loading ? 'Loading resorts...' : placeholder}
                </span>
                <ChevronDown className="h-4 w-4 text-white/60" />
              </div>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          container={portalContainerRef.current ?? undefined}
          className={cn(
            'w-[--radix-popover-trigger-width] p-0',
            'bg-[#0a1628]',
            'border border-white/10 rounded-[10px] shadow-xl'
          )}
          align="start"
          sideOffset={4}
        >
          <Command className="bg-transparent">
            <CommandInput
              placeholder="Search resorts..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList className="max-h-[200px] overflow-y-auto">
              <CommandEmpty className="text-white/40 py-4">No resorts found.</CommandEmpty>

              {/* Add New Resort Option */}
              <CommandGroup>
                <CommandItem
                  onSelect={handleCreateNew}
                  className={cn(
                    'cursor-pointer text-cyan-400 hover:bg-cyan-400/10 data-[selected=true]:bg-cyan-400/10 data-[selected=true]:text-cyan-400'
                  )}
                >
                  <div className="mr-2 flex h-4 w-4 items-center justify-center">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span>Add New Resort</span>
                </CommandItem>
              </CommandGroup>

              {/* Resort List */}
              {filteredResorts.length > 0 && (
                <CommandGroup>
                  {filteredResorts.map(resort => {
                    const isSelected = resort.id === selectedId;
                    return (
                      <CommandItem
                        key={resort.id}
                        onSelect={() => selectResort(resort)}
                        className="cursor-pointer text-white/80 hover:bg-cyan-400/10 data-[selected=true]:bg-cyan-400/10 data-[selected=true]:text-white"
                      >
                        <div
                          className={cn(
                            'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                            isSelected
                              ? 'bg-cyan-400 border-cyan-400 text-white'
                              : 'border-white/30'
                          )}
                        >
                          <Check className={cn('h-3 w-3', isSelected ? '' : 'invisible')} />
                        </div>
                        <div>
                          <div className="font-medium text-white">{resort.name}</div>
                          <div className="text-xs text-white/60 mt-0.5">
                            {getResortDescription(resort)}
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {/* Footer Actions */}
              <CommandGroup>
                <div className="flex items-center justify-between">
                  {selectedId && (
                    <>
                      <CommandItem
                        onSelect={() => {
                          onSelectionChange(null);
                          setIsPopoverOpen(false);
                        }}
                        className="flex-1 justify-center cursor-pointer text-white/60 hover:text-white"
                      >
                        Clear
                      </CommandItem>
                      <Separator orientation="vertical" className="h-6" />
                    </>
                  )}
                  <CommandItem
                    onSelect={() => setIsPopoverOpen(false)}
                    className="flex-1 justify-center cursor-pointer text-white/60 hover:text-white"
                  >
                    Close
                  </CommandItem>
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Create Resort Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="admin-form-modal sm:max-w-lg border-white/10 bg-gradient-to-b from-[#10192f] to-[#0f1629] rounded-[20px] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Resort</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Resort Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Resort Name *</label>
              <Input
                placeholder="Enter resort name"
                value={createForm.name}
                onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                disabled={creating}
                className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm"
              />
            </div>

            {/* Location */}
            <LocationSelector
              label="Location"
              selectedId={createForm.locationId}
              onSelectionChange={locationId => setCreateForm(prev => ({ ...prev, locationId }))}
              required
              wizardMode={true}
            />

            {/* Capacity and Rooms Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/90">Capacity</label>
                <Input
                  type="number"
                  placeholder="Max guests"
                  value={createForm.capacity}
                  onChange={e => setCreateForm(prev => ({ ...prev, capacity: e.target.value }))}
                  disabled={creating}
                  className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/90">Rooms</label>
                <Input
                  type="number"
                  placeholder="Number of rooms"
                  value={createForm.numberOfRooms}
                  onChange={e =>
                    setCreateForm(prev => ({ ...prev, numberOfRooms: e.target.value }))
                  }
                  disabled={creating}
                  className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm"
                />
              </div>
            </div>

            {/* Check-in and Check-out Times */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/90">Check-in Time</label>
                <Input
                  type="time"
                  value={createForm.checkInTime}
                  onChange={e => setCreateForm(prev => ({ ...prev, checkInTime: e.target.value }))}
                  disabled={creating}
                  className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/90">Check-out Time</label>
                <Input
                  type="time"
                  value={createForm.checkOutTime}
                  onChange={e => setCreateForm(prev => ({ ...prev, checkOutTime: e.target.value }))}
                  disabled={creating}
                  className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Description</label>
              <Textarea
                placeholder="Enter resort description..."
                value={createForm.description}
                onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                disabled={creating}
                rows={3}
                className="px-3 py-2 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={cancelCreateResort}
              disabled={creating}
              className="h-9 px-4 bg-white/4 border-[1.5px] border-white/10 text-white/75 hover:bg-white/8 hover:text-white/90 hover:border-white/20 rounded-lg transition-all"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitCreateResort}
              disabled={creating || !createForm.name.trim() || !createForm.locationId}
              className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-all"
            >
              {creating ? 'Creating...' : 'Add Resort'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
