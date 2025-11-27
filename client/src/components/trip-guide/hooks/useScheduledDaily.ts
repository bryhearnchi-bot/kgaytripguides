import { useMemo } from 'react';
import { getScheduleDate } from '../utils/dateHelpers';
import { getTodayString } from '@/lib/timeFormat';

interface DailySchedule {
  key: string;
  items: any[];
}

interface UseScheduledDailyProps {
  DAILY: DailySchedule[];
  tripStatus?: string;
}

export function useScheduledDaily({ DAILY, tripStatus = 'upcoming' }: UseScheduledDailyProps) {
  return useMemo(() => {
    // Create a map to collect all events by their scheduled date (applying 6am rule)
    const eventsByScheduledDate: Record<string, any[]> = {};

    DAILY.forEach(day => {
      day.items.forEach(event => {
        const scheduledDate = getScheduleDate(day.key, event.time);
        if (!eventsByScheduledDate[scheduledDate]) {
          eventsByScheduledDate[scheduledDate] = [];
        }
        eventsByScheduledDate[scheduledDate].push({
          ...event,
          originalDate: day.key, // Keep track of original date for reference
        });
      });
    });

    // Convert back to DAILY format, sorted by date
    const scheduledDaily = Object.keys(eventsByScheduledDate)
      .sort()
      .map(dateKey => ({
        key: dateKey,
        items: (eventsByScheduledDate[dateKey] || []).sort((a, b) => {
          // Custom sort to handle events that cross midnight
          const timeA = a.time;
          const timeB = b.time;

          // Convert time to minutes for proper chronological sorting
          const getMinutesFromMidnight = (time: string | undefined): number => {
            if (!time) return 0;
            const parts = time.split(':');
            const hours = Number(parts[0] || 0);
            const minutes = Number(parts[1] || 0);
            const adjustedHours = hours === 24 ? 0 : hours; // Handle 24:00 as 00:00

            // Events before 6am are "next day" events, so add 24 hours worth of minutes
            if (adjustedHours < 6) {
              return (adjustedHours + 24) * 60 + minutes;
            }
            return adjustedHours * 60 + minutes;
          };

          return getMinutesFromMidnight(timeA) - getMinutesFromMidnight(timeB);
        }),
      }));

    // Filter events based on cruise status and timing
    if (tripStatus !== 'current') {
      // For upcoming or past cruises, show all events
      return scheduledDaily;
    }

    // For current cruise, filter out past events
    const now = new Date();
    const today = getTodayString();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return scheduledDaily
      .map(day => ({
        ...day,
        items: day.items.filter(event => {
          // Use the original date of the event for comparison (before 6am rule was applied)
          const eventDate = event.originalDate || event.dateKey || event.key || day.key;

          // Future dates are always included
          if (today && eventDate > today) return true;

          // Past dates are excluded
          if (today && eventDate < today) return false;

          // For today, check the time
          if (today && eventDate === today) {
            const [eventHour, eventMinute] = event.time.split(':').map(Number);
            const eventTotalMinutes = eventHour * 60 + eventMinute;
            const currentTotalMinutes = currentHour * 60 + currentMinute;

            // Only show future events
            return eventTotalMinutes > currentTotalMinutes;
          }

          return true;
        }),
      }))
      .filter(day => day.items.length > 0); // Remove days with no events after filtering
  }, [DAILY, tripStatus]);
}
