import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, XIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
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

export interface SimpleSelectorOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SimpleSelectorProps {
  label?: string;
  placeholder?: string;
  required?: boolean;
  value: string | null;
  onChange: (value: string) => void;
  options: SimpleSelectorOption[];
  disabled?: boolean;
  className?: string;
  showSearch?: boolean;
  emptyMessage?: string;
}

export function SimpleSelector({
  label,
  placeholder = 'Select an option',
  required = false,
  value,
  onChange,
  options,
  disabled = false,
  className,
  showSearch = true,
  emptyMessage = 'No options found.',
}: SimpleSelectorProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const portalContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPopoverOpen) {
      setSearchValue('');
    }
  }, [isPopoverOpen]);

  // Get selected option
  const selectedOption = options.find(opt => opt.value === value);

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;
    const search = searchValue.toLowerCase();
    return options.filter(
      opt =>
        opt.label.toLowerCase().includes(search) || opt.description?.toLowerCase().includes(search)
    );
  }, [options, searchValue]);

  const handleSelect = (optionValue: string) => {
    if (disabled) return;
    onChange(optionValue);
    setIsPopoverOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || required) return;
    onChange('');
  };

  return (
    <div className={className} ref={portalContainerRef}>
      {label && (
        <Label className="text-xs font-semibold text-white/90 mb-1 block">
          {label} {required && <span className="text-cyan-400">*</span>}
        </Label>
      )}

      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
            disabled={disabled}
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
            {selectedOption ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-sm text-white truncate">
                  {selectedOption.icon && <selectedOption.icon className="h-4 w-4 flex-shrink-0" />}
                  <span className="font-medium">{selectedOption.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {!required && (
                    <>
                      <XIcon
                        className="h-4 w-4 text-white/60 hover:text-white/80 cursor-pointer"
                        onClick={handleClear}
                      />
                      <Separator orientation="vertical" className="h-4" />
                    </>
                  )}
                  <ChevronDown className="h-4 w-4 text-white/60" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-white/40">{placeholder}</span>
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
            {showSearch && (
              <CommandInput
                placeholder="Search options..."
                value={searchValue}
                onValueChange={setSearchValue}
              />
            )}
            <CommandList className="max-h-[200px] overflow-y-auto">
              <CommandEmpty className="text-white/40 py-4">{emptyMessage}</CommandEmpty>

              {/* Options List */}
              {filteredOptions.length > 0 && (
                <CommandGroup>
                  {filteredOptions.map(option => {
                    const isSelected = option.value === value;
                    return (
                      <CommandItem
                        key={option.value}
                        onSelect={() => handleSelect(option.value)}
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
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {option.icon && <option.icon className="h-4 w-4" />}
                            <span className="font-medium text-white">{option.label}</span>
                          </div>
                          {option.description && (
                            <div className="text-xs text-white/60 mt-0.5">{option.description}</div>
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
                  {value && !required && (
                    <>
                      <CommandItem
                        onSelect={() => {
                          onChange('');
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
