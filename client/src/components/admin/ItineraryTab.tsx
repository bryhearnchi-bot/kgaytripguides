import { useState, useEffect } from 'react';
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
  Save
} from 'lucide-react';
import { format, parse } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from './ImageUpload';

interface ItineraryDay {
  id?: number;
  date: string;
  day: number;
  portName: string;
  country?: string;
  arrivalTime?: string;
  departureTime?: string;
  allAboardTime?: string;
  portImageUrl?: string;
  segment: 'pre' | 'main' | 'post';
  description?: string;
  orderIndex: number;
}

interface ItineraryTabProps {
  cruise?: any;
  isEditing: boolean;
}

export default function ItineraryTab({ 
  cruise, 
  isEditing
}: ItineraryTabProps) {
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [editingDay, setEditingDay] = useState<ItineraryDay | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        portImageUrl: day.portImageUrl || '',
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

  const addItineraryDay = () => {
    const newDay: ItineraryDay = {
      date: '',
      day: itineraryDays.length + 1,
      portName: '',
      portImageUrl: '',
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
  };

  const deleteItineraryDay = (id: number) => {
    if (confirm('Are you sure you want to delete this itinerary day?')) {
      deleteItineraryMutation.mutate(id);
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

  if (itineraryLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <MapPin className="w-8 h-8 animate-pulse text-blue-600" />
        <span className="ml-2">Loading itinerary...</span>
      </div>
    );
  }

  if (!cruise?.id) {
    return (
      <div className="text-center py-8">
        <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Cruise Required</h3>
        <p className="text-gray-500">
          Please create the cruise details first before adding itinerary stops.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Itinerary Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Cruise Itinerary</span>
            </CardTitle>
            <Button onClick={addItineraryDay} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Stop
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {itineraryDays.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No itinerary stops</h3>
              <p className="text-gray-500 mb-4">
                Start building your cruise itinerary by adding port stops and activities.
              </p>
              <Button onClick={addItineraryDay}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Stop
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {itineraryDays
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((day) => (
                  <Card key={day.id || day.orderIndex} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge variant="outline">Day {day.day}</Badge>
                            {getSegmentBadge(day.segment)}
                            <span className="font-medium">{day.portName}</span>
                            {day.country && (
                              <span className="text-sm text-gray-500">({day.country})</span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                            {day.date && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{format(new Date(day.date), 'MMM dd, yyyy')}</span>
                              </div>
                            )}
                            {day.arrivalTime && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>Arrival: {day.arrivalTime}</span>
                              </div>
                            )}
                            {day.departureTime && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>Departure: {day.departureTime}</span>
                              </div>
                            )}
                          </div>
                          {day.description && (
                            <p className="text-sm text-gray-700 mt-2">{day.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingDay(day)}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => day.id && deleteItineraryDay(day.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Day Dialog */}
      <Dialog open={!!editingDay} onOpenChange={(open) => !open && setEditingDay(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b">
            <DialogTitle>
              {editingDay?.id ? 'Edit' : 'Add'} Itinerary Stop
            </DialogTitle>
            <DialogDescription>
              Configure the details for this port stop or activity.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {editingDay && (
              <ItineraryDayForm
                day={editingDay}
                onSave={saveItineraryDay}
                onCancel={() => setEditingDay(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Separate component for the day editing form
interface ItineraryDayFormProps {
  day: ItineraryDay;
  onSave: (day: ItineraryDay) => void;
  onCancel: () => void;
}

function ItineraryDayForm({ day, onSave, onCancel }: ItineraryDayFormProps) {
  const [formData, setFormData] = useState<ItineraryDay>(day);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateField = (field: keyof ItineraryDay, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => updateField('date', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="day">Day Number</Label>
          <Input
            id="day"
            type="number"
            value={formData.day}
            onChange={(e) => updateField('day', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="portName">Port/Location Name *</Label>
          <Input
            id="portName"
            value={formData.portName}
            onChange={(e) => updateField('portName', e.target.value)}
            placeholder="e.g., Santorini, Greece"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={formData.country || ''}
            onChange={(e) => updateField('country', e.target.value)}
            placeholder="e.g., Greece"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="arrivalTime">Arrival Time</Label>
          <Input
            id="arrivalTime"
            value={formData.arrivalTime || ''}
            onChange={(e) => updateField('arrivalTime', e.target.value)}
            placeholder="e.g., 8:00 AM"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="departureTime">Departure Time</Label>
          <Input
            id="departureTime"
            value={formData.departureTime || ''}
            onChange={(e) => updateField('departureTime', e.target.value)}
            placeholder="e.g., 6:00 PM"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="allAboardTime">All Aboard Time</Label>
          <Input
            id="allAboardTime"
            value={formData.allAboardTime || ''}
            onChange={(e) => updateField('allAboardTime', e.target.value)}
            placeholder="e.g., 5:30 PM"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="segment">Segment</Label>
        <Select 
          value={formData.segment} 
          onValueChange={(value) => updateField('segment', value)}
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

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Brief description of activities or highlights for this stop..."
          rows={3}
        />
      </div>

      <ImageUpload
        imageType="itinerary"
        currentImageUrl={formData.portImageUrl}
        onImageChange={(imageUrl) => {
          setFormData(prev => ({ ...prev, portImageUrl: imageUrl || '' }));
        }}
        label="Port Image"
      />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="w-4 h-4 mr-2" />
          Save Stop
        </Button>
      </DialogFooter>
    </form>
  );
}