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
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Ship,
  Search,
  Eye,
  Archive,
  Trash2,
  Download,
  BarChart3,
  Users,
  Calendar,
  MapPin,
  Star,
  Clock,
  FileText,
  Activity
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { dateOnly } from '@/lib/utils';

interface PastCruise {
  id: number;
  name: string;
  description?: string;
  slug: string;
  startDate: string;
  endDate: string;
  shipName: string;
  cruiseLine?: string;
  status: 'past' | 'archived';
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

export default function PastCruises() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [selectedCruise, setSelectedCruise] = useState<PastCruise | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch past cruises
  const { data: cruises = [], isLoading: cruisesLoading, error: cruisesError } = useQuery<PastCruise[]>({
    queryKey: ['admin-past-cruises'],
    queryFn: async () => {
      const response = await fetch('/api/admin/cruises?status=past', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch past cruises');
      }
      return response.json();
    },
  });

  // Archive cruise mutation
  const archiveCruise = useMutation({
    mutationFn: async (cruiseId: number) => {
      const response = await fetch(`/api/admin/cruises/${cruiseId}/archive`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to archive cruise');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Cruise archived successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-past-cruises'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to archive cruise',
        variant: 'destructive',
      });
    },
  });

  // Delete cruise mutation
  const deleteCruise = useMutation({
    mutationFn: async (cruiseId: number) => {
      const response = await fetch(`/api/admin/cruises/${cruiseId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to delete cruise');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Cruise deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-past-cruises'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete cruise',
        variant: 'destructive',
      });
    },
  });

  // Export data mutation
  const exportCruiseData = useMutation({
    mutationFn: async (cruiseId: number) => {
      const response = await fetch(`/api/admin/cruises/${cruiseId}/export`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to export cruise data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cruise-${cruiseId}-data-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Cruise data exported successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to export cruise data',
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'past':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'archived':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            <Archive className="w-3 h-3 mr-1" />
            Archived
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  const getUniqueYears = () => {
    const years = cruises.map(cruise => new Date(cruise.startDate).getFullYear());
    return [...new Set(years)].sort((a, b) => b - a);
  };

  const filteredCruises = cruises.filter(cruise => {
    const matchesSearch = cruise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cruise.shipName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (cruise.cruiseLine && cruise.cruiseLine.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || cruise.status === statusFilter;

    const cruiseYear = new Date(cruise.startDate).getFullYear();
    const matchesYear = yearFilter === 'all' || cruiseYear.toString() === yearFilter;

    return matchesSearch && matchesStatus && matchesYear;
  });

  const openReportModal = (cruise: PastCruise) => {
    setSelectedCruise(cruise);
    setReportModalOpen(true);
  };

  const closeReportModal = () => {
    setReportModalOpen(false);
    setSelectedCruise(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/admin/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <Archive className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Past Cruises</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/admin/cruises-active')}
              >
                <Activity className="w-4 h-4 mr-2" />
                View Active Cruises
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search cruises by name, ship, or line..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="past">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
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

          {/* Summary Cards */}
          {!cruisesLoading && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Ship className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Past Cruises</p>
                      <p className="text-2xl font-bold text-gray-900">{filteredCruises.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Guests</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {filteredCruises.reduce((sum, cruise) => sum + (cruise.guestCount || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Star className="w-8 h-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Average Rating</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {filteredCruises.length > 0
                          ? (filteredCruises.reduce((sum, cruise) => sum + (cruise.averageRating || 0), 0) / filteredCruises.length).toFixed(1)
                          : '0.0'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Archive className="w-8 h-8 text-gray-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Archived</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {filteredCruises.filter(c => c.status === 'archived').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Cruises Table */}
          <Card>
            <CardHeader>
              <CardTitle>Past Cruises ({filteredCruises.length})</CardTitle>
              <CardDescription>
                View completed cruise data, analytics, and manage archives
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cruisesLoading ? (
                <div className="text-center py-8">
                  <Ship className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-600" />
                  <p>Loading past cruises...</p>
                </div>
              ) : cruisesError ? (
                <div className="text-center py-8 text-red-600">
                  <p>Error loading cruises: {cruisesError.message}</p>
                </div>
              ) : filteredCruises.length === 0 ? (
                <div className="text-center py-12">
                  <Archive className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No past cruises found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || statusFilter !== 'all' || yearFilter !== 'all'
                      ? 'Try adjusting your search and filter criteria.'
                      : 'Completed cruises will appear here.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cruise Details</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Performance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCruises.map((cruise) => (
                        <TableRow key={cruise.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                                <Ship className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{cruise.name}</div>
                                <div className="text-sm text-gray-500">
                                  {cruise.shipName} {cruise.cruiseLine && `• ${cruise.cruiseLine}`}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {format(dateOnly(cruise.startDate), 'MMM dd')} - {format(dateOnly(cruise.endDate), 'MMM dd, yyyy')}
                              </div>
                              <div className="text-gray-500">
                                {differenceInDays(dateOnly(cruise.endDate), dateOnly(cruise.startDate))} days
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Users className="w-4 h-4 mr-1" />
                                  {cruise.guestCount?.toLocaleString() || 0}
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {cruise.eventsCount || 0}
                                </div>
                              </div>
                              <div className="flex items-center">
                                {getRatingStars(cruise.averageRating)}
                                {cruise.feedbackCount && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({cruise.feedbackCount} reviews)
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(cruise.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openReportModal(cruise)}
                                title="View Report"
                              >
                                <BarChart3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => exportCruiseData.mutate(cruise.id)}
                                disabled={exportCruiseData.isPending}
                                title="Export Data"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setLocation(`/trip/${cruise.slug}`)}
                                title="View Cruise"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {cruise.status !== 'archived' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => archiveCruise.mutate(cruise.id)}
                                  disabled={archiveCruise.isPending}
                                  title="Archive Cruise"
                                >
                                  <Archive className="w-4 h-4" />
                                </Button>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="Delete Cruise"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Cruise</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to permanently delete "{cruise.name}"?
                                      This action cannot be undone and will remove all associated data,
                                      including guest feedback and analytics.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteCruise.mutate(cruise.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete Permanently
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Report Modal */}
      <Dialog open={reportModalOpen} onOpenChange={(open) => !open && closeReportModal()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCruise?.name} - Performance Report
            </DialogTitle>
          </DialogHeader>

          {selectedCruise && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedCruise.guestCount?.toLocaleString() || 'N/A'}
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
                        {selectedCruise.averageRating?.toFixed(1) || 'N/A'}
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
                        {selectedCruise.feedbackCount || 0}
                      </p>
                      <p className="text-sm text-gray-600">Reviews</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cruise Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ship:</span>
                      <span className="font-medium">{selectedCruise.shipName}</span>
                    </div>
                    {selectedCruise.cruiseLine && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cruise Line:</span>
                        <span className="font-medium">{selectedCruise.cruiseLine}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">
                        {differenceInDays(dateOnly(selectedCruise.endDate), dateOnly(selectedCruise.startDate))} days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ports:</span>
                      <span className="font-medium">{selectedCruise.ports || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Events:</span>
                      <span className="font-medium">{selectedCruise.eventsCount || 0}</span>
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
                        {getRatingStars(selectedCruise.averageRating)}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Feedback Rate:</span>
                      <span className="font-medium">
                        {selectedCruise.guestCount && selectedCruise.feedbackCount
                          ? `${((selectedCruise.feedbackCount / selectedCruise.guestCount) * 100).toFixed(1)}%`
                          : 'N/A'
                        }
                      </span>
                    </div>
                    {selectedCruise.totalRevenue && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Revenue:</span>
                        <span className="font-medium">
                          ${selectedCruise.totalRevenue.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <div>{getStatusBadge(selectedCruise.status)}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedCruise.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{selectedCruise.description}</p>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={closeReportModal}>
                  Close
                </Button>
                <Button
                  onClick={() => exportCruiseData.mutate(selectedCruise.id)}
                  disabled={exportCruiseData.isPending}
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