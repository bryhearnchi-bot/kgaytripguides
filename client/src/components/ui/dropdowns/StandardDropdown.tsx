'use client';

import * as React from 'react';
import { Check, ChevronDown, Plus, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useMobileResponsive } from '@/hooks/use-mobile-responsive';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Custom scrollbar styles for dropdown menus - matches fly-out menu gray scrollbar
const scrollbarStyles = `
  [cmdk-list].standard-dropdown-scroll {
    scrollbar-width: thin !important;
    scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05) !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    -webkit-overflow-scrolling: touch !important;
    pointer-events: auto !important;
    touch-action: pan-y !important;
  }
  [cmdk-list].standard-dropdown-scroll::-webkit-scrollbar {
    width: 10px !important;
    display: block !important;
    opacity: 1 !important;
    visibility: visible !important;
  }
  [cmdk-list].standard-dropdown-scroll::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05) !important;
    border-radius: 5px !important;
  }
  [cmdk-list].standard-dropdown-scroll::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2) !important;
    border-radius: 5px !important;
    min-height: 30px !important;
  }
  [cmdk-list].standard-dropdown-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3) !important;
  }
`;

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export type StandardDropdownVariant =
  | 'single-basic'
  | 'single-search'
  | 'single-search-add'
  | 'multi-search'
  | 'multi-search-add';

interface StandardDropdownProps {
  variant: StandardDropdownVariant;
  options: DropdownOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  onCreateNew?: (name: string) => Promise<{ value: string; label: string }>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  addLabel?: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
}

// Shared styling helpers
const triggerBaseClasses =
  'flex p-2 rounded-[10px] border min-h-[40px] h-auto items-center justify-between bg-white/[0.04] border-white/10 hover:bg-white/[0.06] transition-all duration-200 w-full text-left text-sm text-white focus-visible:outline-none focus-visible:border-white/60 focus-visible:bg-white/[0.08] focus-visible:shadow-[0_0_0_2px_rgba(255,255,255,0.28)] focus-visible:ring-0 focus-visible:ring-offset-0';

const popoverContentBaseClasses =
  'w-[--radix-popover-trigger-width] p-0 border border-white/10 rounded-[10px] shadow-xl text-white box-border';

