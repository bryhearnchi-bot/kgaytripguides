'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Custom scrollbar styles for dropdown menus - matches fly-out menu gray scrollbar
const scrollbarStyles = `
  .pill-dropdown-command {
    overflow: visible !important;
  }
  [cmdk-list].pill-dropdown-scroll {
    scrollbar-width: thin !important;
    scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05) !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    -webkit-overflow-scrolling: touch !important;
    pointer-events: auto !important;
    touch-action: pan-y !important;
  }
  [cmdk-list].pill-dropdown-scroll::-webkit-scrollbar {
    width: 10px !important;
    display: block !important;
    opacity: 1 !important;
    visibility: visible !important;
  }
  [cmdk-list].pill-dropdown-scroll::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05) !important;
    border-radius: 5px !important;
  }
  [cmdk-list].pill-dropdown-scroll::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2) !important;
    border-radius: 5px !important;
    min-height: 30px !important;
  }
  [cmdk-list].pill-dropdown-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3) !important;
  }
`;

export interface PillDropdownOption {
  value: string;
  label: string;
  shortLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface PillDropdownProps {
  options: PillDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  emptyMessage?: string;
}

// Pill-style trigger classes - matches schedule/parties tab bar height and background exactly
const pillTriggerClasses =
  'flex items-center justify-between space-x-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors duration-200 border border-white/20 hover:border-white/30 h-auto min-h-0';

export function PillDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select',
  className = '',
  triggerClassName = '',
  emptyMessage = 'No options found.',
}: PillDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const openTimeRef = React.useRef<number>(0);

  const selectedOption = options.find(opt => opt.value === value);
  const currentLabel = selectedOption?.shortLabel || selectedOption?.label || placeholder;

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

  const scrollPositionRef = React.useRef(0);

  React.useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;
    const scrollY = window.scrollY;

    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    scrollPositionRef.current = scrollY;

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, scrollPositionRef.current);
    };
  }, [open]);

  // Debug scrolling and test scroll functionality
  React.useEffect(() => {
    if (open) {
      // Wait for DOM to render
      setTimeout(() => {
        const list = document.querySelector('[cmdk-list]') as HTMLElement;
        if (list) {
          console.log('🔍 PillDropdown Scroll Debug:', {
            scrollHeight: list.scrollHeight,
            clientHeight: list.clientHeight,
            offsetHeight: list.offsetHeight,
            maxHeight: list.style.maxHeight,
            computedMaxHeight: window.getComputedStyle(list).maxHeight,
            overflowY: window.getComputedStyle(list).overflowY,
            overflow: window.getComputedStyle(list).overflow,
            canScroll: list.scrollHeight > list.clientHeight,
            className: list.className,
            parentOverflow: window.getComputedStyle(list.parentElement!).overflow,
            parentClassName: list.parentElement?.className,
            optionsCount: options.length,
            hasScrollbar: list.scrollHeight > list.clientHeight,
            pointerEvents: window.getComputedStyle(list).pointerEvents,
            touchAction: window.getComputedStyle(list).touchAction,
          });

          // Test if we can programmatically scroll
          const originalScrollTop = list.scrollTop;
          list.scrollTop = 10;
          setTimeout(() => {
            const newScrollTop = list.scrollTop;
            console.log('🔍 Scroll Test:', {
              originalScrollTop,
              newScrollTop,
              canScrollProgrammatically: newScrollTop !== originalScrollTop,
            });
            list.scrollTop = originalScrollTop;
          }, 50);
        }
      }, 100);
    }
  }, [open, options.length]);

  return (
    <>
      <style>{scrollbarStyles}</style>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(pillTriggerClasses, triggerClassName, className)}
            style={{ height: 'auto', minHeight: 0, paddingTop: '6px', paddingBottom: '6px' }}
            onPointerDown={e => {
              // Prevent the pointer event from bubbling - this helps on mobile
              e.stopPropagation();
            }}
            onMouseDown={e => {
              // Prevent mouse events from bubbling
              e.stopPropagation();
            }}
          >
            <span className="truncate text-xs leading-tight">{currentLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 text-white/70 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="min-w-[200px] w-auto p-0 border border-white/10 rounded-[20px] shadow-xl text-white"
          align="end"
          sideOffset={4}
          style={{
            backgroundColor: 'rgba(0, 33, 71, 1)',
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
          }}
        >
          <Command className="bg-transparent pill-dropdown-command">
            <CommandList
              className="pill-dropdown-scroll"
              style={{
                maxHeight: '60vh',
                overflowY: 'auto',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
                pointerEvents: 'auto',
              }}
              onWheel={e => {
                e.stopPropagation();
                const target = e.currentTarget;
                target.scrollTop += e.deltaY;
              }}
              onTouchStart={e => e.stopPropagation()}
              onTouchMove={e => e.stopPropagation()}
              onTouchEnd={e => e.stopPropagation()}
            >
              <CommandEmpty className="py-4 text-xs text-white/60">{emptyMessage}</CommandEmpty>
              <CommandGroup className="overflow-visible">
                {options.map(option => {
                  const isSelected = option.value === value;
                  const Icon = option.icon;

                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
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
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
