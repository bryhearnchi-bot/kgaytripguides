'use client';

import { useState } from 'react';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: Date | string;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  className = '',
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  // Convert string to Date if needed
  const dateValue = value instanceof Date ? value : value ? new Date(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal h-10 px-3',
            'bg-white/[0.04] border border-white/10 rounded-[10px]',
            'text-white text-sm transition-all',
            'hover:bg-white/[0.06] hover:border-white/10',
            'focus-visible:outline-none focus-visible:border-cyan-400/60 focus-visible:bg-cyan-400/[0.03] focus-visible:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            className
          )}
        >
          <span className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4 text-white/60" />
            <span className={dateValue ? 'text-white/90' : 'text-white/50'}>
              {dateValue ? dateValue.toLocaleDateString() : placeholder}
            </span>
          </span>
          <ChevronDownIcon className="h-4 w-4 text-white/40" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] overflow-hidden p-0 bg-[#0a1628] border border-white/10 rounded-[10px] shadow-xl pointer-events-auto"
        align="start"
        container={typeof document !== 'undefined' ? document.body : undefined}
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <div className="w-full overflow-hidden">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={date => {
              onChange(date);
              setOpen(false);
            }}
            className="calendar-compact"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
