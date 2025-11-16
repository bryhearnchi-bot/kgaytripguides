import React, { useState } from 'react';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import FormValidator, { FormField, ValidationResult } from './FormValidator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ship, Calendar, MapPin, Users } from 'lucide-react';

// Enhanced schema with more detailed validation
const tripSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Trip name must be at least 3 characters')
      .max(100, 'Trip name must be less than 100 characters')
      .regex(/^[a-zA-Z0-9\s\-'&]+$/, 'Trip name contains invalid characters'),

    slug: z
      .string()
      .min(3, 'Slug must be at least 3 characters')
      .max(50, 'Slug must be less than 50 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),

    shipName: z
      .string()
      .min(2, 'Ship name must be at least 2 characters')
      .max(100, 'Ship name must be less than 100 characters'),

    cruiseLine: z
      .string()
      .min(2, 'Cruise line must be at least 2 characters')
      .max(50, 'Cruise line must be less than 50 characters')
      .optional(),

    tripType: z.enum(['cruise', 'hotel', 'flight', 'tour'], {
      required_error: 'Please select a trip type',
    }),

    startDate: z
      .string()
      .min(1, 'Start date is required')
      .refine(date => {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
      }, 'Start date cannot be in the past'),

    endDate: z.string().min(1, 'End date is required'),

    status: z.enum(['upcoming', 'ongoing', 'past'], {
      required_error: 'Please select a status',
    }),

    description: z
      .string()
      .min(50, 'Description should be at least 50 characters for better SEO')
      .max(2000, 'Description must be less than 2000 characters')
      .optional(),

    heroImageUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),

    capacity: z
      .number()
      .int('Capacity must be a whole number')
      .min(1, 'Capacity must be at least 1')
      .max(10000, 'Capacity seems too high')
      .optional(),

    pricing: z
      .string()
      .min(10, 'Pricing information should be detailed')
      .max(1000, 'Pricing information is too long')
      .optional(),
  })
  .refine(
    data => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

type TripFormData = z.infer<typeof tripSchema>;

// Custom validation functions
const validateSlugUniqueness = async (slug: string): Promise<ValidationResult[]> => {
  if (!slug || slug.length < 3) return [];

  // Simulate API call to check slug uniqueness
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock validation - in real app, call your API
  const existingSlugs = ['greek-isles-2024', 'caribbean-cruise', 'mediterranean-voyage'];

  if (existingSlugs.includes(slug.toLowerCase())) {
    return [
      {
        level: 'error',
        message: 'This slug is already taken',
        suggestion: `Try "${slug}-${new Date().getFullYear()}" or "${slug}-2"`,
      },
    ];
  }

  return [
    {
      level: 'success',
      message: 'Slug is available',
    },
  ];
};

// Debounced version for better UX
let slugValidationTimeout: NodeJS.Timeout;
const debouncedSlugValidation = (slug: string): Promise<ValidationResult[]> => {
  return new Promise(resolve => {
    clearTimeout(slugValidationTimeout);
    slugValidationTimeout = setTimeout(async () => {
      const results = await validateSlugUniqueness(slug);
      resolve(results);
    }, 1000); // Wait 1 second after user stops typing
  });
};

const validateTripName = (name: string): ValidationResult[] => {
  if (!name) return [];

  const validations: ValidationResult[] = [];

  // Check for SEO-friendly length
  if (name.length < 20) {
    validations.push({
      level: 'warning',
      message: 'Trip name could be more descriptive for better SEO',
      suggestion: 'Consider adding destination or year information',
    });
  }

  // Check for brand keywords
  const brandKeywords = ['atlantis', 'gay', 'cruise', 'travel'];
  const hasKeywords = brandKeywords.some(keyword => name.toLowerCase().includes(keyword));

  if (!hasKeywords) {
    validations.push({
      level: 'info',
      message: 'Consider including brand keywords for better discoverability',
      suggestion: 'Include words like "Gay", "Cruise", or "Travel"',
    });
  }

  // Check for year information
  const currentYear = new Date().getFullYear();
  const hasYear =
    name.includes(currentYear.toString()) || name.includes((currentYear + 1).toString());

  if (!hasYear) {
    validations.push({
      level: 'info',
      message: 'Consider including the year in the trip name',
      suggestion: `Add "${currentYear}" or "${currentYear + 1}" to the name`,
    });
  }

  return validations;
};

// Form field definitions with enhanced validation
const formFields: FormField[] = [
  {
    name: 'name',
    label: 'Trip Name',
    type: 'text',
    required: true,
    placeholder: 'e.g., Greek Isles Gay Cruise 2025',
    description: 'A descriptive name for your trip that includes destination and year',
    validation: {
      minLength: 3,
      maxLength: 100,
      custom: validateTripName,
    },
  },
  {
    name: 'slug',
    label: 'URL Slug',
    type: 'text',
    required: true,
    placeholder: 'e.g., greek-isles-2025',
    description: 'URL-friendly identifier (lowercase, hyphens only)',
    validation: {
      minLength: 3,
      maxLength: 50,
      pattern: /^[a-z0-9-]+$/,
      custom: debouncedSlugValidation,
    },
  },
  {
    name: 'shipName',
    label: 'Ship Name',
    type: 'text',
    required: true,
    placeholder: 'e.g., Celebrity Solstice',
    description: 'Name of the cruise ship or venue',
  },
  {
    name: 'cruiseLine',
    label: 'Cruise Line',
    type: 'text',
    required: false,
    placeholder: 'e.g., Celebrity Cruises',
    description: 'The cruise line operating the ship',
  },
  {
    name: 'startDate',
    label: 'Start Date',
    type: 'date',
    required: true,
    description: 'Trip departure date',
  },
  {
    name: 'endDate',
    label: 'End Date',
    type: 'date',
    required: true,
    description: 'Trip return date',
  },
  {
    name: 'capacity',
    label: 'Passenger Capacity',
    type: 'number',
    required: false,
    placeholder: 'e.g., 2850',
    description: 'Maximum number of passengers',
  },
  {
    name: 'description',
    label: 'Trip Description',
    type: 'textarea',
    required: false,
    placeholder: 'Describe this amazing journey through the Greek islands...',
    description: 'Detailed description for marketing and SEO (minimum 50 characters recommended)',
    validation: {
      minLength: 50,
      maxLength: 2000,
    },
  },
  {
    name: 'heroImageUrl',
    label: 'Hero Image URL',
    type: 'url',
    required: false,
    placeholder: 'https://example.com/image.jpg',
    description: 'Main promotional image for the trip',
  },
  {
    name: 'pricing',
    label: 'Pricing Information',
    type: 'textarea',
    required: false,
    placeholder: 'Starting from $2,999 per person...',
    description: 'Pricing details and packages available',
  },
];

interface EnhancedTripFormProps {
  trip?: any;
  isEditing?: boolean;
  onSubmit?: (data: TripFormData) => Promise<void>;
  onCancel?: () => void;
}

export default function EnhancedTripForm({
  trip,
  isEditing = false,
  onSubmit,
  onCancel,
}: EnhancedTripFormProps) {
  const queryClient = useQueryClient();
  const [lastDraftSave, setLastDraftSave] = useState<Date | null>(null);

  // Fetch trip types for enhanced validation
  const { data: tripTypes } = useQuery({
    queryKey: ['trip-types'],
    queryFn: async () => {
      const response = await fetch('/api/settings/trip_types');
      if (!response.ok) throw new Error('Failed to fetch trip types');
      return response.json();
    },
  });

  // Create/update trip mutation
  const tripMutation = useMutation({
    mutationFn: async (data: TripFormData) => {
      const url = isEditing ? `/api/trips/${trip?.id}` : '/api/trips';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to save trip');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trips'] });
      toast.success(isEditing ? 'Trip updated' : 'Trip created', {
        description: 'Your changes have been saved successfully.',
      });
    },
    onError: (error: Error) => {
      toast.error('Save failed', {
        description: error.message,
      });
    },
  });

  const handleSubmit = async (data: TripFormData) => {
    if (onSubmit) {
      await onSubmit(data);
    } else {
      await tripMutation.mutateAsync(data);
    }
  };

  const handleDraftSave = async (data: Partial<TripFormData>) => {
    // Save draft to localStorage or API
    try {
      const draftKey = `trip-draft-${trip?.id || 'new'}`;
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          ...data,
          lastSaved: new Date().toISOString(),
        })
      );
      setLastDraftSave(new Date());
    } catch (error) {}
  };

  // Load draft from localStorage
  const loadDraft = (): Partial<TripFormData> => {
    try {
      const draftKey = `trip-draft-${trip?.id || 'new'}`;
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const draft = JSON.parse(saved);
        setLastDraftSave(new Date(draft.lastSaved));
        return draft;
      }
    } catch (error) {}
    return {};
  };

  // Default values with draft support
  const defaultValues: Partial<TripFormData> = {
    ...trip,
    ...loadDraft(),
    tripType: trip?.tripType || 'cruise',
    status: trip?.status || 'upcoming',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="w-5 h-5 text-blue-600" />
            {isEditing ? 'Edit Trip Details' : 'Create New Trip'}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? 'Update trip information with real-time validation and auto-save'
              : 'Create a new trip with progressive validation and helpful suggestions'}
          </CardDescription>

          {/* Trip Type Indicators */}
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="outline" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              Progressive Validation
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              Auto-save Drafts
            </Badge>
            <Badge variant="outline" className="text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              SEO Optimization
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Form with Validation */}
      <FormValidator
        schema={tripSchema}
        fields={formFields}
        onSubmit={handleSubmit}
        onDraftSave={handleDraftSave}
        defaultValues={defaultValues}
        autoSaveInterval={15000} // 15 seconds
        showProgress={true}
        showPreview={true}
        title="Trip Information"
        description="Fill out the trip details with real-time validation and helpful suggestions"
        className="border-l-4 border-l-blue-500"
      />

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Form Statistics</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="font-semibold text-blue-900">{formFields.length}</div>
              <div className="text-blue-600">Total Fields</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="font-semibold text-green-900">
                {formFields.filter(f => f.required).length}
              </div>
              <div className="text-green-600">Required Fields</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="font-semibold text-orange-900">
                {formFields.filter(f => f.validation?.custom).length}
              </div>
              <div className="text-orange-600">Custom Validations</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="font-semibold text-purple-900">Real-time</div>
              <div className="text-purple-600">Validation</div>
            </div>
          </div>

          {lastDraftSave && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
              Draft auto-saved at {lastDraftSave.toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
