import type { DailyEvent } from "@/data/trip-data";
import { parseTime } from '@/lib/timeFormat';

export interface CalendarEventData {
  title: string;
  startDate: Date;
  endDate: Date;
  location: string;
  description: string;
}

export function createCalendarEvent(event: DailyEvent, eventDate: string): CalendarEventData {
  // Parse the event date to get the year, month, day
  const dateMatch = eventDate.match(/(\w+),\s*(\w+)\s*(\d+)/);
  if (!dateMatch) {
    throw new Error('Invalid date format');
  }

  const [, , monthStr, dayStr] = dateMatch;
  const year = 2025;
  const monthMap: { [key: string]: number } = {
    'Jan': 0, 'January': 0,
    'Feb': 1, 'February': 1,
    'Mar': 2, 'March': 2,
    'Apr': 3, 'April': 3,
    'May': 4,
    'Jun': 5, 'June': 5,
    'Jul': 6, 'July': 6,
    'Aug': 7, 'August': 7,
    'Sep': 8, 'September': 8,
    'Oct': 9, 'October': 9,
    'Nov': 10, 'November': 10,
    'Dec': 11, 'December': 11
  };
  const month = monthMap[monthStr || ''] ?? 8; // Default to September for current trip
  const day = parseInt(dayStr || '0', 10);

  // Parse the event time
  const timeData = parseTime(event.time);
  if (!timeData) {
    throw new Error('Invalid time format');
  }

  // Create date in local timezone (no timezone adjustments)
  const startDate = new Date(year, month, day, timeData.h, timeData.m, 0, 0);

  // Set duration based on event type - KGay Travel pre-trip party is 3 hours, others are 1 hour
  const duration = event.title.includes("KGay Travel") ? 3 : 1;
  const endDate = new Date(startDate.getTime() + (duration * 60 * 60 * 1000));

  return {
    title: event.title,
    startDate,
    endDate,
    location: event.venue,
    description: `${event.title} at ${event.venue}`
  };
}

function formatDateForCalendar(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function generateICSContent(eventData: CalendarEventData): string {
  const startDate = formatDateForCalendar(eventData.startDate);
  const endDate = formatDateForCalendar(eventData.endDate);
  const now = formatDateForCalendar(new Date());

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Atlantis Trip Guide//Event//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@trip-guide.com`,
    `DTSTAMP:${now}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${eventData.title}`,
    `DESCRIPTION:${eventData.description}`,
    `LOCATION:${eventData.location}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export function addToGoogleCalendar(eventData: CalendarEventData): void {
  const startDate = eventData.startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDate = eventData.endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventData.title,
    dates: `${startDate}/${endDate}`,
    details: eventData.description,
    location: eventData.location
  });

  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
}

export function addToAppleCalendar(eventData: CalendarEventData): void {
  const icsContent = generateICSContent(eventData);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // Create a temporary link to trigger download/open
  const link = document.createElement('a');
  link.href = url;
  link.download = `${eventData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;

  // For iOS devices, try to open with calendar app
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    link.href = `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
  }

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the blob URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function downloadICS(eventData: CalendarEventData): void {
  const icsContent = generateICSContent(eventData);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${eventData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}