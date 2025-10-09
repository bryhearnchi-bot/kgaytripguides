import { parseTime } from '@/lib/timeFormat';

export function timeToMinutes(timeStr: string): number {
  const parsed = parseTime(timeStr);
  if (!parsed) return 9999; // Put unparseable times at the end
  return parsed.h * 60 + parsed.m;
}

export function isDateInPast(dateKey: string): boolean {
  const today = new Date();
  // Parse date string directly as local date
  const [year, month, day] = dateKey.split('-').map(Number);
  const tripDate = new Date(year || 2025, (month || 1) - 1, day || 1, 0, 0, 0, 0);

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
    const [year, month, day] = date.split('-').map(Number);
    const currentDate = new Date(year, month - 1, day);
    currentDate.setDate(currentDate.getDate() - 1);
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return date;
}
