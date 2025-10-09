import React, { useState, useEffect } from 'react';
import { Building2, Plus, Check, ChevronDown, XIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { OceanInput } from '@/components/ui/ocean-input';
import { OceanTextarea } from '@/components/ui/ocean-textarea';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';

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

interface Venue {
  id: number;
  name: string;
  venueTypeId: number;
  venueTypeName?: string;
  description?: string;
  shipId?: number;
  resortId?: number;
}

interface VenueType {
  id: number;
  name: string;
}

interface VenueDropdownProps {
  tripType: 'cruise' | 'resort';
  shipId?: number | null;
  resortId?: number | null;
  value: number | null;
  onChange: (venueId: number | null) => void;
  required?: boolean;
  label?: string;
  className?: string;
}

export function VenueDropdown({
  tripType,
  shipId,
  resortId,
  value,
  onChange,
  required = false,
  label = 'Venue',
  className,
}: VenueDropdownProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueTypes, setVenueTypes] = useState<VenueType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const portalContainerRef = React.useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    venueTypeId: '',
    description: '',
  });

  // Fetch venues when trip type or ship/resort changes
  useEffect(() => {
    fetchVenues();
    fetchVenueTypes();
  }, [tripType, shipId, resortId]);

  const fetchVenues = async () => {
    try {
      setLoading(true);

      // Determine endpoint based on trip type
      let endpoint: string;
      if (tripType === 'cruise') {
        if (!shipId) {
          console.log('[VenueDropdown] No shipId provided for cruise trip');
          setVenues([]);
          setLoading(false);
          return;
        }
        endpoint = `/api/admin/ships/${shipId}/venues`;
      } else {
        if (!resortId) {
          console.log('[VenueDropdown] No resortId provided for resort trip');
          setVenues([]);
          setLoading(false);
          return;
        }
        endpoint = `/api/admin/resorts/${resortId}/venues`;
      }

      console.log('[VenueDropdown] Fetching venues from:', endpoint);
      const response = await api.get(endpoint);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[VenueDropdown] Error response:', errorText);
        throw new Error(`Failed to fetch venues: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[VenueDropdown] Received data:', data);
      setVenues(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[VenueDropdown] Error fetching venues:', error);
      setVenues([]);
      toast({
        title: 'Error',
        description: `Failed to load ${tripType === 'cruise' ? 'ship' : 'resort'} venues`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVenueTypes = async () => {
    try {
      const response = await api.get('/api/admin/venue-types');
      const data = await response.json();
      // Ensure data is an array
      setVenueTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching venue types:', error);
      setVenueTypes([]); // Set empty array on error
    }
  };

  const handleCreateVenue = async () => {
    if (!formData.name.trim() || !formData.venueTypeId) {
      toast({
        title: 'Validation Error',
        description: 'Name and venue type are required',
        variant: 'destructive',
      });
      return;
    }

    // Determine endpoint based on trip type
    let endpoint: string;
    if (tripType === 'cruise') {
      if (!shipId) {
        toast({
          title: 'Error',
          description: 'Ship ID is required to create venue',
          variant: 'destructive',
        });
        return;
      }
      endpoint = `/api/admin/ships/${shipId}/venues`;
    } else {
      if (!resortId) {
        toast({
          title: 'Error',
          description: 'Resort ID is required to create venue',
          variant: 'destructive',
        });
        return;
      }
      endpoint = `/api/admin/resorts/${resortId}/venues`;
    }

    try {
      setCreating(true);
      const response = await api.post(endpoint, {
        name: formData.name,
        venueTypeId: parseInt(formData.venueTypeId),
        description: formData.description || undefined,
      });

      const newVenue = await response.json();
      setVenues(prev => [...prev, newVenue]);
      onChange(newVenue.id);

      toast({
        title: 'Success',
        description: 'Venue created successfully',
      });

      setShowCreateModal(false);
      setFormData({ name: '', venueTypeId: '', description: '' });
    } catch (error) {
      console.error('Error creating venue:', error);
      toast({
        title: 'Error',
        description: 'Failed to create venue',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  // Reset search when popover closes
  useEffect(() => {
    if (!isPopoverOpen) {
      setSearchValue('');
    }
  }, [isPopoverOpen]);

  // Get selected venue
  const selectedVenue = venues.find(v => v.id === value);

  // Filter venues based on search
  const filteredVenues = React.useMemo(() => {
    if (!searchValue) return venues;
    const search = searchValue.toLowerCase();
    return venues.filter(
      venue =>
        venue.name.toLowerCase().includes(search) ||
        venue.venueTypeName?.toLowerCase().includes(search)
    );
  }, [venues, searchValue]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleCreateNew = () => {
    setShowCreateModal(true);
    setIsPopoverOpen(false);
  };

  const selectVenue = (venueId: number) => {
    onChange(venueId);
    setIsPopoverOpen(false);
  };

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
            disabled={loading}
            role="combobox"
            aria-expanded={isPopoverOpen}
            className={cn(
              'flex p-2 rounded-[10px] border min-h-[40px] h-auto items-center justify-between',
              'bg-white/[0.04] border border-white/10 hover:bg-white/[0.06]',
              'transition-all duration-200 w-full text-left',
              'focus-visible:outline-none focus-visible:border-cyan-400/60',
              'focus-visible:bg-cyan-400/[0.03]',
              'focus-visible:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]',
              loading && 'opacity-40 cursor-not-allowed'
            )}
          >
            {selectedVenue ? (
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-white truncate">
                  <span className="font-medium">{selectedVenue.name}</span>
                  {selectedVenue.venueTypeName && (
                    <span className="text-white/60 ml-2">• {selectedVenue.venueTypeName}</span>
                  )}
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
                  {loading ? 'Loading venues...' : 'Select a venue'}
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
              placeholder="Search venues..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar">
              <CommandEmpty className="text-white/40 py-4">No venues found.</CommandEmpty>

              {/* Add New Venue Option */}
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
                  <span>Add New Venue</span>
                </CommandItem>
              </CommandGroup>

              {/* Venue List */}
              {filteredVenues.length > 0 && (
                <CommandGroup>
                  {filteredVenues.map(venue => {
                    const isSelected = venue.id === value;
                    return (
                      <CommandItem
                        key={venue.id}
                        onSelect={() => selectVenue(venue.id)}
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
                          <div className="font-medium text-white">{venue.name}</div>
                          {venue.venueTypeName && (
                            <div className="text-xs text-white/60 mt-0.5">
                              {venue.venueTypeName}
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {/* Footer Actions */}
              <CommandGroup>
                <div className="flex items-center justify-between">
                  {value && (
                    <>
                      <CommandItem
                        onSelect={() => {
                          onChange(null);
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

      {/* Create Venue Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="admin-form-modal sm:max-w-md border-white/10 bg-gradient-to-b from-[#10192f] to-[#0f1629] rounded-[20px] text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              Create New Venue
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Venue Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">
                Venue Name <span className="text-cyan-400">*</span>
              </label>
              <OceanInput
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Pool Deck, Main Lounge"
                className="h-10"
              />
            </div>

            {/* Venue Type */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">
                Venue Type <span className="text-cyan-400">*</span>
              </label>
              <Select
                value={formData.venueTypeId}
                onValueChange={val => setFormData({ ...formData, venueTypeId: val })}
              >
                <SelectTrigger className="h-10 bg-white/[0.04] border-[1.5px] border-white/8 text-white">
                  <SelectValue placeholder="Select venue type" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a1628] border-white/10">
                  {venueTypes.map(type => (
                    <SelectItem key={type.id} value={String(type.id)} className="text-white">
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Description</label>
              <OceanTextarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional venue description..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="h-9 px-4 bg-white/4 border-[1.5px] border-white/10 text-white/90 hover:bg-white/10 hover:text-white transition-all"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateVenue}
              disabled={creating}
              className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors"
            >
              {creating ? 'Creating...' : 'Create Venue'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
