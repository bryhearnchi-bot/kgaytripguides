import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Ship,
  Plus,
  Search,
  Edit,
  Eye,
  Archive,
  Trash2,
  Download,
  BarChart3,
  Users,
  Calendar,
  MapPin,
  Clock,
  Activity,
  Anchor,
  Star,
  FileText
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { dateOnly } from '@/lib/utils';

interface Trip {
  id: number;
  name: string;
  description?: string;
  slug: string;
  startDate: string;
  endDate: string;
  shipName: string;
  cruiseLine?: string;
  status: 'upcoming' | 'ongoing' | 'past' | 'archived';
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

export default function TripsManagement() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all trips - using the working /api/trips endpoint
  const { data: allTrips = [], isLoading: tripsLoading, error: tripsError } = useQuery<Trip[]>({
    queryKey: ['admin-trips'],
    queryFn: async () => {
      const response = await fetch('/api/trips', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      return response.json();
    },
  });

  // Note: Trip updates are handled through the edit page at /admin/trips/:id
  // Status updates are managed automatically based on dates

  // Archive trip mutation - using updateTrip to set status
  const archiveTrip = useMutation({
    mutationFn: async (tripId: number) => {
      // Archive by updating status field
      const tripToArchive = allTrips.find(t => t.id === tripId);
      if (!tripToArchive) throw new Error('Trip not found');

      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ ...tripToArchive, status: 'archived' }),
      });
      if (!response.ok) {
        throw new Error('Failed to archive trip');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Trip archived successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-trips'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to archive trip',
        variant: 'destructive',
      });
    },
  });

  // Delete trip mutation - using correct /api/trips/:id endpoint
  const deleteTrip = useMutation({
    mutationFn: async (tripId: number) => {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to delete trip');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Trip deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-trips'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete trip',
        variant: 'destructive',
      });
    },
  });

  // Export data mutation - simplified for now
  const exportTripData = useMutation({
    mutationFn: async (tripId: number) => {
      // For now, we'll export the trip data as JSON
      const trip = allTrips.find(t => t.id === tripId);
      if (!trip) throw new Error('Trip not found');

      const dataStr = JSON.stringify(trip, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trip-${tripId}-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Trip data exported successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to export trip data',
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (trip: Trip) => {
    const now = new Date();
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);

    if (trip.status === 'archived') {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
          <Archive className="w-3 h-3 mr-1" />
          Archived
        </Badge>
      );
    }

    if (now < startDate) {
      const daysUntil = differenceInDays(startDate, now);
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800">
          <Clock className="w-3 h-3 mr-1" />
          {daysUntil} days until departure
        </Badge>
      );
    } else if (now >= startDate && now <= endDate) {
      const daysRemaining = differenceInDays(endDate, now);
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <Activity className="w-3 h-3 mr-1" />
          {daysRemaining} days remaining
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Clock className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    }
  };

  const getRatingStars = (rating?: number) => {
    if (!rating) return <span className="text-gray-400">No ratings</span>;

    return (
      <div className="flex items-center space-x-1">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const getDaysUntilDeparture = (startDate: string) => {
    const now = new Date();
    const departure = new Date(startDate);
    return Math.max(0, differenceInDays(departure, now));
  };

  const categorizeTrips = () => {
    const now = new Date();

    const upcoming = allTrips.filter(trip => {
      const startDate = new Date(trip.startDate);
      return now < startDate && trip.status !== 'archived';
    });

    const current = allTrips.filter(trip => {
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);
      return now >= startDate && now <= endDate && trip.status !== 'archived';
    });

    const past = allTrips.filter(trip => {
      const endDate = new Date(trip.endDate);
      return now > endDate || trip.status === 'past' || trip.status === 'archived';
    });

    return { upcoming, current, past };
  };

  const getFilteredTrips = (category: 'all' | 'upcoming' | 'current' | 'past') => {
    const { upcoming, current, past } = categorizeTrips();
    let trips: Trip[] = [];

    switch (category) {
      case 'all':
        trips = allTrips.filter(trip => trip.status !== 'archived');
        break;
      case 'upcoming':
        trips = upcoming;
        break;
      case 'current':
        trips = current;
        break;
      case 'past':
        trips = past;
        break;
    }

    return trips.filter(trip => {
      const matchesSearch = trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           trip.shipName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (trip.cruiseLine && trip.cruiseLine.toLowerCase().includes(searchTerm.toLowerCase()));

      const tripYear = new Date(trip.startDate).getFullYear();
      const matchesYear = yearFilter === 'all' || tripYear.toString() === yearFilter;

      return matchesSearch && matchesYear;
    });
  };

  const getUniqueYears = () => {
    const years = allTrips.map(trip => new Date(trip.startDate).getFullYear());
    return [...new Set(years)].sort((a, b) => b - a);
  };

  const openQuickView = (trip: Trip) => {
    setSelectedTrip(trip);
    setQuickViewOpen(true);
  };

  const closeQuickView = () => {
    setQuickViewOpen(false);
    setSelectedTrip(null);
  };

  const openReportModal = (trip: Trip) => {
    setSelectedTrip(trip);
    setReportModalOpen(true);
  };

  const closeReportModal = () => {
    setReportModalOpen(false);
    setSelectedTrip(null);
  };

  const { upcoming, current, past } = categorizeTrips();
  const currentTrips = getFilteredTrips('current');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trips Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage all trip itineraries and schedules</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setLocation('/admin/trips/new')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Trip
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search trips by name, ship, or cruise line..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {getUniqueYears().map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <Ship className="w-4 h-4" />
            <span>All ({allTrips.filter(trip => trip.status !== 'archived').length})</span>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Upcoming ({upcoming.length})</span>
          </TabsTrigger>
          {current.length > 0 && (
            <TabsTrigger value="current" className="flex items-center space-x-2 bg-gradient-to-r from-green-100 to-emerald-100 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white">
              <Activity className="w-4 h-4" />
              <span>Current ({current.length})</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="past" className="flex items-center space-x-2">
            <Archive className="w-4 h-4" />
            <span>Past ({past.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* All Trips */}
        <TabsContent value="all" className="space-y-6">
          {/* All Trips Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Trips ({getFilteredTrips('all').length})</CardTitle>
              <CardDescription>
                Complete overview of all trips across all statuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tripsLoading ? (
                <div className="text-center py-8">
                  <Ship className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-600" />
                  <p>Loading trips...</p>
                </div>
              ) : tripsError ? (
                <div className="text-center py-8 text-red-600">
                  <p>Error loading trips: {tripsError.message}</p>
                </div>
              ) : getFilteredTrips('all').length === 0 ? (
                <div className="text-center py-12">
                  <Ship className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || yearFilter !== 'all' ? 'Try adjusting your search criteria.' : 'Get started by creating your first trip.'}
                  </p>
                  {!searchTerm && yearFilter === 'all' && (
                    <Button onClick={() => setLocation('/admin/trips/new')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Trip
                    </Button>
                  )}
                </div>
              ) : (
                <TripsTable
                  trips={getFilteredTrips('all')}
                  onQuickView={openQuickView}
                  onArchive={archiveTrip}
                  onDelete={deleteTrip}
                  onExport={exportTripData}
                  setLocation={setLocation}
                  showActions={['view', 'edit', 'preview']}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upcoming Trips */}
        <TabsContent value="upcoming" className="space-y-6">
          {/* Upcoming Trips Table */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Trips ({getFilteredTrips('upcoming').length})</CardTitle>
              <CardDescription>
                Manage trips scheduled for future departure
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tripsLoading ? (
                <div className="text-center py-8">
                  <Ship className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-600" />
                  <p>Loading trips...</p>
                </div>
              ) : tripsError ? (
                <div className="text-center py-8 text-red-600">
                  <p>Error loading trips: {tripsError.message}</p>
                </div>
              ) : getFilteredTrips('upcoming').length === 0 ? (
                <div className="text-center py-12">
                  <Ship className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming trips found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || yearFilter !== 'all' ? 'Try adjusting your search criteria.' : 'Get started by creating your first trip.'}
                  </p>
                  {!searchTerm && yearFilter === 'all' && (
                    <Button onClick={() => setLocation('/admin/trips/new')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Trip
                    </Button>
                  )}
                </div>
              ) : (
                <TripsTable
                  trips={getFilteredTrips('upcoming')}
                  onQuickView={openQuickView}
                  onArchive={archiveTrip}
                  onDelete={deleteTrip}
                  onExport={exportTripData}
                  setLocation={setLocation}
                  showActions={['view', 'edit', 'preview']}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Current Trips - Only show tab if there are current trips */}
        {current.length > 0 && (
          <TabsContent value="current" className="space-y-6">
            {/* Current Trips Table */}
            <Card>
              <CardHeader>
                <CardTitle>Current Trips ({currentTrips.length})</CardTitle>
                <CardDescription>
                  Trips currently in progress and actively sailing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TripsTable
                  trips={currentTrips}
                  onQuickView={openQuickView}
                  onArchive={archiveTrip}
                  onDelete={deleteTrip}
                  onExport={exportTripData}
                  setLocation={setLocation}
                  showActions={['view', 'edit', 'preview']}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Past Trips */}
        <TabsContent value="past" className="space-y-6">
          {/* Past Trips Table */}
          <Card>
            <CardHeader>
              <CardTitle>Past Trips ({getFilteredTrips('past').length})</CardTitle>
              <CardDescription>
                View completed trip data, analytics, and manage archives
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tripsLoading ? (
                <div className="text-center py-8">
                  <Ship className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-600" />
                  <p>Loading trips...</p>
                </div>
              ) : tripsError ? (
                <div className="text-center py-8 text-red-600">
                  <p>Error loading trips: {tripsError.message}</p>
                </div>
              ) : getFilteredTrips('past').length === 0 ? (
                <div className="text-center py-12">
                  <Archive className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No past trips found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || yearFilter !== 'all'
                      ? 'Try adjusting your search and filter criteria.'
                      : 'Completed trips will appear here.'}
                  </p>
                </div>
              ) : (
                <TripsTable
                  trips={getFilteredTrips('past')}
                  onQuickView={openReportModal}
                  onArchive={archiveTrip}
                  onDelete={deleteTrip}
                  onExport={exportTripData}
                  setLocation={setLocation}
                  showActions={['report', 'export', 'view', 'archive', 'delete']}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick View Modal */}
      <Dialog open={quickViewOpen} onOpenChange={(open) => !open && closeQuickView()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTrip?.name} - Quick View
            </DialogTitle>
          </DialogHeader>

          {selectedTrip && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Trip Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ship:</span>
                        <span className="font-medium">{selectedTrip.shipName}</span>
                      </div>
                      {selectedTrip.cruiseLine && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cruise Line:</span>
                          <span className="font-medium">{selectedTrip.cruiseLine}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">
                          {differenceInDays(dateOnly(selectedTrip.endDate), dateOnly(selectedTrip.startDate))} days
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Statistics</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Guests:</span>
                        <span className="font-medium">{selectedTrip.guestCount || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ports:</span>
                        <span className="font-medium">{selectedTrip.ports || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Events:</span>
                        <span className="font-medium">{selectedTrip.eventsCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Schedule</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Departure:</span>
                        <span className="font-medium">
                          {format(dateOnly(selectedTrip.startDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Return:</span>
                        <span className="font-medium">
                          {format(dateOnly(selectedTrip.endDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Days Until:</span>
                        <span className="font-medium">
                          {getDaysUntilDeparture(selectedTrip.startDate)} days
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                    <div className="flex justify-center">
                      {getStatusBadge(selectedTrip)}
                    </div>
                  </div>
                </div>
              </div>

              {selectedTrip.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-600">{selectedTrip.description}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={closeQuickView}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    closeQuickView();
                    setLocation(`/admin/trips/${selectedTrip.id}`);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Trip
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      <Dialog open={reportModalOpen} onOpenChange={(open) => !open && closeReportModal()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTrip?.name} - Performance Report
            </DialogTitle>
          </DialogHeader>

          {selectedTrip && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedTrip.guestCount?.toLocaleString() || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">Total Guests</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Star className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedTrip.averageRating?.toFixed(1) || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">Average Rating</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedTrip.feedbackCount || 0}
                      </p>
                      <p className="text-sm text-gray-600">Reviews</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Trip Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ship:</span>
                      <span className="font-medium">{selectedTrip.shipName}</span>
                    </div>
                    {selectedTrip.cruiseLine && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cruise Line:</span>
                        <span className="font-medium">{selectedTrip.cruiseLine}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">
                        {differenceInDays(dateOnly(selectedTrip.endDate), dateOnly(selectedTrip.startDate))} days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ports:</span>
                      <span className="font-medium">{selectedTrip.ports || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Events:</span>
                      <span className="font-medium">{selectedTrip.eventsCount || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Guest Rating:</span>
                      <div className="flex items-center">
                        {getRatingStars(selectedTrip.averageRating)}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Feedback Rate:</span>
                      <span className="font-medium">
                        {selectedTrip.guestCount && selectedTrip.feedbackCount
                          ? `${((selectedTrip.feedbackCount / selectedTrip.guestCount) * 100).toFixed(1)}%`
                          : 'N/A'
                        }
                      </span>
                    </div>
                    {selectedTrip.totalRevenue && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Revenue:</span>
                        <span className="font-medium">
                          ${selectedTrip.totalRevenue.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <div>{getStatusBadge(selectedTrip)}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedTrip.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{selectedTrip.description}</p>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={closeReportModal}>
                  Close
                </Button>
                <Button
                  onClick={() => exportTripData.mutate(selectedTrip.id)}
                  disabled={exportTripData.isPending}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Full Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Trips Table Component
interface TripsTableProps {
  trips: Trip[];
  onQuickView: (trip: Trip) => void;
  onArchive: any;
  onDelete: any;
  onExport: any;
  setLocation: (location: string) => void;
  showActions: string[];
}

function TripsTable({
  trips,
  onQuickView,
  onArchive,
  onDelete,
  onExport,
  setLocation,
  showActions
}: TripsTableProps) {
  const getStatusBadge = (trip: Trip) => {
    const now = new Date();
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);

    if (trip.status === 'archived') {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
          <Archive className="w-3 h-3 mr-1" />
          Archived
        </Badge>
      );
    }

    if (now < startDate) {
      const daysUntil = differenceInDays(startDate, now);
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800">
          <Clock className="w-3 h-3 mr-1" />
          {daysUntil} days until departure
        </Badge>
      );
    } else if (now >= startDate && now <= endDate) {
      const daysRemaining = differenceInDays(endDate, now);
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <Activity className="w-3 h-3 mr-1" />
          {daysRemaining} days remaining
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Clock className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    }
  };

  const getRatingStars = (rating?: number) => {
    if (!rating) return <span className="text-gray-400">No ratings</span>;

    return (
      <div className="flex items-center space-x-1">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trip Details</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Stats</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip) => (
            <TableRow key={trip.id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                    <Ship className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{trip.name}</div>
                    <div className="text-sm text-gray-500">
                      {trip.shipName} {trip.cruiseLine && `• ${trip.cruiseLine}`}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    {format(dateOnly(trip.startDate), 'MMM dd')} - {format(dateOnly(trip.endDate), 'MMM dd, yyyy')}
                  </div>
                  <div className="text-gray-500">
                    {differenceInDays(dateOnly(trip.endDate), dateOnly(trip.startDate))} days
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(trip)}
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {trip.guestCount?.toLocaleString() || 0}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {trip.ports || 0}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {trip.eventsCount || 0}
                    </div>
                  </div>
                  {trip.averageRating && (
                    <div className="flex items-center">
                      {getRatingStars(trip.averageRating)}
                      {trip.feedbackCount && (
                        <span className="text-xs text-gray-500 ml-2">
                          ({trip.feedbackCount} reviews)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  {showActions.includes('view') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onQuickView(trip)}
                      title="Quick View"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  {showActions.includes('report') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onQuickView(trip)}
                      title="View Report"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                  )}
                  {showActions.includes('export') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onExport.mutate(trip.id)}
                      disabled={onExport.isPending}
                      title="Export Data"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  {showActions.includes('edit') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(`/admin/trips/${trip.id}`)}
                      title="Edit Trip"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {showActions.includes('preview') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(`/trip/${trip.slug}`)}
                      title="Preview Trip"
                    >
                      <Anchor className="w-4 h-4" />
                    </Button>
                  )}
                  {showActions.includes('archive') && trip.status !== 'archived' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onArchive.mutate(trip.id)}
                      disabled={onArchive.isPending}
                      title="Archive Trip"
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  )}
                  {showActions.includes('delete') && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete Trip"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Trip</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to permanently delete "{trip.name}"?
                            This action cannot be undone and will remove all associated data,
                            including guest feedback and analytics.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete.mutate(trip.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Permanently
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}