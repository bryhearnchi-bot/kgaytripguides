import { useId, useState } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DropdownOption {
  value: string;
  label: string;
}

interface SingleDropDownNewProps {
  label?: string;
  placeholder?: string;
  emptyMessage?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function SingleDropDownNew({
  label,
  placeholder = 'Select an option',
  emptyMessage = 'No option found.',
  options,
  value,
  onChange,
  disabled = false,
  required = false,
  className = '',
}: SingleDropDownNewProps) {
  const id = useId();
  const [open, setOpen] = useState<boolean>(false);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={`w-full space-y-1 ${className}`}>
      {label && (
        <Label htmlFor={id} className="text-xs font-semibold text-white/90">
          {label} {required && <span className="text-cyan-400">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full h-10 justify-between px-3 font-normal',
              'bg-white/[0.04] border border-white/10 rounded-[10px]',
              'text-white hover:bg-white/[0.06] hover:border-white/10',
              'transition-all focus-visible:outline-none',
              'focus-visible:border-cyan-400/60 focus-visible:bg-cyan-400/[0.03]',
              'focus-visible:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              !selectedOption && 'text-white/50'
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto min-w-[var(--radix-popover-trigger-width)] p-0 bg-[#0a1628] border border-white/10 shadow-xl pointer-events-auto"
          align="start"
          container={typeof document !== 'undefined' ? document.body : undefined}
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <Command className="bg-transparent pointer-events-auto">
            <CommandInput
              placeholder="Search..."
              className="h-9 border-b border-white/10 bg-transparent text-white placeholder:text-white/40"
            />
            <CommandList className="max-h-[300px] overflow-y-auto pointer-events-auto">
              <CommandEmpty className="py-6 text-center text-sm text-white/50">
                {emptyMessage}
              </CommandEmpty>
              <CommandGroup className="p-1">
                {options.map(option => (
                  <CommandItem
                    value={option.label}
                    key={option.value}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      'px-3 py-2.5 cursor-pointer rounded-md transition-colors pointer-events-auto',
                      'text-white/90 hover:bg-cyan-400/10 hover:text-white',
                      "data-[selected='true']:bg-cyan-400/10 data-[selected='true']:text-white"
                    )}
                  >
                    {option.label}
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4 text-cyan-400',
                        option.value === value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
