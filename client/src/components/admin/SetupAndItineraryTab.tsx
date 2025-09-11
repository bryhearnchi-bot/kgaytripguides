import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar,
  MapPin,
  Clock,
  Ship
} from 'lucide-react';
import { format, parse } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const setupSchema = z.object({
  name: z.string().min(1, 'Cruise name is required'),
  slug: z.string().min(1, 'Slug is required'),
  shipName: z.string().min(1, 'Ship name is required'),
  cruiseLine: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.enum(['upcoming', 'ongoing', 'past']).default('upcoming'),
  description: z.string().optional(),
  heroImageUrl: z.string().optional(),
});

type SetupFormData = z.infer<typeof setupSchema>;

interface ItineraryDay {
  id?: number;
  date: string;
  day: number;
  portName: string;
  country?: string;
  arrivalTime?: string;
  departureTime?: string;
  allAboardTime?: string;
  segment: 'pre' | 'main' | 'post';
  description?: string;
  orderIndex: number;
}

interface SetupAndItineraryTabProps {
  cruise?: any;
  isEditing: boolean;
  onDataChange: () => void;
  onSave?: (data: any) => void;
}

export default function SetupAndItineraryTab({ 
  cruise, 
  isEditing, 
  onDataChange,
  onSave 
}: SetupAndItineraryTabProps) {
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [editingDay, setEditingDay] = useState<ItineraryDay | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      status: 'upcoming',
    },
  });

  // Fetch existing itinerary data
  const { data: existingItinerary, isLoading: itineraryLoading } = useQuery({
    queryKey: ['itinerary', cruise?.id],
    queryFn: async () => {
      if (!cruise?.id) return [];
      const response = await fetch(`/api/cruises/${cruise.id}/itinerary`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch itinerary');
      return response.json();
    },
    enabled: !!cruise?.id && isEditing,
  });

  // Load existing itinerary data
  useEffect(() => {
    if (existingItinerary) {
      const mappedDays = existingItinerary.map((day: any) => ({
        id: day.id,
        date: day.date ? (day.date.includes('T') ? day.date.split('T')[0] : day.date) : '',
        day: day.day,
        portName: day.portName || '',
        country: day.country || '',
        arrivalTime: day.arrivalTime || '',
        departureTime: day.departureTime || '',
        allAboardTime: day.allAboardTime || '',
        segment: day.segment || 'main',
        description: day.description || '',
        orderIndex: day.orderIndex || 0,
      }));
      setItineraryDays(mappedDays);
    }
  }, [existingItinerary]);

  // Create itinerary day mutation
  const createItineraryMutation = useMutation({
    mutationFn: async (dayData: ItineraryDay) => {
      if (!cruise?.id) throw new Error('No cruise ID');
      const response = await fetch(`/api/cruises/${cruise.id}/itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...dayData,
          date: dayData.date || null,
        }),
      });
      if (!response.ok) throw new Error('Failed to create itinerary day');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', cruise?.id] });
      toast({ title: 'Success', description: 'Itinerary day added successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: 'Failed to add itinerary day. Please try again.',
        variant: 'destructive' 
      });
    },
  });

  // Update itinerary day mutation
  const updateItineraryMutation = useMutation({
    mutationFn: async (dayData: ItineraryDay) => {
      if (!dayData.id) throw new Error('No day ID');
      const response = await fetch(`/api/itinerary/${dayData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...dayData,
          date: dayData.date || null,
        }),
      });
      if (!response.ok) throw new Error('Failed to update itinerary day');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', cruise?.id] });
      toast({ title: 'Success', description: 'Itinerary day updated successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: 'Failed to update itinerary day. Please try again.',
        variant: 'destructive' 
      });
    },
  });

  // Delete itinerary day mutation
  const deleteItineraryMutation = useMutation({
    mutationFn: async (dayId: number) => {
      const response = await fetch(`/api/itinerary/${dayId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete itinerary day');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', cruise?.id] });
      toast({ title: 'Success', description: 'Itinerary day deleted successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: 'Failed to delete itinerary day. Please try again.',
        variant: 'destructive' 
      });
    },
  });

  // Populate form when cruise data loads
  useEffect(() => {
    if (cruise && isEditing) {
      const formData = {
        name: cruise.name || '',
        slug: cruise.slug || '',
        shipName: cruise.shipName || '',
        cruiseLine: cruise.cruiseLine || '',
        startDate: cruise.startDate ? cruise.startDate.split('T')[0] : '',
        endDate: cruise.endDate ? cruise.endDate.split('T')[0] : '',
        status: cruise.status || 'upcoming',
        description: cruise.description || '',
        heroImageUrl: cruise.heroImageUrl || '',
      };
      reset(formData);
    }
  }, [cruise, isEditing, reset]);

  // Auto-generate slug from name (only for new cruises)
  const watchedName = watch('name');
  useEffect(() => {
    if (watchedName && !isEditing) {
      const slug = watchedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('slug', slug);
    }
  }, [watchedName, isEditing, setValue]);

  // Track form changes for unsaved changes detection
  useEffect(() => {
    if (isDirty) {
      onDataChange();
    }
  }, [isDirty, onDataChange]);

  const onSubmit = (data: SetupFormData) => {
    console.log('Setup form submitted:', data);
    if (onSave) {
      onSave(data);
    }
  };

  // Provide current form data to parent for header save
  useEffect(() => {
    const getCurrentData = () => {
      return watch();
    };
    // This would need to be passed up to parent - for now, rely on form submit
  }, [watch]);

  const addItineraryDay = () => {
    const newDay: ItineraryDay = {
      date: '',
      day: itineraryDays.length + 1,
      portName: '',
      segment: 'main',
      orderIndex: itineraryDays.length,
    };
    setEditingDay(newDay);
  };

  const saveItineraryDay = (day: ItineraryDay) => {
    if (day.id) {
      // Update existing day via API
      updateItineraryMutation.mutate(day);
    } else {
      // Add new day via API
      createItineraryMutation.mutate(day);
    }
    setEditingDay(null);
    onDataChange();
  };

  const deleteItineraryDay = (id: number) => {
    if (confirm('Are you sure you want to delete this itinerary day?')) {
      deleteItineraryMutation.mutate(id);
      onDataChange();
    }
  };

  const getSegmentBadge = (segment: string) => {
    const variants = {
      pre: 'bg-blue-100 text-blue-800',
      main: 'bg-green-100 text-green-800', 
      post: 'bg-purple-100 text-purple-800'
    };
    return (
      <Badge className={variants[segment as keyof typeof variants]}>
        {segment.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Cruise Setup Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Ship className="w-5 h-5" />
            <span>Cruise Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Cruise Name</Label>
                <Input 
                  id="name"
                  {...register('name')}
                  placeholder="Enter cruise name"
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input 
                  id="slug"
                  {...register('slug')}
                  placeholder="cruise-url-slug"
                />
                {errors.slug && (
                  <p className="text-sm text-red-600 mt-1">{errors.slug.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shipName">Ship Name</Label>
                <Input 
                  id="shipName"
                  {...register('shipName')}
                  placeholder="e.g., Virgin Resilient Lady"
                />
                {errors.shipName && (
                  <p className="text-sm text-red-600 mt-1">{errors.shipName.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="cruiseLine">Cruise Line</Label>
                <Input 
                  id="cruiseLine"
                  {...register('cruiseLine')}
                  placeholder="e.g., Virgin Voyages"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input 
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input 
                  id="endDate"
                  type="date"
                  {...register('endDate')}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.endDate.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select {...register('status')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                {...register('description')}
                placeholder="Describe the cruise experience..."
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={!isDirty && isEditing}
            >
              {isEditing ? 'Save Changes' : 'Create Cruise'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Itinerary Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Itinerary</span>
            </CardTitle>
            <Button onClick={addItineraryDay} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Day
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Segment Headers */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">Pre-Cruise</h3>
                <p className="text-sm text-blue-600">Activities before embarkation</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border-2 border-dashed border-green-200">
                <h3 className="font-medium text-green-900 mb-2">Main Cruise</h3>
                <p className="text-sm text-green-600">Core cruise itinerary</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border-2 border-dashed border-purple-200">
                <h3 className="font-medium text-purple-900 mb-2">Post-Cruise</h3>
                <p className="text-sm text-purple-600">Activities after disembarkation</p>
              </div>
            </div>

            {/* Itinerary Days */}
            {itineraryDays.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No itinerary days added yet.</p>
                <p className="text-sm">Click "Add Day" to start building your itinerary.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {itineraryDays.map(day => (
                  <div key={day.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      {getSegmentBadge(day.segment)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Day {day.day}</span>
                        <span className="text-gray-500">•</span>
                        <span>{day.portName}</span>
                        {day.country && (
                          <>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-600">{day.country}</span>
                          </>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {day.date && format(parse(day.date, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy')}
                        {day.arrivalTime && ` • Arrival: ${day.arrivalTime}`}
                        {day.departureTime && ` • Departure: ${day.departureTime}`}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setEditingDay(day)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => day.id && deleteItineraryDay(day.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {itineraryDays.filter(d => d.segment === 'pre').length}
            </div>
            <div className="text-sm text-gray-600">Pre-Cruise Days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {itineraryDays.filter(d => d.segment === 'main').length}
            </div>
            <div className="text-sm text-gray-600">Main Cruise Days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {itineraryDays.filter(d => d.segment === 'post').length}
            </div>
            <div className="text-sm text-gray-600">Post-Cruise Days</div>
          </CardContent>
        </Card>
      </div>

      {/* Itinerary Day Edit Modal */}
      <Dialog open={editingDay !== null} onOpenChange={() => setEditingDay(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDay?.id ? 'Edit Itinerary Day' : 'Add New Itinerary Day'}
            </DialogTitle>
            <DialogDescription>
              Configure the details for this day of the cruise.
            </DialogDescription>
          </DialogHeader>

          {editingDay && <ItineraryDayForm
            day={editingDay}
            onSave={saveItineraryDay}
            onCancel={() => setEditingDay(null)}
            isLoading={createItineraryMutation.isPending || updateItineraryMutation.isPending}
          />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Itinerary Day Form Component
function ItineraryDayForm({ 
  day, 
  onSave, 
  onCancel, 
  isLoading 
}: {
  day: ItineraryDay;
  onSave: (day: ItineraryDay) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState(day);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="day">Day Number</Label>
          <Input
            id="day"
            type="number"
            value={formData.day}
            onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) || 1 })}
            min="1"
            required
          />
        </div>
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="portName">Port Name</Label>
        <Input
          id="portName"
          value={formData.portName}
          onChange={(e) => setFormData({ ...formData, portName: e.target.value })}
          placeholder="e.g. Mykonos, Greece"
          required
        />
      </div>

      <div>
        <Label htmlFor="country">Country</Label>
        <Input
          id="country"
          value={formData.country || ''}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          placeholder="e.g. Greece"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="arrivalTime">Arrival Time</Label>
          <Input
            id="arrivalTime"
            value={formData.arrivalTime || ''}
            onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
            placeholder="08:00"
          />
        </div>
        <div>
          <Label htmlFor="departureTime">Departure Time</Label>
          <Input
            id="departureTime"
            value={formData.departureTime || ''}
            onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
            placeholder="18:00"
          />
        </div>
        <div>
          <Label htmlFor="allAboardTime">All Aboard</Label>
          <Input
            id="allAboardTime"
            value={formData.allAboardTime || ''}
            onChange={(e) => setFormData({ ...formData, allAboardTime: e.target.value })}
            placeholder="17:30"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="segment">Segment</Label>
        <Select 
          value={formData.segment} 
          onValueChange={(value) => setFormData({ ...formData, segment: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pre">Pre-Cruise</SelectItem>
            <SelectItem value="main">Main Cruise</SelectItem>
            <SelectItem value="post">Post-Cruise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of activities or highlights"
          rows={2}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Day'}
        </Button>
      </DialogFooter>
    </form>
  );
}