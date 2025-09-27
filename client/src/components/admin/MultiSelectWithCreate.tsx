import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, Plus, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface MultiSelectItem {
  id: number | string;
  name: string;
  description?: string;
}

interface MultiSelectWithCreateProps {
  items: MultiSelectItem[];
  selectedIds: (number | string)[];
  onSelectionChange: (selectedIds: (number | string)[]) => void;
  onCreate: (name: string) => Promise<void>;
  renderItem?: (item: MultiSelectItem) => React.ReactNode;
  placeholder?: string;
  createButtonText?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function MultiSelectWithCreate({
  items,
  selectedIds,
  onSelectionChange,
  onCreate,
  renderItem,
  placeholder = "Select items...",
  createButtonText = "Create New",
  searchPlaceholder = "Search items...",
  disabled = false,
  loading = false,
  className,
}: MultiSelectWithCreateProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [creating, setCreating] = useState(false);

  // Get selected items for display
  const selectedItems = items.filter(item => selectedIds.includes(item.id));

  // Filter items based on search
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchValue.toLowerCase()))
  );

  const handleSelect = (itemId: number | string) => {
    const newSelectedIds = selectedIds.includes(itemId)
      ? selectedIds.filter(id => id !== itemId)
      : [...selectedIds, itemId];
    onSelectionChange(newSelectedIds);
  };

  const handleRemove = (itemId: number | string) => {
    onSelectionChange(selectedIds.filter(id => id !== itemId));
  };

  const handleCreate = async () => {
    if (!searchValue.trim()) return;

    setCreating(true);
    try {
      await onCreate(searchValue.trim());
      setSearchValue('');
      setOpen(false);
    } catch (error) {
      console.error('Error creating item:', error);
    } finally {
      setCreating(false);
    }
  };

  // Show create option when searching and no exact match exists
  const showCreateOption = searchValue.trim() &&
    !filteredItems.some(item => item.name.toLowerCase() === searchValue.toLowerCase());

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected Items Display */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map((item) => (
            <Badge
              key={item.id}
              variant="secondary"
              className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 transition-colors"
            >
              {item.name}
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                disabled={disabled}
                className="ml-2 hover:text-blue-600 focus:outline-none"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Multi-Select Trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading}
            className={cn(
              "w-full justify-between bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500",
              selectedItems.length === 0 && "text-gray-500"
            )}
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <span className="truncate">
                {selectedItems.length === 0
                  ? placeholder
                  : `${selectedItems.length} selected`
                }
              </span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchValue}
              onValueChange={setSearchValue}
              className="border-none focus:ring-0"
            />
            <CommandList>
              <CommandEmpty>
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 mb-3">No items found</p>
                  {showCreateOption && (
                    <Button
                      onClick={handleCreate}
                      disabled={creating}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-none"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {creating ? 'Creating...' : `${createButtonText} "${searchValue}"`}
                    </Button>
                  )}
                </div>
              </CommandEmpty>
              <CommandGroup>
                {filteredItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <CommandItem
                      key={item.id}
                      onSelect={() => handleSelect(item.id)}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                    >
                      <div className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border",
                        isSelected
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300"
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        {renderItem ? (
                          renderItem(item)
                        ) : (
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            {item.description && (
                              <div className="text-sm text-gray-500">{item.description}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
                {showCreateOption && filteredItems.length > 0 && (
                  <>
                    <div className="border-t border-gray-200 my-1" />
                    <CommandItem
                      onSelect={handleCreate}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex h-4 w-4 items-center justify-center">
                        <Plus className="h-3 w-3 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-blue-600">
                          {creating ? 'Creating...' : `${createButtonText} "${searchValue}"`}
                        </div>
                      </div>
                    </CommandItem>
                  </>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}