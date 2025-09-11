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

interface CruiseDetailsTabProps {
  cruise?: any;
  isEditing: boolean;
}

export default function CruiseDetailsTab({ 
  cruise, 
  isEditing
}: CruiseDetailsTabProps) {
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

  // Fetch existing cruise data if editing
  const { data: existingCruise, isLoading } = useQuery({
    queryKey: ['cruise', cruise?.id],
    queryFn: async () => {
      if (!cruise?.id) return null;
      const response = await fetch(`/api/cruises/id/${cruise.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch cruise');
      return response.json();
    },
    enabled: !!cruise?.id && isEditing,
  });

  // Load existing cruise data
  useEffect(() => {
    if (existingCruise && isEditing) {
      reset({
        name: existingCruise.name || '',
        slug: existingCruise.slug || '',
        shipName: existingCruise.shipName || '',
        cruiseLine: existingCruise.cruiseLine || '',
        startDate: existingCruise.startDate ? (existingCruise.startDate.includes('T') ? existingCruise.startDate.split('T')[0] : existingCruise.startDate) : '',
        endDate: existingCruise.endDate ? (existingCruise.endDate.includes('T') ? existingCruise.endDate.split('T')[0] : existingCruise.endDate) : '',
        status: existingCruise.status || 'upcoming',
        description: existingCruise.description || '',
        heroImageUrl: existingCruise.heroImageUrl || '',
      });
    }
  }, [existingCruise, isEditing, reset]);

  // Create cruise mutation
  const createCruise = useMutation({
    mutationFn: async (data: SetupFormData) => {
      const response = await fetch('/api/cruises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create cruise');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-cruises'] });
      toast({
        title: "Cruise created",
        description: `${data.name} has been created successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create cruise. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update cruise mutation
  const updateCruise = useMutation({
    mutationFn: async (data: SetupFormData) => {
      const response = await fetch(`/api/cruises/${cruise.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update cruise');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cruises'] });
      queryClient.invalidateQueries({ queryKey: ['cruise', cruise?.id] });
      toast({
        title: "Cruise updated",
        description: "Cruise details have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update cruise. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: SetupFormData) => {
    console.log('Setup form submitted:', data);
    if (isEditing) {
      updateCruise.mutate(data);
    } else {
      createCruise.mutate(data);
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

  // Auto-generate slug when cruise name changes
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
        <span className="ml-2">Loading cruise details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Ship className="w-5 h-5" />
            <span>Cruise Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Cruise Name *</Label>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="A brief description of the cruise experience..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroImageUrl">Hero Image URL</Label>
              <Input
                id="heroImageUrl"
                {...register('heroImageUrl')}
                placeholder="https://example.com/cruise-hero-image.jpg"
              />
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={createCruise.isPending || updateCruise.isPending || !isDirty}
              >
                <Save className="w-4 h-4 mr-2" />
                {createCruise.isPending || updateCruise.isPending 
                  ? 'Saving...' 
                  : isEditing 
                    ? 'Update Cruise' 
                    : 'Create Cruise'
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Current Status Display */}
      {existingCruise && (
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge variant={existingCruise.status === 'upcoming' ? 'default' : 'secondary'}>
                  {existingCruise.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-medium">
                  {existingCruise.createdAt ? format(new Date(existingCruise.createdAt), 'MMM dd, yyyy') : 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-medium">
                  {existingCruise.updatedAt ? format(new Date(existingCruise.updatedAt), 'MMM dd, yyyy') : 'Unknown'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}