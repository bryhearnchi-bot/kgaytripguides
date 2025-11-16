import React, { useState, useEffect, useMemo } from 'react';
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
import { MoreVertical, Edit, Building2 } from 'lucide-react';
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

interface EnhancedLookupTablesTableProps {
  data: any[];
  columns: TableColumn[];
  actions?: TableAction[];
  keyField?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  mobileBreakpoint?: number;
  nameField?: string;
}

export function EnhancedLookupTablesTable({
  data,
  columns,
  actions = [],
  keyField = 'id',
  isLoading = false,
  emptyMessage = 'No data available',
  className = '',
  mobileBreakpoint = 768,
  nameField = 'name',
}: EnhancedLookupTablesTableProps) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < mobileBreakpoint
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileBreakpoint]);

  const renderCellValue = (column: TableColumn, row: any) => {
    const value = row[column.key];
    return column.render ? column.render(value, row) : value;
  };

  // Sort data
  const { sortData } = useTableState('lookup_tables_table', {}, nameField);
  const sortedData = sortData(data);

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse border border-white/10 bg-white/5">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-4 bg-white/20 rounded w-3/4"></div>
                <div className="h-3 bg-white/15 rounded w-1/2"></div>
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
          const nameColumn = columns.find(col => col.key === nameField || col.key === 'name');
          const logoColumn = columns.find(col => col.key === 'logo');

          return (
            <Card
              key={rowKey}
              className="border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Logo - left aligned (if showLogo) */}
                    {logoColumn && (
                      <div className="flex-shrink-0">{renderCellValue(logoColumn, row)}</div>
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
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Desktop Table Layout
  return (
    <div className={`w-full ${className}`}>
      <div className="overflow-x-auto">
        <Table className="text-xs text-white/80">
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10">
              {columns.map(column => (
                <TableHead key={column.key} className={`text-white/60 ${column.className || ''}`}>
                  {column.label}
                </TableHead>
              ))}
              {actions.length > 0 && (
                <TableHead className="text-center text-white/60" style={{ width: '80px' }}>
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map(row => (
              <TableRow key={row[keyField]} className="border-white/10 hover:bg-white/5">
                {columns.map(column => (
                  <TableCell key={column.key} className={`py-4 ${column.className || ''}`}>
                    {renderCellValue(column, row)}
                  </TableCell>
                ))}
                {actions.length > 0 && (
                  <TableCell className="py-4" style={{ width: '80px' }}>
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
