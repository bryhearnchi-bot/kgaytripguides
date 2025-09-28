import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  CheckIcon,
  XCircle,
  ChevronDown,
  XIcon,
  WandSparkles,
  Plus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

// Type aliases for backward compatibility
export interface MultiSelectItem {
  id: number | string;
  name: string;
  description?: string;
}

export type MultiSelectMenuVariant = 'compact' | 'minimal' | 'elevated';

// Convert our item format to the shadcn format
interface MultiSelectOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

const multiSelectVariants = cva("m-1 transition-all duration-300 ease-in-out", {
  variants: {
    variant: {
      default: "border-foreground/10 text-foreground bg-card hover:bg-card/80",
      secondary:
        "border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive:
        "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
      inverted: "inverted",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface MultiSelectWithCreateProps
  extends VariantProps<typeof multiSelectVariants> {
  items: MultiSelectItem[];
  selectedIds: (number | string)[];
  onSelectionChange: (selectedIds: (number | string)[]) => void;
  onCreate?: (name: string) => Promise<void> | void;
  renderItem?: (item: MultiSelectItem) => React.ReactNode;
  placeholder?: string;
  createButtonText?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  menuVariant?: MultiSelectMenuVariant;
  maxItems?: number;
  hidePlaceholderWhenSelected?: boolean;
  hideSearchWhenEmpty?: boolean;
  displaySelectedBelow?: boolean;
  container?: HTMLElement;
}

// Custom styles for scrollbar
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

export function MultiSelectWithCreate({
  items,
  selectedIds,
  onSelectionChange,
  onCreate,
  renderItem,
  placeholder = "Select items...",
  createButtonText = "Create New",
  searchPlaceholder = "Search...",
  disabled = false,
  loading = false,
  className,
  menuVariant = 'compact',
  maxItems = 3,
  hidePlaceholderWhenSelected = false,
  hideSearchWhenEmpty = false,
  displaySelectedBelow = false,
  variant = "default",
  container,
}: MultiSelectWithCreateProps) {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  // Now using real data from database

  // Convert items to options format - using testItems instead of items
  const options: MultiSelectOption[] = React.useMemo(() =>
    items.map(item => ({
      label: item.name,
      value: String(item.id),
      disabled: false,
    })),
    [items]
  );

  // Get selected items - using testItems instead of items
  const selectedItems = React.useMemo(() =>
    items.filter(item => selectedIds.includes(item.id)),
    [items, selectedIds]
  );

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;
    return options.filter(
      option =>
        option.label.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [options, searchValue]);

  // Check if we should show create button - using testItems instead of items
  const showCreateButton = onCreate && searchValue.trim() &&
    !items.some(item => item.name.toLowerCase() === searchValue.toLowerCase());

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (showCreateButton) {
        handleCreate();
      } else {
        setIsPopoverOpen(true);
      }
    } else if (event.key === "Backspace" && !event.currentTarget.value) {
      const newSelectedIds = [...selectedIds];
      newSelectedIds.pop();
      onSelectionChange(newSelectedIds);
    }
  };

  const toggleOption = (optionValue: string) => {
    if (disabled) return;
    const itemId = items.find(item => String(item.id) === optionValue)?.id;
    if (!itemId) return;

    const newSelectedIds = selectedIds.includes(itemId)
      ? selectedIds.filter(id => id !== itemId)
      : [...selectedIds, itemId];
    onSelectionChange(newSelectedIds);
  };

  const handleClear = () => {
    if (disabled) return;
    onSelectionChange([]);
  };

  const handleTogglePopover = () => {
    if (disabled) return;
    setIsPopoverOpen(prev => !prev);
  };

  const toggleAll = () => {
    if (disabled) return;
    if (selectedIds.length === items.length) {
      handleClear();
    } else {
      onSelectionChange(items.map(item => item.id));
    }
  };

  const handleCreate = async () => {
    if (!onCreate || !searchValue.trim() || creating) return;

    try {
      setCreating(true);
      await onCreate(searchValue.trim());
      setSearchValue("");
    } catch (error) {
      console.error('Error creating item:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleRemove = (e: React.MouseEvent, itemId: number | string) => {
    e.stopPropagation();
    onSelectionChange(selectedIds.filter(id => id !== itemId));
  };

  React.useEffect(() => {
    if (!isPopoverOpen) {
      setSearchValue("");
    }
  }, [isPopoverOpen]);

  return (
    <div className={cn("w-full", className)}>
      <style>{scrollbarStyles}</style>
      <Popover
        open={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}
        modal={false}>
        <PopoverTrigger asChild>
          <Button
            onClick={handleTogglePopover}
            disabled={disabled || loading}
            role="combobox"
            aria-expanded={isPopoverOpen}
            aria-haspopup="listbox"
            className={cn(
              "flex p-2 rounded-xl border min-h-[44px] h-auto items-center justify-between",
              "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15",
              "transition-all duration-200 w-full text-left",
              disabled && "opacity-50 cursor-not-allowed"
            )}>
            {!displaySelectedBelow && selectedItems.length > 0 ? (
              <div className="flex justify-between items-center w-full">
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedItems.slice(0, maxItems).map((item) => (
                    <Badge
                      key={item.id}
                      className={cn(
                        "bg-blue-500/20 text-blue-100 border-blue-400/30",
                        "hover:bg-blue-500/25 text-xs px-2 py-0.5 rounded-md",
                        "flex items-center gap-1"
                      )}
                      variant={variant}>
                      <span className="truncate max-w-[100px]">{item.name}</span>
                      <XCircle
                        className="h-3 w-3 cursor-pointer hover:text-blue-200"
                        onClick={(e) => handleRemove(e, item.id)}
                      />
                    </Badge>
                  ))}
                  {selectedItems.length > maxItems && (
                    <Badge
                      className="bg-blue-500/20 text-blue-100 border-blue-400/30 text-xs px-2 py-0.5"
                      variant={variant}>
                      + {selectedItems.length - maxItems} more
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <XIcon
                    className="h-4 w-4 text-white/60 hover:text-white/80 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                  />
                  <Separator orientation="vertical" className="h-4" />
                  <ChevronDown className="h-4 w-4 text-white/60" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-white/40">
                  {placeholder}
                </span>
                <ChevronDown className="h-4 w-4 text-white/60" />
              </div>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          container={container}
          className={cn(
            "w-[--radix-popover-trigger-width] p-0",
            "bg-gradient-to-b from-[#1a2332] to-[#0f1420]",
            "border border-white/10 rounded-xl shadow-2xl"
          )}
          align="start"
          sideOffset={4}>
          <Command className="bg-transparent">
            <CommandInput
              placeholder={searchPlaceholder}
              onKeyDown={handleInputKeyDown}
              value={searchValue}
              onValueChange={setSearchValue}
              className="border-b border-white/10"
            />
            <CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar">
              <CommandEmpty className="text-white/40 py-4">
                {showCreateButton ? null : "No results found."}
              </CommandEmpty>

              {!searchValue && (
                <CommandGroup>
                  <CommandItem
                    onSelect={toggleAll}
                    className="cursor-pointer text-white/80 hover:text-white">
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                        selectedIds.length === items.length
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "border-white/30"
                      )}>
                      <CheckIcon className={cn(
                        "h-3 w-3",
                        selectedIds.length === items.length ? "" : "invisible"
                      )} />
                    </div>
                    <span>Select All</span>
                  </CommandItem>
                </CommandGroup>
              )}

              {filteredOptions.length > 0 && (
                <CommandGroup>
                  {filteredOptions.map((option) => {
                    const item = items.find(i => String(i.id) === option.value);
                    const isSelected = item && selectedIds.includes(item.id);
                    return (
                      <CommandItem
                        key={option.value}
                        onSelect={() => toggleOption(option.value)}
                        className="cursor-pointer text-white/80 hover:text-white">
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                            isSelected
                              ? "bg-blue-500 border-blue-500 text-white"
                              : "border-white/30"
                          )}>
                          <CheckIcon className={cn(
                            "h-3 w-3",
                            isSelected ? "" : "invisible"
                          )} />
                        </div>
                        {renderItem && item ? (
                          renderItem(item)
                        ) : (
                          <div>
                            <div className="font-medium text-white">
                              {option.label}
                            </div>
                            {item?.description && (
                              <div className="text-xs text-white/60 mt-0.5">
                                {item.description}
                              </div>
                            )}
                          </div>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {showCreateButton && (
                <>
                  <CommandSeparator className="my-1 border-t border-white/10" />
                  <CommandGroup>
                    <CommandItem
                      onSelect={handleCreate}
                      className={cn(
                        "cursor-pointer text-blue-400 hover:text-blue-300",
                        creating && "opacity-50 cursor-not-allowed"
                      )}
                      disabled={creating}>
                      <div className="mr-2 flex h-4 w-4 items-center justify-center">
                        <Plus className="h-4 w-4" />
                      </div>
                      <span>
                        {creating ? 'Creating...' : `${createButtonText} "${searchValue}"`}
                      </span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}

              <CommandSeparator className="border-t border-white/10" />
              <CommandGroup>
                <div className="flex items-center justify-between">
                  {selectedIds.length > 0 && (
                    <>
                      <CommandItem
                        onSelect={handleClear}
                        className="flex-1 justify-center cursor-pointer text-white/60 hover:text-white">
                        Clear
                      </CommandItem>
                      <Separator orientation="vertical" className="h-6" />
                    </>
                  )}
                  <CommandItem
                    onSelect={() => setIsPopoverOpen(false)}
                    className="flex-1 justify-center cursor-pointer text-white/60 hover:text-white">
                    Close
                  </CommandItem>
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {displaySelectedBelow && selectedItems.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedItems.map((item) => (
            <Badge
              key={item.id}
              className={cn(
                "bg-blue-500/20 text-blue-100 border-blue-400/30",
                "hover:bg-blue-500/25 text-xs px-2 py-0.5 rounded-md",
                "flex items-center gap-1"
              )}
              variant={variant as any}>
              <span>{item.name}</span>
              <XCircle
                className="h-3 w-3 cursor-pointer hover:text-blue-200"
                onClick={() => onSelectionChange(selectedIds.filter(id => id !== item.id))}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Re-export for compatibility
export interface MultiSelectRef {
  reset: () => void;
  getSelectedValues: () => string[];
  setSelectedValues: (values: string[]) => void;
  clear: () => void;
  focus: () => void;
}