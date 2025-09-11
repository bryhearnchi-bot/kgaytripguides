import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { 
  Ship, 
  Users, 
  LogOut, 
  BarChart3,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Info,
  X,
  MapPin,
  Settings,
  UserCog
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { dateOnly } from '@/lib/utils';
import ArtistDatabaseManager from '../../components/admin/ArtistDatabaseManager';
import CruiseDetailsTab from '@/components/admin/CruiseDetailsTab';
import ItineraryTab from '@/components/admin/ItineraryTab';
import EventsAndEntertainmentTab from '../../components/admin/EventsAndEntertainmentTab';
import InfoAndUpdatesTab from '../../components/admin/InfoAndUpdatesTab';

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
  const [cruiseModalOpen, setCruiseModalOpen] = useState(false);
  const [editingCruiseId, setEditingCruiseId] = useState<number | null>(null);
  const [cruiseEditorTab, setCruiseEditorTab] = useState("details");
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

  const openCruiseModal = (cruiseId?: number) => {
    setEditingCruiseId(cruiseId || null);
    setCruiseModalOpen(true);
  };

  const closeCruiseModal = () => {
    setCruiseModalOpen(false);
    setEditingCruiseId(null);
    setCruiseEditorTab("details");
    // Refresh cruises data when modal closes
    queryClient.invalidateQueries({ queryKey: ['admin-cruises'] });
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
                  <span className="hidden sm:inline">Cruise Guide Admin</span>
                  <span className="sm:hidden">Admin</span>
                </h1>
                <p className="text-sm text-gray-500 hidden md:block">
                  Atlantis Events Management Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={getRoleBadgeVariant(user?.role || '')}>
                    <span className="hidden md:inline">{user?.role?.replace('_', ' ').toUpperCase()}</span>
                    <span className="md:hidden">{user?.role?.split('_')[0].toUpperCase()}</span>
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tab Navigation - Responsive */}
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="cruises" className="flex items-center space-x-2">
              <Ship className="w-4 h-4" />
              <span className="hidden sm:inline">Cruise Management</span>
              <span className="sm:hidden">Cruises</span>
            </TabsTrigger>
            <TabsTrigger value="talent" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Talent Directory</span>
              <span className="sm:hidden">Talent</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <UserCog className="w-4 h-4" />
              <span className="hidden sm:inline">User Management</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden">Settings</span>
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
                <Button onClick={() => openCruiseModal()}>
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
                        <Button onClick={() => openCruiseModal()}>
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
                              <p><strong>Dates:</strong> {format(dateOnly(cruise.startDate), 'MMM dd, yyyy')} - {format(dateOnly(cruise.endDate), 'MMM dd, yyyy')}</p>
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
                                onClick={() => openCruiseModal(cruise.id)}
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

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">User Management</h2>
              <p className="text-gray-600">Manage admin users, permissions, and access controls</p>
            </div>
            
            <Card>
              <CardContent className="text-center py-12">
                <UserCog className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">User Management Coming Soon</h3>
                <p className="text-gray-500">
                  User management and permission controls will be available in a future update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
              <p className="text-gray-600">Configure system settings, branding, and preferences</p>
            </div>
            
            <Card>
              <CardContent className="text-center py-12">
                <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Settings Coming Soon</h3>
                <p className="text-gray-500">
                  System configuration and settings panel will be available in a future update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Cruise Editor Modal */}
      <Dialog open={cruiseModalOpen} onOpenChange={(open) => !open && closeCruiseModal()}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCruiseId ? 'Edit Cruise' : 'Create New Cruise'}
            </DialogTitle>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>
          
          <div className="mt-4">
            <Tabs value={cruiseEditorTab} onValueChange={setCruiseEditorTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details" className="flex items-center space-x-2">
                  <Ship className="w-4 h-4" />
                  <span className="hidden sm:inline">Cruise Details</span>
                  <span className="sm:hidden">Details</span>
                </TabsTrigger>
                <TabsTrigger value="itinerary" className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span className="hidden sm:inline">Itinerary</span>
                  <span className="sm:hidden">Route</span>
                </TabsTrigger>
                <TabsTrigger value="events" className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Events</span>
                </TabsTrigger>
                <TabsTrigger value="info" className="flex items-center space-x-2">
                  <Info className="w-4 h-4" />
                  <span>Info</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6">
                <CruiseDetailsTab 
                  cruise={editingCruiseId ? { id: editingCruiseId } : null}
                  isEditing={!!editingCruiseId}
                />
              </TabsContent>

              <TabsContent value="itinerary" className="mt-6">
                <ItineraryTab 
                  cruise={editingCruiseId ? { id: editingCruiseId } : null}
                  isEditing={!!editingCruiseId}
                />
              </TabsContent>

              <TabsContent value="events" className="mt-6">
                <EventsAndEntertainmentTab 
                  onDataChange={() => {
                    // Handle events data changes
                    queryClient.invalidateQueries({ queryKey: ['admin-cruises'] });
                  }}
                />
              </TabsContent>

              <TabsContent value="info" className="mt-6">
                <InfoAndUpdatesTab 
                  onDataChange={() => {
                    // Handle info data changes  
                    queryClient.invalidateQueries({ queryKey: ['admin-cruises'] });
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}