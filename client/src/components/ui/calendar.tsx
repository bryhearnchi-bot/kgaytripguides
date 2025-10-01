import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  // Check if compact mode is requested
  const isCompact = className?.includes('calendar-compact');

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', isCompact && '[&]:p-2 [&]:w-full', className)}
      classNames={{
        months: cn(
          'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
          isCompact && 'space-y-0'
        ),
        month: cn('space-y-4', isCompact && '!space-y-2 w-full'),
        caption: cn(
          'flex justify-center pt-1 relative items-center',
          isCompact && 'pt-0 pb-2 px-8'
        ),
        caption_label: cn('text-sm font-medium text-white', isCompact && 'text-[0.7rem]'),
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          isCompact
            ? 'h-5 w-5 min-h-[20px] min-w-[20px] bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 !p-0 flex items-center justify-center shrink-0 !rounded-full aspect-square [&_svg]:!size-2.5'
            : 'h-7 w-7 bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 p-0'
        ),
        nav_button_previous: cn(isCompact ? 'absolute left-1' : 'absolute left-1'),
        nav_button_next: cn(isCompact ? 'absolute right-1' : 'absolute right-1'),
        table: cn('w-full border-collapse', isCompact && 'table-fixed [&_td]:p-0.5 [&_th]:p-0.5'),
        head_row: isCompact ? '' : 'flex',
        head_cell: cn(
          'text-white/50 rounded-md font-normal',
          isCompact ? 'text-[0.6rem] text-center w-auto p-0' : 'text-[0.8rem] w-9'
        ),
        row: cn(isCompact ? '' : 'flex w-full mt-2'),
        cell: cn(
          'text-center p-0 relative',
          isCompact
            ? 'w-auto [&:has([aria-selected])]:bg-cyan-400/20 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20'
            : 'h-9 w-9 text-sm [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-cyan-400/20 [&:has([aria-selected])]:bg-cyan-400/20 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20'
        ),
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          isCompact
            ? 'w-full h-full aspect-square p-0 text-[0.65rem] leading-none font-normal text-white/90 hover:bg-white/10 hover:text-white aria-selected:opacity-100 pointer-events-auto cursor-pointer min-h-[1.5rem] flex items-center justify-center'
            : 'h-9 w-9 p-0 font-normal text-white/90 hover:bg-white/10 hover:text-white aria-selected:opacity-100 pointer-events-auto cursor-pointer'
        ),
        day_range_end: 'day-range-end',
        day_selected:
          'bg-cyan-400 text-white hover:bg-cyan-500 hover:text-white focus:bg-cyan-400 focus:text-white',
        day_today: 'bg-white/10 text-cyan-400 font-semibold',
        day_outside:
          'day-outside text-white/30 aria-selected:bg-cyan-400/20 aria-selected:text-white/50',
        day_disabled: 'text-white/20 opacity-50 cursor-not-allowed',
        day_range_middle: 'aria-selected:bg-cyan-400/20 aria-selected:text-white',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft
            className={cn(isCompact ? 'h-2.5 w-2.5' : 'h-4 w-4', className)}
            {...props}
          />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight
            className={cn(isCompact ? 'h-2.5 w-2.5' : 'h-4 w-4', className)}
            {...props}
          />
        ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
