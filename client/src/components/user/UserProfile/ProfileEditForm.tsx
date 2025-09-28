import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { addCsrfToken } from '@/utils/csrf';
import { supabase } from '@/lib/supabase';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  X,
  Camera
} from 'lucide-react';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  profileImageUrl: z.string().optional(),
  phoneNumber: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  emailUpdates: z.boolean(),
  textMessages: z.boolean(),
  cruiseNotifications: z.boolean(),
  marketingEmails: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileEditFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function ProfileEditForm({ onCancel, onSuccess }: ProfileEditFormProps) {
  const { user, profile } = useSupabaseAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.name?.first || '',
      lastName: profile?.name?.last || '',
      profileImageUrl: (profile as any)?.profile_image_url || '',
      phoneNumber: (profile as any)?.phone_number || '',
      bio: (profile as any)?.bio || '',
      city: (profile as any)?.location?.city || '',
      state: (profile as any)?.location?.state || '',
      country: (profile as any)?.location?.country || '',
      emailUpdates: (profile as any)?.communication_preferences?.email ?? true,
      textMessages: (profile as any)?.communication_preferences?.sms ?? false,
      cruiseNotifications: (profile as any)?.trip_updates_opt_in ?? true,
      marketingEmails: (profile as any)?.marketing_emails ?? false,
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      // Update profile via backend API with proper field mapping and CSRF protection
      const headers = await addCsrfToken({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      });

      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          name: {
            first: data.firstName,
            last: data.lastName,
            full: `${data.firstName} ${data.lastName}`.trim()
          },
          profile_image_url: data.profileImageUrl,
          phone_number: data.phoneNumber,
          bio: data.bio,
          location: {
            city: data.city,
            state: data.state,
            country: data.country,
          },
          communication_preferences: {
            email: data.emailUpdates,
            sms: data.textMessages,
          },
          trip_updates_opt_in: data.cruiseNotifications,
          marketing_emails: data.marketingEmails,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const result = await response.json();

      // Profile state will be refreshed by the parent component

      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto space-y-6" onClick={(e) => {
      // Prevent form clicks from interfering with image upload buttons
      const target = e.target as HTMLElement;
      if (target.closest('[data-image-upload]')) {
        e.stopPropagation();
      }
    }}>
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profile Photo Upload */}
          <div>
            <Label>Profile Photo</Label>
            <ImageUploadField
              label="Profile Photo"
              value={watch('profileImageUrl') || ''}
              onChange={(url) => setValue('profileImageUrl', url || '', { shouldDirty: true })}
              imageType="profiles"
              placeholder="No profile photo uploaded"
              disabled={loading}
              autoSave={true}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && (
                <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && (
                <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phoneNumber">
                <Phone className="inline w-4 h-4 mr-1" />
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                {...register('phoneNumber')}
                className={errors.phoneNumber ? 'border-red-500' : ''}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-red-600 mt-1">{errors.phoneNumber.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={4}
              placeholder="Tell us a bit about yourself..."
              {...register('bio')}
              className={errors.bio ? 'border-red-500' : ''}
            />
            {errors.bio && (
              <p className="text-sm text-red-600 mt-1">{errors.bio.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {watch('bio')?.length || 0}/500 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              {...register('city')}
            />
          </div>

          <div>
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              {...register('state')}
            />
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              {...register('country')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Communication Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Communication Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailUpdates">Email Updates</Label>
              <p className="text-sm text-gray-500">
                Receive cruise updates and notifications via email
              </p>
            </div>
            <Switch
              id="emailUpdates"
              checked={watch('emailUpdates')}
              onCheckedChange={(checked) => setValue('emailUpdates', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="textMessages">Text Messages</Label>
              <p className="text-sm text-gray-500">
                Receive important updates via SMS
              </p>
            </div>
            <Switch
              id="textMessages"
              checked={watch('textMessages')}
              onCheckedChange={(checked) => setValue('textMessages', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="cruiseNotifications">Cruise Notifications</Label>
              <p className="text-sm text-gray-500">
                Updates about cruises you're following
              </p>
            </div>
            <Switch
              id="cruiseNotifications"
              checked={watch('cruiseNotifications')}
              onCheckedChange={(checked) => setValue('cruiseNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketingEmails">Marketing Emails</Label>
              <p className="text-sm text-gray-500">
                Promotional offers and newsletters (optional)
              </p>
            </div>
            <Switch
              id="marketingEmails"
              checked={watch('marketingEmails')}
              onCheckedChange={(checked) => setValue('marketingEmails', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={loading || !isDirty}
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}