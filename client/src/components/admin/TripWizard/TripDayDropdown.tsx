import { useState, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { SingleDropDownNew } from '@/components/ui/single-drop-down-new';

interface ScheduleEntry {
  dayNumber: number;
  date: string;
  imageUrl?: string;
  description?: string;
}

interface ItineraryEntry {
  dayNumber: number;
  date: string;
  portName?: string;
  locationType?: string;
  arrivalTime?: string;
  departureTime?: string;
  allAboardTime?: string;
  imageUrl?: string;
  description?: string;
}

interface TripDayDropdownProps {
  tripType: 'resort' | 'cruise';
  scheduleEntries?: ScheduleEntry[];
  itineraryEntries?: ItineraryEntry[];
  value: string; // ISO date
  onChange: (date: string) => void;
  required?: boolean;
  label?: string;
  className?: string;
}

export function TripDayDropdown({
  tripType,
  scheduleEntries = [],
  itineraryEntries = [],
  value,
  onChange,
  required = false,
  label = 'Day',
  className,
}: TripDayDropdownProps) {
  // Build day options from schedule/itinerary entries
  const dayOptions = useMemo(() => {
    const entries = tripType === 'resort' ? scheduleEntries : itineraryEntries;

    return entries
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .map(entry => {
        let dayLabel = '';

        if (entry.dayNumber < 0) {
          dayLabel = 'Pre-Trip';
        } else if (entry.dayNumber >= 100) {
          dayLabel = 'Post-Trip';
        } else {
          dayLabel = `Day ${entry.dayNumber}`;
        }

        // Format date nicely (timezone-agnostic - no timezone conversions)
        const datePart = entry.date.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const formattedDate = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        return {
          value: datePart, // Return only YYYY-MM-DD, not full timestamp
          label: `${dayLabel} - ${formattedDate}`,
        };
      });
  }, [tripType, scheduleEntries, itineraryEntries]);

  return (
    <SingleDropDownNew
      label={label}
      placeholder="Select a day"
      emptyMessage="No days available"
      options={dayOptions}
      value={value}
      onChange={onChange}
      required={required}
      className={className}
    />
  );
}
