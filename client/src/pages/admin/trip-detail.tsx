import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Ship,
  Save,
  Eye,
  Edit,
  Calendar,
  MapPin,
  Users,
  Music,
  Image,
  FileText,
  Settings,
  Activity,
  Star,
  Clock,
  Anchor,
  Upload,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { dateOnly } from '@/lib/utils';

interface TripDetail {
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
  mapUrl?: string;
  bookingUrl?: string;
  guestCount?: number;
  maxCapacity?: number;
  highlights?: any;
  includesInfo?: any;
  pricing?: any;
  itinerary?: any[];
  events?: any[];
  ports?: any[];
  createdAt: string;
  updatedAt: string;
}

interface TripFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  shipName: string;
  cruiseLine: string;
  guestCount: number;
  maxCapacity: number;
  heroImageUrl: string;
  mapUrl: string;
  bookingUrl: string;
}

export default function TripDetail() {
  const [, setLocation] = useLocation();
  const [cruise, setCruise] = useState<TripDetail | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<TripFormData>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    shipName: '',
    cruiseLine: '',
    guestCount: 0,
    maxCapacity: 0,
    heroImageUrl: '',
    mapUrl: '',
    bookingUrl: '',
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get trip ID from URL params
  const tripId = new URLSearchParams(window.location.search).get('id');

  // Fetch trip details
  const {
    data: tripData,
    isLoading: tripLoading,
    error: tripError,
  } = useQuery<TripDetail>({
    queryKey: ['admin-trip-detail', tripId],
    queryFn: async () => {
      if (!tripId) throw new Error('No trip ID provided');

      const response = await fetch(`/api/admin/trips/${tripId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch trip details');
      }
      return response.json();
    },
    enabled: !!tripId,
  });

  // Initialize form data when trip data loads
  useEffect(() => {
    if (tripData) {
      setCruise(tripData);
      setFormData({
        name: tripData.name,
        description: tripData.description || '',
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        shipName: tripData.shipName,
        cruiseLine: tripData.cruiseLine || '',
        guestCount: tripData.guestCount || 0,
        maxCapacity: tripData.maxCapacity || 0,
        heroImageUrl: tripData.heroImageUrl || '',
        mapUrl: tripData.mapUrl || '',
        bookingUrl: tripData.bookingUrl || '',
      });
    }
  }, [tripData]);

  // Update trip mutation
  const updateTrip = useMutation({
    mutationFn: async (data: Partial<TripFormData>) => {
      if (!tripId) throw new Error('No trip ID');

      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update trip');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Trip updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-trip-detail', tripId] });
      setIsEditing(false);
    },
    onError: error => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update trip',
        variant: 'destructive',
      });
    },
  });

  const handleInputChange = (field: keyof TripFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Trip name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast({
        title: 'Validation Error',
        description: 'Start and end dates are required',
        variant: 'destructive',
      });
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast({
        title: 'Validation Error',
        description: 'End date must be after start date',
        variant: 'destructive',
      });
      return;
    }

    updateTrip.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Upcoming
          </Badge>
        );
      case 'ongoing':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Ongoing
          </Badge>
        );
      case 'past':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            Past
          </Badge>
        );
      case 'archived':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            Archived
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!tripId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="text-center py-8">
            <Ship className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Trip Selected</h3>
            <p className="text-gray-500 mb-4">Please select a trip to view details.</p>
            <Button onClick={() => setLocation('/admin/trips')}>View All Trips</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tripLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Ship className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-600" />
          <p>Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (tripError || !cruise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="text-center py-8">
            <Ship className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Trip</h3>
            <p className="text-gray-500 mb-4">
              {tripError?.message || 'Failed to load trip details'}
            </p>
            <Button onClick={() => setLocation('/admin/trips')}>View All Trips</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Ship className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">{cruise.name}</h1>
              {getStatusBadge(cruise.status)}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation(`/trip/${cruise.slug}`)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Live
              </Button>
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Trip
                </Button>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateTrip.isPending}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateTrip.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Ship className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="itinerary" className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Itinerary</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Events</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center space-x-2">
              <Image className="w-4 h-4" />
              <span>Media</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cruise Information */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Trip Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Trip Name *</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={e => handleInputChange('name', e.target.value)}
                              placeholder="Enter trip name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="shipName">Ship Name *</Label>
                            <Input
                              id="shipName"
                              value={formData.shipName}
                              onChange={e => handleInputChange('shipName', e.target.value)}
                              placeholder="Enter ship name"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cruiseLine">Cruise Line</Label>
                          <Input
                            id="cruiseLine"
                            value={formData.cruiseLine}
                            onChange={e => handleInputChange('cruiseLine', e.target.value)}
                            placeholder="Enter cruise line"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={e => handleInputChange('description', e.target.value)}
                            placeholder="Enter trip description"
                            rows={4}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date *</Label>
                            <Input
                              id="startDate"
                              type="date"
                              value={formData.startDate}
                              onChange={e => handleInputChange('startDate', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="endDate">End Date *</Label>
                            <Input
                              id="endDate"
                              type="date"
                              value={formData.endDate}
                              onChange={e => handleInputChange('endDate', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="guestCount">Current Guest Count</Label>
                            <Input
                              id="guestCount"
                              type="number"
                              value={formData.guestCount}
                              onChange={e =>
                                handleInputChange('guestCount', parseInt(e.target.value) || 0)
                              }
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="maxCapacity">Maximum Capacity</Label>
                            <Input
                              id="maxCapacity"
                              type="number"
                              value={formData.maxCapacity}
                              onChange={e =>
                                handleInputChange('maxCapacity', parseInt(e.target.value) || 0)
                              }
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="heroImageUrl">Hero Image URL</Label>
                          <Input
                            id="heroImageUrl"
                            value={formData.heroImageUrl}
                            onChange={e => handleInputChange('heroImageUrl', e.target.value)}
                            placeholder="Enter image URL"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mapUrl">Map URL</Label>
                          <Input
                            id="mapUrl"
                            value={formData.mapUrl}
                            onChange={e => handleInputChange('mapUrl', e.target.value)}
                            placeholder="Enter map URL"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bookingUrl">Booking URL</Label>
                          <Input
                            id="bookingUrl"
                            value={formData.bookingUrl}
                            onChange={e => handleInputChange('bookingUrl', e.target.value)}
                            placeholder="Enter booking URL"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-600">Ship</p>
                              <p className="font-medium">{cruise.shipName}</p>
                            </div>
                            {cruise.cruiseLine && (
                              <div>
                                <p className="text-sm text-gray-600">Cruise Line</p>
                                <p className="font-medium">{cruise.cruiseLine}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-sm text-gray-600">Duration</p>
                              <p className="font-medium">
                                {differenceInDays(
                                  dateOnly(cruise.endDate),
                                  dateOnly(cruise.startDate)
                                )}{' '}
                                days
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-600">Departure</p>
                              <p className="font-medium">
                                {format(dateOnly(cruise.startDate), 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Return</p>
                              <p className="font-medium">
                                {format(dateOnly(cruise.endDate), 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Status</p>
                              <div>{getStatusBadge(cruise.status)}</div>
                            </div>
                          </div>
                        </div>

                        {cruise.description && (
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Description</p>
                            <p className="text-gray-900">{cruise.description}</p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-2xl font-bold text-gray-900">
                          {cruise.guestCount?.toLocaleString() || '0'}
                        </p>
                        <p className="text-sm text-gray-600">Guests</p>
                      </div>
                      <div className="text-center">
                        <MapPin className="w-8 h-8 mx-auto mb-2 text-green-600" />
                        <p className="text-2xl font-bold text-gray-900">
                          {cruise.ports?.length || 0}
                        </p>
                        <p className="text-sm text-gray-600">Ports</p>
                      </div>
                      <div className="text-center">
                        <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                        <p className="text-2xl font-bold text-gray-900">
                          {cruise.events?.length || 0}
                        </p>
                        <p className="text-sm text-gray-600">Events</p>
                      </div>
                      <div className="text-center">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                        <p className="text-2xl font-bold text-gray-900">
                          {differenceInDays(dateOnly(cruise.endDate), dateOnly(cruise.startDate))}
                        </p>
                        <p className="text-sm text-gray-600">Days</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Hero Image */}
                {cruise.heroImageUrl && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Hero Image</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <img
                        src={cruise.heroImageUrl}
                        alt={cruise.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span>Trip created</span>
                        <span className="text-gray-500 ml-auto">
                          {format(dateOnly(cruise.createdAt), 'MMM dd')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span>Last updated</span>
                        <span className="text-gray-500 ml-auto">
                          {format(dateOnly(cruise.updatedAt), 'MMM dd')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setActiveTab('itinerary')}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Manage Itinerary
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setActiveTab('events')}
                    >
                      <Music className="w-4 h-4 mr-2" />
                      Manage Events
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setActiveTab('media')}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Media
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Other tabs would be implemented here */}
          <TabsContent value="itinerary" className="space-y-6">
            <Card>
              <CardContent className="text-center py-12">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Itinerary Management</h3>
                <p className="text-gray-500">
                  Itinerary management features will be integrated here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Events Management</h3>
                <p className="text-gray-500">Events management features will be integrated here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <Card>
              <CardContent className="text-center py-12">
                <Image className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Media Management</h3>
                <p className="text-gray-500">
                  Media upload and management features will be integrated here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardContent className="text-center py-12">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
                <p className="text-gray-500">
                  Analytics and reporting features will be integrated here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardContent className="text-center py-12">
                <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Trip Settings</h3>
                <p className="text-gray-500">
                  Advanced settings and configuration options will be integrated here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
