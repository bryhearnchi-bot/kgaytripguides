import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight, MoreVertical, ChevronUp, ChevronsUpDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTableState, TableColumn } from '@/hooks/use-table-state';

interface TableAction {
  label: string;
  icon: React.ReactNode;
  onClick: (row: any) => void;
  variant?: 'default' | 'destructive';
  disabled?: (row: any) => boolean;
}

interface EnhancedThemesTableProps {
  data: any[];
  columns: TableColumn[];
  actions?: TableAction[];
  keyField?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  mobileBreakpoint?: number;
}

export function EnhancedThemesTable({
  data,
  columns,
  actions = [],
  keyField = 'id',
  isLoading = false,
  emptyMessage = 'No data available',
  className = '',
  mobileBreakpoint = 768,
}: EnhancedThemesTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<any>>(new Set());
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < mobileBreakpoint
  );
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const resizeStartPos = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);
  const nextColumnStartWidth = useRef<number>(0);
  const nextColumnKey = useRef<string>('');

  // Default column widths - stable object reference
  const defaultColumnWidths = useMemo(
    () => ({
      image: 80,
      name: 200,
      shortDescription: 250,
      costumeIdeas: 250,
      status: 120,
    }),
    []
  );

  const { columnWidths, sortConfig, updateColumnWidth, handleSort, sortData } = useTableState(
    'themes_table',
    defaultColumnWidths,
    'name' // Default sort by name column (first column after image)
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileBreakpoint]);

  // Handle column resizing
  const handleMouseDown = useCallback(
    (columnKey: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Find the next column
      const currentIndex = columns.findIndex(col => col.key === columnKey);
      const nextColumn = currentIndex < columns.length - 1 ? columns[currentIndex + 1] : null;

      if (!nextColumn) return; // Can't resize the last column

      setIsResizing(columnKey);
      resizeStartPos.current = e.clientX;
      resizeStartWidth.current =
        (columnWidths as Record<string, number>)[columnKey] ||
        (defaultColumnWidths as Record<string, number>)[columnKey] ||
        150;
      nextColumnStartWidth.current =
        (columnWidths as Record<string, number>)[nextColumn.key] ||
        (defaultColumnWidths as Record<string, number>)[nextColumn.key] ||
        150;
      nextColumnKey.current = nextColumn.key;
    },
    [columnWidths, defaultColumnWidths, columns]
  );

  useEffect(() => {
    if (!isResizing) return;

    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();

      // Use requestAnimationFrame to throttle updates
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        const diff = e.clientX - resizeStartPos.current;

        // Calculate new widths based on the initial widths
        const currentColumnNewWidth = Math.max(80, resizeStartWidth.current + diff);
        const nextColumnNewWidth = Math.max(80, nextColumnStartWidth.current - diff);

        // Update both columns in a batch
        const updatedWidths = {
          [isResizing]: currentColumnNewWidth,
          [nextColumnKey.current]: nextColumnNewWidth,
        };

        // Update both at once to prevent intermediate states
        Object.entries(updatedWidths).forEach(([key, width]) => {
          updateColumnWidth(key, width);
        });
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      setIsResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, updateColumnWidth]);

  const toggleRowExpansion = (rowKey: any) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowKey)) {
      newExpanded.delete(rowKey);
    } else {
      newExpanded.add(rowKey);
    }
    setExpandedRows(newExpanded);
  };

  // Get columns for different screen sizes
  const highPriorityColumns = columns.filter(col => col.priority === 'high' || !col.priority);
  const mediumPriorityColumns = columns.filter(col => col.priority === 'medium');
  const lowPriorityColumns = columns.filter(col => col.priority === 'low');

  const mobileVisibleColumns = highPriorityColumns.slice(0, 2);
  const hiddenColumns = [
    ...mediumPriorityColumns,
    ...lowPriorityColumns,
    ...highPriorityColumns.slice(2),
  ];

  const renderCellValue = (column: TableColumn, row: any) => {
    const value = row[column.key];
    return column.render ? column.render(value, row) : value;
  };

  // Sort data
  const sortedData = sortData(data);

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="h-3 w-3 text-white/30" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="h-3 w-3 text-white/70" />
    ) : (
      <ChevronDown className="h-3 w-3 text-white/70" />
    );
  };

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse border border-white/10 bg-white/5">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-4 bg-white/20 rounded w-3/4"></div>
                <div className="h-3 bg-white/15 rounded w-1/2"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-white/10 rounded w-16"></div>
                  <div className="h-6 bg-white/10 rounded w-20"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <Card className={`border border-white/10 bg-white/5 backdrop-blur ${className}`}>
        <CardContent className="p-8 text-center">
          <p className="text-white/60">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  // Mobile Card Layout
  if (isMobile) {
    return (
      <div className={`space-y-3 ${className}`}>
        {sortedData.map(row => {
          const rowKey = row[keyField];
          const isExpanded = expandedRows.has(rowKey);

          // Find specific columns for the new layout
          const imageColumn = columns.find(col => col.key === 'image');
          const nameColumn = columns.find(col => col.key === 'name');

          return (
            <Card
              key={rowKey}
              className="border border-white/10 bg-white/10 backdrop-blur-xl overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Image - left aligned */}
                    {imageColumn && (
                      <div className="flex-shrink-0">{renderCellValue(imageColumn, row)}</div>
                    )}

                    {/* Name - middle, flexible width */}
                    {nameColumn && (
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white font-medium">
                          {renderCellValue(nameColumn, row)}
                        </div>
                      </div>
                    )}

                    {/* Buttons - right aligned */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {hiddenColumns.length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => toggleRowExpansion(rowKey)}
                          className="h-8 w-8 rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                          title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}

                      {actions.length > 0 && (
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-8 w-8 rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-white/15 backdrop-blur-xl border-white/10"
                          >
                            {actions.map((action, index) => (
                              <DropdownMenuItem
                                key={index}
                                onSelect={e => {
                                  e.preventDefault();
                                  action.onClick(row);
                                }}
                                disabled={action.disabled?.(row)}
                                className={`text-white hover:bg-white/10 focus:bg-white/10 transition-colors ${
                                  action.variant === 'destructive'
                                    ? 'text-red-400 hover:bg-red-400/10'
                                    : ''
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {action.icon}
                                  {action.label}
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && hiddenColumns.length > 0 && (
                  <div className="border-t border-white/10 bg-white/5 p-4 space-y-2">
                    {hiddenColumns.map(column => (
                      <div key={column.key} className="flex justify-between items-start gap-2">
                        <span className="text-xs text-white/50 font-medium">{column.label}:</span>
                        <div className="text-xs text-white text-right flex-1">
                          {renderCellValue(column, row)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Enhanced Desktop Table Layout with resizing and sorting
  return (
    <div className={`w-full ${className}`}>
      <div className="overflow-x-auto">
        <Table
          className="text-xs text-white/80"
          style={{ tableLayout: 'auto', width: 'auto', minWidth: '100%' }}
        >
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10">
              {columns.map((column, index) => (
                <TableHead
                  key={column.key}
                  className={`text-white/60 relative group ${
                    index < columns.length - 1 || actions.length > 0
                      ? 'border-r border-white/10'
                      : ''
                  } ${
                    column.priority === 'low'
                      ? 'hidden lg:table-cell'
                      : column.priority === 'medium'
                        ? 'hidden md:table-cell'
                        : ''
                  } ${column.className || ''}`}
                  style={{
                    width:
                      column.key === 'image'
                        ? '80px'
                        : column.resizable === false
                          ? `${column.width || 150}px`
                          : `${columnWidths[column.key] || defaultColumnWidths[column.key as keyof typeof defaultColumnWidths] || 150}px`,
                  }}
                >
                  <div
                    className="flex items-center gap-2 cursor-pointer select-none"
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                  >
                    <span>{column.label}</span>
                    {column.sortable !== false && getSortIcon(column.key)}
                  </div>

                  {/* Resize handle - skip for non-resizable columns */}
                  {index < columns.length - 1 && column.resizable !== false && (
                    <div
                      className="absolute right-0 top-0 h-full w-2 cursor-col-resize opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-opacity -mr-1"
                      onMouseDown={e => handleMouseDown(column.key, e)}
                      style={{
                        background:
                          isResizing === column.key ? 'rgba(255,255,255,0.4)' : 'transparent',
                        opacity: isResizing === column.key ? 1 : undefined,
                      }}
                    />
                  )}
                </TableHead>
              ))}
              {actions.length > 0 && (
                <TableHead
                  className="text-center text-white/60"
                  style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}
                >
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map(row => (
              <TableRow key={row[keyField]} className="border-white/10 hover:bg-white/5">
                {columns.map(column => (
                  <TableCell
                    key={column.key}
                    className={`py-4 ${
                      column.priority === 'low'
                        ? 'hidden lg:table-cell'
                        : column.priority === 'medium'
                          ? 'hidden md:table-cell'
                          : ''
                    } ${column.className || ''}`}
                    style={{
                      width:
                        column.key === 'image'
                          ? '80px'
                          : column.resizable === false
                            ? `${column.width || 150}px`
                            : `${columnWidths[column.key] || defaultColumnWidths[column.key as keyof typeof defaultColumnWidths] || 150}px`,
                    }}
                  >
                    {renderCellValue(column, row)}
                  </TableCell>
                ))}
                {actions.length > 0 && (
                  <TableCell
                    className="py-4"
                    style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}
                  >
                    <div className="flex items-center justify-center">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-8 w-8 rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0f172a] border-white/10">
                          {actions.map((action, index) => (
                            <DropdownMenuItem
                              key={index}
                              onSelect={e => {
                                e.preventDefault();
                                action.onClick(row);
                              }}
                              disabled={action.disabled?.(row)}
                              className={`text-white hover:bg-white/10 ${
                                action.variant === 'destructive'
                                  ? 'text-red-400 hover:text-red-300'
                                  : ''
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {action.icon}
                                {action.label}
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
