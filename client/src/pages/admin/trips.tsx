import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Ship, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  MapPin,
  Users,
  Search,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useToast } from '@/hooks/use-toast';

interface Trip {
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
  highlights?: any;
  includesInfo?: any;
  pricing?: any;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

function TripsManagementContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: trips, isLoading, error } = useQuery<Trip[]>({
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
      queryClient.invalidateQueries({ queryKey: ['admin-trips'] });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="default">Upcoming</Badge>;
      case 'ongoing':
        return <Badge variant="secondary">Ongoing</Badge>;
      case 'past':
        return <Badge variant="outline">Past</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredTrips = trips?.filter(trip =>
    trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.shipName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (trip.cruiseLine && trip.cruiseLine.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const canEdit = user?.role && ['super_admin', 'trip_admin', 'content_editor'].includes(user.role);
  const canDelete = user?.role && ['super_admin'].includes(user.role);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Ship className="w-8 h-8 animate-pulse mx-auto mb-4" />
          <p>Loading trips...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error loading trips: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
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
              <div className="flex items-center space-x-2">
                <Ship className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Trip Management
                </h1>
              </div>
            </div>
            {canEdit && (
              <Button onClick={() => setLocation('/admin/trips/unified/new')}>
                <Plus className="w-4 h-4 mr-2" />
                New Trip
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Stats */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search trips by name or ship..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Ship className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Trips</p>
                    <p className="text-2xl font-bold">{trips?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Upcoming</p>
                    <p className="text-2xl font-bold">
                      {trips?.filter(c => c.status === 'upcoming').length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Ongoing</p>
                    <p className="text-2xl font-bold">
                      {trips?.filter(c => c.status === 'ongoing').length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Past</p>
                    <p className="text-2xl font-bold">
                      {trips?.filter(c => c.status === 'past').length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trips Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip Name</TableHead>
                  <TableHead>Ship</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{trip.name}</p>
                        <p className="text-sm text-gray-500">{trip.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{trip.shipName}</p>
                        {trip.cruiseLine && (
                          <p className="text-sm text-gray-500">{trip.cruiseLine}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{format(new Date(trip.startDate), 'MMM dd, yyyy')}</p>
                        <p className="text-gray-500">
                          to {format(new Date(trip.endDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(trip.status)}</TableCell>
                    <TableCell>
                      {trip.pricing ? (
                        <span className="text-sm">View Pricing</span>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {canEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/admin/trips/${trip.id}/unified`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${trip.name}"? This action cannot be undone.`)) {
                                deleteTrip.mutate(trip.id, {
                                  onSuccess: () => {
                                    toast({
                                      title: "Success",
                                      description: `"${trip.name}" has been deleted.`,
                                    });
                                  },
                                  onError: (error: any) => {
                                    toast({
                                      title: "Error",
                                      description: error.message || "Failed to delete trip. Please try again.",
                                      variant: "destructive",
                                    });
                                  }
                                });
                              }
                            }}
                            disabled={deleteTrip.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredTrips.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No trips found matching your search.' : 'No trips found.'}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function TripsManagement() {
  return (
    <ProtectedRoute requiredRoles={['super_admin', 'cruise_admin', 'content_editor']}>
      <TripsManagementContent />
    </ProtectedRoute>
  );
}