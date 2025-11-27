import React from 'react';
import { TableColumn } from '@/hooks/use-table-state';
import { getOptimizedImageUrl, IMAGE_PRESETS } from '@/lib/image-utils';

// STANDARDIZED COLUMN SPECIFICATIONS
// These are the EXACT specifications that must be used across ALL admin tables

export const FIXED_COLUMN_SPECS = {
  image: {
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    resizable: false,
    sortable: false,
    className: '',
  },
  actions: {
    width: 100,
    className: 'text-center',
  },
} as const;

export const ICON_SPECS = {
  // Table icons
  tableIcon: {
    className: 'h-6 w-6',
  },
  // Image placeholder icon
  imagePlaceholder: {
    className: 'h-6 w-6 text-white/70',
  },
  // Action button icons
  actionIcon: {
    className: 'h-4 w-4',
  },
  // Add button icon
  addIcon: {
    className: 'h-5 w-5 text-blue-400/80',
  },
} as const;

export const BUTTON_SPECS = {
  // Standard action buttons
  actionButton: {
    className:
      'h-4 w-4 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-white/10',
  },
  // Destructive action buttons (delete, remove, etc.)
  destructiveButton: {
    className:
      'h-4 w-4 rounded-xl border border-[#fb7185]/30 bg-[#fb7185]/10 text-[#fb7185] hover:bg-[#fb7185]/20',
  },
  // Add new item button
  addButton: {
    className:
      'h-4 w-4 rounded-xl border border-white/15 bg-blue-500/10 text-white/80 hover:bg-blue-500/15',
  },
  // Button container
  actionContainer: {
    className: 'flex items-center justify-center gap-1.5',
  },
} as const;

export const IMAGE_SPECS = {
  // Image container
  container: {
    className: 'flex items-center justify-center',
  },
  // Image wrapper with gradient background
  wrapper: {
    className:
      'flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10',
  },
  // Image element
  image: {
    className: 'h-full w-full rounded-xl object-cover',
  },
} as const;

export const TABLE_LAYOUT_SPECS = {
  // Table header
  header: {
    className:
      'flex flex-col gap-2 border-b border-white/10 pl-6 pr-3 py-3 md:flex-row md:items-center md:justify-between',
  },
  // Table title
  title: {
    className: 'text-lg font-semibold text-white',
  },
  // Table footer
  footer: {
    className: 'flex items-center justify-between border-t border-white/10 px-6 py-4',
  },
  // Footer text
  footerText: {
    className: 'text-xs text-white/50',
  },
  // Table wrapper
  wrapper: {
    className:
      'rounded-2xl border border-white/10 bg-white/5/80 shadow-2xl shadow-black/40 backdrop-blur',
  },
} as const;

export const NAME_COLUMN_SPECS = {
  // Primary name text
  primaryText: {
    className: 'font-bold text-xs text-white',
  },
  // No secondary text (slug, etc.) should be shown
  showSecondary: false,
} as const;

// Helper function to create standard image column
export function createImageColumn<T>(
  getImageUrl?: (item: T) => string | undefined,
  getName?: (item: T) => string,
  PlaceholderIcon?: React.ComponentType<{ className?: string }>
): TableColumn {
  return {
    key: 'image',
    label: '',
    priority: 'high',
    ...FIXED_COLUMN_SPECS.image,
    render: (_value: any, item: T) => {
      const rawUrl = getImageUrl && getImageUrl(item);
      // Use thumbnail preset for admin table images (80x80)
      const optimizedUrl = rawUrl
        ? getOptimizedImageUrl(rawUrl, IMAGE_PRESETS.thumbnail)
        : undefined;

      const imageElement = (
        <div className={IMAGE_SPECS.container.className}>
          <div className={IMAGE_SPECS.wrapper.className}>
            {optimizedUrl ? (
              <img
                src={optimizedUrl}
                alt={getName ? getName(item) : ''}
                className={IMAGE_SPECS.image.className}
                loading="lazy"
              />
            ) : PlaceholderIcon ? (
              <PlaceholderIcon className={ICON_SPECS.imagePlaceholder.className} />
            ) : null}
          </div>
        </div>
      );
      return imageElement;
    },
  };
}

// Helper function to create standard name column
export function createNameColumn<T>(
  key: string,
  label: string,
  getName: (item: T) => string,
  minWidth: number = 200
): TableColumn {
  return {
    key,
    label,
    priority: 'high',
    sortable: true,
    minWidth,
    render: (_value: any, item: T) => {
      const nameElement = (
        <p className={NAME_COLUMN_SPECS.primaryText.className}>{getName(item)}</p>
      );
      return nameElement;
    },
  };
}

// Helper to format footer text
export function formatTableFooter(showing: number, total: number, itemName: string): string {
  return `Showing ${showing} of ${total} ${itemName}`;
}

// Helper to format table title
export function formatTableTitle(
  title: string,
  showCount: boolean = false,
  count?: number
): string {
  // Never show count in title per template
  return title;
}

// IMPORTANT: Column Structure for Admin Tables
// All admin tables follow this pattern:
// 1. FIRST COLUMN: Image (fixed 80px width) - use createImageColumn()
// 2. MIDDLE COLUMNS: Dynamic based on table type (trips, ships, resorts, etc.)
//    - These can have different widths, content, and rendering
//    - Examples:
//      - Trips: name, startDate, status, highlights
//      - Ships: name, cruiseLine, capacity, features
//      - Resorts: name, location, roomCount, amenities
// 3. LAST COLUMN: Actions (fixed 100px width) - automatically added by EnhancedTable
//
// The key is that ONLY the first (image) and last (actions) columns are fixed.
// Everything in between is customizable per table.
