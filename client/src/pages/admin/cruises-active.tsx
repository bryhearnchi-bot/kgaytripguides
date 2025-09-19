import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Ship,
  Plus,
  Search,
  Edit,
  Eye,
  Users,
  Calendar,
  MapPin,
  Clock,
  Activity,
  Anchor,
  Star
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { dateOnly } from '@/lib/utils';

interface Cruise {
  id: number;
  name: string;
  description?: string;
  slug: string;
  startDate: string;
  endDate: string;
  shipName: string;
  cruiseLine?: string;
  status: 'upcoming' | 'ongoing' | 'past';
  heroImageUrl?: string;
  guestCount?: number;
  ports?: number;
  eventsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export default function ActiveCruises() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCruise, setSelectedCruise] = useState<Cruise | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch active cruises (upcoming and ongoing)
  const { data: cruises = [], isLoading: cruisesLoading, error: cruisesError } = useQuery<Cruise[]>({
    queryKey: ['admin-active-cruises'],
    queryFn: async () => {
      const response = await fetch('/api/admin/cruises?status=active', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch active cruises');
      }
      return response.json();
    },
  });

  // Update cruise status mutation
  const updateCruiseStatus = useMutation({
    mutationFn: async ({ cruiseId, status }: { cruiseId: number; status: string }) => {
      const response = await fetch(`/api/admin/cruises/${cruiseId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Failed to update cruise status');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Cruise status updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-active-cruises'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update cruise status',
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (cruise: Cruise) => {
    const now = new Date();
    const startDate = new Date(cruise.startDate);
    const endDate = new Date(cruise.endDate);

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
        <Badge variant="outline" className="bg-gray-100 text-gray-800">
          <Star className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    }
  };

  const getDaysUntilDeparture = (startDate: string) => {
    const now = new Date();
    const departure = new Date(startDate);
    return Math.max(0, differenceInDays(departure, now));
  };

  const filteredCruises = cruises.filter(cruise =>
    cruise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cruise.shipName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cruise.cruiseLine && cruise.cruiseLine.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openQuickView = (cruise: Cruise) => {
    setSelectedCruise(cruise);
    setQuickViewOpen(true);
  };

  const closeQuickView = () => {
    setQuickViewOpen(false);
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
                <Ship className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Active Cruises</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/admin/cruises-past')}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Past Cruises
              </Button>
              <Button
                onClick={() => setLocation('/admin/cruise-wizard')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Cruise
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search cruises by name, ship, or cruise line..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          {!cruisesLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Ship className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Active Cruises</p>
                      <p className="text-2xl font-bold text-gray-900">{filteredCruises.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Activity className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Currently Sailing</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {filteredCruises.filter(c => {
                          const now = new Date();
                          const start = new Date(c.startDate);
                          const end = new Date(c.endDate);
                          return now >= start && now <= end;
                        }).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="w-8 h-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Departing Soon</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {filteredCruises.filter(c => getDaysUntilDeparture(c.startDate) <= 7 && getDaysUntilDeparture(c.startDate) > 0).length}
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
              <CardTitle>Active Cruises ({filteredCruises.length})</CardTitle>
              <CardDescription>
                Manage upcoming and ongoing cruise itineraries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cruisesLoading ? (
                <div className="text-center py-8">
                  <Ship className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-600" />
                  <p>Loading active cruises...</p>
                </div>
              ) : cruisesError ? (
                <div className="text-center py-8 text-red-600">
                  <p>Error loading cruises: {cruisesError.message}</p>
                </div>
              ) : filteredCruises.length === 0 ? (
                <div className="text-center py-12">
                  <Ship className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active cruises found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first cruise.'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setLocation('/admin/cruise-wizard')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Cruise
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cruise Details</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Stats</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCruises.map((cruise) => (
                        <TableRow key={cruise.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-medium">
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
                            {getStatusBadge(cruise)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {cruise.guestCount || 0}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {cruise.ports || 0}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {cruise.eventsCount || 0}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openQuickView(cruise)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setLocation(`/admin/cruise-detail?id=${cruise.id}`)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setLocation(`/trip/${cruise.slug}`)}
                              >
                                <Anchor className="w-4 h-4" />
                              </Button>
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

      {/* Quick View Modal */}
      <Dialog open={quickViewOpen} onOpenChange={(open) => !open && closeQuickView()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCruise?.name} - Quick View
            </DialogTitle>
          </DialogHeader>

          {selectedCruise && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Cruise Details</h3>
                    <div className="space-y-2 text-sm">
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
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Statistics</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Guests:</span>
                        <span className="font-medium">{selectedCruise.guestCount || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ports:</span>
                        <span className="font-medium">{selectedCruise.ports || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Events:</span>
                        <span className="font-medium">{selectedCruise.eventsCount || 0}</span>
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
                          {format(dateOnly(selectedCruise.startDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Return:</span>
                        <span className="font-medium">
                          {format(dateOnly(selectedCruise.endDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Days Until:</span>
                        <span className="font-medium">
                          {getDaysUntilDeparture(selectedCruise.startDate)} days
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                    <div className="flex justify-center">
                      {getStatusBadge(selectedCruise)}
                    </div>
                  </div>
                </div>
              </div>

              {selectedCruise.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-600">{selectedCruise.description}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={closeQuickView}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    closeQuickView();
                    setLocation(`/admin/cruise-detail?id=${selectedCruise.id}`);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Cruise
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}