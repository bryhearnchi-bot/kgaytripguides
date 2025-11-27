/**
 * Format trip dates for display
 * Uses local date parsing to avoid timezone issues per CLAUDE.md rules
 */
export function formatTripDates(startDate?: string, endDate?: string): string | null {
  if (!startDate || !endDate) return null;

  const startDateStr = startDate.split('T')[0] ?? '';
  const endDateStr = endDate.split('T')[0] ?? '';

  const startParts = startDateStr.split('-');
  const startYear = Number(startParts[0] ?? 2025);
  const startMonth = Number(startParts[1] ?? 1);
  const startDay = Number(startParts[2] ?? 1);
  const endParts = endDateStr.split('-');
  const endYear = Number(endParts[0] ?? 2025);
  const endMonth = Number(endParts[1] ?? 1);
  const endDay = Number(endParts[2] ?? 1);

  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);

  const formatOptions: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };

  // If same month and year, show "Month Day - Day, Year"
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endDay}, ${start.getFullYear()}`;
  }

  // Otherwise show full dates
  const startFormatted = start.toLocaleDateString('en-US', formatOptions);
  const endFormatted = end.toLocaleDateString('en-US', formatOptions);
  return `${startFormatted} - ${endFormatted}`;
}
