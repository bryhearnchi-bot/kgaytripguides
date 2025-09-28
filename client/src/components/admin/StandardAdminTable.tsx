import React from 'react';
import { PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnhancedTripsTable } from '@/components/admin/EnhancedTripsTable';
import { TableColumn } from '@/hooks/use-table-state';
import {
  TABLE_LAYOUT_SPECS,
  BUTTON_SPECS,
  ICON_SPECS,
  FIXED_COLUMN_SPECS,
  formatTableFooter,
  formatTableTitle,
} from '@/config/admin-table-config';

interface TableAction {
  label: string;
  icon: React.ReactNode;
  onClick: (row: any) => void;
  variant?: 'default' | 'destructive';
  disabled?: (row: any) => boolean;
}

interface StandardAdminTableProps {
  // Table identification
  title: string;
  itemName: string; // e.g., "trips", "ships", "resorts"

  // Data
  data: any[];
  keyField?: string;

  // Columns - consumer provides ALL columns including the standardized image column
  columns: TableColumn[];

  // Actions - these will be rendered in the fixed-width actions column
  actions?: TableAction[];

  // Add button
  showAddButton?: boolean;
  onAddClick?: () => void;
  canAdd?: boolean;

  // Loading and empty states
  isLoading?: boolean;
  emptyMessage?: string;

  // Pagination (optional)
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;

  // Additional customization
  className?: string;
}

/**
 * StandardAdminTable - A consistent table component for all admin pages
 *
 * This component ensures:
 * 1. Image column is always 80px fixed width (first column)
 * 2. Actions column is always 100px fixed width (last column)
 * 3. Middle columns are dynamic based on the specific table
 * 4. Consistent header, footer, and styling across all admin tables
 *
 * Usage:
 * - For trips: Pass trip-specific columns (name, schedule, status, highlights)
 * - For ships: Pass ship-specific columns (name, cruise line, capacity, etc.)
 * - For resorts: Pass resort-specific columns (name, location, rooms, etc.)
 */
export function StandardAdminTable({
  title,
  itemName,
  data,
  keyField = 'id',
  columns,
  actions = [],
  showAddButton = false,
  onAddClick,
  canAdd = true,
  isLoading = false,
  emptyMessage,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  itemsPerPage = 10,
  className = '',
}: StandardAdminTableProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, data.length);
  const totalItems = data.length;

  // Validate that first column is image column with correct specs
  React.useEffect(() => {
    if (columns.length > 0 && columns[0].key === 'image') {
      const imageCol = columns[0];
      if (
        imageCol.width !== FIXED_COLUMN_SPECS.image.width ||
        imageCol.minWidth !== FIXED_COLUMN_SPECS.image.minWidth ||
        imageCol.maxWidth !== FIXED_COLUMN_SPECS.image.maxWidth
      ) {
        console.warn(
          `StandardAdminTable: Image column does not match standard specs. Expected width: ${FIXED_COLUMN_SPECS.image.width}, minWidth: ${FIXED_COLUMN_SPECS.image.minWidth}, maxWidth: ${FIXED_COLUMN_SPECS.image.maxWidth}`
        );
      }
    }
  }, [columns]);

  const defaultEmptyMessage = `No ${itemName} found`;

  return (
    <section className={`${TABLE_LAYOUT_SPECS.wrapper.className} ${className}`}>
      {/* Header */}
      <header className={TABLE_LAYOUT_SPECS.header.className}>
        <div>
          <h2 className={TABLE_LAYOUT_SPECS.title.className}>
            {formatTableTitle(`All ${itemName.charAt(0).toUpperCase() + itemName.slice(1)}`)}
          </h2>
        </div>
        {showAddButton && canAdd && onAddClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onAddClick}
            className={BUTTON_SPECS.addButton.className}
            title={`Add New ${itemName.slice(0, -1)}`}
          >
            <PlusSquare className={ICON_SPECS.addIcon.className} />
          </Button>
        )}
      </header>

      {/* Table */}
      <EnhancedTripsTable
        data={data}
        columns={columns}
        actions={actions}
        keyField={keyField}
        isLoading={isLoading}
        emptyMessage={emptyMessage || defaultEmptyMessage}
      />

      {/* Footer - only show if we have data */}
      {!isLoading && data.length > 0 && (
        <footer className={TABLE_LAYOUT_SPECS.footer.className}>
          <div className={TABLE_LAYOUT_SPECS.footerText.className}>
            {formatTableFooter(endItem - startItem + 1, totalItems, itemName)}
          </div>
          {totalPages > 1 && onPageChange && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-8 rounded-full border border-white/10 bg-white/5 px-3 text-xs text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                variant="ghost"
              >
                Previous
              </Button>
              <span className="text-xs text-white/50">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="h-8 rounded-full border border-white/10 bg-white/5 px-3 text-xs text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                variant="ghost"
              >
                Next
              </Button>
            </div>
          )}
        </footer>
      )}
    </section>
  );
}