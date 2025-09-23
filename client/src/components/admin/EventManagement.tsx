import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Music,
  PartyPopper,
  Coffee,
  Sparkles,
  Star,
  Upload,
  Link,
  Filter,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Tag
} from 'lucide-react';
import PartyManagement from './PartyManagement';
import { dateOnly } from '@/lib/utils';

interface Event {
  id: number;
  tripId: number;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  type: 'party' | 'show' | 'dining' | 'workshop' | 'meetup' | 'other';
  imageUrl?: string;
  capacity?: number;
  price?: number;
  featured?: boolean;
  tags?: string;
  hostId?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface EventManagementProps {
  tripId?: number;
  selectMode?: boolean;
  onSelect?: (event: Event) => void;
  selectedId?: number | null;
}

export default function EventManagement({
  tripId,
  selectMode = false,
  onSelect,
  selectedId
}: EventManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('grid');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showTalentSelector, setShowTalentSelector] = useState(false);
  const [imageUploadMode, setImageUploadMode] = useState<'upload' | 'url'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Form state for create/edit
  const [formData, setFormData] = useState<Partial<Event>>({
    title: '',
    type: 'party',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    imageUrl: '',
    capacity: 0,
    price: 0,
    featured: false,
    tags: '',
    hostId: undefined
  });

  // Fetch events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', tripId, searchQuery, filterType, filterDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (tripId) params.append('tripId', tripId.toString());
      if (searchQuery) params.append('search', searchQuery);
      if (filterType && filterType !== 'all') params.append('type', filterType);
      if (filterDate) params.append('date', filterDate);
      
