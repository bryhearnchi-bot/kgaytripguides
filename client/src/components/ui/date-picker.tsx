'use client';

import { useState } from 'react';
import { CalendarIcon, ChevronDown } from 'lucide-react';
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
  fromDate?: Date; // Minimum selectable date
  toDate?: Date; // Maximum selectable date
  disabledDates?: (date: Date) => boolean; // Custom function to disable specific dates
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  className = '',
  fromDate,
  toDate,
  disabledDates,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  // Helper to parse date string in local timezone (not UTC)
  const parseDateString = (dateStr: string): Date | undefined => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return undefined;

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    // Validate all parts are valid numbers
    if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined;
    if (month < 1 || month > 12) return undefined;
    if (day < 1 || day > 31) return undefined;

    return new Date(year, month - 1, day);
  };

  // Convert string to Date if needed - parse in local timezone
  const dateValue =
    value instanceof Date ? value : value ? parseDateString(value as string) : undefined;

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
            'focus-visible:outline-none focus-visible:border-white/60 focus-visible:bg-white/[0.08] focus-visible:shadow-[0_0_0_2px_rgba(255,255,255,0.28)] focus-visible:ring-0 focus-visible:ring-offset-0',
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
          <ChevronDown className="h-4 w-4 text-white/40" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] overflow-hidden p-0 border border-white/10 rounded-[10px] shadow-xl pointer-events-auto"
        align="start"
        container={typeof document !== 'undefined' ? document.body : undefined}
        onOpenAutoFocus={e => e.preventDefault()}
        style={{
          backgroundColor: 'rgba(0, 33, 71, 1)',
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
        }}
      >
        <div className="w-full overflow-hidden">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={date => {
              onChange(date);
              setOpen(false);
            }}
            disabled={date => {
              if (fromDate && date < fromDate) return true;
              if (toDate && date > toDate) return true;
              if (disabledDates && disabledDates(date)) return true;
              return false;
            }}
            fromDate={fromDate}
            toDate={toDate}
            className="calendar-compact"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
