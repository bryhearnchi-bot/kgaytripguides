import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { differenceInDays, format } from 'date-fns';
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
import {
  ChevronDown,
  MoreVertical,
  ChevronUp,
  ChevronsUpDown,
  Calendar,
  Music,
  Star,
  Home,
  Ship,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTableState, TableColumn } from '@/hooks/use-table-state';
import { CategoryChip } from '@/components/admin/CategoryChip';
import { dateOnly } from '@/lib/utils';

interface TableAction {
  label: string;
  icon: React.ReactNode;
  onClick: (row: any) => void;
  variant?: 'default' | 'destructive';
  disabled?: (row: any) => boolean;
  visible?: (row: any) => boolean;
}

interface EnhancedTripsTableProps {
  data: any[];
  columns: TableColumn[];
  actions?: TableAction[];
  keyField?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  mobileBreakpoint?: number;
}

export function EnhancedTripsTable({
  data,
  columns,
  actions = [],
  keyField = 'id',
  isLoading = false,
  emptyMessage = 'No data available',
  className = '',
  mobileBreakpoint = 768,
}: EnhancedTripsTableProps) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < mobileBreakpoint
  );
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const resizeStartPos = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);
  const nextColumnStartWidth = useRef<number>(0);
  const nextColumnKey = useRef<string>('');

  // Default column widths for trips table
  const defaultColumnWidths = useMemo(
    () => ({
      image: 80,
      name: 200,
      startDate: 140,
      status: 100,
      highlights: 180,
    }),
    []
  );

  const { columnWidths, sortConfig, updateColumnWidth, handleSort, sortData } = useTableState(
    'trips_table',
    defaultColumnWidths,
    'status' // Default sort by status column (drafts, previews, then chronological)
  );

  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
      // Force a re-render to recalculate table constraints
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileBreakpoint]);

  // Handle column resizing
  const handleMouseDown = useCallback(
    (columnKey: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Find the next resizable column
      const currentIndex = columns.findIndex(col => col.key === columnKey);
      let nextColumn = null;

      // Look for the next resizable column
      for (let i = currentIndex + 1; i < columns.length; i++) {
        const col = columns[i];
        if (col && col.resizable !== false) {
          nextColumn = col;
          break;
        }
      }

      if (!nextColumn) return; // Can't resize if no next resizable column

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
        const minColumnWidth = 80;

        // Calculate new widths based on the initial widths
        let currentColumnNewWidth = resizeStartWidth.current + diff;
        let nextColumnNewWidth = nextColumnStartWidth.current - diff;

        // Ensure minimum widths are respected
        if (currentColumnNewWidth < minColumnWidth) {
          const adjustment = minColumnWidth - currentColumnNewWidth;
          currentColumnNewWidth = minColumnWidth;
          nextColumnNewWidth = nextColumnStartWidth.current - diff + adjustment;
        }

        if (nextColumnNewWidth < minColumnWidth) {
          const adjustment = minColumnWidth - nextColumnNewWidth;
          nextColumnNewWidth = minColumnWidth;
          currentColumnNewWidth = resizeStartWidth.current + diff - adjustment;
        }

        // Final safety check
        currentColumnNewWidth = Math.max(minColumnWidth, currentColumnNewWidth);
        nextColumnNewWidth = Math.max(minColumnWidth, nextColumnNewWidth);

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

  // Sort data with computed value extractor
  const sortedData = sortData(data, (item: any, key: string) => {
    // Handle computed status column
    if (key === 'status') {
      // Map status to numeric values for sorting: Draft → Preview → Current → Upcoming → Past → Archived
      const statusPriority: Record<string, number> = {
        draft: 1,
        preview: 2,
        current: 3,
        upcoming: 4,
        past: 5,
        archived: 6,
      };

      // Check if it's a draft first
      if (item.status === 'draft') {
        return statusPriority.draft;
      }

      // Check if it's preview (tripStatusId === 5)
      if (item.tripStatusId === 5 || item.status === 'preview') {
        return statusPriority.preview;
      }

      // Check if it's archived
      if (item.status === 'archived') {
        return statusPriority.archived;
      }

      // Compute status based on dates
      const now = new Date();
      const start = new Date(item.startDate);
      const end = new Date(item.endDate);

      if (now < start) return statusPriority.upcoming;
      if (now >= start && now <= end) return statusPriority.current;
      return statusPriority.past;
    }
    return item[key];
  });

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

          const imageColumn = columns.find(col => col.key === 'image');
          const nameColumn = columns.find(col => col.key === 'name');
          const statusColumn = columns.find(col => col.key === 'status');
          const startDateColumn = columns.find(col => col.key === 'startDate');
          const tripTypeColumn = columns.find(col => col.key === 'tripTypeId');

          // Helper function to get days out/left badge info for CategoryChip
          const getDaysBadgeInfo = (trip: any) => {
            if (
              trip.status === 'draft' ||
              trip.tripStatusId === 5 ||
              trip.status === 'preview' ||
              trip.status === 'archived'
            ) {
              return null; // Don't show days badge for draft/preview/archived
            }
            const nowDate = new Date();
            const today = new Date(
              nowDate.getFullYear(),
              nowDate.getMonth(),
              nowDate.getDate(),
              0,
              0,
              0,
              0
            );
            const start = dateOnly(trip.startDate);
            const end = dateOnly(trip.endDate);
            if (trip.status === 'ongoing' || (today >= start && today <= end)) {
              const daysRemaining = Math.max(0, differenceInDays(end, today));
              const label =
                daysRemaining === 0
                  ? 'Docking soon'
                  : `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left`;
              // Green color for current/ongoing trips (same as StatusBadge "current")
              return {
                label,
                icon: <Clock className="h-3 w-3" />,
                className: 'border-[#34d399]/40 bg-[#34d399]/15 text-[#34d399]',
              };
            }
            if (today < start) {
              const daysUntil = Math.max(0, differenceInDays(start, today));
              const label =
                daysUntil === 0
                  ? 'Departs today'
                  : `${daysUntil} ${daysUntil === 1 ? 'day' : 'days'} out`;
              // Cyan color for upcoming trips (same as StatusBadge "upcoming")
              return {
                label,
                icon: <Clock className="h-3 w-3" />,
                className: 'border-[#22d3ee]/40 bg-[#22d3ee]/15 text-[#22d3ee]',
              };
            }
            return null; // Don't show for past trips
          };

          return (
            <Card
              key={rowKey}
              className="border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex gap-3 sm:gap-6">
                    {/* Image on the left with trip type above it */}
                    {imageColumn && (
                      <div className="flex-shrink-0 flex flex-col items-center justify-center">
                        {/* Trip type badge centered above image */}
                        {tripTypeColumn && (
                          <div className="mb-2 flex items-center gap-2">
                            {row.tripTypeId === 2 ? (
                              <>
                                <Home className="h-4 w-4 text-cyan-400" />
                                <span className="text-xs font-medium text-white">Resort</span>
                              </>
                            ) : row.tripTypeId === 1 ? (
                              <>
                                <Ship className="h-4 w-4 text-blue-400" />
                                <span className="text-xs font-medium text-white">Cruise</span>
                              </>
                            ) : (
                              <span className="text-xs text-white/50">Unknown</span>
                            )}
                          </div>
                        )}
                        {renderCellValue(imageColumn, row)}
                      </div>
                    )}

                    {/* Name, Date, and Days on board */}
                    <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
                      {nameColumn && (
                        <div className="text-sm sm:text-base text-white font-medium break-words">
                          {renderCellValue(nameColumn, row)}
                        </div>
                      )}
                      {startDateColumn && row.startDate && row.endDate && (
                        <div className="flex-1 flex items-center mt-3">
                          <div className="space-y-1">
                            <p className="text-xs text-white font-medium">
                              {format(dateOnly(row.startDate), 'MMM dd')} –{' '}
                              {format(dateOnly(row.endDate), 'MMM dd, yyyy')}
                            </p>
                            <p className="text-xs text-white/50">
                              {Math.max(
                                1,
                                differenceInDays(dateOnly(row.endDate), dateOnly(row.startDate))
                              )}{' '}
                              days on board
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Buttons on the right */}
                    <div className="flex flex-col items-end gap-4 flex-shrink-0">
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
                            {actions
                              .filter(action => !action.visible || action.visible(row))
                              .map((action, index) => (
                                <DropdownMenuItem
                                  key={index}
                                  onClick={() => action.onClick(row)}
                                  disabled={action.disabled?.(row)}
                                  className={`text-white hover:bg-white/10 focus:bg-white/10 transition-colors ${
                                    action.variant === 'destructive'
                                      ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10'
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
                      {/* Days out/left badge */}
                      {(() => {
                        const daysBadgeInfo = getDaysBadgeInfo(row);
                        if (daysBadgeInfo) {
                          return (
                            <span
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${daysBadgeInfo.className}`}
                            >
                              <span
                                className={
                                  daysBadgeInfo.className.includes('text-[#34d399]')
                                    ? 'text-[#34d399]'
                                    : 'text-[#22d3ee]'
                                }
                              >
                                {daysBadgeInfo.icon}
                              </span>
                              <span>{daysBadgeInfo.label}</span>
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Bottom Statistics Section - styled like EventCard bottom action bar */}
                {(() => {
                  const highlightsColumn = columns.find(col => col.key === 'highlights');
                  if (highlightsColumn && row.eventsCount !== undefined) {
                    return (
                      <div className="bg-white/5 border-t border-white/10 px-3 py-1.5">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          {/* Statistics badges */}
                          <CategoryChip
                            label={`${row.eventsCount ?? 0} events`}
                            icon={<Calendar className="h-3 w-3" />}
                            variant="neutral"
                          />
                          <CategoryChip
                            label={`${row.partiesCount ?? 0} parties`}
                            icon={<Music className="h-3 w-3" />}
                            variant="neutral"
                          />
                          <CategoryChip
                            label={`${row.talentCount ?? 0} artists`}
                            icon={<Star className="h-3 w-3" />}
                            variant="neutral"
                          />
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
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

                  {/* Resize handle - only for resizable columns and not the last resizable column */}
                  {column.resizable !== false &&
                    (() => {
                      // Check if there's a next resizable column
                      const hasNextResizableColumn = columns
                        .slice(index + 1)
                        .some(col => col.resizable !== false);
                      return (
                        hasNextResizableColumn && (
                          <div
                            className="absolute right-0 top-0 h-full w-2 cursor-col-resize opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-opacity -mr-1"
                            onMouseDown={e => handleMouseDown(column.key, e)}
                            style={{
                              background:
                                isResizing === column.key ? 'rgba(255,255,255,0.4)' : 'transparent',
                              opacity: isResizing === column.key ? 1 : undefined,
                            }}
                          />
                        )
                      );
                    })()}
                </TableHead>
              ))}
              {actions.length > 0 && (
                <TableHead
                  className="text-center text-white/60"
                  style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
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
                    style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
                  >
                    <div className="flex items-center justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
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
                          {actions
                            .filter(action => !action.visible || action.visible(row))
                            .map((action, index) => (
                              <DropdownMenuItem
                                key={index}
                                onClick={() => action.onClick(row)}
                                disabled={action.disabled?.(row)}
                                className={`text-white hover:bg-white/10 focus:bg-white/10 transition-colors ${
                                  action.variant === 'destructive'
                                    ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10'
                                    : ''
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {action.icon}
                                  <span>{action.label}</span>
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
