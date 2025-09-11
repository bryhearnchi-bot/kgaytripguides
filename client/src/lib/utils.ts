import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parse date from ISO string as a local date (no timezone conversion)
// Treats the date as-is without any timezone adjustments
export function dateOnly(isoString: string): Date {
  // Extract just the date part (YYYY-MM-DD)
  const dateStr = isoString.split('T')[0];
  const [year, month, day] = dateStr.split('-').map(Number);
  // Create date in local timezone with time at midnight
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}
