import React, { useState, useEffect } from 'react';
import { Plus, Check, ChevronDown, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export interface SearchableDropdownItem {
  id: number;
  name: string;
  description?: string;
  [key: string]: string | number | boolean | null | undefined;
}

interface SearchableDropdownProps {
  items: SearchableDropdownItem[];
  value: number | null;
  onChange: (id: number | null) => void;
  onCreateNew?: () => void;
  loading?: boolean;
  required?: boolean;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  createNewLabel?: string;
  className?: string;
  formatDisplay?: (item: SearchableDropdownItem) => { primary: string; secondary?: string };
}

export function SearchableDropdown({
  items,
  value,
  onChange,
  onCreateNew,
  loading = false,
  required = false,
  label,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No options found.',
  createNewLabel = 'Add New',
  className,
  formatDisplay,
}: SearchableDropdownProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const portalContainerRef = React.useRef<HTMLDivElement>(null);

  // Reset search when popover closes
  useEffect(() => {
    if (!isPopoverOpen) {
      setSearchValue('');
    }
  }, [isPopoverOpen]);

  // Get selected item
  const selectedItem = items.find(item => item.id === value);

  // Filter items based on search
  const filteredItems = React.useMemo(() => {
    if (!searchValue) return items;
    const search = searchValue.toLowerCase();
    return items.filter(
      item =>
        item.name.toLowerCase().includes(search) || item.description?.toLowerCase().includes(search)
    );
  }, [items, searchValue]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew();
      setIsPopoverOpen(false);
    }
  };

  const selectItem = (itemId: number) => {
    onChange(itemId);
    setIsPopoverOpen(false);
  };

  // Format display
  const getDisplayText = (item: SearchableDropdownItem) => {
    if (formatDisplay) {
      return formatDisplay(item);
    }
    return {
      primary: item.name,
      secondary: item.description,
    };
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
            {selectedItem ? (
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-white truncate">
                  <span className="font-medium">{getDisplayText(selectedItem).primary}</span>
                  {getDisplayText(selectedItem).secondary && (
                    <span className="text-white/60 ml-2">
                      • {getDisplayText(selectedItem).secondary}
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
                  {loading ? 'Loading...' : placeholder}
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
              placeholder={searchPlaceholder}
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar">
              <CommandEmpty className="text-white/40 py-4">{emptyMessage}</CommandEmpty>

              {/* Add New Option */}
              {onCreateNew && (
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
                    <span>{createNewLabel}</span>
                  </CommandItem>
                </CommandGroup>
              )}

              {/* Item List */}
              {filteredItems.length > 0 && (
                <CommandGroup>
                  {filteredItems.map(item => {
                    const isSelected = item.id === value;
                    const displayText = getDisplayText(item);
                    return (
                      <CommandItem
                        key={item.id}
                        onSelect={() => selectItem(item.id)}
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
                          <div className="font-medium text-white">{displayText.primary}</div>
                          {displayText.secondary && (
                            <div className="text-xs text-white/60 mt-0.5">
                              {displayText.secondary}
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
    </div>
  );
}
