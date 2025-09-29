import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parse date from ISO string as a local date (no timezone conversion)
// Treats the date as-is without any timezone adjustments
export function dateOnly(isoString: string | null | undefined): Date {
  // Handle null/undefined values
  if (!isoString) {
    return new Date(); // Return current date as fallback
  }

  // Extract just the date part (YYYY-MM-DD)
  const dateStr = isoString.split('T')[0];
  if (!dateStr) {
    return new Date(); // Return current date as fallback
  }

  const parts = dateStr.split('-').map(Number);
  const year = parts[0] || 2024;
  const month = parts[1] || 1;
  const day = parts[2] || 1;

  // Create date in local timezone with time at midnight
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}
