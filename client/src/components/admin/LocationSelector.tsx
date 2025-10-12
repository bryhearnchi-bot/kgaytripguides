import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { AlertCircle, Check, ChevronDown, Plus, XIcon } from 'lucide-react';
import { useLocations } from '@/contexts/LocationsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { OceanInput } from '@/components/ui/ocean-input';
import { OceanTextarea } from '@/components/ui/ocean-textarea';
import { LocationSearchBar } from './LocationSearchBar';
import { type LocationData } from '@/lib/location-service';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
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

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    background: rgba(255, 255, 255, 0.05);
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.5);
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.7);
  }
`;

interface Location {
  id: number;
  name: string;
  city?: string;
  stateProvince?: string;
  country: string;
  countryCode?: string;
  description?: string;
  imageUrl?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface LocationSelectorProps {
  selectedId?: number | null;
  onSelectionChange: (locationId: number | null) => void;
  disabled?: boolean;
  className?: string;
  wizardMode?: boolean;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

interface CreateLocationFormData {
  name: string;
  city: string;
  stateProvince: string;
  country: string;
  countryCode: string;
  description: string;
  location: string;
}

export function LocationSelector({
  selectedId,
  onSelectionChange,
  disabled = false,
  className,
  wizardMode = false,
  label = 'Location',
  placeholder = 'Select a location',
  required = false,
}: LocationSelectorProps) {
  // Use shared locations context to avoid multiple API calls
  const { locations: contextLocations, loading, error, refetch } = useLocations();
  const [locations, setLocations] = useState<Location[]>(contextLocations);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const portalContainerRef = React.useRef<HTMLDivElement>(null);

  // Create location modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateLocationFormData>({
    name: '',
    city: '',
    stateProvince: '',
    country: '',
    countryCode: '',
    description: '',
    location: '',
  });

  // Update local locations when context locations change
  useEffect(() => {
    setLocations(contextLocations);
  }, [contextLocations]);

  const handlePhotonLocationSelect = (locationData: Partial<LocationData>) => {
    // Auto-fill form from Photon API data
    setCreateForm(prev => ({
      ...prev,
      name: locationData.formatted || prev.name,
      city: locationData.city || prev.city,
      stateProvince: locationData.state || prev.stateProvince,
      country: locationData.country || prev.country,
      countryCode: locationData.countryCode || prev.countryCode,
      location: locationData.formatted || prev.location,
    }));
  };

  const submitCreateLocation = async () => {
    if (!createForm.name.trim() || !createForm.country.trim()) {
      return;
    }

    try {
      setCreating(true);
      const response = await api.post('/api/locations', {
        name: createForm.name.trim(),
        city: createForm.city.trim() || null,
        stateProvince: createForm.stateProvince.trim() || null,
        country: createForm.country.trim(),
        countryCode: createForm.countryCode.trim() || null,
        description: createForm.description.trim() || null,
        location: createForm.location.trim() || null,
      });

      if (!response.ok) {
        throw new Error(`Failed to create location: ${response.status}`);
      }

      const newLocation = await response.json();

      // Add the new location to the list
      setLocations(prev => [...prev, newLocation]);

      // Auto-select the newly created location
      onSelectionChange(newLocation.id);

      // Reset form and close modal
      setCreateForm({
        name: '',
        city: '',
        stateProvince: '',
        country: '',
        countryCode: '',
        description: '',
        location: '',
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating location:', error);
    } finally {
      setCreating(false);
    }
  };

  const cancelCreateLocation = () => {
    setCreateForm({
      name: '',
      city: '',
      stateProvince: '',
      country: '',
      countryCode: '',
      description: '',
      location: '',
    });
    setShowCreateModal(false);
  };

  const handleCreateNew = () => {
    // Open the modal instead of inline create
    setShowCreateModal(true);
    setIsPopoverOpen(false);
  };

  const selectLocation = (locationId: number) => {
    if (disabled) return;
    onSelectionChange(locationId);
    setIsPopoverOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onSelectionChange(null);
  };

  useEffect(() => {
    if (!isPopoverOpen) {
      setSearchValue('');
    }
  }, [isPopoverOpen]);

  // Get selected location
  const selectedLocation = locations.find(loc => loc.id === selectedId);

  // Build display description for each location
  const getLocationDescription = (location: Location) => {
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.stateProvince) parts.push(location.stateProvince);
    parts.push(location.country);
    return parts.join(', ');
  };

  // Filter locations based on search
  const filteredLocations = React.useMemo(() => {
    if (!searchValue) return locations;
    const search = searchValue.toLowerCase();
    return locations.filter(
      loc =>
        loc.name.toLowerCase().includes(search) ||
        loc.city?.toLowerCase().includes(search) ||
        loc.stateProvince?.toLowerCase().includes(search) ||
        loc.country.toLowerCase().includes(search)
    );
  }, [locations, searchValue]);

  // Show error state
  if (error) {
    return (
      <div className={`rounded-md border border-red-200 bg-red-50 p-4 ${className}`}>
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading locations</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={refetch}
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
      <style>{scrollbarStyles}</style>

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
            {selectedLocation ? (
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-white truncate">
                  <span className="font-medium">{selectedLocation.name}</span>
                  <span className="text-white/60 ml-2">
                    • {getLocationDescription(selectedLocation)}
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
                  {loading ? 'Loading locations...' : placeholder}
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
              placeholder="Search locations..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar">
              <CommandEmpty className="text-white/40 py-4">No locations found.</CommandEmpty>

              {/* Add New Location Option */}
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
                  <span>Add New Location</span>
                </CommandItem>
              </CommandGroup>

              {/* Location List */}
              {filteredLocations.length > 0 && (
                <CommandGroup>
                  {filteredLocations.map(location => {
                    const isSelected = location.id === selectedId;
                    return (
                      <CommandItem
                        key={location.id}
                        onSelect={() => selectLocation(location.id)}
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
                          <div className="font-medium text-white">{location.name}</div>
                          <div className="text-xs text-white/60 mt-0.5">
                            {getLocationDescription(location)}
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

      {/* Create Location Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="admin-form-modal sm:max-w-lg border-white/10 bg-gradient-to-b from-[#10192f] to-[#0f1629] rounded-[20px] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Photon API Search */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">
                Search for Location (Optional)
              </label>
              <LocationSearchBar
                placeholder="Search city, state, or country..."
                onChange={handlePhotonLocationSelect}
                className="w-full"
              />
              <p className="text-[10px] text-white/50 mt-0.5">
                Search to auto-fill location details from global database
              </p>
            </div>

            <div className="border-t border-white/10 my-4"></div>

            {/* Manual Input Fields */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Location Name *</label>
              <OceanInput
                placeholder="Enter location name"
                value={createForm.name}
                onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                disabled={creating}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/90">City</label>
                <OceanInput
                  placeholder="Enter city"
                  value={createForm.city}
                  onChange={e => setCreateForm(prev => ({ ...prev, city: e.target.value }))}
                  disabled={creating}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/90">State/Province</label>
                <OceanInput
                  placeholder="Enter state/province"
                  value={createForm.stateProvince}
                  onChange={e =>
                    setCreateForm(prev => ({ ...prev, stateProvince: e.target.value }))
                  }
                  disabled={creating}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/90">Country *</label>
                <OceanInput
                  placeholder="Enter country"
                  value={createForm.country}
                  onChange={e => setCreateForm(prev => ({ ...prev, country: e.target.value }))}
                  disabled={creating}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/90">Country Code</label>
                <OceanInput
                  placeholder="e.g., US"
                  value={createForm.countryCode}
                  onChange={e => setCreateForm(prev => ({ ...prev, countryCode: e.target.value }))}
                  disabled={creating}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Description (Optional)</label>
              <OceanTextarea
                placeholder="Enter location description"
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
              onClick={cancelCreateLocation}
              disabled={creating}
              className="h-9 px-4 bg-white/4 border-[1.5px] border-white/10 text-white/75 hover:bg-white/8 hover:text-white/90 hover:border-white/20 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitCreateLocation}
              disabled={creating || !createForm.name.trim() || !createForm.country.trim()}
              className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Add Location'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
