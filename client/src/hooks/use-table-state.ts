import { useState, useEffect, useCallback } from 'react';

export interface TableColumn {
  key: string;
  label: string;
  className?: string;
  render?: (value: any, row: any) => React.ReactNode;
  mobileHidden?: boolean;
  priority?: 'high' | 'medium' | 'low';
  sortable?: boolean;
  resizable?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface TableState {
  columnWidths: Record<string, number>;
  sortConfig: SortConfig | null;
}

export function useTableState(
  tableId: string,
  defaultColumnWidths: Record<string, number> = {},
  defaultSortColumn?: string
) {
  const storageKey = `table_state_${tableId}`;

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    // Initialize with defaults on first render
    try {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsedState: TableState = JSON.parse(savedState);
        return { ...defaultColumnWidths, ...parsedState.columnWidths };
      }
    } catch (error) {}
    return defaultColumnWidths;
  });

  const [sortConfig, setSortConfig] = useState<SortConfig | null>(() => {
    // Initialize sort config on first render
    try {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsedState: TableState = JSON.parse(savedState);
        if (parsedState.sortConfig) {
          return parsedState.sortConfig;
        }
      }
    } catch (error) {}
    // If no saved sort and defaultSortColumn provided, use default
    return defaultSortColumn ? { key: defaultSortColumn, direction: 'asc' } : null;
  });

  // Save state to localStorage whenever it changes (but skip initial load)
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      return;
    }

    const state: TableState = {
      columnWidths,
      sortConfig,
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {}
  }, [storageKey, columnWidths, sortConfig, isInitialized]);

  const updateColumnWidth = useCallback((columnKey: string, width: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [columnKey]: width,
    }));
  }, []);

  const handleSort = useCallback((columnKey: string) => {
    setSortConfig(prev => {
      if (prev?.key === columnKey) {
        // Toggle between asc and desc for the same column
        return { key: columnKey, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      } else {
        // New column, start with asc
        return { key: columnKey, direction: 'asc' };
      }
    });
  }, []);

  const sortData = useCallback(
    (data: any[], computedValueExtractor?: (item: any, key: string) => any) => {
      if (!sortConfig) return data;

      return [...data].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Use computed value extractor if provided
        if (computedValueExtractor) {
          aValue = computedValueExtractor(a, sortConfig.key);
          bValue = computedValueExtractor(b, sortConfig.key);
        }

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        // Handle different data types
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const result = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
          return sortConfig.direction === 'asc' ? result : -result;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          const result = aValue - bValue;
          return sortConfig.direction === 'asc' ? result : -result;
        }

        // Handle Date objects
        if (aValue instanceof Date && bValue instanceof Date) {
          const result = aValue.getTime() - bValue.getTime();
          return sortConfig.direction === 'asc' ? result : -result;
        }

        // Handle date strings
        if (
          typeof aValue === 'string' &&
          typeof bValue === 'string' &&
          (aValue.match(/^\d{4}-\d{2}-\d{2}/) || bValue.match(/^\d{4}-\d{2}-\d{2}/))
        ) {
          const dateA = new Date(aValue);
          const dateB = new Date(bValue);
          if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
            const result = dateA.getTime() - dateB.getTime();
            return sortConfig.direction === 'asc' ? result : -result;
          }
        }

        // Fallback to string comparison
        const result = String(aValue).localeCompare(String(bValue));
        return sortConfig.direction === 'asc' ? result : -result;
      });
    },
    [sortConfig]
  );

  return {
    columnWidths,
    sortConfig,
    updateColumnWidth,
    handleSort,
    sortData,
  };
}
