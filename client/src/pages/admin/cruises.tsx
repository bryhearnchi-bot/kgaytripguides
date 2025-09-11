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
  highlights?: any;
  includesInfo?: any;
  pricing?: any;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

function CruisesManagementContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cruises, isLoading, error } = useQuery<Cruise[]>({
    queryKey: ['admin-cruises'],
    queryFn: async () => {
      const response = await fetch('/api/cruises', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch cruises');
      }
      return response.json();
    },
  });

  const deleteCruise = useMutation({
    mutationFn: async (cruiseId: number) => {
      const response = await fetch(`/api/cruises/${cruiseId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to delete cruise');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cruises'] });
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

  const filteredCruises = cruises?.filter(cruise =>
    cruise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cruise.shipName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cruise.cruiseLine && cruise.cruiseLine.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const canEdit = user?.role && ['super_admin', 'cruise_admin', 'content_editor'].includes(user.role);
  const canDelete = user?.role && ['super_admin'].includes(user.role);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Ship className="w-8 h-8 animate-pulse mx-auto mb-4" />
          <p>Loading cruises...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error loading cruises: {error.message}</p>
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
                  Cruise Management
                </h1>
              </div>
            </div>
            {canEdit && (
              <Button onClick={() => setLocation('/admin/cruises/unified/new')}>
                <Plus className="w-4 h-4 mr-2" />
                New Cruise
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
                placeholder="Search cruises by name or ship..."
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
                    <p className="text-sm text-gray-600">Total Cruises</p>
                    <p className="text-2xl font-bold">{cruises?.length || 0}</p>
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
                      {cruises?.filter(c => c.status === 'upcoming').length || 0}
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
                      {cruises?.filter(c => c.status === 'ongoing').length || 0}
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
                      {cruises?.filter(c => c.status === 'past').length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Cruises Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Cruises</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cruise Name</TableHead>
                  <TableHead>Ship</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCruises.map((cruise) => (
                  <TableRow key={cruise.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{cruise.name}</p>
                        <p className="text-sm text-gray-500">{cruise.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{cruise.shipName}</p>
                        {cruise.cruiseLine && (
                          <p className="text-sm text-gray-500">{cruise.cruiseLine}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{format(new Date(cruise.startDate), 'MMM dd, yyyy')}</p>
                        <p className="text-gray-500">
                          to {format(new Date(cruise.endDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(cruise.status)}</TableCell>
                    <TableCell>
                      {cruise.pricing ? (
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
                            onClick={() => setLocation(`/admin/cruises/${cruise.id}/unified`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${cruise.name}"? This action cannot be undone.`)) {
                                deleteCruise.mutate(cruise.id, {
                                  onSuccess: () => {
                                    toast({
                                      title: "Success",
                                      description: `"${cruise.name}" has been deleted.`,
                                    });
                                  },
                                  onError: (error: any) => {
                                    toast({
                                      title: "Error",
                                      description: error.message || "Failed to delete cruise. Please try again.",
                                      variant: "destructive",
                                    });
                                  }
                                });
                              }
                            }}
                            disabled={deleteCruise.isPending}
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
            {filteredCruises.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No cruises found matching your search.' : 'No cruises found.'}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function CruisesManagement() {
  return (
    <ProtectedRoute requiredRoles={['super_admin', 'cruise_admin', 'content_editor']}>
      <CruisesManagementContent />
    </ProtectedRoute>
  );
}