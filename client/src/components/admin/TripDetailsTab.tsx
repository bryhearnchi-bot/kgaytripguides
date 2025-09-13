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
import { Ship, Save } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from './ImageUpload';

const setupSchema = z.object({
  name: z.string().min(1, 'Trip name is required'),
  slug: z.string().min(1, 'Slug is required'),
  shipName: z.string().min(1, 'Ship name is required'),
  cruiseLine: z.string().optional(),
  tripType: z.string().default('cruise'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.enum(['upcoming', 'ongoing', 'past']).default('upcoming'),
  description: z.string().optional(),
  heroImageUrl: z.string().optional(),
});

type SetupFormData = z.infer<typeof setupSchema>;

interface TripDetailsTabProps {
  trip?: any;
  isEditing: boolean;
}

export default function TripDetailsTab({ 
  trip, 
  isEditing
}: TripDetailsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch trip types for dropdown
  const { data: tripTypes } = useQuery({
    queryKey: ['trip-types'],
    queryFn: async () => {
      const response = await fetch('/api/settings/trip_types');
      if (!response.ok) throw new Error('Failed to fetch trip types');
      return response.json();
    },
  });

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
      tripType: 'cruise',
    },
  });

  // Fetch existing trip data if editing
  const { data: existingTrip, isLoading } = useQuery({
    queryKey: ['trip', trip?.id],
    queryFn: async () => {
      if (!trip?.id) return null;
      const response = await fetch(`/api/trips/id/${trip.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch trip');
      return response.json();
    },
    enabled: !!trip?.id && isEditing,
  });

  // Load existing trip data
  useEffect(() => {
    if (existingTrip && isEditing) {
      reset({
        name: existingTrip.name || '',
        slug: existingTrip.slug || '',
        shipName: existingTrip.shipName || '',
        cruiseLine: existingTrip.cruiseLine || '',
        tripType: existingTrip.tripType || 'cruise',
        startDate: existingTrip.startDate ? (existingTrip.startDate.includes('T') ? existingTrip.startDate.split('T')[0] : existingTrip.startDate) : '',
        endDate: existingTrip.endDate ? (existingTrip.endDate.includes('T') ? existingTrip.endDate.split('T')[0] : existingTrip.endDate) : '',
        status: existingTrip.status || 'upcoming',
        description: existingTrip.description || '',
        heroImageUrl: existingTrip.heroImageUrl || '',
      });
    }
  }, [existingTrip, isEditing, reset]);

  // Create trip mutation
  const createTrip = useMutation({
    mutationFn: async (data: SetupFormData) => {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create trip');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-trips'] });
      toast({
        title: "Trip created",
        description: `${data.name} has been created successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create trip. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update trip mutation
  const updateTrip = useMutation({
    mutationFn: async (data: SetupFormData) => {
      const response = await fetch(`/api/trips/${trip.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update trip');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip', trip?.id] });
      toast({
        title: "Trip updated",
        description: "Trip details have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update trip. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: SetupFormData) => {
    console.log('Setup form submitted:', data);
    if (isEditing) {
      updateTrip.mutate(data);
    } else {
      createTrip.mutate(data);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Auto-generate slug when trip name changes
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'name' && value.name && !isEditing) {
        setValue('slug', generateSlug(value.name));
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue, isEditing]);

  const statusOptions = [
    { value: 'upcoming', label: 'Upcoming', color: 'bg-blue-500' },
    { value: 'ongoing', label: 'Ongoing', color: 'bg-green-500' },
    { value: 'past', label: 'Past', color: 'bg-gray-500' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Ship className="w-8 h-8 animate-pulse text-blue-600" />
        <span className="ml-2">Loading trip details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Ship className="w-5 h-5" />
            <span>Trip Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Trip Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="e.g., Greek Isles Adventure"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  {...register('slug')}
                  placeholder="e.g., greek-isles-2025"
                />
                {errors.slug && (
                  <p className="text-sm text-red-600">{errors.slug.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shipName">Ship Name *</Label>
                <Input
                  id="shipName"
                  {...register('shipName')}
                  placeholder="e.g., Virgin Resilient Lady"
                />
                {errors.shipName && (
                  <p className="text-sm text-red-600">{errors.shipName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cruiseLine">Cruise Line</Label>
                <Input
                  id="cruiseLine"
                  {...register('cruiseLine')}
                  placeholder="e.g., Virgin Voyages"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tripType">Trip Type</Label>
                <Select 
                  value={watch('tripType')} 
                  onValueChange={(value) => setValue('tripType', value, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trip type" />
                  </SelectTrigger>
                  <SelectContent>
                    {tripTypes?.map(type => (
                      <SelectItem key={type.key} value={type.key}>
                        <div className="flex items-center space-x-2">
                          <span>{type.label}</span>
                          {type.metadata?.description && (
                            <span className="text-xs text-gray-500">({type.metadata.description})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate')}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={watch('status')} 
                  onValueChange={(value) => setValue('status', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${option.color}`} />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="A brief description of the trip experience..."
                rows={3}
              />
            </div>

            <ImageUpload
              imageType="trip"
              currentImageUrl={watch('heroImageUrl') || ''}
              onImageChange={(imageUrl) => {
                setValue('heroImageUrl', imageUrl || '', { shouldDirty: true });
              }}
              label="Hero Image"
            />

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={createTrip.isPending || updateTrip.isPending || !isDirty}
              >
                <Save className="w-4 h-4 mr-2" />
                {createTrip.isPending || updateTrip.isPending 
                  ? 'Saving...' 
                  : isEditing 
                    ? 'Update Trip' 
                    : 'Create Trip'
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Current Status Display */}
      {existingTrip && (
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge variant={existingTrip.status === 'upcoming' ? 'default' : 'secondary'}>
                  {existingTrip.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-medium">
                  {existingTrip.createdAt ? format(new Date(existingTrip.createdAt), 'MMM dd, yyyy') : 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-medium">
                  {existingTrip.updatedAt ? format(new Date(existingTrip.updatedAt), 'MMM dd, yyyy') : 'Unknown'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}