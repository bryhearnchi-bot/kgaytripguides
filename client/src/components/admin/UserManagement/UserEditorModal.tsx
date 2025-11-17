import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StandardDropdown } from '@/components/ui/dropdowns';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { addCsrfToken } from '@/utils/csrf';
import { supabase } from '@/lib/supabase';
import {
  User,
  Mail,
  Phone,
  Shield,
  MapPin,
  Settings,
  Save,
  UserPlus,
  Key,
  Globe,
  Image,
  Clock,
  Activity,
  Eye,
} from 'lucide-react';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  full_name: z.string().optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  phone_number: z.string().optional(),
  role: z.enum(['viewer', 'content_manager', 'admin']),
  account_status: z.enum(['active', 'suspended', 'pending_verification']),
  is_active: z.boolean(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  avatar_url: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  facebook: z.string().optional(),
  linkedin: z.string().optional(),
  tiktok: z.string().optional(),
  email_updates: z.boolean(),
  text_messages: z.boolean(),
  cruise_notifications: z.boolean(),
  marketing_emails: z.boolean(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  mode: 'add' | 'edit';
}

export function UserEditorModal({ isOpen, onClose, user, mode }: UserEditorModalProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: user?.email || '',
      firstName: user?.name?.first || '',
      lastName: user?.name?.last || '',
      full_name: user?.full_name || '',
      username: user?.username || '',
      phone_number: user?.phone_number || '',
      role: user?.role || 'viewer',
      account_status: user?.account_status || 'active',
      is_active: user?.is_active ?? true,
      bio: user?.bio || '',
      website: user?.website || '',
      avatar_url: user?.avatar_url || '',
      city: user?.location?.city || '',
      state: user?.location?.state || '',
      country: user?.location?.country || '',
      instagram: user?.social_links?.instagram || '',
      twitter: user?.social_links?.twitter || '',
      facebook: user?.social_links?.facebook || '',
      linkedin: user?.social_links?.linkedin || '',
      tiktok: user?.social_links?.tiktok || '',
      email_updates: user?.communication_preferences?.email ?? true,
      text_messages: user?.communication_preferences?.sms ?? false,
      cruise_notifications: user?.trip_updates_opt_in ?? true,
      marketing_emails: user?.marketing_emails ?? false,
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        email: user.email || '',
        firstName: user.name?.first || '',
        lastName: user.name?.last || '',
        full_name: user.full_name || '',
        username: user.username || '',
        phone_number: user.phone_number || '',
        role: user.role || 'viewer',
        account_status: user.account_status || 'active',
        is_active: user.is_active ?? true,
        bio: user.bio || '',
        website: user.website || '',
        avatar_url: user.avatar_url || '',
        city: user.location?.city || '',
        state: user.location?.state || '',
        country: user.location?.country || '',
        instagram: user.social_links?.instagram || '',
        twitter: user.social_links?.twitter || '',
        facebook: user.social_links?.facebook || '',
        linkedin: user.social_links?.linkedin || '',
        tiktok: user.social_links?.tiktok || '',
        email_updates: user.communication_preferences?.email ?? true,
        text_messages: user.communication_preferences?.sms ?? false,
        cruise_notifications: user.trip_updates_opt_in ?? true,
        marketing_emails: user.marketing_emails ?? false,
      });
    }
  }, [user, reset]);

  const createUser = useMutation({
    mutationFn: async (data: UserFormData) => {
      // Use our API endpoint which handles both auth user creation and profile setup
      const response = await fetch('/api/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          fullName: data.full_name,
          username: data.username,
          phoneNumber: data.phone_number,
          role: data.role,
          accountStatus: data.account_status,
          isActive: data.is_active,
          bio: data.bio,
          website: data.website,
          avatarUrl: data.avatar_url,
          location: {
            city: data.city,
            state: data.state,
            country: data.country,
          },
          socialLinks: {
            instagram: data.instagram,
            twitter: data.twitter,
            facebook: data.facebook,
            linkedin: data.linkedin,
            tiktok: data.tiktok,
          },
          communicationPreferences: {
            email: data.email_updates,
            sms: data.text_messages,
          },
          tripUpdatesOptIn: data.cruise_notifications,
          marketingEmails: data.marketing_emails,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create user: ${error}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User created', {
        description: 'The new user has been successfully created.',
      });
      onClose();
    },
    onError: (error: any) => {
      toast.error('Creation failed', {
        description: error.message || 'Failed to create user',
      });
    },
  });

  const updateUser = useMutation({
    mutationFn: async (data: UserFormData) => {
      // Get authentication token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      // Update profile via backend API with CSRF protection
      const headers = await addCsrfToken({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      });

      const profileResponse = await fetch(`/api/admin/users/${user.id}/profile`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          fullName: data.full_name,
          username: data.username,
          email: data.email,
          phone_number: data.phone_number,
          role: data.role,
          account_status: data.account_status,
          is_active: data.is_active,
          bio: data.bio,
          website: data.website,
          avatar_url: data.avatar_url,
          location: {
            city: data.city,
            state: data.state,
            country: data.country,
          },
          social_links: {
            instagram: data.instagram,
            twitter: data.twitter,
            facebook: data.facebook,
            linkedin: data.linkedin,
            tiktok: data.tiktok,
          },
          communication_preferences: {
            email: data.email_updates,
            sms: data.text_messages,
          },
          trip_updates_opt_in: data.cruise_notifications,
          marketing_emails: data.marketing_emails,
        }),
      });

      if (!profileResponse.ok) {
        const error = await profileResponse.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      // Update password if provided (still using Supabase admin for this)
      if (data.password) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(user.id, {
          password: data.password,
        });
        if (passwordError) throw passwordError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User updated', {
        description: 'User information has been successfully updated.',
      });
      onClose();
    },
    onError: (error: any) => {
      toast.error('Update failed', {
        description: error.message || 'Failed to update user',
      });
    },
  });

  const onSubmit = async (data: UserFormData) => {
    setLoading(true);
    try {
      if (mode === 'add') {
        if (!data.password) {
          toast.error('Password required', {
            description: 'Please provide a password for the new user',
          });
          setLoading(false);
          return;
        }
        await createUser.mutateAsync(data);
      } else {
        await updateUser.mutateAsync(data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'add' ? (
              <>
                <UserPlus className="w-5 h-5" />
                Add New User
              </>
            ) : (
              <>
                <User className="w-5 h-5" />
                Edit User
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">
                <User className="w-4 h-4 mr-2" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="profile">
                <Image className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="location">
                <MapPin className="w-4 h-4 mr-2" />
                Location
              </TabsTrigger>
              <TabsTrigger value="social">
                <Globe className="w-4 h-4 mr-2" />
                Social
              </TabsTrigger>
              <TabsTrigger value="preferences">
                <Settings className="w-4 h-4 mr-2" />
                Preferences
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">
                    <Mail className="inline w-4 h-4 mr-1" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="username">
                    <User className="inline w-4 h-4 mr-1" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    {...register('username')}
                    className={errors.username ? 'border-red-500' : ''}
                    placeholder="Optional unique username"
                  />
                  {errors.username && (
                    <p className="text-sm text-red-600 mt-1">{errors.username.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="firstName">
                    <User className="inline w-4 h-4 mr-1" />
                    First Name *
                  </Label>
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
                  <Label htmlFor="lastName">
                    <User className="inline w-4 h-4 mr-1" />
                    Last Name *
                  </Label>
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
                  <Label htmlFor="full_name">
                    <User className="inline w-4 h-4 mr-1" />
                    Full Display Name
                  </Label>
                  <Input
                    id="full_name"
                    {...register('full_name')}
                    placeholder="Optional override for display name"
                  />
                </div>

                <div>
                  <Label htmlFor="phone_number">
                    <Phone className="inline w-4 h-4 mr-1" />
                    Phone Number
                  </Label>
                  <Input id="phone_number" type="tel" {...register('phone_number')} />
                </div>

                {(mode === 'add' || mode === 'edit') && (
                  <div>
                    <Label htmlFor="password">
                      <Key className="inline w-4 h-4 mr-1" />
                      {mode === 'add' ? 'Password *' : 'New Password (optional)'}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      {...register('password')}
                      placeholder={mode === 'edit' ? 'Leave blank to keep current' : ''}
                      className={errors.password ? 'border-red-500' : ''}
                    />
                    {errors.password && (
                      <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="role">
                    <Shield className="inline w-4 h-4 mr-1" />
                    Role *
                  </Label>
                  <StandardDropdown
                    variant="single-basic"
                    placeholder="Select role"
                    options={[
                      { value: 'viewer', label: 'Viewer' },
                      { value: 'content_manager', label: 'Content Manager' },
                      { value: 'admin', label: 'Admin' },
                    ]}
                    value={watch('role')}
                    onChange={(value: string | string[]) => setValue('role', value as any)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="account_status">
                    <Activity className="inline w-4 h-4 mr-1" />
                    Account Status *
                  </Label>
                  <StandardDropdown
                    variant="single-basic"
                    placeholder="Select status"
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'suspended', label: 'Suspended' },
                      { value: 'pending_verification', label: 'Pending Verification' },
                    ]}
                    value={watch('account_status')}
                    onChange={(value: string | string[]) =>
                      setValue('account_status', value as any)
                    }
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={watch('is_active')}
                    onCheckedChange={checked => setValue('is_active', checked)}
                  />
                  <Label htmlFor="is_active" className="flex items-center">
                    <Activity className="inline w-4 h-4 mr-1" />
                    Account Active
                  </Label>
                </div>
              </div>

              {user?.last_sign_in_at && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center text-sm text-blue-700">
                    <Clock className="w-4 h-4 mr-2" />
                    Last sign in: {new Date(user.last_sign_in_at).toLocaleString()}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="profile" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="avatar_url">
                    <Image className="inline w-4 h-4 mr-1" />
                    Avatar URL
                  </Label>
                  <Input
                    id="avatar_url"
                    type="url"
                    {...register('avatar_url')}
                    placeholder="https://example.com/avatar.jpg"
                    className={errors.avatar_url ? 'border-red-500' : ''}
                  />
                  {errors.avatar_url && (
                    <p className="text-sm text-red-600 mt-1">{errors.avatar_url.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="website">
                    <Globe className="inline w-4 h-4 mr-1" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    {...register('website')}
                    placeholder="https://example.com"
                    className={errors.website ? 'border-red-500' : ''}
                  />
                  {errors.website && (
                    <p className="text-sm text-red-600 mt-1">{errors.website.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    rows={4}
                    {...register('bio')}
                    placeholder="Tell us about this user..."
                    className={errors.bio ? 'border-red-500' : ''}
                  />
                  {errors.bio && <p className="text-sm text-red-600 mt-1">{errors.bio.message}</p>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="city">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    City
                  </Label>
                  <Input id="city" {...register('city')} placeholder="San Francisco" />
                </div>

                <div>
                  <Label htmlFor="state">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    State/Province
                  </Label>
                  <Input id="state" {...register('state')} placeholder="California" />
                </div>

                <div>
                  <Label htmlFor="country">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    Country
                  </Label>
                  <Input id="country" {...register('country')} placeholder="United States" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="instagram">
                    <Globe className="inline w-4 h-4 mr-1" />
                    Instagram
                  </Label>
                  <Input
                    id="instagram"
                    {...register('instagram')}
                    placeholder="@username or full URL"
                  />
                </div>

                <div>
                  <Label htmlFor="twitter">
                    <Globe className="inline w-4 h-4 mr-1" />
                    Twitter/X
                  </Label>
                  <Input
                    id="twitter"
                    {...register('twitter')}
                    placeholder="@username or full URL"
                  />
                </div>

                <div>
                  <Label htmlFor="facebook">
                    <Globe className="inline w-4 h-4 mr-1" />
                    Facebook
                  </Label>
                  <Input
                    id="facebook"
                    {...register('facebook')}
                    placeholder="Profile URL or username"
                  />
                </div>

                <div>
                  <Label htmlFor="linkedin">
                    <Globe className="inline w-4 h-4 mr-1" />
                    LinkedIn
                  </Label>
                  <Input id="linkedin" {...register('linkedin')} placeholder="Profile URL" />
                </div>

                <div>
                  <Label htmlFor="tiktok">
                    <Globe className="inline w-4 h-4 mr-1" />
                    TikTok
                  </Label>
                  <Input id="tiktok" {...register('tiktok')} placeholder="@username or full URL" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="flex items-center text-sm text-amber-700">
                    <Eye className="w-4 h-4 mr-2" />
                    Communication preferences are set by the user during invitation and account
                    setup
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_updates" className="flex items-center">
                      <Eye className="inline w-4 h-4 mr-1 text-gray-400" />
                      Email Updates (Read-only)
                    </Label>
                    <p className="text-sm text-gray-500">
                      Receive updates via email - controlled by user
                    </p>
                  </div>
                  <Switch id="email_updates" checked={watch('email_updates')} disabled />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="text_messages" className="flex items-center">
                      <Eye className="inline w-4 h-4 mr-1 text-gray-400" />
                      Text Messages (Read-only)
                    </Label>
                    <p className="text-sm text-gray-500">
                      Receive SMS notifications - controlled by user
                    </p>
                  </div>
                  <Switch id="text_messages" checked={watch('text_messages')} disabled />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="cruise_notifications" className="flex items-center">
                      <Eye className="inline w-4 h-4 mr-1 text-gray-400" />
                      Cruise Notifications (Read-only)
                    </Label>
                    <p className="text-sm text-gray-500">
                      Updates about cruises they're following - controlled by user
                    </p>
                  </div>
                  <Switch
                    id="cruise_notifications"
                    checked={watch('cruise_notifications')}
                    disabled
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing_emails">
                      <Settings className="inline w-4 h-4 mr-1" />
                      Marketing Emails
                    </Label>
                    <p className="text-sm text-gray-500">
                      Promotional offers and newsletters - admin can edit
                    </p>
                  </div>
                  <Switch
                    id="marketing_emails"
                    checked={watch('marketing_emails')}
                    onCheckedChange={checked => setValue('marketing_emails', checked)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : mode === 'add' ? 'Create User' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
