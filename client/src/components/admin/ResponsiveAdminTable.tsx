import React, { useState } from 'react';
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
import { ChevronDown, ChevronRight, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RowData = Record<string, any>;

interface TableColumn {
  key: string;
  label: string;
  className?: string;
  render?: (value: unknown, row: RowData) => React.ReactNode;
  mobileHidden?: boolean;
  priority?: 'high' | 'medium' | 'low'; // For mobile column prioritization
}

interface TableAction {
  label: string;
  icon: React.ReactNode;
  onClick: (row: RowData) => void;
  variant?: 'default' | 'destructive';
  disabled?: (row: RowData) => boolean;
}

interface ResponsiveAdminTableProps {
  data: RowData[];
  columns: TableColumn[];
  actions?: TableAction[];
  keyField?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  mobileBreakpoint?: number;
}

export function ResponsiveAdminTable({
  data,
  columns,
  actions = [],
  keyField = 'id',
  isLoading = false,
  emptyMessage = 'No data available',
  className = '',
  mobileBreakpoint = 768,
}: ResponsiveAdminTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < mobileBreakpoint
  );

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileBreakpoint]);

  const toggleRowExpansion = (rowKey: string | number) => {
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

  const mobileVisibleColumns = highPriorityColumns.slice(0, 2); // Show only 2 most important columns on mobile
  const hiddenColumns = [
    ...mediumPriorityColumns,
    ...lowPriorityColumns,
    ...highPriorityColumns.slice(2),
  ];

  const renderCellValue = (column: TableColumn, row: RowData) => {
    const value = row[column.key];
    return column.render ? column.render(value, row) : String(value ?? '');
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

  if (data.length === 0) {
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
        {data.map(row => {
          const rowKey = row[keyField] as string | number;
          const isExpanded = expandedRows.has(rowKey);

          return (
            <Card
              key={rowKey}
              className="border border-white/10 bg-white/5/80 backdrop-blur overflow-hidden"
            >
              <CardContent className="p-0">
                {/* Main content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      {mobileVisibleColumns.map(column => (
                        <div key={column.key} className="flex justify-between items-start gap-2">
                          <span className="text-xs text-white/50 font-medium min-w-0 flex-shrink-0">
                            {column.label}:
                          </span>
                          <div className="text-sm text-white text-right flex-1 min-w-0">
                            {renderCellValue(column, row)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
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
                        <DropdownMenu>
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
                            className="border-white/10"
                            style={{
                              backgroundColor: 'rgba(0, 33, 71, 1)',
                              backgroundImage:
                                'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
                            }}
                          >
                            {actions.map((action, index) => (
                              <DropdownMenuItem
                                key={index}
                                onClick={() => action.onClick(row)}
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
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && hiddenColumns.length > 0 && (
                  <div className="border-t border-white/10 bg-white/5 p-4 space-y-2">
                    {hiddenColumns.map(column => (
                      <div key={column.key} className="flex justify-between items-start gap-2">
                        <span className="text-xs text-white/50 font-medium min-w-0 flex-shrink-0">
                          {column.label}:
                        </span>
                        <div className="text-sm text-white text-right flex-1 min-w-0">
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

  // Desktop Table Layout
  return (
    <div className={`overflow-x-auto ${className}`}>
      <Table className="min-w-full text-sm text-white/80">
        <TableHeader className="bg-white/5">
          <TableRow className="border-white/10">
            {columns.map(column => (
              <TableHead key={column.key} className={`text-white/60 ${column.className || ''}`}>
                {column.label}
              </TableHead>
            ))}
            {actions.length > 0 && (
              <TableHead className="text-right text-white/60 w-[100px]">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(row => (
            <TableRow
              key={row[keyField] as string | number}
              className="border-white/10 hover:bg-white/5"
            >
              {columns.map(column => (
                <TableCell key={column.key} className={`py-4 ${column.className || ''}`}>
                  {renderCellValue(column, row)}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell className="text-right py-4">
                  <div className="flex items-center justify-end gap-1">
                    {actions.map((action, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="icon"
                        onClick={() => action.onClick(row)}
                        disabled={action.disabled?.(row)}
                        className={`h-8 w-8 rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 ${
                          action.variant === 'destructive'
                            ? 'border-[#fb7185]/30 bg-[#fb7185]/10 text-[#fb7185] hover:bg-[#fb7185]/20'
                            : ''
                        }`}
                        title={action.label}
                      >
                        {action.icon}
                      </Button>
                    ))}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
