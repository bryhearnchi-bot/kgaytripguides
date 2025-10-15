import { parseTime, parseDateString, formatDateToString } from '@/lib/timeFormat';

export function timeToMinutes(timeStr: string): number {
  const parsed = parseTime(timeStr);
  if (!parsed) return 9999; // Put unparseable times at the end
  return parsed.h * 60 + parsed.m;
}

export function isDateInPast(dateKey: string): boolean {
  const today = new Date();
  // Parse date string directly as local date
  const parsed = parseDateString(dateKey);
  if (!parsed) return false;

  const tripDate = new Date(parsed.year, parsed.month - 1, parsed.day, 0, 0, 0, 0);

  // Set today to start of day for comparison
  today.setHours(0, 0, 0, 0);

  return tripDate < today;
}

// Utility function: Events before 6am belong to the previous day's schedule
export function getScheduleDate(date: string, time: string | undefined): string {
  if (!time) return date;
  const timeParts = time.split(':');
  if (timeParts.length === 0) return date;
  const hour = parseInt(timeParts[0] || '0');
  if (hour < 6) {
    // Before 6am - belongs to previous day (timezone-agnostic)
    const parsed = parseDateString(date);
    if (!parsed) return date;

    const currentDate = new Date(parsed.year, parsed.month - 1, parsed.day);
    currentDate.setDate(currentDate.getDate() - 1);
    return formatDateToString(currentDate);
  }
  return date;
}
