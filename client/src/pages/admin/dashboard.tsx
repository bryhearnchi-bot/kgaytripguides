import { useState, useEffect } from 'react';
import * as React from 'react';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import AdminNavigationBanner from '@/components/admin/AdminNavigationBanner';
import ArtistDatabaseManager from '@/components/admin/ArtistDatabaseManager';
import TripDetailsTab from '@/components/admin/TripDetailsTab';
import ItineraryTab from '@/components/admin/ItineraryTab';
import EventsAndEntertainmentTab from '@/components/admin/EventsAndEntertainmentTab';
import InfoAndUpdatesTab from '@/components/admin/InfoAndUpdatesTab';
import UserManagement from '@/components/admin/UserManagement';
import SettingsTab from '@/components/admin/SettingsTab';
import PortManagement from '@/components/admin/PortManagementSafe';
import PartyManagement from '@/components/admin/PartyManagement';
import Analytics from '@/components/admin/Dashboard/Analytics';
import { useToast } from '@/hooks/use-toast';
import { dateOnly } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Ship,
  Users,
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
  UserCog,
  Anchor,
  Music,
  Menu,
  Home,
  FileText,
  TrendingUp,
  ChevronRight,
  Activity,
  Globe,
  Star,
  ChevronDown,
  ChevronUp,
  Shield
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
  const { profile } = useSupabaseAuthContext();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState('');
  const [tripModalOpen, setTripModalOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<number | null>(null);
  const [tripEditorTab, setTripEditorTab] = useState("details");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const isSectionCollapsed = (sectionId: string) => {
    return isMobile && collapsedSections[sectionId];
  };

  // Check if mobile viewport
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch trips data
  const { data: trips, isLoading: tripsLoading } = useQuery<Trip[]>({
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
      toast({
        title: "Trip deleted",
        description: "The trip has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete trip. Please try again.",
        variant: "destructive",
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Upcoming</Badge>;
      case 'ongoing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Ongoing</Badge>;
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

  const canEdit = profile?.role && ['super_admin', 'trip_admin', 'content_editor', 'admin'].includes(profile.role);
  const canDelete = profile?.role && ['super_admin', 'admin'].includes(profile.role);

  const handleDeleteTrip = (trip: Trip) => {
    if (confirm(`Are you sure you want to delete "${trip.name}"? This action cannot be undone.`)) {
      deleteTrip.mutate(trip.id);
    }
  };

  const openTripModal = (tripId?: number) => {
    setEditingTripId(tripId || null);
    setTripModalOpen(true);
  };

  const closeTripModal = () => {
    setTripModalOpen(false);
    setEditingTripId(null);
    setTripEditorTab("details");
    queryClient.invalidateQueries({ queryKey: ['admin-trips'] });
  };

  const navigationItems = [
    { id: 'overview', label: 'Dashboard', icon: Home, color: 'text-blue-600' },
    { id: 'trips', label: 'Trip Management', icon: Ship, color: 'text-cyan-600' },
    { id: 'talent', label: 'Talent Directory', icon: Users, color: 'text-purple-600' },
    { id: 'ports', label: 'Port Management', icon: Anchor, color: 'text-green-600' },
    { id: 'party', label: 'Party Management', icon: Music, color: 'text-pink-600' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-orange-600' },
    { id: 'users', label: 'User Management', icon: UserCog, color: 'text-indigo-600' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation Banner */}
      <AdminNavigationBanner />

      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-[52px] h-[calc(100vh-52px)] bg-white border-r border-gray-200 transition-all duration-300 z-50 shadow-sm ${
        isMobile
          ? `transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} w-64`
          : sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Shield className={`${sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5'} text-ocean-600`} />
            {!sidebarCollapsed && (
              <span className="text-sm font-semibold text-gray-700">Admin Panel</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (isMobile) {
                setMobileMenuOpen(!mobileMenuOpen);
              } else {
                setSidebarCollapsed(!sidebarCollapsed);
              }
            }}
            className="ml-auto hover:bg-gray-200"
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>

        <nav className="p-2">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (isMobile) {
                      setMobileMenuOpen(false);
                    }
                  }}
                  className={`w-full flex items-center ${sidebarCollapsed && !isMobile ? 'justify-center' : 'justify-start'} px-3 py-3 rounded-lg transition-all duration-200 group touch-manipulation ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-gray-500 group-hover:text-gray-700'}`} />
                  {(!sidebarCollapsed || isMobile) && (
                    <>
                      <span className={`ml-3 font-medium ${isActive ? 'text-gray-900' : ''}`}>
                        {item.label}
                      </span>
                      {isActive && <ChevronRight className="ml-auto w-4 h-4" />}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer Info */}
        {(!sidebarCollapsed || isMobile) && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
            <div className="text-xs text-gray-500">
              <p className="font-medium mb-1">K-GAY Travel Guides</p>
              <p>Admin Dashboard v2.0</p>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={`pt-[52px] transition-all duration-300 ${
        isMobile ? 'ml-0 pb-20' : (sidebarCollapsed ? 'ml-16' : 'ml-64')
      }`}>
        <div className="p-3 sm:p-4 md:p-6">
          {/* Mobile Menu Button */}
          {isMobile && (
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobileMenuOpen(true)}
                className="flex items-center gap-2 touch-manipulation"
              >
                <Menu className="w-4 h-4" />
                <span>Menu</span>
              </Button>
            </div>
          )}
          {/* Dashboard Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your trips.</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                <Card className="hover:shadow-lg transition-all duration-300 border-t-4 border-t-blue-500">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center">
                        <Ship className="w-6 h-6 text-blue-600" />
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        +12%
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-bold text-gray-900">{filteredTrips.length || 0}</h3>
                      <p className="text-sm text-gray-600">Active Trips</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300 border-t-4 border-t-purple-500">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-purple-600" />
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        +23%
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-bold text-gray-900">156</h3>
                      <p className="text-sm text-gray-600">Talent Profiles</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300 border-t-4 border-t-green-500">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <Badge variant="secondary" className="bg-red-100 text-red-700">
                        -5%
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-bold text-gray-900">87%</h3>
                      <p className="text-sm text-gray-600">Engagement Rate</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300 border-t-4 border-t-orange-500">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-orange-600" />
                      </div>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                        Today
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-bold text-gray-900">3</h3>
                      <p className="text-sm text-gray-600">Upcoming Events</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                <Card className="lg:col-span-2 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="w-5 h-5 text-blue-600" />
                          Recent Activity
                        </CardTitle>
                        <CardDescription>Latest updates from your trips and events</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      <div className="flex items-center space-x-4 p-4 hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center">
                          <Plus className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">New trip created</p>
                          <p className="text-xs text-gray-500">Greek Isles 2025 - 2 minutes ago</p>
                        </div>
                        <Badge variant="outline" className="text-xs">New</Badge>
                      </div>
                      <div className="flex items-center space-x-4 p-4 hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-50 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Talent profile updated</p>
                          <p className="text-xs text-gray-500">Trixie Mattel - 15 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 p-4 hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center">
                          <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Event published</p>
                          <p className="text-xs text-gray-500">Welcome Party - 1 hour ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 p-4 hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center">
                          <Star className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">New review received</p>
                          <p className="text-xs text-gray-500">5-star rating - 2 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>Common tasks and shortcuts</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <Button
                      onClick={() => openTripModal()}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Trip
                    </Button>
                    <Button variant="outline" className="w-full hover:bg-purple-50 hover:border-purple-300">
                      <Users className="w-4 h-4 mr-2 text-purple-600" />
                      Add Talent
                    </Button>
                    <Button variant="outline" className="w-full hover:bg-orange-50 hover:border-orange-300">
                      <Calendar className="w-4 h-4 mr-2 text-orange-600" />
                      Schedule Event
                    </Button>
                    <Button variant="outline" className="w-full hover:bg-green-50 hover:border-green-300">
                      <Anchor className="w-4 h-4 mr-2 text-green-600" />
                      Add Port
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Placeholder */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle>Trip Engagement Trends</CardTitle>
                    <CardDescription>Monthly engagement across all trips</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 sm:h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-sm sm:text-base text-gray-500 text-center px-4">Chart visualization would go here</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle>Popular Destinations</CardTitle>
                    <CardDescription>Top ports by visitor interest</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 sm:h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-sm sm:text-base text-gray-500 text-center px-4">Chart visualization would go here</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Trip Management Section */}
          {activeTab === 'trips' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Trip Management</h2>
                  <p className="text-sm sm:text-base text-gray-600">Create and manage trip itineraries, events, and entertainment</p>
                </div>
                {canEdit && (
                  <Button
                    onClick={() => openTripModal()}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 w-full sm:w-auto touch-manipulation min-h-[44px]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Create New Trip</span>
                    <span className="sm:hidden">New Trip</span>
                  </Button>
                )}
              </div>

              {/* Search Bar */}
              <Card>
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search trips by name or ship..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Trips List */}
              {tripsLoading && (
                <div className="text-center py-8">
                  <Ship className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-600" />
                  <p>Loading trips...</p>
                </div>
              )}

              {filteredTrips && (
                <div className="grid gap-4">
                  {filteredTrips.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Ship className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
                        <p className="text-gray-500 mb-4">
                          {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first trip.'}
                        </p>
                        {canEdit && !searchTerm && (
                          <Button onClick={() => openTripModal()}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Trip
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    filteredTrips.map((trip) => (
                      <Card key={trip.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{trip.name}</h3>
                                {getStatusBadge(trip.status)}
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><strong>Ship:</strong> {trip.shipName}</p>
                                {trip.cruiseLine && <p><strong>Line:</strong> {trip.cruiseLine}</p>}
                                <p><strong>Dates:</strong> {format(dateOnly(trip.startDate), 'MMM dd, yyyy')} - {format(dateOnly(trip.endDate), 'MMM dd, yyyy')}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setLocation(`/trip/${trip.slug}`)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              {canEdit && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openTripModal(trip.id)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteTrip(trip)}
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
            </div>
          )}

          {/* Talent Directory Section */}
          {activeTab === 'talent' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Talent Directory</h2>
                <p className="text-gray-600">Manage performer profiles, bios, and social media links</p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <ArtistDatabaseManager />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Port Management Section */}
          {activeTab === 'ports' && (
            <PortManagement />
          )}

          {/* Party Management Section */}
          {activeTab === 'party' && (
            <PartyManagement />
          )}

          {/* Analytics Section */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics & Reports</h2>
                <p className="text-gray-600">View engagement statistics and user activity reports</p>
              </div>

              <Analytics />
            </div>
          )}

          {/* User Management Section */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">User Management</h2>
                <p className="text-gray-600">Manage admin users, permissions, and access controls</p>
              </div>

              <UserManagement />
            </div>
          )}

          {/* Settings Section */}
          {activeTab === 'settings' && (
            <SettingsTab />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 p-2">
          <div className="flex justify-around items-center">
            <button
              onClick={() => {
                setActiveTab('overview');
              }}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors touch-manipulation ${
                activeTab === 'overview' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs mt-1">Dashboard</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('trips');
              }}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors touch-manipulation ${
                activeTab === 'trips' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
            >
              <Ship className="w-5 h-5" />
              <span className="text-xs mt-1">Trips</span>
            </button>
            <button
              onClick={() => openTripModal()}
              className="flex flex-col items-center p-2 rounded-lg bg-blue-600 text-white shadow-lg touch-manipulation"
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs mt-1">Add</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('talent');
              }}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors touch-manipulation ${
                activeTab === 'talent' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs mt-1">Talent</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(true);
              }}
              className="flex flex-col items-center p-2 rounded-lg transition-colors text-gray-600 touch-manipulation"
            >
              <Menu className="w-5 h-5" />
              <span className="text-xs mt-1">More</span>
            </button>
          </div>
        </div>
      )}

      {/* Trip Editor Modal */}
      <Dialog open={tripModalOpen} onOpenChange={(open) => !open && closeTripModal()}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTripId ? 'Edit Trip' : 'Create New Trip'}
            </DialogTitle>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>

          <div className="mt-4">
            <Tabs value={tripEditorTab} onValueChange={setTripEditorTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details" className="flex items-center space-x-2">
                  <Ship className="w-4 h-4" />
                  <span className="hidden sm:inline">Trip Details</span>
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
                <TripDetailsTab
                  trip={editingTripId ? { id: editingTripId } : null}
                  isEditing={!!editingTripId}
                />
              </TabsContent>

              <TabsContent value="itinerary" className="mt-6">
                <ItineraryTab
                  trip={editingTripId ? { id: editingTripId } : null}
                  isEditing={!!editingTripId}
                />
              </TabsContent>

              <TabsContent value="events" className="mt-6">
                <EventsAndEntertainmentTab
                  onDataChange={() => {
                    queryClient.invalidateQueries({ queryKey: ['admin-trips'] });
                  }}
                />
              </TabsContent>

              <TabsContent value="info" className="mt-6">
                <InfoAndUpdatesTab
                  onDataChange={() => {
                    queryClient.invalidateQueries({ queryKey: ['admin-trips'] });
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