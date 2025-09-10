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

const cruiseSchema = z.object({
  name: z.string().min(1, 'Cruise name is required'),
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

type CruiseFormData = z.infer<typeof cruiseSchema>;

interface CruiseFormContentProps {
  isEditing: boolean;
  cruiseId?: string;
}

function CruiseFormContent({ isEditing, cruiseId }: CruiseFormContentProps) {
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
  } = useForm<CruiseFormData>({
    resolver: zodResolver(cruiseSchema),
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

  // Fetch existing cruise data for editing
  const { data: cruise, isLoading: isLoadingCruise } = useQuery({
    queryKey: ['cruise', cruiseId],
    queryFn: async () => {
      if (!cruiseId) return null;
      const response = await fetch(`/api/cruises/${cruiseId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch cruise');
      return response.json();
    },
    enabled: isEditing && !!cruiseId,
  });

  // Populate form with existing data
  useEffect(() => {
    if (cruise && isEditing) {
      const heroImageUrl = cruise.heroImageUrl || '';
      reset({
        name: cruise.name,
        slug: cruise.slug,
        shipName: cruise.shipName,
        cruiseLine: cruise.cruiseLine || '',
        startDate: format(new Date(cruise.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(cruise.endDate), 'yyyy-MM-dd'),
        status: cruise.status,
        description: cruise.description || '',
        heroImageUrl,
      });
      setImagePreview(heroImageUrl);
    }
  }, [cruise, isEditing, reset]);

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

  const saveCruise = useMutation({
    mutationFn: async (data: CruiseFormData) => {
      const url = isEditing ? `/api/cruises/${cruiseId}` : '/api/cruises';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          startDate: new Date(data.startDate).toISOString(),
          endDate: new Date(data.endDate).toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save cruise');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-cruises'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['cruise', cruiseId] });
      }
      
      toast({
        title: "Success",
        description: `Cruise "${data.name}" has been ${isEditing ? 'updated' : 'created'}.`,
      });
      
      setLocation('/admin/cruises');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? 'update' : 'create'} cruise.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CruiseFormData) => {
    saveCruise.mutate(data);
  };

  if (isEditing && isLoadingCruise) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading cruise data...</p>
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
                onClick={() => setLocation('/admin/cruises')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Cruises
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Cruise' : 'Create New Cruise'}
              </h1>
            </div>
            <Button
              type="submit"
              form="cruise-form"
              disabled={isSubmitting || saveCruise.isPending}
            >
              {isSubmitting || saveCruise.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Update' : 'Create'} Cruise
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
            <CardTitle>Cruise Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form id="cruise-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Cruise Name *</Label>
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
                  placeholder="Describe the cruise experience..."
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

interface CruiseFormProps {
  isEditing?: boolean;
}

export default function CruiseForm({ isEditing = false }: CruiseFormProps) {
  const params = useParams();
  const cruiseId = params.id;

  return (
    <ProtectedRoute requiredRoles={['super_admin', 'cruise_admin', 'content_editor']}>
      <CruiseFormContent isEditing={isEditing} cruiseId={cruiseId} />
    </ProtectedRoute>
  );
}