export function StandardDropdown({
  variant,
  options,
  value,
  onChange,
  onCreateNew,
  label,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  className = '',
  addLabel = 'Add New',
  emptyMessage = 'No options found.',
  searchPlaceholder = 'Search...',
}: StandardDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const isMobile = useMobileResponsive();
  const openTimeRef = React.useRef<number>(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = React.useState<number | undefined>(undefined);

  // Update trigger width when open changes
  React.useEffect(() => {
    if (open && triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  // Handle open change with delay to prevent immediate close on mobile
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (newOpen) {
      openTimeRef.current = Date.now();
      setOpen(true);
    } else {
      // Prevent closing if it was just opened (within 150ms) - fixes mobile tap issue
      const timeSinceOpen = Date.now() - openTimeRef.current;
      if (timeSinceOpen > 150) {
        setOpen(false);
      }
    }
  }, []);

  const isMulti = variant.includes('multi');
  const hasSearch = variant.includes('search');
  const hasAdd = variant.includes('add');

  // Get selected values
  const selectedValues = isMulti ? (value as string[]) : [value as string];
  const selectedValue = isMulti ? undefined : (value as string);

  // Filter options based on search
  const filtered = React.useMemo(() => {
    if (!hasSearch || !searchValue.trim()) return options;
    const searchLower = searchValue.toLowerCase();
    return options.filter(option => option.label.toLowerCase().includes(searchLower));
  }, [options, searchValue, hasSearch]);

  // Get current label(s)
  const currentLabel = React.useMemo(() => {
    if (isMulti) {
      const selected = options.filter(opt => selectedValues.includes(opt.value));
      if (selected.length === 0) return placeholder;
      if (selected.length === 1 && selected[0]) return selected[0].label;
      return `${selected.length} selected`;
    }
    const selected = options.find(opt => opt.value === selectedValue);
    return selected?.label || placeholder;
  }, [isMulti, options, selectedValues, selectedValue, placeholder]);

  // Handle selection
  const handleSelect = (optionValue: string) => {
    if (isMulti) {
      const current = value as string[];
      const isSelected = current.includes(optionValue);
      const newValue = isSelected
        ? current.filter(v => v !== optionValue)
        : [...current, optionValue];
      onChange(newValue);
    } else {
      onChange(optionValue);
      setOpen(false);
    }
  };

  // Handle Add New
  const openAddDialog = () => {
    setShowAddDialog(true);
  };

  const handleConfirmAdd = async () => {
    if (!onCreateNew || !newName.trim()) return;

    try {
      setCreating(true);
      const newItem = await onCreateNew(newName.trim());

      // Add to options (parent should handle this, but we can optimistically update)
      // Auto-select the new item
      if (isMulti) {
        const current = value as string[];
        onChange([...current, newItem.value]);
      } else {
        onChange(newItem.value);
        setOpen(false);
      }

      setShowAddDialog(false);
      setNewName('');
    } catch (error) {
      console.error('Failed to create new item:', error);
    } finally {
      setCreating(false);
    }
  };

  // Render Add New fly-up
  const renderAddDialog = () => {
    if (!hasAdd || !onCreateNew) return null;

    const mobileContent = (
      <>
        {/* Header with title and X button */}
        <div className="flex items-center justify-between w-full px-4 pt-4 pb-3 border-b border-white/10">
          <SheetHeader className="text-left">
            <SheetTitle className="text-lg font-bold text-white leading-tight">
              {addLabel}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Create a new entry you can reuse.
            </SheetDescription>
          </SheetHeader>
          <button
            type="button"
            onClick={() => setShowAddDialog(false)}
            aria-label="Close"
            className="h-9 w-9 rounded-full border border-white/10 bg-white/10 hover:bg-white/15 text-white transition-colors flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          <label className="text-xs font-medium text-white/90">Name</label>
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/10 rounded-[10px] text-white text-sm placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder={`Enter ${addLabel.toLowerCase().replace('add new ', '')} name`}
            autoFocus
          />
          {/* Save button underneath the field */}
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={handleConfirmAdd}
              disabled={creating || !newName.trim()}
              aria-label="Save & Add"
              className="h-9 px-4 rounded-lg border border-white/10 bg-white/10 hover:bg-white/15 text-green-400 hover:text-green-300 transition-colors flex items-center justify-center text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save &amp; Add
            </button>
          </div>
        </div>
      </>
    );

    const desktopContent = (
      <>
        {/* Custom header matching Edit Trip modal */}
        <div className="flex items-center justify-between w-full px-5 pt-5 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white leading-tight">{addLabel}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirmAdd}
              disabled={creating || !newName.trim()}
              aria-label="Save Changes"
              className="h-9 w-9 rounded-full border border-white/10 bg-white/10 hover:bg-white/15 text-green-400 hover:text-green-300 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowAddDialog(false)}
              aria-label="Close"
              className="h-9 w-9 rounded-full border border-white/10 bg-white/10 hover:bg-white/15 text-white transition-colors flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Content area */}
        <div className="px-5 py-4 space-y-2">
          <label className="text-xs font-medium text-white/90">Name</label>
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/10 rounded-[10px] text-white text-sm placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder={`Enter ${addLabel.toLowerCase().replace('add new ', '')} name`}
            autoFocus
          />
        </div>
      </>
    );

    if (isMobile) {
      return (
        <Sheet open={showAddDialog} onOpenChange={setShowAddDialog}>
          <SheetContent
            side="bottom"
            className="border-white/10 text-white rounded-t-2xl p-0 flex flex-col [&>button]:hidden"
            style={{
              backgroundColor: 'rgba(0, 33, 71, 1)',
              backgroundImage:
                'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
              height: '37.5vh',
              maxHeight: '37.5vh',
            }}
          >
            {mobileContent}
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent
          className="sm:max-w-sm w-[92vw] border-white/10 rounded-[16px] text-white p-0"
          style={{
            backgroundColor: 'rgba(0, 33, 71, 1)',
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
          }}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{addLabel}</DialogTitle>
            <DialogDescription>Create a new entry you can reuse.</DialogDescription>
          </DialogHeader>
          {desktopContent}
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className={cn('w-full space-y-1 relative', className)} ref={containerRef}>
        {label && (
          <Label className="text-xs font-semibold text-white/90">
            {label} {required && <span className="text-white/60">*</span>}
          </Label>
        )}
        <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
          <PopoverTrigger asChild>
            <Button
              ref={triggerRef}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                triggerBaseClasses,
                !currentLabel || currentLabel === placeholder ? 'text-white/50' : ''
              )}
              onPointerDown={e => {
                // Prevent the pointer event from bubbling - this helps on mobile
                e.stopPropagation();
              }}
              onMouseDown={e => {
                // Prevent mouse events from bubbling
                e.stopPropagation();
              }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isMulti && selectedValues.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {selectedValues.slice(0, 2).map(val => {
                      const opt = options.find(o => o.value === val);
                      return (
                        <Badge
                          key={val}
                          variant="secondary"
                          className="text-xs bg-white/10 text-white border-white/20"
                        >
                          {opt?.label || val}
                        </Badge>
                      );
                    })}
                    {selectedValues.length > 2 && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-white/10 text-white border-white/20"
                      >
                        +{selectedValues.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
                {(!isMulti || selectedValues.length === 0) && (
                  <span className="truncate">{currentLabel}</span>
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-white/60 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className={cn(popoverContentBaseClasses, 'overflow-hidden z-[9999]')}
            align="start"
            sideOffset={4}
            collisionPadding={0}
            avoidCollisions={false}
            container={containerRef.current || undefined}
            onOpenAutoFocus={e => {
              // Prevent Radix from taking control of focus
              // Let cmdk handle focus management instead
              e.preventDefault();
              // On mobile, don't auto-focus search to avoid keyboard popup
              // On desktop, focus the search input for immediate typing
              if (hasSearch && !isMobile) {
                setTimeout(() => {
                  const input = document.querySelector('[cmdk-input]') as HTMLInputElement;
                  if (input) {
                    input.focus();
                  }
                }, 10);
              }
            }}
            onCloseAutoFocus={e => {
              // Prevent Radix from moving focus on close to avoid conflicts
              e.preventDefault();
            }}
            onPointerDownOutside={() => {
              // Allow clicking outside to close
            }}
            onInteractOutside={() => {
              // Allow interactions outside
            }}
            style={{
              backgroundColor: 'rgba(0, 33, 71, 1)',
              backgroundImage:
                'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
              // Explicitly set width to match trigger when using local container
              // This overrides the CSS variable which doesn't work with local portals
              width: triggerWidth ? `${triggerWidth}px` : undefined,
            }}
          >
            <Command className="bg-transparent flex flex-col h-full w-full" shouldFilter={false}>
              {hasSearch && (
                <CommandInput
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onValueChange={setSearchValue}
                  className="h-9 border-b border-white/10 bg-transparent text-white placeholder:text-white/40 flex-shrink-0"
                />
              )}
              <CommandList
                className={cn(hasSearch ? 'max-h-64' : 'max-h-60', 'standard-dropdown-scroll')}
              >
                <CommandEmpty className="py-4 text-xs text-white/60">{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {filtered.map(option => {
                    const isSelected = isMulti
                      ? selectedValues.includes(option.value)
                      : option.value === selectedValue;
                    const Icon = option.icon;

                    return (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => handleSelect(option.value)}
                        className="cursor-pointer text-sm text-white hover:bg-white/10"
                      >
                        {Icon && <Icon className="w-4 h-4 mr-2" />}
                        <span className="flex-1">{option.label}</span>
                        <Check
                          className={cn(
                            'ml-auto h-4 w-4 text-white',
                            isSelected ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    );
                  })}

                  {/* Add New as last item (or only item when no matches) */}
                  {hasAdd && onCreateNew && (
                    <CommandItem
                      disabled={false}
                      onSelect={openAddDialog}
                      className="mt-1 cursor-pointer text-sm text-[#2563eb] hover:bg-white/10 rounded-[8px] flex items-center gap-1 px-2 py-1.5"
                    >
                      <Plus className="h-3 w-3" />
                      <span className="truncate">
                        {filtered.length === 0 && searchValue.trim().length > 0
                          ? `Add "${searchValue.trim()}"`
                          : addLabel}
                      </span>
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {renderAddDialog()}
    </>
  );
}