      const response = await fetch(`/api/events?${params}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    }
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['event-stats', tripId],
    queryFn: async () => {
      const params = tripId ? `?tripId=${tripId}` : '';
      const response = await fetch(`/api/events/stats${params}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<Event>) => {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, tripId: tripId || data.tripId })
      });
      if (!response.ok) throw new Error('Failed to create event');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event-stats'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Event created successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Event> }) => {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update event');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsEditDialogOpen(false);
      setSelectedEvent(null);
      resetForm();
      toast({
        title: 'Success',
        description: 'Event updated successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete event');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event-stats'] });
      toast({
        title: 'Success',
        description: 'Event deleted successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'party',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      imageUrl: '',
      capacity: 0,
      price: 0,
      featured: false,
      tags: '',
      hostId: undefined
    });
    setImageUrl('');
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setFormData(event);
    setImageUrl(event.imageUrl || '');
    setIsEditDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSubmit = {
      ...formData,
      imageUrl
    };

    if (selectedEvent) {
      updateMutation.mutate({ id: selectedEvent.id, data: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In production, this would upload to Supabase Storage
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    toast({
      title: 'Image uploaded',
      description: 'Image ready for use'
    });
  };

  const handleTalentSelect = (talent: any) => {
    setFormData({ ...formData, hostId: talent.id });
    setShowTalentSelector(false);
    toast({
      title: 'Host selected',
      description: `${talent.name} selected as event host`
    });
  };

  const eventTypes = [
    { value: 'party', label: 'Party', icon: PartyPopper, color: 'bg-pink-500' },
    { value: 'show', label: 'Show', icon: Music, color: 'bg-purple-500' },
    { value: 'dining', label: 'Dining', icon: Coffee, color: 'bg-orange-500' },
    { value: 'workshop', label: 'Workshop', icon: Users, color: 'bg-blue-500' },
    { value: 'meetup', label: 'Meetup', icon: Users, color: 'bg-green-500' },
    { value: 'other', label: 'Other', icon: Sparkles, color: 'bg-gray-500' }
  ];

  const locations = [
    'Pool Deck', 'Main Theater', 'Sky Lounge', 'Beach Club',
    'Dining Room', 'Rooftop Bar', 'Dance Floor', 'Spa Deck',
    'Captain\'s Lounge', 'Sunset Deck'
  ];

  const getEventIcon = (type: string) => {
    const eventType = eventTypes.find(t => t.value === type);
    return eventType?.icon || Sparkles;
  };

  const getEventColor = (type: string) => {
    const eventType = eventTypes.find(t => t.value === type);
    return eventType?.color || 'bg-gray-500';
  };

  // Calendar View Component
  const CalendarView = () => {
    const eventsByDate = events.reduce((acc: any, event: Event) => {
      const date = event.date.split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(event);
      return acc;
    }, {});

    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-sm text-gray-600 pb-2">
                {day}
              </div>
            ))}
            {/* Simplified calendar grid - in production would show proper calendar */}
            {Object.entries(eventsByDate).map(([date, dateEvents]: [string, any]) => (
              <div key={date} className="border rounded-lg p-2 min-h-[80px]">
                <div className="text-xs font-medium mb-1">
                  {format(dateOnly(date), 'MMM d')}
                </div>
                <div className="space-y-1">
                  {dateEvents.slice(0, 3).map((event: Event) => {
                    const Icon = getEventIcon(event.type);
                    return (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded ${getEventColor(event.type)} text-white cursor-pointer`}
                        onClick={() => handleEdit(event)}
                      >
                        <div className="flex items-center">
                          <Icon className="w-3 h-3 mr-1" />
                          <span className="truncate">{event.title}</span>
                        </div>
                      </div>
                    );
                  })}
                  {dateEvents.length > 3 && (
                    <div className="text-xs text-gray-500">+{dateEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (selectMode) {
    return (
      <div className="space-y-6">
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {eventTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Event Grid for Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event: Event) => {
            const Icon = getEventIcon(event.type);
            return (
              <Card
                key={event.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedId === event.id
                    ? 'ring-2 ring-blue-500 bg-blue-50/50'
                    : 'hover:ring-1 hover:ring-gray-300'
                }`}
                onClick={() => onSelect?.(event)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-lg ${getEventColor(event.type)}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    {event.featured && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <h3 className="font-medium mb-1">{event.title}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {format(dateOnly(event.date), 'MMM d, yyyy')}
                    </div>
                    {event.startTime && (
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {event.startTime}
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {event.location}
                      </div>
                    )}
                  </div>
                  {selectedId === event.id && (
                    <div className="mt-2">
                      <Badge className="bg-blue-500">Selected</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Event Management
          </h2>
          <p className="text-gray-600 mt-1">Manage all cruise events and activities</p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Featured</p>
                <p className="text-2xl font-bold">{stats?.featured || 0}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Capacity</p>
                <p className="text-2xl font-bold">{stats?.totalCapacity || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Price</p>
                <p className="text-2xl font-bold">${stats?.avgPrice?.toFixed(2) || '0.00'}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events by title, location, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {eventTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-[160px]"
              />
              <div className="flex rounded-lg border">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-none"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="rounded-l-none"
                >
                  <Calendar className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Display */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filterType !== 'all' || filterDate
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first event'}
            </p>
            {!searchQuery && filterType === 'all' && !filterDate && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Event
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'calendar' ? (
        <CalendarView />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {events.map((event: Event) => {
            const Icon = getEventIcon(event.type);
            return (
              <Card key={event.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {event.imageUrl && (
                  <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-lg ${getEventColor(event.type)}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      {event.featured && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                      <Badge variant="secondary">
                        {eventTypes.find(t => t.value === event.type)?.label}
                      </Badge>
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {format(dateOnly(event.date), 'MMM d, yyyy')}
                    </div>
                    {event.startTime && (
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {event.startTime}
                        {event.endTime && ` - ${event.endTime}`}
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {event.location}
                      </div>
                    )}
                    {event.capacity && (
                      <div className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        Capacity: {event.capacity}
                      </div>
                    )}
                    {event.price !== undefined && event.price > 0 && (
                      <div className="flex items-center text-gray-600">
                        <DollarSign className="w-4 h-4 mr-2" />
                        ${event.price}
                      </div>
                    )}
                  </div>
                  {event.tags && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {event.tags.split(',').map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(event)}
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        if (confirm(`Delete "${event.title}"?`)) {
                          deleteMutation.mutate(event.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {events.map((event: Event) => {
                const Icon = getEventIcon(event.type);
                return (
                  <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${getEventColor(event.type)}`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-lg">{event.title}</h3>
                            {event.featured && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                            <Badge variant="secondary">
                              {eventTypes.find(t => t.value === event.type)?.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {format(dateOnly(event.date), 'MMM d, yyyy')}
                            </span>
                            {event.startTime && (
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {event.startTime}
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {event.location}
                              </span>
                            )}
                            {event.capacity && (
                              <span className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {event.capacity} capacity
                              </span>
                            )}
                            {event.price !== undefined && event.price > 0 && (
                              <span className="flex items-center">
                                <DollarSign className="w-3 h-3 mr-1" />
                                ${event.price}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(event)}>
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete "${event.title}"?`)) {
                              deleteMutation.mutate(event.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={() => {
        setIsCreateDialogOpen(false);
        setIsEditDialogOpen(false);
        setSelectedEvent(null);
        resetForm();
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? 'Edit Event' : 'Create New Event'}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent ? 'Update the event details' : 'Add a new event to the cruise schedule'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Event Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as Event['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Describe the event..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select
                  value={formData.location || ''}
                  onValueChange={(value) => setFormData({ ...formData, location: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Event Host</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.hostId ? `Host ID: ${formData.hostId}` : ''}
                    placeholder="No host selected"
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTalentSelector(true)}
                  >
                    <Users className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., poolside, sunset, adults-only"
              />
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>Event Image</Label>
              <Tabs value={imageUploadMode} onValueChange={(v) => setImageUploadMode(v as 'upload' | 'url')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">Image URL</TabsTrigger>
                  <TabsTrigger value="upload">Upload Image</TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/event-image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!imageUrl}
                    >
                      <Link className="w-4 h-4" />
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="upload" className="space-y-2">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Click to upload image</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </TabsContent>
              </Tabs>
              {imageUrl && (
                <div className="mt-2">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full max-w-xs h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="featured" className="flex items-center cursor-pointer">
                <Star className="w-4 h-4 mr-2 text-yellow-500" />
                Featured Event
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setSelectedEvent(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </div>
                ) : (
                  <>
                    {selectedEvent ? 'Update' : 'Create'} Event
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Talent Selector Dialog */}
      <Dialog open={showTalentSelector} onOpenChange={setShowTalentSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Select Event Host</DialogTitle>
            <DialogDescription>
              Choose a talent/performer to host this event
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh]">
            <PartyManagement
              selectMode={true}
              onSelect={handleTalentSelect}
              selectedId={formData.hostId || null}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}