import React, { useState, ReactNode } from 'react';
import { ChevronDown, ChevronRight, Eye, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface Column {
  key: string;
  label: string;
  primary?: boolean;
  secondary?: boolean;
  render?: (value: any, row: any) => ReactNode;
  mobileHidden?: boolean;
  sortable?: boolean;
}

interface Action {
  label: string;
  icon: ReactNode;
  onClick: (row: any) => void;
  variant?: 'default' | 'destructive';
}

interface MobileDataTableProps {
  data: any[];
  columns: Column[];
  actions?: Action[];
  loading?: boolean;
  emptyMessage?: string;
  searchPlaceholder?: string;
  enableSearch?: boolean;
  enableExpandableRows?: boolean;
  expandedRowRender?: (row: any) => ReactNode;
  keyField?: string;
}

export function MobileDataTable({
  data,
  columns,
  actions = [],
  loading = false,
  emptyMessage = 'No data available',
  searchPlaceholder = 'Search...',
  enableSearch = true,
  enableExpandableRows = false,
  expandedRowRender,
  keyField = 'id'
}: MobileDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<any>>(new Set());

  const primaryColumn = columns.find(col => col.primary);
  const secondaryColumn = columns.find(col => col.secondary);
  const visibleColumns = columns.filter(col => !col.mobileHidden && !col.primary && !col.secondary);

  const filteredData = data.filter(row => {
    if (!searchTerm) return true;
    return columns.some(column => {
      const value = row[column.key];
      return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  const toggleRowExpansion = (rowKey: any) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowKey)) {
      newExpanded.delete(rowKey);
    } else {
      newExpanded.add(rowKey);
    }
    setExpandedRows(newExpanded);
  };

  const renderCellValue = (column: Column, row: any) => {
    const value = row[column.key];
    if (column.render) {
      return column.render(value, row);
    }
    return value;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-500 mb-2">{emptyMessage}</div>
        {searchTerm && (
          <div className="text-sm text-gray-400">
            No results found for "{searchTerm}"
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      {enableSearch && (
        <div className="relative">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Mobile Cards */}
      <div className="space-y-3">
        {filteredData.map((row) => {
          const rowKey = row[keyField];
          const isExpanded = expandedRows.has(rowKey);

          return (
            <Card key={rowKey} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Main Row Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Primary Content */}
                      {primaryColumn && (
                        <div className="font-medium text-gray-900 truncate mb-1">
                          {renderCellValue(primaryColumn, row)}
                        </div>
                      )}

                      {/* Secondary Content */}
                      {secondaryColumn && (
                        <div className="text-sm text-gray-600 mb-2">
                          {renderCellValue(secondaryColumn, row)}
                        </div>
                      )}

                      {/* Key-Value Pairs for Mobile */}
                      <div className="space-y-1">
                        {visibleColumns.slice(0, 2).map((column) => (
                          <div key={column.key} className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium">
                              {column.label}:
                            </span>
                            <span className="text-gray-900 text-right flex-1 ml-2 truncate">
                              {renderCellValue(column, row)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-2 ml-4">
                      {enableExpandableRows && visibleColumns.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(rowKey)}
                          className="p-1.5"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      )}

                      {actions.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-1.5">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actions.map((action, index) => (
                              <DropdownMenuItem
                                key={index}
                                onClick={() => action.onClick(row)}
                                className={action.variant === 'destructive' ? 'text-red-600' : ''}
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

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    {expandedRowRender ? (
                      expandedRowRender(row)
                    ) : (
                      <div className="space-y-2">
                        {visibleColumns.slice(2).map((column) => (
                          <div key={column.key} className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium">
                              {column.label}:
                            </span>
                            <span className="text-gray-900 text-right flex-1 ml-2">
                              {renderCellValue(column, row)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Results Summary */}
      <div className="text-center text-sm text-gray-500 py-2">
        Showing {filteredData.length} of {data.length} items
      </div>
    </div>
  );
}