import { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { differenceInDays, format } from 'date-fns';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TripWizard } from '@/components/admin/TripWizard/TripWizard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FilterBar } from '@/components/admin/FilterBar';
import { AdminTable } from '@/components/admin/AdminTable';
import { EnhancedTripsTable } from '@/components/admin/EnhancedTripsTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { CategoryChip } from '@/components/admin/CategoryChip';
import { PageStats } from '@/components/admin/PageStats';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { dateOnly } from '@/lib/utils';
import {
  Activity,
  Archive,
  BarChart3,
  Calendar,
  Clock,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Link,
  Loader2,
  MapPin,
  Plus,
  PlusSquare,
  Search,
  Ship,
  Star,
  Trash2,
  TreePalm,
  Users,
} from 'lucide-react';

interface Trip {
  id: number;
  name: string;
  description?: string;
  slug: string;
  startDate: string;
  endDate: string;
  shipName: string;
  cruiseLine?: string;
  status: 'upcoming' | 'ongoing' | 'past' | 'archived' | 'draft';
  heroImageUrl?: string;
  guestCount?: number;
  ports?: number;
  eventsCount?: number;
  talentCount?: number;
  feedbackCount?: number;
  averageRating?: number;
  totalRevenue?: number;
  createdAt: string;
  updatedAt: string;
  wizardState?: any;
  wizardCurrentPage?: number;
}

type StatusFilter = 'all' | 'upcoming' | 'current' | 'past' | 'archived' | 'draft';

interface GroupedTrips {
  upcoming: Trip[];
  current: Trip[];
  past: Trip[];
  archived: Trip[];
  draft: Trip[];
  active: Trip[];
}

