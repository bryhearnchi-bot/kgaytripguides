import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInDays, format } from "date-fns";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilterBar } from "@/components/admin/FilterBar";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CategoryChip } from "@/components/admin/CategoryChip";
import { PageStats } from "@/components/admin/PageStats";
import { useSupabaseAuthContext } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import { dateOnly } from "@/lib/utils";
import {
  Activity,
  Anchor,
  Archive,
  BarChart3,
  Calendar,
  Clock,
  Download,
  Edit,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Plus,
  Ship,
  Star,
  Trash2,
  Users,
} from "lucide-react";

interface Trip {
  id: number;
  name: string;
  description?: string;
  slug: string;
  startDate: string;
  endDate: string;
  shipName: string;
  cruiseLine?: string;
  status: "upcoming" | "ongoing" | "past" | "archived";
  heroImageUrl?: string;
  guestCount?: number;
  ports?: number;
  eventsCount?: number;
  feedbackCount?: number;
  averageRating?: number;
  totalRevenue?: number;
  createdAt: string;
  updatedAt: string;
}

type StatusFilter = "all" | "upcoming" | "current" | "past" | "archived";

interface GroupedTrips {
  upcoming: Trip[];
  current: Trip[];
  past: Trip[];
  archived: Trip[];
  active: Trip[];
}

