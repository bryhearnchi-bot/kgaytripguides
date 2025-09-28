import { useState, useEffect, useMemo, useCallback } from 'react';

export interface TableColumn {
  key: string;
  label: string;
  className?: string;
  render?: (value: any, row: any) => React.ReactNode;
  mobileHidden?: boolean;
  priority?: 'high' | 'medium' | 'low';
  // Enhanced properties
  sortable?: boolean;
  resizable?: boolean;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
}

interface TableState {
  columnWidths: Record<string, number>;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  columnOrder: string[];
}

interface UseEnhancedTableStateProps {
  tableId: string;
  columns: TableColumn[];
  data: any[];
  enableSorting?: boolean;
  enableResizing?: boolean;
  persistState?: boolean;
}

const DEFAULT_COLUMN_WIDTH = 150;
const MIN_COLUMN_WIDTH = 80;
const MAX_COLUMN_WIDTH = 400;

export function useEnhancedTableState({
  tableId,
  columns,
  data,
  enableSorting = true,
  enableResizing = true,
  persistState = true,
}: UseEnhancedTableStateProps) {
  // Initialize state from localStorage or defaults
  const getInitialState = useCallback((): TableState => {
    if (persistState && typeof window !== 'undefined') {
      const stored = localStorage.getItem(`table-state-${tableId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Validate stored state structure
          if (parsed && typeof parsed === 'object') {
            return {
              columnWidths: parsed.columnWidths || {},
              sortConfig: parsed.sortConfig || null,
              columnOrder: parsed.columnOrder || columns.map(col => col.key),
            };
          }
        } catch (error) {
          console.warn('Failed to parse stored table state:', error);
        }
      }
    }

    // Default state
    return {
      columnWidths: columns.reduce((acc, col) => {
        acc[col.key] = col.defaultWidth || DEFAULT_COLUMN_WIDTH;
        return acc;
      }, {} as Record<string, number>),
      sortConfig: null,
      columnOrder: columns.map(col => col.key),
    };
  }, [tableId, columns, persistState]);

  const [tableState, setTableState] = useState<TableState>(getInitialState);

  // Persist state to localStorage when it changes
  useEffect(() => {
    if (persistState && typeof window !== 'undefined') {
      localStorage.setItem(`table-state-${tableId}`, JSON.stringify(tableState));
    }
  }, [tableState, tableId, persistState]);

  // Sort data based on current sort configuration
  const sortedData = useMemo(() => {
    if (!enableSorting || !tableState.sortConfig) {
      return data;
    }

    const { key, direction } = tableState.sortConfig;
    return [...data].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return direction === 'asc' ? -1 : 1;
      if (bVal == null) return direction === 'asc' ? 1 : -1;

      // Handle different data types
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, tableState.sortConfig, enableSorting]);

  // Handle sorting
  const handleSort = useCallback((columnKey: string) => {
    if (!enableSorting) return;

    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    setTableState(prev => {
      const currentSort = prev.sortConfig;
      let newSortConfig: { key: string; direction: 'asc' | 'desc' } | null = null;

      if (currentSort?.key === columnKey) {
        // Toggle direction or clear sort
        if (currentSort.direction === 'asc') {
          newSortConfig = { key: columnKey, direction: 'desc' };
        } else {
          newSortConfig = null; // Clear sort on third click
        }
      } else {
        // Sort ascending by default
        newSortConfig = { key: columnKey, direction: 'asc' };
      }

      return { ...prev, sortConfig: newSortConfig };
    });
  }, [columns, enableSorting]);

  // Handle column resizing
  const handleColumnResize = useCallback((columnKey: string, newWidth: number) => {
    if (!enableResizing) return;

    const column = columns.find(col => col.key === columnKey);
    if (!column?.resizable) return;

    // Apply constraints
    const minWidth = column.minWidth || MIN_COLUMN_WIDTH;
    const maxWidth = column.maxWidth || MAX_COLUMN_WIDTH;
    const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

    setTableState(prev => ({
      ...prev,
      columnWidths: {
        ...prev.columnWidths,
        [columnKey]: constrainedWidth,
      },
    }));
  }, [columns, enableResizing]);

  // Reset table state to defaults
  const resetTableState = useCallback(() => {
    const defaultState = {
      columnWidths: columns.reduce((acc, col) => {
        acc[col.key] = col.defaultWidth || DEFAULT_COLUMN_WIDTH;
        return acc;
      }, {} as Record<string, number>),
      sortConfig: null,
      columnOrder: columns.map(col => col.key),
    };
    setTableState(defaultState);
  }, [columns]);

  // Get column width
  const getColumnWidth = useCallback((columnKey: string) => {
    return tableState.columnWidths[columnKey] || DEFAULT_COLUMN_WIDTH;
  }, [tableState.columnWidths]);

  // Get sort state for a column
  const getSortState = useCallback((columnKey: string) => {
    if (tableState.sortConfig?.key === columnKey) {
      return tableState.sortConfig.direction;
    }
    return null;
  }, [tableState.sortConfig]);

  return {
    // State
    sortedData,
    sortConfig: tableState.sortConfig,
    columnWidths: tableState.columnWidths,

    // Actions
    handleSort,
    handleColumnResize,
    resetTableState,

    // Getters
    getColumnWidth,
    getSortState,

    // Configuration
    enableSorting,
    enableResizing,
  };
}