export default function TripsManagement() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useSupabaseAuthContext();

  const userRole = profile?.role ?? 'viewer';
  const canCreateOrEditTrips = ['super_admin', 'content_manager'].includes(userRole);
  const canArchiveTrips = canCreateOrEditTrips || userRole === 'super_admin';
  const canDeleteTrips = ['super_admin', 'content_manager'].includes(userRole);
  const canExportTrips = canCreateOrEditTrips || userRole === 'super_admin';

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [tripPendingDeletion, setTripPendingDeletion] = useState<Trip | null>(null);
  const [draftToResume, setDraftToResume] = useState<Trip | null>(null);
  const [slugEditModalOpen, setSlugEditModalOpen] = useState(false);
  const [tripToEditSlug, setTripToEditSlug] = useState<Trip | null>(null);
  const [newSlug, setNewSlug] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: allTrips = [],
    isLoading,
    error,
  } = useQuery<Trip[]>({
    queryKey: ['admin-trips'],
    queryFn: async () => {
      const response = await api.get('/api/admin/trips');
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      const data = await response.json();
      // Admin endpoint returns paginated data with { trips: [...], pagination: {...} }
      return data.trips || data;
    },
  });

  const archiveTrip = useMutation({
    mutationFn: async (tripId: number) => {
      if (!canArchiveTrips) {
        throw new Error('You do not have permission to archive trips.');
      }
      const tripToArchive = allTrips.find(trip => trip.id === tripId);
      if (!tripToArchive) {
        throw new Error('Trip not found');
      }

      const response = await api.put(`/api/trips/${tripId}`, {
        ...tripToArchive,
        status: 'archived',
      });

      if (!response.ok) {
        throw new Error('Failed to archive trip');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Trip archived',
        description: 'The voyage has been moved to archives.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-trips'] });
    },
    onError: () => {
      toast({
        title: 'Archive failed',
        description: 'We could not archive this trip. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteTrip = useMutation({
    mutationFn: async (tripId: number) => {
      if (!canDeleteTrips) {
        throw new Error('You do not have permission to delete trips.');
      }
      const response = await api.delete(`/api/trips/${tripId}`);
      if (!response.ok) {
        throw new Error('Failed to delete trip');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Trip deleted',
        description: 'The voyage has been removed from the roster.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-trips'] });
    },
    onError: () => {
      toast({
        title: 'Delete failed',
        description: 'This trip could not be deleted.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setTripPendingDeletion(null);
    },
  });

  const updateSlug = useMutation({
    mutationFn: async ({ tripId, slug }: { tripId: number; slug: string }) => {
      if (!canCreateOrEditTrips) {
        throw new Error('You do not have permission to edit trips.');
      }

      // Call the API to update the slug
      const response = await api.patch(`/api/admin/trips/${tripId}/slug`, { slug });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(error.error || error.message || 'Failed to update slug');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trips'] });
      toast({
        title: 'URL slug updated',
        description: 'The trip URL has been successfully updated.',
      });
      setSlugEditModalOpen(false);
      setTripToEditSlug(null);
      setNewSlug('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update slug',
        description: error.message || 'An error occurred while updating the slug',
        variant: 'destructive',
      });
    },
  });

  const exportTripData = useMutation({
    mutationFn: async (tripId: number) => {
      if (!canExportTrips) {
        throw new Error('You do not have permission to export trips.');
      }
      const trip = allTrips.find(entry => entry.id === tripId);
      if (!trip) {
        throw new Error('Trip not found');
      }

      const dataStr = JSON.stringify(trip, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `trip-${tripId}-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
    },
    onSuccess: () => {
      toast({
        title: 'Export complete',
        description: 'Trip details downloaded as JSON.',
      });
    },
    onError: () => {
      toast({
        title: 'Export failed',
        description: "We couldn't export this trip.",
        variant: 'destructive',
      });
    },
  });

  const groupedTrips = useMemo<GroupedTrips>(() => groupTrips(allTrips), [allTrips]);

  const filteredTrips = useMemo(() => {
    return filterTrips(groupedTrips, statusFilter, searchTerm, yearFilter);
  }, [groupedTrips, statusFilter, searchTerm, yearFilter]);

  const availableYears = useMemo(() => {
    const yearValues = new Set<number>();
    allTrips.forEach(trip => {
      yearValues.add(dateOnly(trip.startDate).getFullYear());
    });
    return Array.from(yearValues).sort((a, b) => b - a);
  }, [allTrips]);

  const statusFilters = useMemo(
    () => [
      { value: 'all', label: 'All voyages', count: groupedTrips.active.length },
      { value: 'draft', label: 'Drafts', count: groupedTrips.draft.length },
      { value: 'upcoming', label: 'Upcoming', count: groupedTrips.upcoming.length },
      { value: 'current', label: 'Sailing now', count: groupedTrips.current.length },
      { value: 'past', label: 'Completed', count: groupedTrips.past.length },
      { value: 'archived', label: 'Archived', count: groupedTrips.archived.length },
    ],
    [groupedTrips]
  );

  const pageStats = useMemo(
    () => [
      {
        label: 'Voyages',
        value: groupedTrips.active.length,
        helpText: 'Active across the fleet',
        icon: <Ship className="h-4 w-4" />,
      },
      {
        label: 'Upcoming',
        value: groupedTrips.upcoming.length,
        helpText: 'Departing soon',
        icon: <Clock className="h-4 w-4" />,
      },
      {
        label: 'Sailing now',
        value: groupedTrips.current.length,
        helpText: groupedTrips.current.length ? 'In progress' : 'Awaiting departure',
        icon: <Activity className="h-4 w-4" />,
      },
      {
        label: 'Archived',
        value: groupedTrips.archived.length,
        helpText: 'Stored voyages',
        icon: <Archive className="h-4 w-4" />,
      },
    ],
    [groupedTrips]
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredTrips.length);
  const paginatedTrips = filteredTrips.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, yearFilter, searchTerm]);

  const isFiltered = statusFilter !== 'all' || yearFilter !== 'all' || searchTerm.trim().length > 0;
  const loadError = error as Error | null;
  const showError = Boolean(loadError);
  const showEmpty = !isLoading && !showError && filteredTrips.length === 0;

  const totalForFilter = useMemo(() => {
    switch (statusFilter) {
      case 'upcoming':
        return groupedTrips.upcoming.length;
      case 'current':
        return groupedTrips.current.length;
      case 'past':
        return groupedTrips.past.length;
      case 'archived':
        return groupedTrips.archived.length;
      case 'draft':
        return groupedTrips.draft.length;
      case 'all':
      default:
        return groupedTrips.active.length;
    }
  }, [groupedTrips, statusFilter]);

  const tableFooter = !showError
    ? filteredTrips.length === 0
      ? 'No trips to display'
      : `Showing ${paginatedTrips.length} of ${filteredTrips.length} trips`
    : undefined;

  const tableEmptyState = showError ? (
    <>
      <Ship className="h-10 w-10 text-white/30" />
      <p className="text-sm text-white/70">
        {loadError?.message || 'Something went wrong while loading voyages.'}
      </p>
      <Button
        onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-trips'] })}
        className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
      >
        Retry fetch
      </Button>
    </>
  ) : (
    <>
      <Ship className="h-10 w-10 text-white/30" />
      <p className="text-sm text-white/70">
        {isFiltered
          ? "No voyages match the filters you've applied."
          : 'Create your first voyage to populate the roster.'}
      </p>
      {!isFiltered && canCreateOrEditTrips && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsWizardOpen(true)}
          className="h-4 w-4 rounded-xl border border-white/15 bg-blue-500/10 text-white/80 hover:bg-blue-500/15"
          title="Add New Trip"
        >
          <PlusSquare className="h-5 w-5 text-blue-400/80" />
        </Button>
      )}
    </>
  );

  const handleOpenQuickView = (trip: Trip) => {
    setSelectedTrip(trip);
    setQuickViewOpen(true);
  };

  const handleOpenReport = (trip: Trip) => {
    setSelectedTrip(trip);
    setReportModalOpen(true);
  };

  const closeQuickView = () => {
    setQuickViewOpen(false);
    setSelectedTrip(null);
  };

  const closeReportModal = () => {
    setReportModalOpen(false);
    setSelectedTrip(null);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
              <TreePalm className="h-6 w-6" />
              Trip Management
            </h1>
            <p className="text-sm text-white/60">
              Manage upcoming, current, and past trips all in one place.
            </p>
          </div>
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Search voyages by name, ship, or cruise line"
              className="h-11 rounded-full border-white/10 bg-white/10 pl-10 text-sm text-white placeholder:text-white/50 focus:border-[#22d3ee]/70 focus:ring-0"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map(filter => {
            const isActive = statusFilter === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value as StatusFilter)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition ${
                  isActive
                    ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white'
                }`}
                type="button"
              >
                <span>{filter.label}</span>
                {typeof filter.count === 'number' && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] leading-none text-white/70">
                    {filter.count}
                  </span>
                )}
              </button>
            );
          })}
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="h-11 w-full rounded-full border-white/10 bg-white/10 text-left text-sm text-white placeholder:text-white/50 focus:border-[#22d3ee]/70 focus:ring-0 focus:ring-offset-0 md:w-48">
              <SelectValue placeholder="All years" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#10192f] text-white">
              <SelectItem
                value="all"
                className="cursor-pointer text-white/80 focus:bg-white/10 focus:text-white"
              >
                All years
              </SelectItem>
              {availableYears.map(year => (
                <SelectItem
                  key={year}
                  value={year.toString()}
                  className="cursor-pointer text-white/80 focus:bg-white/10 focus:text-white"
                >
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
        <header className="flex flex-col gap-2 border-b border-white/10 pl-6 pr-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">All Trips</h2>
          </div>
          {canCreateOrEditTrips && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsWizardOpen(true)}
              className="h-4 w-4 rounded-xl border border-white/15 bg-blue-500/10 text-white/80 hover:bg-blue-500/15"
              title="Add New Trip"
            >
              <PlusSquare className="h-5 w-5 text-blue-400/80" />
            </Button>
          )}
        </header>

        {showEmpty || showError ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-white/60">
            {tableEmptyState}
          </div>
        ) : (
          <EnhancedTripsTable
            data={paginatedTrips}
            columns={[
              {
                key: 'image',
                label: '',
                priority: 'high',
                sortable: false,
                resizable: false,
                width: 80,
                minWidth: 80,
                maxWidth: 80,
                render: (_value, trip) => (
                  <div className="flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10">
                      {trip.heroImageUrl ? (
                        <img
                          src={trip.heroImageUrl}
                          alt={trip.name}
                          className="h-full w-full rounded-xl object-cover"
                        />
                      ) : (
                        <Ship className="h-6 w-6 text-white/70" />
                      )}
                    </div>
                  </div>
                ),
              },
              {
                key: 'name',
                label: 'Voyage',
                priority: 'high',
                sortable: true,
                minWidth: 200,
                render: (_value, trip) => (
                  <p className="font-bold text-xs text-white">{trip.name}</p>
                ),
              },
              {
                key: 'startDate',
                label: 'Schedule',
                priority: 'high',
                sortable: true,
                minWidth: 150,
                render: (_value, trip) => (
                  <div className="space-y-1">
                    <p className="text-xs text-white font-medium">
                      {format(dateOnly(trip.startDate), 'MMM dd')} –{' '}
                      {format(dateOnly(trip.endDate), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-xs text-white/50">
                      {Math.max(
                        1,
                        differenceInDays(dateOnly(trip.endDate), dateOnly(trip.startDate))
                      )}{' '}
                      days on board
                    </p>
                  </div>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                priority: 'medium',
                sortable: true,
                minWidth: 120,
                render: (_value, trip) => getTripStatusBadge(trip),
              },
              {
                key: 'highlights',
                label: 'Highlights',
                priority: 'medium',
                sortable: false,
                minWidth: 200,
                render: (_value, trip) => (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <CategoryChip
                        label={`${trip.guestCount?.toLocaleString() ?? 0} guests`}
                        icon={<Users className="h-3 w-3" />}
                        variant="neutral"
                      />
                      <CategoryChip
                        label={`${trip.ports ?? 0} ports`}
                        icon={<MapPin className="h-3 w-3" />}
                        variant="neutral"
                      />
                      <CategoryChip
                        label={`${trip.eventsCount ?? 0} events`}
                        icon={<Calendar className="h-3 w-3" />}
                        variant="neutral"
                      />
                      <CategoryChip
                        label={`${trip.talentCount ?? 0} artists`}
                        icon={<Star className="h-3 w-3" />}
                        variant="neutral"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {renderRatingStars(trip.averageRating)}
                      {trip.feedbackCount ? (
                        <span className="text-xs text-white/50">
                          ({trip.feedbackCount} reviews)
                        </span>
                      ) : null}
                    </div>
                  </div>
                ),
              },
            ]}
            actions={[
              // Resume Draft button (only for draft trips)
              {
                label: 'Resume Draft',
                icon: <Edit className="h-4 w-4" />,
                onClick: (trip: Trip) => {
                  setDraftToResume(trip);
                  setIsWizardOpen(true);
                },
                visible: (trip: Trip) => trip.status === 'draft' && canCreateOrEditTrips,
              },
              // Edit Trip button (for non-draft trips)
              {
                label: 'Edit Trip',
                icon: <Edit className="h-4 w-4" />,
                onClick: (trip: Trip) => navigate(`/admin/trips/${trip.id}`),
                visible: (trip: Trip) => trip.status !== 'draft' && canCreateOrEditTrips,
              },
              // Edit URL Slug (for live/completed trips)
              {
                label: 'Edit URL Slug',
                icon: <Link className="h-4 w-4" />,
                onClick: (trip: Trip) => {
                  setTripToEditSlug(trip);
                  setNewSlug(trip.slug);
                  setSlugEditModalOpen(true);
                },
                visible: (trip: Trip) => trip.status !== 'draft' && canCreateOrEditTrips,
              },
              // Preview button (for all trips)
              {
                label: 'Preview',
                icon: <ExternalLink className="h-4 w-4" />,
                onClick: (trip: Trip) => {
                  window.open(`/trip/${trip.slug}`, '_blank');
                },
                visible: () => true,
              },
              // Delete button (for all trips)
              {
                label: 'Delete',
                icon: <Trash2 className="h-4 w-4" />,
                onClick: (trip: Trip) => {
                  setTripPendingDeletion(trip);
                  // Note: This will trigger the AlertDialog, but we need to handle it differently
                  // For now, we'll use a simple confirm dialog
                  if (
                    confirm(
                      `Are you sure you want to delete "${trip.name}"? This action cannot be undone.`
                    )
                  ) {
                    deleteTrip.mutate(trip.id);
                  }
                },
                variant: 'destructive' as const,
                visible: () => canDeleteTrips,
              },
            ]}
            keyField="id"
            isLoading={isLoading}
            emptyMessage={
              isFiltered
                ? "No voyages match the filters you've applied."
                : 'Create your first voyage to populate the roster.'
            }
          />
        )}

        {!showEmpty && !showError && (
          <footer className="flex items-center justify-between border-t border-white/10 px-6 py-4">
            <div className="text-xs text-white/50">{tableFooter}</div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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

      <Dialog open={quickViewOpen} onOpenChange={open => !open && closeQuickView()}>
        <DialogContent className="max-w-3xl border border-white/10 bg-[#0f172a] text-white shadow-2xl">
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="text-xl font-semibold text-white">
              {selectedTrip?.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-white/60">
              Snapshot of the voyage schedule and key metrics.
            </DialogDescription>
          </DialogHeader>

          {selectedTrip && (
            <div className="mt-4 space-y-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-white/60">
                    {selectedTrip.shipName}
                    {selectedTrip.cruiseLine ? ` • ${selectedTrip.cruiseLine}` : ''}
                  </p>
                  <p className="text-xs text-white/40">Slug: {selectedTrip.slug}</p>
                </div>
                <div>{getTripStatusBadge(selectedTrip)}</div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-semibold text-white">Schedule</h3>
                  <div className="mt-3 space-y-2 text-sm text-white/70">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Departure</span>
                      <span>{format(dateOnly(selectedTrip.startDate), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Return</span>
                      <span>{format(dateOnly(selectedTrip.endDate), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Duration</span>
                      <span>
                        {Math.max(
                          1,
                          differenceInDays(
                            dateOnly(selectedTrip.endDate),
                            dateOnly(selectedTrip.startDate)
                          )
                        )}{' '}
                        days
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Days until</span>
                      <span>{getDaysUntilDeparture(selectedTrip.startDate)} days</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-semibold text-white">Metrics</h3>
                  <div className="mt-3 space-y-2 text-sm text-white/70">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Guests</span>
                      <span>{selectedTrip.guestCount?.toLocaleString() ?? 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Ports</span>
                      <span>{selectedTrip.ports ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Events</span>
                      <span>{selectedTrip.eventsCount ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Guest rating</span>
                      <span>{renderRatingStars(selectedTrip.averageRating)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedTrip.description && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-white">Overview</h3>
                  <p className="text-sm text-white/70">{selectedTrip.description}</p>
                </div>
              )}

              <div className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
                <Button
                  variant="ghost"
                  onClick={closeQuickView}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                >
                  Close
                </Button>
                {canCreateOrEditTrips && (
                  <Button
                    onClick={() => {
                      closeQuickView();
                      navigate(`/admin/trips/${selectedTrip.id}`);
                    }}
                    className="rounded-full bg-blue-600 hover:bg-blue-700 px-5 py-2 text-sm font-semibold text-white transition-colors"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit trip
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={reportModalOpen} onOpenChange={open => !open && closeReportModal()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border border-white/10 bg-[#0f172a] text-white shadow-2xl">
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="text-xl font-semibold text-white">
              {selectedTrip?.name} report
            </DialogTitle>
            <DialogDescription className="text-sm text-white/60">
              Voyage performance metrics and engagement summaries.
            </DialogDescription>
          </DialogHeader>

          {selectedTrip && (
            <div className="mt-4 space-y-6">
              <PageStats
                stats={[
                  {
                    label: 'Guests',
                    value: selectedTrip.guestCount?.toLocaleString() ?? 'N/A',
                    helpText: 'Manifested',
                    icon: <Users className="h-4 w-4" />,
                  },
                  {
                    label: 'Average rating',
                    value: selectedTrip.averageRating
                      ? selectedTrip.averageRating.toFixed(1)
                      : 'N/A',
                    helpText: `${selectedTrip.feedbackCount ?? 0} reviews`,
                    icon: <Star className="h-4 w-4" />,
                  },
                  {
                    label: 'Events',
                    value: selectedTrip.eventsCount ?? 0,
                    helpText: 'On the itinerary',
                    icon: <Calendar className="h-4 w-4" />,
                  },
                ]}
                columns={3}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-semibold text-white">Trip summary</h3>
                  <div className="space-y-2 text-sm text-white/70">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Fleet</span>
                      <span>{selectedTrip.shipName}</span>
                    </div>
                    {selectedTrip.cruiseLine && (
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">Cruise line</span>
                        <span>{selectedTrip.cruiseLine}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Duration</span>
                      <span>
                        {Math.max(
                          1,
                          differenceInDays(
                            dateOnly(selectedTrip.endDate),
                            dateOnly(selectedTrip.startDate)
                          )
                        )}{' '}
                        days
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Status</span>
                      <span>{getTripStatusBadge(selectedTrip)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-semibold text-white">Engagement</h3>
                  <div className="space-y-2 text-sm text-white/70">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Feedback rate</span>
                      <span>
                        {selectedTrip.guestCount && selectedTrip.feedbackCount
                          ? `${(
                              (selectedTrip.feedbackCount / selectedTrip.guestCount) *
                              100
                            ).toFixed(1)}%`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Total revenue</span>
                      <span>
                        {selectedTrip.totalRevenue
                          ? `$${selectedTrip.totalRevenue.toLocaleString()}`
                          : 'Not provided'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Ports visited</span>
                      <span>{selectedTrip.ports ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
                <Button
                  variant="ghost"
                  onClick={closeReportModal}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                >
                  Close
                </Button>
                <Button
                  onClick={() => exportTripData.mutate(selectedTrip.id)}
                  disabled={exportTripData.isPending}
                  className="rounded-full bg-blue-600 hover:bg-blue-700 px-5 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Trip Wizard Modal */}
      <TripWizard
        isOpen={isWizardOpen}
        onOpenChange={open => {
          setIsWizardOpen(open);
          if (!open) {
            setDraftToResume(null);
          }
        }}
        draftTrip={draftToResume}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-trips'] });
          setDraftToResume(null);
          toast({
            title: 'Success',
            description: draftToResume ? 'Draft resumed!' : 'Trip created successfully!',
          });
        }}
      />

      {/* Slug Edit Modal */}
      <Dialog open={slugEditModalOpen} onOpenChange={setSlugEditModalOpen}>
        <DialogContent className="sm:max-w-md border-white/10 bg-gradient-to-b from-[#10192f] to-[#0f1629] rounded-[20px] text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white">Edit URL Slug</DialogTitle>
            <DialogDescription className="text-sm text-white/60">
              Change the URL path for this trip. This will update all links to the trip.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-white/80">Trip Name</label>
              <p className="text-sm text-white/60">{tripToEditSlug?.name}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/80">URL Slug</label>
              <Input
                value={newSlug}
                onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="enter-url-slug"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
              <p className="text-xs text-white/50">Preview: /trip/{newSlug || 'enter-url-slug'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSlugEditModalOpen(false)}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (tripToEditSlug && newSlug) {
                  updateSlug.mutate({ tripId: tripToEditSlug.id, slug: newSlug });
                }
              }}
              disabled={!newSlug || newSlug === tripToEditSlug?.slug}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Update Slug
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function groupTrips(trips: Trip[]): GroupedTrips {
  // Get today's date at midnight for fair comparison
  const nowDate = new Date();
  const today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 0, 0, 0, 0);
  const upcoming: Trip[] = [];
  const current: Trip[] = [];
  const past: Trip[] = [];
  const archived: Trip[] = [];
  const draft: Trip[] = [];

  trips.forEach(trip => {
    if (trip.status === 'draft') {
      draft.push(trip);
      return;
    }

    if (trip.status === 'archived') {
      archived.push(trip);
      return;
    }

    const start = dateOnly(trip.startDate);
    const end = dateOnly(trip.endDate);

    if (trip.status === 'ongoing' || (today >= start && today <= end)) {
      current.push(trip);
      return;
    }

    if (today < start) {
      upcoming.push(trip);
      return;
    }

    past.push(trip);
  });

  return {
    upcoming,
    current,
    past,
    archived,
    draft,
    active: [...draft, ...upcoming, ...current, ...past],
  };
}

function filterTrips(
  groups: GroupedTrips,
  status: StatusFilter,
  search: string,
  year: string
): Trip[] {
  const normalizedSearch = search.trim().toLowerCase();

  let source: Trip[];
  switch (status) {
    case 'upcoming':
      source = groups.upcoming;
      break;
    case 'current':
      source = groups.current;
      break;
    case 'past':
      source = groups.past;
      break;
    case 'archived':
      source = groups.archived;
      break;
    case 'draft':
      source = groups.draft;
      break;
    case 'all':
    default:
      source = groups.active;
      break;
  }

  return source.filter(trip => {
    const matchesSearch =
      !normalizedSearch ||
      trip.name.toLowerCase().includes(normalizedSearch) ||
      trip.shipName.toLowerCase().includes(normalizedSearch) ||
      (trip.cruiseLine && trip.cruiseLine.toLowerCase().includes(normalizedSearch));

    if (!matchesSearch) {
      return false;
    }

    if (year === 'all') {
      return true;
    }

    const tripYear = dateOnly(trip.startDate).getFullYear().toString();
    return tripYear === year;
  });
}

function getTripSortableStatus(trip: Trip): string {
  if (trip.status === 'archived') {
    return 'archived';
  }

  const now = new Date();
  const start = dateOnly(trip.startDate);
  const end = dateOnly(trip.endDate);

  if (now < start) {
    return 'upcoming';
  }

  if (now >= start && now <= end) {
    return 'current';
  }

  return 'past';
}

function getTripStatusBadge(trip: Trip) {
  if (trip.status === 'draft') {
    return <StatusBadge status="draft" label="Draft" />;
  }

  if (trip.status === 'archived') {
    return <StatusBadge status="archived" />;
  }

  // Get today's date at midnight for fair comparison
  const nowDate = new Date();
  const today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 0, 0, 0, 0);
  const start = dateOnly(trip.startDate);
  const end = dateOnly(trip.endDate);

  // Check database status first for 'ongoing', then fall back to date calculation
  if (trip.status === 'ongoing' || (today >= start && today <= end)) {
    const daysRemaining = Math.max(0, differenceInDays(end, today));
    const label = daysRemaining === 0 ? 'Docking soon' : `${daysRemaining} days left`;
    return <StatusBadge status="current" label={label} />;
  }

  if (today < start) {
    const daysUntil = Math.max(0, differenceInDays(start, today));
    const label = daysUntil === 0 ? 'Departs today' : `${daysUntil} days out`;
    return <StatusBadge status="upcoming" label={label} />;
  }

  return <StatusBadge status="past" label="Completed" />;
}

function renderRatingStars(rating?: number) {
  if (!rating) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-amber-300">
      {[1, 2, 3, 4, 5].map(value => (
        <Star
          key={value}
          className={`h-3.5 w-3.5 ${
            value <= Math.round(rating) ? 'fill-current text-amber-300' : 'text-white/20'
          }`}
        />
      ))}
      <span className="text-xs text-white/60">{rating.toFixed(1)}</span>
    </div>
  );
}

function getDaysUntilDeparture(startDate: string) {
  const now = new Date();
  const departure = dateOnly(startDate);
  return Math.max(0, differenceInDays(departure, now));
}
