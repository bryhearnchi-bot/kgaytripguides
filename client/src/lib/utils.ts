import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parse date from ISO string without timezone conversion
// Converts "2025-08-21T00:00:00.000Z" to local Aug 21 (not Aug 20 in PDT)
export function dateOnly(isoString: string): Date {
  const [year, month, day] = isoString.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}
