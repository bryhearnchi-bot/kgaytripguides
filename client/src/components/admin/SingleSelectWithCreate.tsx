import * as React from 'react';
import { useState } from 'react';
import { CheckIcon, ChevronDown, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Add custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    background: rgba(255, 255, 255, 0.05);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(34, 211, 238, 0.5);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(34, 211, 238, 0.7);
  }
`;

export interface SingleSelectItem {
  id: number | string;
  name: string;
  description?: string;
}

interface SingleSelectWithCreateProps {
  options: SingleSelectItem[];
  value?: number | string;
  onValueChange: (value: number | string) => void;
  onCreateNew?: (name: string) => Promise<void>;
  placeholder?: string;
  searchPlaceholder?: string;
  createLabel?: string;
  disabled?: boolean;
  className?: string;
  container?: HTMLElement;
  showSearch?: boolean;
  showCreateNew?: boolean;
}

export default function SingleSelectWithCreate({
  options,
  value,
  onValueChange,
  onCreateNew,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search options...',
  createLabel = 'Create new option',
  disabled = false,
  className,
  container,
  showSearch = true,
  showCreateNew = true,
}: SingleSelectWithCreateProps) {
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const selectedOption = options.find(option => option.id === value && value !== 0);

  const handleCreateNew = async () => {
    if (!newItemName.trim() || !onCreateNew) return;

    setIsCreating(true);
    try {
      await onCreateNew(newItemName.trim());
      setNewItemName('');
      setShowCreate(false);
    } catch (error) {
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelect = (optionId: number | string) => {
    onValueChange(optionId);
    setOpen(false);
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'justify-between h-11 px-3.5',
              'bg-white/[0.04] border-white/[0.08] border-[1.5px] rounded-[10px]',
              'text-white text-sm font-normal',
              'hover:bg-white/[0.06] hover:border-white/[0.12]',
              'focus:outline-none focus:border-[#22d3ee]/60 focus:bg-[#22d3ee]/[0.03]',
              'focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]',
              'transition-all duration-200',
              !selectedOption && 'text-white/50'
            )}
            disabled={disabled}
          >
            {selectedOption ? selectedOption.name : placeholder}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            'p-0 w-[var(--radix-popover-trigger-width)]',
            'bg-[#0f172a] border-white/10 shadow-2xl'
          )}
          container={container}
        >
          <Command className="bg-transparent">
            {showSearch && (
              <CommandInput
                placeholder={searchPlaceholder}
                className={cn(
                  'h-11 px-3.5 border-0 border-b border-white/10',
                  'bg-transparent text-white placeholder:text-white/40',
                  'focus:ring-0 focus:border-[#22d3ee]/60'
                )}
              />
            )}
            <CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar bg-transparent">
              <CommandEmpty className="py-4 text-center text-white/50 text-sm">
                No options found.
              </CommandEmpty>
              <CommandGroup>
                {options.map(option => (
                  <CommandItem
                    key={option.id}
                    value={option.name}
                    onSelect={() => handleSelect(option.id)}
                    className={cn(
                      'cursor-pointer px-3.5 py-2.5 text-white text-sm',
                      'hover:bg-white/5 focus:bg-white/5',
                      'data-[selected]:bg-transparent',
                      'bg-transparent border-0'
                    )}
                  >
                    <CheckIcon
                      className={cn(
                        'mr-2 h-4 w-4 text-[#22d3ee]',
                        value === option.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="text-white">{option.name}</span>
                      {option.description && (
                        <span className="text-sm text-white/50">{option.description}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>

              {onCreateNew && showCreateNew && (
                <>
                  <CommandSeparator className="bg-white/10" />
                  <CommandGroup>
                    {!showCreate ? (
                      <CommandItem
                        onSelect={() => setShowCreate(true)}
                        className={cn(
                          'cursor-pointer px-3.5 py-2.5 text-[#22d3ee] text-sm',
                          'hover:bg-white/5 focus:bg-white/5',
                          'bg-transparent border-0'
                        )}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {createLabel}
                      </CommandItem>
                    ) : (
                      <div className="p-3 space-y-3 bg-white/[0.02] border-t border-white/10">
                        <Label htmlFor="newItemName" className="text-xs text-white/90 font-medium">
                          New category name
                        </Label>
                        <Input
                          id="newItemName"
                          value={newItemName}
                          onChange={e => setNewItemName(e.target.value)}
                          placeholder="Enter category name"
                          className={cn(
                            'h-8 px-2.5 text-xs',
                            'bg-white/[0.04] border-white/[0.08] border-[1.5px] rounded-[6px]',
                            'text-white placeholder:text-white/40',
                            'focus:outline-none focus:border-[#22d3ee]/60 focus:bg-[#22d3ee]/[0.03]',
                            'focus:shadow-[0_0_0_2px_rgba(34,211,238,0.08)]'
                          )}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCreateNew();
                            } else if (e.key === 'Escape') {
                              setShowCreate(false);
                              setNewItemName('');
                            }
                          }}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleCreateNew}
                            disabled={!newItemName.trim() || isCreating}
                            className={cn(
                              'h-6 text-xs px-3',
                              'bg-[#22d3ee]/20 hover:bg-[#22d3ee]/30 text-[#22d3ee]',
                              'border border-[#22d3ee]/30 hover:border-[#22d3ee]/50'
                            )}
                          >
                            {isCreating ? 'Creating...' : 'Create'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowCreate(false);
                              setNewItemName('');
                            }}
                            className={cn(
                              'h-6 text-xs px-3',
                              'bg-white/[0.04] hover:bg-white/[0.08] text-white/70',
                              'border border-white/10 hover:border-white/20'
                            )}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
