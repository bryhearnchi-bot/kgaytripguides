import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { AlertCircle, Check, ChevronDown, Plus, XIcon, Ship as ShipIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

interface Ship {
  id: number;
  name: string;
  cruiseLine: string;
  capacity?: number;
  decks?: number;
  imageUrl?: string;
  deckPlansUrl?: string;
  description?: string;
}

interface ShipSelectorProps {
  selectedId?: number | null;
  onSelectionChange: (shipId: number | null, shipData?: Ship) => void;
  onCreateNew?: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

interface CreateShipFormData {
  name: string;
  cruiseLine: string;
  capacity: string;
  decks: string;
  imageUrl: string;
  deckPlansUrl: string;
  description: string;
}

export function ShipSelector({
  selectedId,
  onSelectionChange,
  onCreateNew,
  disabled = false,
  className,
  label = 'Ship',
  placeholder = 'Select a ship or add new',
  required = false,
}: ShipSelectorProps) {
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const portalContainerRef = React.useRef<HTMLDivElement>(null);

  // Create ship modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateShipFormData>({
    name: '',
    cruiseLine: '',
    capacity: '',
    decks: '',
    imageUrl: '',
    deckPlansUrl: '',
    description: '',
  });

  const fetchShips = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/ships');

      if (!response.ok) {
        throw new Error(`Failed to fetch ships: ${response.status}`);
      }

      const data = await response.json();
      setShips(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch ships');
    } finally {
      setLoading(false);
    }
  };

  const submitCreateShip = async () => {
    if (!createForm.name.trim() || !createForm.cruiseLine.trim()) {
      return;
    }

    try {
      setCreating(true);
      const response = await api.post('/api/ships', {
        name: createForm.name.trim(),
        cruiseLine: createForm.cruiseLine.trim(),
        capacity: createForm.capacity ? parseInt(createForm.capacity) : null,
        decks: createForm.decks ? parseInt(createForm.decks) : null,
        imageUrl: createForm.imageUrl.trim() || null,
        deckPlansUrl: createForm.deckPlansUrl.trim() || null,
        description: createForm.description.trim() || null,
      });

      if (!response.ok) {
        throw new Error(`Failed to create ship: ${response.status}`);
      }

      const newShip = await response.json();

      // Add the new ship to the list
      setShips(prev => [...prev, newShip]);

      // Auto-select the newly created ship and pass full ship data
      onSelectionChange(newShip.id, newShip);

      // Reset form and close modal
      setCreateForm({
        name: '',
        cruiseLine: '',
        capacity: '',
        decks: '',
        imageUrl: '',
        deckPlansUrl: '',
        description: '',
      });
      setShowCreateModal(false);
    } catch (error) {
    } finally {
      setCreating(false);
    }
  };

  const cancelCreateShip = () => {
    setCreateForm({
      name: '',
      cruiseLine: '',
      capacity: '',
      decks: '',
      imageUrl: '',
      deckPlansUrl: '',
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

  const selectShip = (ship: Ship) => {
    if (disabled) return;
    onSelectionChange(ship.id, ship);
    setIsPopoverOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onSelectionChange(null);
  };

  useEffect(() => {
    fetchShips();
  }, []);

  useEffect(() => {
    if (!isPopoverOpen) {
      setSearchValue('');
    }
  }, [isPopoverOpen]);

  // Get selected ship
  const selectedShip = ships.find(ship => ship.id === selectedId);

  // Filter ships based on search
  const filteredShips = React.useMemo(() => {
    if (!searchValue) return ships;
    const search = searchValue.toLowerCase();
    return ships.filter(
      ship =>
        ship.name.toLowerCase().includes(search) || ship.cruiseLine.toLowerCase().includes(search)
    );
  }, [ships, searchValue]);

  // Show error state
  if (error) {
    return (
      <div className={`rounded-md border border-red-200 bg-red-50 p-4 ${className}`}>
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading ships</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchShips}
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
            {selectedShip ? (
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-white truncate">
                  <span className="font-medium">{selectedShip.name}</span>
                  <span className="text-white/60 ml-2">• {selectedShip.cruiseLine}</span>
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
                  {loading ? 'Loading ships...' : placeholder}
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
              placeholder="Search ships..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList className="max-h-[200px] overflow-y-auto">
              <CommandEmpty className="text-white/40 py-4">No ships found.</CommandEmpty>

              {/* Add New Ship Option */}
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
                  <span>Add New Ship</span>
                </CommandItem>
              </CommandGroup>

              {/* Ship List */}
              {filteredShips.length > 0 && (
                <CommandGroup>
                  {filteredShips.map(ship => {
                    const isSelected = ship.id === selectedId;
                    return (
                      <CommandItem
                        key={ship.id}
                        onSelect={() => selectShip(ship)}
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
                          <div className="font-medium text-white">{ship.name}</div>
                          <div className="text-xs text-white/60 mt-0.5">{ship.cruiseLine}</div>
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

      {/* Create Ship Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="admin-form-modal sm:max-w-lg border-white/10 bg-gradient-to-b from-[#10192f] to-[#0f1629] rounded-[20px] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Ship</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Ship Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Ship Name *</label>
              <Input
                placeholder="Enter ship name"
                value={createForm.name}
                onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                disabled={creating}
                className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm"
              />
            </div>

            {/* Cruise Line */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Cruise Line *</label>
              <Input
                placeholder="Enter cruise line name"
                value={createForm.cruiseLine}
                onChange={e => setCreateForm(prev => ({ ...prev, cruiseLine: e.target.value }))}
                disabled={creating}
                className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm"
              />
            </div>

            {/* Capacity and Decks Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/90">Capacity</label>
                <Input
                  type="number"
                  placeholder="Max passengers"
                  value={createForm.capacity}
                  onChange={e => setCreateForm(prev => ({ ...prev, capacity: e.target.value }))}
                  disabled={creating}
                  className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/90">Decks</label>
                <Input
                  type="number"
                  placeholder="Number of decks"
                  value={createForm.decks}
                  onChange={e => setCreateForm(prev => ({ ...prev, decks: e.target.value }))}
                  disabled={creating}
                  className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Description</label>
              <Textarea
                placeholder="Enter ship description..."
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
              onClick={cancelCreateShip}
              disabled={creating}
              className="h-9 px-4 bg-white/4 border-[1.5px] border-white/10 text-white/75 hover:bg-white/8 hover:text-white/90 hover:border-white/20 rounded-lg transition-all"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitCreateShip}
              disabled={creating || !createForm.name.trim() || !createForm.cruiseLine.trim()}
              className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-all"
            >
              {creating ? 'Creating...' : 'Add Ship'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
