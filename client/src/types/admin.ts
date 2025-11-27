/**
 * Admin Component Types
 * Generic types for admin tables, forms, and UI components
 */
import React from 'react';

/**
 * Generic table column definition
 * @template T - The row data type
 */
export interface TableColumn<T = Record<string, unknown>> {
  /** Unique key identifying this column, should match a property of T */
  key: string;
  /** Display label for the column header */
  label: string;
  /** Optional CSS class for styling */
  className?: string;
  /** Optional custom render function for cell content */
  render?: (value: unknown, row: T) => React.ReactNode;
  /** Whether to hide this column on mobile */
  mobileHidden?: boolean;
  /** Priority for mobile column visibility (high columns shown first) */
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Generic table action definition
 * @template T - The row data type
 */
export interface TableAction<T = Record<string, unknown>> {
  /** Display label for the action */
  label: string;
  /** Icon to display (React component or element) */
  icon: React.ReactNode;
  /** Click handler receiving the row data */
  onClick: (row: T) => void;
  /** Visual variant for the action button */
  variant?: 'default' | 'destructive';
  /** Function to determine if action should be disabled */
  disabled?: (row: T) => boolean;
}

/**
 * Props for ResponsiveAdminTable component
 * @template T - The row data type
 */
export interface ResponsiveAdminTableProps<T = Record<string, unknown>> {
  /** Array of data rows to display */
  data: T[];
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Optional action buttons for each row */
  actions?: TableAction<T>[];
  /** Property name to use as unique key for rows */
  keyField?: string;
  /** Loading state indicator */
  isLoading?: boolean;
  /** Message to display when data array is empty */
  emptyMessage?: string;
  /** Additional CSS class names */
  className?: string;
  /** Breakpoint width for switching to mobile layout */
  mobileBreakpoint?: number;
}

/**
 * Sort direction for table columns
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort configuration for tables
 */
export interface TableSort {
  /** Column key to sort by */
  column: string;
  /** Sort direction */
  direction: SortDirection;
}

/**
 * Pagination configuration for tables
 */
export interface TablePagination {
  /** Current page number (1-indexed) */
  page: number;
  /** Number of rows per page */
  pageSize: number;
  /** Total number of rows */
  total: number;
}

/**
 * Filter configuration for admin lists
 */
export interface AdminFilter {
  /** Filter field name */
  field: string;
  /** Filter operator */
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte';
  /** Filter value */
  value: string | number | boolean;
}

/**
 * Bulk action configuration
 */
export interface BulkAction<T = Record<string, unknown>> {
  /** Action identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon to display */
  icon?: React.ReactNode;
  /** Handler for the bulk action */
  onExecute: (selectedRows: T[]) => void | Promise<void>;
  /** Whether action is destructive (shows warning styling) */
  destructive?: boolean;
  /** Confirmation message before executing */
  confirmMessage?: string;
}

/**
 * Admin modal/dialog props
 */
export interface AdminModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Handler for closing the modal */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Optional description text */
  description?: string;
}

/**
 * Form field error state
 */
export interface FieldError {
  /** Field name */
  field: string;
  /** Error message */
  message: string;
}

/**
 * Generic form state for admin forms
 */
export interface AdminFormState<T> {
  /** Form data values */
  values: T;
  /** Field-level errors */
  errors: Record<string, string>;
  /** Whether form is submitting */
  isSubmitting: boolean;
  /** Whether form has been modified */
  isDirty: boolean;
}
