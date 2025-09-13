import { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, Upload, X } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const tripSchema = z.object({
  name: z.string().min(1, 'Trip name is required'),
  slug: z.string().min(1, 'Slug is required'),
  shipName: z.string().min(1, 'Ship name is required'),
  cruiseLine: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.enum(['upcoming', 'ongoing', 'past']).default('upcoming'),
  description: z.string().optional(),
  heroImageUrl: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type TripFormData = z.infer<typeof tripSchema>;

interface TripFormContentProps {
  isEditing: boolean;
  tripId?: string;
}

function TripFormContent({ isEditing, tripId }: TripFormContentProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
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
  }, [watchedName, setValue, isEditing]);

  // Fetch existing trip data for editing
  const { data: trip, isLoading: isLoadingTrip } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      if (!tripId) return null;
      const response = await fetch(`/api/trips/${tripId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch trip');
      return response.json();
    },
    enabled: isEditing && !!tripId,
  });

  // Populate form with existing data
  useEffect(() => {
    if (trip && isEditing) {
      const heroImageUrl = trip.heroImageUrl || '';
      reset({
        name: trip.name,
        slug: trip.slug,
        shipName: trip.shipName,
        cruiseLine: trip.cruiseLine || '',
        startDate: trip.startDate ? trip.startDate.split('T')[0] : '',
        endDate: trip.endDate ? trip.endDate.split('T')[0] : '',
        status: trip.status,
        description: trip.description || '',
        heroImageUrl,
      });
      setImagePreview(heroImageUrl);
    }
  }, [trip, isEditing, reset]);

  // Upload image file
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/media', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const result = await response.json();
    return result.url;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error", 
        description: "Image must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Upload to server
      const imageUrl = await uploadImage(file);
      setValue('heroImageUrl', imageUrl);
      
      // Clean up preview
      URL.revokeObjectURL(previewUrl);
      setImagePreview(imageUrl);

      toast({
        title: "Success",
        description: "Image uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image.",
        variant: "destructive",
      });
      setImagePreview('');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setValue('heroImageUrl', '');
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const saveTrip = useMutation({
    mutationFn: async (data: TripFormData) => {
      const url = isEditing ? `/api/trips/${tripId}` : '/api/trips';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          startDate: data.startDate + 'T00:00:00.000Z',
          endDate: data.endDate + 'T00:00:00.000Z'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save trip');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-trips'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      }
      
      toast({
        title: "Success",
        description: `Trip "${data.name}" has been ${isEditing ? 'updated' : 'created'}.`,
      });
      
      setLocation('/admin/trips');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? 'update' : 'create'} trip.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TripFormData) => {
    saveTrip.mutate(data);
  };

  if (isEditing && isLoadingTrip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading trip data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/admin/trips')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Trips
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Trip' : 'Create New Trip'}
              </h1>
            </div>
            <Button
              type="submit"
              form="trip-form"
              disabled={isSubmitting || saveTrip.isPending}
            >
              {isSubmitting || saveTrip.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Update' : 'Create'} Trip
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Form Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Trip Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form id="trip-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Trip Name *</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="e.g., Greek Isles Adventure 2025"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="slug">URL Slug *</Label>
                    <Input
                      id="slug"
                      {...register('slug')}
                      placeholder="e.g., greek-isles-adventure-2025"
                    />
                    {errors.slug && (
                      <p className="text-sm text-red-600 mt-1">{errors.slug.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="shipName">Ship Name *</Label>
                    <Input
                      id="shipName"
                      {...register('shipName')}
                      placeholder="e.g., Resilient Lady"
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
                    {errors.cruiseLine && (
                      <p className="text-sm text-red-600 mt-1">{errors.cruiseLine.message}</p>
                    )}
                  </div>
                </div>

                {/* Dates and Status */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
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
                    <Label htmlFor="endDate">End Date *</Label>
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
                    <Select
                      value={watch('status')}
                      onValueChange={(value) => setValue('status', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="past">Past</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>
                    )}
                  </div>

                  <div>
                    <Label>Hero Image</Label>
                    <div className="space-y-3">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Hero image preview"
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={removeImage}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">No image selected</p>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                        >
                          {uploadingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Image
                            </>
                          )}
                        </Button>
                        {imagePreview && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={removeImage}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      
                      <Input
                        {...register('heroImageUrl')}
                        placeholder="Or enter image URL directly"
                        value={watch('heroImageUrl') || ''}
                        onChange={(e) => {
                          setValue('heroImageUrl', e.target.value);
                          setImagePreview(e.target.value);
                        }}
                      />
                      
                      {errors.heroImageUrl && (
                        <p className="text-sm text-red-600">{errors.heroImageUrl.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Describe the trip experience..."
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

interface TripFormProps {
  isEditing?: boolean;
}

export default function TripForm({ isEditing = false }: TripFormProps) {
  const params = useParams();
  const tripId = params.id;

  return (
    <ProtectedRoute requiredRoles={['super_admin', 'cruise_admin', 'content_editor']}>
      <TripFormContent isEditing={isEditing} tripId={tripId} />
    </ProtectedRoute>
  );
}