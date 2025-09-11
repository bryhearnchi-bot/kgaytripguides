import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Ship, 
  Users, 
  LogOut, 
  BarChart3,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import ArtistDatabaseManager from '../../components/admin/ArtistDatabaseManager';

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

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("cruises");
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    setLocation('/admin/login');
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'cruise_admin': return 'default';
      case 'content_editor': return 'secondary';
      case 'media_manager': return 'outline';
      default: return 'secondary';
    }
  };

  // Fetch cruises data
  const { data: cruises, isLoading: cruisesLoading, error: cruisesError } = useQuery<Cruise[]>({
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
    enabled: activeTab === 'cruises',
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
      toast({
        title: "Cruise deleted",
        description: "The cruise has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete cruise. Please try again.",
        variant: "destructive",
      });
    }
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

  const handleDeleteCruise = (cruise: Cruise) => {
    if (confirm(`Are you sure you want to delete "${cruise.name}"? This action cannot be undone.`)) {
      deleteCruise.mutate(cruise.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Ship className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Cruise Guide Admin
                </h1>
                <p className="text-sm text-gray-500">
                  Atlantis Events Management Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={getRoleBadgeVariant(user?.role || '')}>
                    {user?.role?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="cruises" className="flex items-center space-x-2">
              <Ship className="w-4 h-4" />
              <span>Cruise Management</span>
            </TabsTrigger>
            <TabsTrigger value="talent" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Talent Directory</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Cruise Management Tab */}
          <TabsContent value="cruises" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Cruise Management</h2>
                <p className="text-gray-600">Create and manage cruise itineraries, events, and entertainment</p>
              </div>
              {canEdit && (
                <Button onClick={() => setLocation('/admin/cruises/unified/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Cruise
                </Button>
              )}
            </div>

            {/* Search Bar */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search cruises by name or ship..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cruises List */}
            {cruisesLoading && (
              <div className="text-center py-8">
                <Ship className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-600" />
                <p>Loading cruises...</p>
              </div>
            )}

            {cruisesError && (
              <div className="text-center py-8 text-red-600">
                <p>Error loading cruises: {cruisesError.message}</p>
              </div>
            )}

            {filteredCruises && (
              <div className="grid gap-4">
                {filteredCruises.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Ship className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No cruises found</h3>
                      <p className="text-gray-500 mb-4">
                        {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first cruise.'}
                      </p>
                      {canEdit && !searchTerm && (
                        <Button onClick={() => setLocation('/admin/cruises/unified/new')}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Cruise
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  filteredCruises.map((cruise) => (
                    <Card key={cruise.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{cruise.name}</h3>
                              {getStatusBadge(cruise.status)}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p><strong>Ship:</strong> {cruise.shipName}</p>
                              {cruise.cruiseLine && <p><strong>Line:</strong> {cruise.cruiseLine}</p>}
                              <p><strong>Dates:</strong> {format(new Date(cruise.startDate), 'MMM dd, yyyy')} - {format(new Date(cruise.endDate), 'MMM dd, yyyy')}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/cruise/${cruise.slug}`)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            {canEdit && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setLocation(`/admin/cruises/${cruise.id}/unified`)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCruise(cruise)}
                                className="text-red-600 hover:text-red-700 hover:border-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          {/* Talent Directory Tab */}
          <TabsContent value="talent" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Talent Directory</h2>
              <p className="text-gray-600">Manage performer profiles, bios, and social media links</p>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <ArtistDatabaseManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics & Reports</h2>
              <p className="text-gray-600">View engagement statistics and user activity reports</p>
            </div>
            
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
                <p className="text-gray-500">
                  Analytics and reporting features will be available in a future update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}