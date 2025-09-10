import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar,
  MapPin,
  Clock,
  Ship
} from 'lucide-react';
import { format } from 'date-fns';

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
}

export default function SetupAndItineraryTab({ 
  cruise, 
  isEditing, 
  onDataChange 
}: SetupAndItineraryTabProps) {
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [editingDay, setEditingDay] = useState<ItineraryDay | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: cruise || {
      status: 'upcoming',
    },
  });

  // Auto-generate slug from name
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

  const onSubmit = (data: SetupFormData) => {
    console.log('Setup form submitted:', data);
    onDataChange();
  };

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
      // Update existing
      setItineraryDays(prev => 
        prev.map(d => d.id === day.id ? day : d)
      );
    } else {
      // Add new
      setItineraryDays(prev => [...prev, { ...day, id: Date.now() }]);
    }
    setEditingDay(null);
    onDataChange();
  };

  const deleteItineraryDay = (id: number) => {
    setItineraryDays(prev => prev.filter(d => d.id !== id));
    onDataChange();
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

            <Button type="submit" className="w-full">
              Save Cruise Details
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
                        {day.date && format(new Date(day.date), 'MMM dd, yyyy')}
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
    </div>
  );
}