type TimeFormat = '12h' | '24h';

interface ParsedTime {
  h: number;
  m: number;
}

export function parseTime(timeStr: string): ParsedTime | null {
  if (!timeStr || timeStr === '—' || /overnight/i.test(timeStr)) return null;

  // Handle 24h format (HH:mm)
  const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match24 && match24[1] && match24[2]) {
    return { h: parseInt(match24[1], 10), m: parseInt(match24[2], 10) };
  }

  // Handle 12h format (H:mm AM/PM)
  const match12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12 && match12[1] && match12[2] && match12[3]) {
    let h = parseInt(match12[1], 10);
    const m = parseInt(match12[2], 10);
    const isPM = /pm/i.test(match12[3]);

    if (h === 12) h = 0;
    if (isPM) h += 12;

    return { h, m };
  }

  return null;
}

export function formatTime(timeStr: string | undefined, format: TimeFormat): string {
  if (!timeStr) return '—';

  const parsed = parseTime(timeStr);
  if (!parsed) return timeStr;

  const { h, m } = parsed;
  const mm = String(m).padStart(2, '0');

  if (format === '24h') {
    const hh = String(h).padStart(2, '0');
    return `${hh}:${mm}`;
  } else {
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const period = h >= 12 ? 'PM' : 'AM';
    return `${h12}:${mm} ${period}`;
  }
}

export function formatAllAboard(departTime: string | undefined, format: TimeFormat): string {
  if (!departTime) return '—';

  const parsed = parseTime(departTime);
  if (!parsed) return departTime;

  let { h, m } = parsed;
  h = h - 1;
  if (h < 0) h = 23;

  const mm = String(m).padStart(2, '0');

  if (format === '24h') {
    const hh = String(h).padStart(2, '0');
    return `${hh}:${mm}`;
  } else {
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const period = h >= 12 ? 'PM' : 'AM';
    return `${h12}:${mm} ${period}`;
  }
}

export function createTimeFromHoursMinutes(
  hours: number,
  minutes: number,
  format: TimeFormat
): string {
  const mm = String(minutes).padStart(2, '0');

  if (format === '24h') {
    const hh = String(hours).padStart(2, '0');
    return `${hh}:${mm}`;
  } else {
    const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const period = hours >= 12 ? 'PM' : 'AM';
    return `${h12}:${mm} ${period}`;
  }
}

/**
 * Parse a YYYY-MM-DD date string and return validated components
 * Returns null if parsing fails
 */
export function parseDateString(
  dateStr: string
): { year: number; month: number; day: number } | null {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  // Validate all parts are valid numbers
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  return { year, month, day };
}

/**
 * Format a Date object to YYYY-MM-DD string
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