export default function TripsManagement() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useSupabaseAuthContext();

  const userRole = profile?.role ?? "viewer";
  const canCreateOrEditTrips = ["super_admin", "content_manager"].includes(userRole);
  const canArchiveTrips = canCreateOrEditTrips || userRole === "super_admin";
  const canDeleteTrips = ["super_admin", "content_manager"].includes(userRole);
  const canExportTrips = canCreateOrEditTrips || userRole === "super_admin";

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [tripPendingDeletion, setTripPendingDeletion] = useState<Trip | null>(null);

  const {
    data: allTrips = [],
    isLoading,
    error,
  } = useQuery<Trip[]>({
    queryKey: ["admin-trips"],
    queryFn: async () => {
      const response = await api.get("/api/trips");
      if (!response.ok) {
        throw new Error("Failed to fetch trips");
      }
      return response.json();
    },
  });

  const archiveTrip = useMutation({
    mutationFn: async (tripId: number) => {
      if (!canArchiveTrips) {
        throw new Error("You do not have permission to archive trips.");
      }
      const tripToArchive = allTrips.find((trip) => trip.id === tripId);
      if (!tripToArchive) {
        throw new Error("Trip not found");
      }

      const response = await api.put(`/api/trips/${tripId}`, { ...tripToArchive, status: "archived" });

      if (!response.ok) {
        throw new Error("Failed to archive trip");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trip archived",
        description: "The voyage has been moved to archives.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
    },
    onError: () => {
      toast({
        title: "Archive failed",
        description: "We could not archive this trip. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteTrip = useMutation({
    mutationFn: async (tripId: number) => {
      if (!canDeleteTrips) {
        throw new Error("You do not have permission to delete trips.");
      }
      const response = await api.delete(`/api/trips/${tripId}`);
      if (!response.ok) {
        throw new Error("Failed to delete trip");
      }
    },
    onSuccess: () => {
      toast({
        title: "Trip deleted",
        description: "The voyage has been removed from the roster.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "This trip could not be deleted.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setTripPendingDeletion(null);
    },
  });

  const exportTripData = useMutation({
    mutationFn: async (tripId: number) => {
      if (!canExportTrips) {
        throw new Error("You do not have permission to export trips.");
      }
      const trip = allTrips.find((entry) => entry.id === tripId);
      if (!trip) {
        throw new Error("Trip not found");
      }

      const dataStr = JSON.stringify(trip, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `trip-${tripId}-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
    },
    onSuccess: () => {
      toast({
        title: "Export complete",
        description: "Trip details downloaded as JSON.",
      });
    },
    onError: () => {
      toast({
        title: "Export failed",
        description: "We couldn't export this trip.",
        variant: "destructive",
      });
    },
  });

  const groupedTrips = useMemo<GroupedTrips>(() => groupTrips(allTrips), [allTrips]);

  const filteredTrips = useMemo(() => {
    return filterTrips(groupedTrips, statusFilter, searchTerm, yearFilter);
  }, [groupedTrips, statusFilter, searchTerm, yearFilter]);

  const availableYears = useMemo(() => {
    const yearValues = new Set<number>();
    allTrips.forEach((trip) => {
      yearValues.add(dateOnly(trip.startDate).getFullYear());
    });
    return Array.from(yearValues).sort((a, b) => b - a);
  }, [allTrips]);

  const statusFilters = useMemo(
    () => [
      { value: "all", label: "All voyages", count: groupedTrips.active.length },
      { value: "upcoming", label: "Upcoming", count: groupedTrips.upcoming.length },
      { value: "current", label: "Sailing now", count: groupedTrips.current.length },
      { value: "past", label: "Completed", count: groupedTrips.past.length },
      { value: "archived", label: "Archived", count: groupedTrips.archived.length },
    ],
    [groupedTrips]
  );

  const pageStats = useMemo(
    () => [
      {
        label: "Voyages",
        value: groupedTrips.active.length,
        helpText: "Active across the fleet",
        icon: <Ship className="h-4 w-4" />,
      },
      {
        label: "Upcoming",
        value: groupedTrips.upcoming.length,
        helpText: "Departing soon",
        icon: <Clock className="h-4 w-4" />,
      },
      {
        label: "Sailing now",
        value: groupedTrips.current.length,
        helpText: groupedTrips.current.length ? "In progress" : "Awaiting departure",
        icon: <Activity className="h-4 w-4" />,
      },
      {
        label: "Archived",
        value: groupedTrips.archived.length,
        helpText: "Stored voyages",
        icon: <Archive className="h-4 w-4" />,
      },
    ],
    [groupedTrips]
  );

  const isFiltered =
    statusFilter !== "all" || yearFilter !== "all" || searchTerm.trim().length > 0;
  const loadError = error as Error | null;
  const showError = Boolean(loadError);
  const showEmpty = !isLoading && !showError && filteredTrips.length === 0;

  const totalForFilter = useMemo(() => {
    switch (statusFilter) {
      case "upcoming":
        return groupedTrips.upcoming.length;
      case "current":
        return groupedTrips.current.length;
      case "past":
        return groupedTrips.past.length;
      case "archived":
        return groupedTrips.archived.length;
      case "all":
      default:
        return groupedTrips.active.length;
    }
  }, [groupedTrips, statusFilter]);

  const tableFooter = !showError
    ? `Showing ${filteredTrips.length} of ${totalForFilter} voyages`
    : undefined;

  const tableEmptyState = showError ? (
    <>
      <Ship className="h-10 w-10 text-white/30" />
      <p className="text-sm text-white/70">
        {loadError?.message || "Something went wrong while loading voyages."}
      </p>
      <Button
        onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-trips"] })}
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
          : "Create your first voyage to populate the roster."}
      </p>
      {!isFiltered && canCreateOrEditTrips && (
        <Button
          onClick={() => navigate("/admin/trips/new")}
          className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:from-[#38e0f6] hover:to-[#3b82f6]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create voyage
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
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Voyage Control
            </p>
            <h1 className="text-2xl font-semibold text-white">Sailings & Trips</h1>
            <p className="text-sm text-white/60">
              Monitor upcoming departures, live sailings, and archived voyages in one place.
            </p>
          </div>
          {canCreateOrEditTrips && (
            <Button
              onClick={() => navigate("/admin/trips/new")}
              className="self-start rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-5 py-2 text-sm font-semibold text-white hover:from-[#38e0f6] hover:to-[#3b82f6]"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Trip
            </Button>
          )}
        </div>
      </section>


      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search voyages by name, ship, or cruise line"
        filters={statusFilters}
        activeFilter={statusFilter}
        onFilterChange={(value) => setStatusFilter(value as StatusFilter)}
      >
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="h-11 w-full rounded-full border-white/10 bg-white/10 text-left text-sm text-white placeholder:text-white/50 focus:border-[#22d3ee]/70 focus:ring-0 focus:ring-offset-0 md:w-48">
            <SelectValue placeholder="All years" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#10192f] text-white">
            <SelectItem value="all" className="cursor-pointer text-white/80 focus:bg-white/10 focus:text-white">
              All years
            </SelectItem>
            {availableYears.map((year) => (
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
      </FilterBar>

      <AdminTable
        title="Voyage Manifest"
        description="Current Atlantis & KGAY sailings"
        count={filteredTrips.length}
        empty={showEmpty || showError}
        emptyState={tableEmptyState}
        footer={tableFooter}
      >
        {!showEmpty && !showError && (
          <>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10 text-white/60">
                <TableHead className="text-white/60">Voyage</TableHead>
                <TableHead className="text-white/60">Schedule</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60">Highlights</TableHead>
                <TableHead className="text-right text-white/60">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-white/10">
                  <TableCell colSpan={5} className="py-12">
                    <div className="flex items-center justify-center gap-3 text-white/60">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading voyages…
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrips.map((trip) => (
                  <TableRow
                    key={trip.id}
                    className="border-white/10 bg-transparent hover:bg-white/5"
                  >
                    <TableCell className="py-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-[#22d3ee]/25 to-[#2563eb]/30 text-white">
                          <Ship className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-white">{trip.name}</p>
                          <p className="text-xs text-white/60">
                            {trip.shipName}
                            {trip.cruiseLine ? ` • ${trip.cruiseLine}` : ""}
                          </p>
                          <p className="text-[11px] uppercase tracking-[0.25em] text-white/40">
                            {trip.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-sm text-white/80">
                      <p className="font-medium text-white">
                        {format(dateOnly(trip.startDate), "MMM dd")} – {format(
                          dateOnly(trip.endDate),
                          "MMM dd, yyyy"
                        )}
                      </p>
                      <p className="text-xs text-white/50">
                        {Math.max(
                          1,
                          differenceInDays(
                            dateOnly(trip.endDate),
                            dateOnly(trip.startDate)
                          )
                        )}{" "}
                        days on board
                      </p>
                    </TableCell>
                    <TableCell className="align-top">
                      {getTripStatusBadge(trip)}
                    </TableCell>
                    <TableCell className="align-top">
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
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        {renderRatingStars(trip.averageRating)}
                        {trip.feedbackCount ? (
                          <span className="text-xs text-white/50">
                            ({trip.feedbackCount} reviews)
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {canCreateOrEditTrips && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/trips/${trip.id}`)}
                            className="h-9 w-9 rounded-full border border-white/15 bg-white/5 p-0 text-white/80 hover:bg-white/10"
                            title="Edit trip"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenQuickView(trip)}
                          className="h-9 w-9 rounded-full border border-white/15 bg-white/5 p-0 text-white/80 hover:bg-white/10"
                          title="Quick view"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/trip/${trip.slug}`)}
                          className="h-9 w-9 rounded-full border border-white/15 bg-white/5 p-0 text-white/80 hover:bg-white/10"
                          title="Preview trip"
                        >
                          <Anchor className="h-4 w-4" />
                        </Button>
                        {canArchiveTrips && trip.status !== "archived" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => archiveTrip.mutate(trip.id)}
                            disabled={archiveTrip.isPending}
                            className="h-9 w-9 rounded-full border border-white/15 bg-white/5 p-0 text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Archive trip"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                        {canDeleteTrips && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTripPendingDeletion(trip)}
                                className="h-9 w-9 rounded-full border border-[#fb7185]/30 bg-[#fb7185]/10 p-0 text-[#fb7185] hover:bg-[#fb7185]/20"
                                title="Delete trip"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="border border-white/10 bg-[#10192f] text-white">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete trip</AlertDialogTitle>
                                <AlertDialogDescription className="text-white/60">
                                  This will permanently remove "{trip.name}" and all associated voyage data. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white/10">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    tripPendingDeletion &&
                                    deleteTrip.mutate(tripPendingDeletion.id)
                                  }
                                  disabled={deleteTrip.isPending}
                                  className="rounded-full bg-[#fb7185] px-4 py-2 text-sm font-semibold text-white hover:bg-[#f43f5e] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Delete permanently
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </>
        )}
      </AdminTable>

      <Dialog open={quickViewOpen} onOpenChange={(open) => !open && closeQuickView()}>
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
                    {selectedTrip.cruiseLine ? ` • ${selectedTrip.cruiseLine}` : ""}
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
                      <span>{format(dateOnly(selectedTrip.startDate), "MMM dd, yyyy")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Return</span>
                      <span>{format(dateOnly(selectedTrip.endDate), "MMM dd, yyyy")}</span>
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
                        )}{" "}
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
                      <span>{selectedTrip.guestCount?.toLocaleString() ?? "Not set"}</span>
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
                    className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-5 py-2 text-sm font-semibold text-white hover:from-[#38e0f6] hover:to-[#3b82f6]"
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

      <Dialog open={reportModalOpen} onOpenChange={(open) => !open && closeReportModal()}>
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
                    label: "Guests",
                    value: selectedTrip.guestCount?.toLocaleString() ?? "N/A",
                    helpText: "Manifested",
                    icon: <Users className="h-4 w-4" />,
                  },
                  {
                    label: "Average rating",
                    value: selectedTrip.averageRating
                      ? selectedTrip.averageRating.toFixed(1)
                      : "N/A",
                    helpText: `${selectedTrip.feedbackCount ?? 0} reviews`,
                    icon: <Star className="h-4 w-4" />,
                  },
                  {
                    label: "Events",
                    value: selectedTrip.eventsCount ?? 0,
                    helpText: "On the itinerary",
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
                        )}{" "}
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
                              (selectedTrip.feedbackCount /
                                selectedTrip.guestCount) *
                              100
                            ).toFixed(1)}%`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Total revenue</span>
                      <span>
                        {selectedTrip.totalRevenue
                          ? `$${selectedTrip.totalRevenue.toLocaleString()}`
                          : "Not provided"}
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
                  className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-5 py-2 text-sm font-semibold text-white hover:from-[#38e0f6] hover:to-[#3b82f6] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function groupTrips(trips: Trip[]): GroupedTrips {
  const now = new Date();
  const upcoming: Trip[] = [];
  const current: Trip[] = [];
  const past: Trip[] = [];
  const archived: Trip[] = [];

  trips.forEach((trip) => {
    if (trip.status === "archived") {
      archived.push(trip);
      return;
    }

    const start = dateOnly(trip.startDate);
    const end = dateOnly(trip.endDate);

    if (trip.status === "ongoing" || (now >= start && now <= end)) {
      current.push(trip);
      return;
    }

    if (now < start) {
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
    active: [...upcoming, ...current, ...past],
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
    case "upcoming":
      source = groups.upcoming;
      break;
    case "current":
      source = groups.current;
      break;
    case "past":
      source = groups.past;
      break;
    case "archived":
      source = groups.archived;
      break;
    case "all":
    default:
      source = groups.active;
      break;
  }

  return source.filter((trip) => {
    const matchesSearch =
      !normalizedSearch ||
      trip.name.toLowerCase().includes(normalizedSearch) ||
      trip.shipName.toLowerCase().includes(normalizedSearch) ||
      (trip.cruiseLine && trip.cruiseLine.toLowerCase().includes(normalizedSearch));

    if (!matchesSearch) {
      return false;
    }

    if (year === "all") {
      return true;
    }

    const tripYear = dateOnly(trip.startDate).getFullYear().toString();
    return tripYear === year;
  });
}

function getTripStatusBadge(trip: Trip) {
  if (trip.status === "archived") {
    return <StatusBadge status="archived" />;
  }

  const now = new Date();
  const start = dateOnly(trip.startDate);
  const end = dateOnly(trip.endDate);

  if (now < start) {
    const daysUntil = Math.max(0, differenceInDays(start, now));
    const label = daysUntil === 0 ? "Departs today" : `${daysUntil} days out`;
    return <StatusBadge status="upcoming" label={label} />;
  }

  if (now >= start && now <= end) {
    const daysRemaining = Math.max(0, differenceInDays(end, now));
    const label = daysRemaining === 0 ? "Docking soon" : `${daysRemaining} days left`;
    return <StatusBadge status="current" label={label} />;
  }

  return <StatusBadge status="past" label="Completed" />;
}

function renderRatingStars(rating?: number) {
  if (!rating) {
    return <span className="text-xs text-white/50">No ratings yet</span>;
  }

  return (
    <div className="flex items-center gap-1 text-amber-300">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`h-3.5 w-3.5 ${
            value <= Math.round(rating)
              ? "fill-current text-amber-300"
              : "text-white/20"
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
