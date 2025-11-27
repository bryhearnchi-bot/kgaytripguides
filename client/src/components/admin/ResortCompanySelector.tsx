import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { AlertCircle, Check, ChevronDown, Plus, XIcon, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { ADMIN_MODAL_FIELD_STYLES } from '@/lib/adminStyles';

interface ResortCompany {
  id: number;
  name: string;
}

interface ResortCompanySelectorProps {
  selectedId?: number | null;
  onSelectionChange: (resortCompanyId: number | null, resortCompanyData?: ResortCompany) => void;
  onCreateNew?: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

interface CreateResortCompanyFormData {
  name: string;
}

export function ResortCompanySelector({
  selectedId,
  onSelectionChange,
  onCreateNew,
  disabled = false,
  className,
  label = 'Resort Company',
  placeholder = 'Select a resort company or add new',
  required = false,
}: ResortCompanySelectorProps) {
  const [resortCompanies, setResortCompanies] = useState<ResortCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const portalContainerRef = React.useRef<HTMLDivElement>(null);

  // Create resort company modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateResortCompanyFormData>({
    name: '',
  });

  const fetchResortCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/admin/lookup-tables/resort-companies');

      if (!response.ok) {
        throw new Error(`Failed to fetch resort companies: ${response.status}`);
      }

      const data = await response.json();
      setResortCompanies(data.items || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch resort companies');
    } finally {
      setLoading(false);
    }
  };

  const submitCreateResortCompany = async () => {
    if (!createForm.name.trim()) {
      return;
    }

    try {
      setCreating(true);
      const response = await api.post('/api/admin/lookup-tables/resort-companies', {
        name: createForm.name.trim(),
      });

      if (!response.ok) {
        throw new Error(`Failed to create resort company: ${response.status}`);
      }

      const result = await response.json();
      const newResortCompany = result.item;

      // Add the new resort company to the list
      setResortCompanies(prev => [...prev, newResortCompany]);

      // Auto-select the newly created resort company and pass full data
      onSelectionChange(newResortCompany.id, newResortCompany);

      // Reset form and close modal
      setCreateForm({ name: '' });
      setShowCreateModal(false);
    } catch (error) {
    } finally {
      setCreating(false);
    }
  };

  const cancelCreateResortCompany = () => {
    setCreateForm({ name: '' });
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

  const selectResortCompany = (resortCompany: ResortCompany) => {
    if (disabled) return;
    onSelectionChange(resortCompany.id, resortCompany);
    setIsPopoverOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onSelectionChange(null);
  };

  useEffect(() => {
    fetchResortCompanies();
  }, []);

  useEffect(() => {
    if (!isPopoverOpen) {
      setSearchValue('');
    }
  }, [isPopoverOpen]);

  // Get selected resort company
  const selectedResortCompany = resortCompanies.find(rc => rc.id === selectedId);

  // Filter resort companies based on search
  const filteredResortCompanies = React.useMemo(() => {
    if (!searchValue) return resortCompanies;
    const search = searchValue.toLowerCase();
    return resortCompanies.filter(rc => rc.name.toLowerCase().includes(search));
  }, [resortCompanies, searchValue]);

  // Show error state
  if (error) {
    return (
      <div className={`rounded-md border border-red-200 bg-red-50 p-4 ${className}`}>
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading resort companies</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchResortCompanies}
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
      <style>{ADMIN_MODAL_FIELD_STYLES}</style>
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
            {selectedResortCompany ? (
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-white truncate">
                  <span className="font-medium">{selectedResortCompany.name}</span>
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
                  {loading ? 'Loading resort companies...' : placeholder}
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
            'bg-white/15 backdrop-blur-xl',
            'border border-white/10 rounded-[10px] shadow-xl'
          )}
          align="start"
          sideOffset={4}
        >
          <Command className="bg-transparent">
            <CommandInput
              placeholder="Search resort companies..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList className="max-h-[200px] overflow-y-auto">
              <CommandEmpty className="text-white/40 py-4">No resort companies found.</CommandEmpty>

              {/* Add New Resort Company Option */}
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
                  <span>Add New Resort Company</span>
                </CommandItem>
              </CommandGroup>

              {/* Resort Company List */}
              {filteredResortCompanies.length > 0 && (
                <CommandGroup>
                  {filteredResortCompanies.map(resortCompany => {
                    const isSelected = resortCompany.id === selectedId;
                    return (
                      <CommandItem
                        key={resortCompany.id}
                        onSelect={() => selectResortCompany(resortCompany)}
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
                        <div className="font-medium text-white">{resortCompany.name}</div>
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

      {/* Create Resort Company Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent
          className="admin-form-modal sm:max-w-md border-white/10 rounded-[20px] text-white"
          style={{
            backgroundColor: 'rgba(0, 33, 71, 1)',
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-white">Add New Resort Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Resort Company Name *</label>
              <Input
                placeholder="Enter resort company name"
                value={createForm.name}
                onChange={e => setCreateForm({ name: e.target.value })}
                disabled={creating}
                className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={cancelCreateResortCompany}
              disabled={creating}
              className="h-9 px-4 bg-white/4 border-[1.5px] border-white/10 text-white/75 hover:bg-white/8 hover:text-white/90 hover:border-white/20 rounded-lg transition-all"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitCreateResortCompany}
              disabled={creating || !createForm.name.trim()}
              className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-all"
            >
              {creating ? 'Creating...' : 'Add Resort Company'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
