import React, { useState, useEffect } from 'react';
import { User, Plus, Check, ChevronDown, XIcon } from 'lucide-react';
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

interface Talent {
  id: number;
  name: string;
  talentCategoryId: number;
  talentCategoryName?: string;
  bio?: string;
}

interface TalentCategory {
  id: number;
  name: string;
}

interface TalentDropdownProps {
  tripId: number;
  value: number | null;
  onChange: (talentId: number | null) => void;
  required?: boolean;
  label?: string;
  className?: string;
}

export function TalentDropdown({
  tripId,
  value,
  onChange,
  required = false,
  label = 'Talent',
  className,
}: TalentDropdownProps) {
  const [talent, setTalent] = useState<Talent[]>([]);
  const [talentCategories, setTalentCategories] = useState<TalentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const portalContainerRef = React.useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    talentCategoryId: '',
    bio: '',
  });

  // Fetch talent for this trip
  useEffect(() => {
    fetchTalent();
    fetchTalentCategories();
  }, [tripId]);

  const fetchTalent = async () => {
    try {
      setLoading(true);
      // Fetch ALL talent from the global talent table
      const response = await api.get('/api/admin/talent');
      const data = await response.json();
      // Ensure data is an array
      setTalent(Array.isArray(data) ? data : []);
    } catch (error) {
      setTalent([]); // Set empty array on error
      toast({
        title: 'Error',
        description: 'Failed to load talent',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTalentCategories = async () => {
    try {
      const response = await api.get('/api/admin/talent-categories');
      const data = await response.json();
      // Ensure data is an array
      setTalentCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      setTalentCategories([]); // Set empty array on error
    }
  };

  const handleCreateTalent = async () => {
    if (!formData.name.trim() || !formData.talentCategoryId) {
      toast({
        title: 'Validation Error',
        description: 'Name and talent category are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreating(true);
      const response = await api.post('/api/admin/talent', {
        name: formData.name,
        talentCategoryId: parseInt(formData.talentCategoryId),
        bio: formData.bio || undefined,
      });

      const newTalent = await response.json();
      setTalent(prev => [...prev, newTalent]);
      onChange(newTalent.id);

      toast({
        title: 'Success',
        description: 'Talent created successfully',
      });

      setShowCreateModal(false);
      setFormData({ name: '', talentCategoryId: '', bio: '' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create talent',
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

  // Get selected talent
  const selectedTalent = talent.find(t => t.id === value);

  // Filter talent based on search
  const filteredTalent = React.useMemo(() => {
    if (!searchValue) return talent;
    const search = searchValue.toLowerCase();
    return talent.filter(
      t =>
        t.name.toLowerCase().includes(search) ||
        t.talentCategoryName?.toLowerCase().includes(search)
    );
  }, [talent, searchValue]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleCreateNew = () => {
    setShowCreateModal(true);
    setIsPopoverOpen(false);
  };

  const selectTalent = (talentId: number) => {
    onChange(talentId);
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
            {selectedTalent ? (
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-white truncate">
                  <span className="font-medium">{selectedTalent.name}</span>
                  {selectedTalent.talentCategoryName && (
                    <span className="text-white/60 ml-2">
                      • {selectedTalent.talentCategoryName}
                    </span>
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
                  {loading ? 'Loading talent...' : 'Select talent'}
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
              placeholder="Search talent..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar">
              <CommandEmpty className="text-white/40 py-4">No talent found.</CommandEmpty>

              {/* Add New Talent Option */}
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
                  <span>Add New Talent</span>
                </CommandItem>
              </CommandGroup>

              {/* Talent List */}
              {filteredTalent.length > 0 && (
                <CommandGroup>
                  {filteredTalent.map(t => {
                    const isSelected = t.id === value;
                    return (
                      <CommandItem
                        key={t.id}
                        onSelect={() => selectTalent(t.id)}
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
                          <div className="font-medium text-white">{t.name}</div>
                          {t.talentCategoryName && (
                            <div className="text-xs text-white/60 mt-0.5">
                              {t.talentCategoryName}
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

      {/* Create Talent Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="admin-form-modal sm:max-w-md border-white/10 bg-gradient-to-b from-[#10192f] to-[#0f1629] rounded-[20px] text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Create New Talent
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Talent Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">
                Talent Name <span className="text-cyan-400">*</span>
              </label>
              <OceanInput
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., RuPaul, Lady Bunny"
                className="h-10"
              />
            </div>

            {/* Talent Category */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">
                Talent Category <span className="text-cyan-400">*</span>
              </label>
              <Select
                value={formData.talentCategoryId}
                onValueChange={val => setFormData({ ...formData, talentCategoryId: val })}
              >
                <SelectTrigger className="h-10 bg-white/[0.04] border-[1.5px] border-white/8 text-white">
                  <SelectValue placeholder="Select talent category" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a1628] border-white/10">
                  {talentCategories.map(cat => (
                    <SelectItem key={cat.id} value={String(cat.id)} className="text-white">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Bio</label>
              <OceanTextarea
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Optional talent bio..."
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
              onClick={handleCreateTalent}
              disabled={creating}
              className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors"
            >
              {creating ? 'Creating...' : 'Create Talent'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
