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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
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
  Key
} from 'lucide-react';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone_number: z.string().optional(),
  role: z.enum(['viewer', 'content_manager', 'admin']),
  account_status: z.enum(['active', 'suspended', 'pending_verification']),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
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
  const { toast } = useToast();
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
      full_name: user?.full_name || '',
      phone_number: user?.phone_number || '',
      role: user?.role || 'viewer',
      account_status: user?.account_status || 'active',
      bio: user?.bio || '',
      city: user?.location?.city || '',
      state: user?.location?.state || '',
      country: user?.location?.country || '',
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
        full_name: user.full_name || '',
        phone_number: user.phone_number || '',
        role: user.role || 'viewer',
        account_status: user.account_status || 'active',
        bio: user.bio || '',
        city: user.location?.city || '',
        state: user.location?.state || '',
        country: user.location?.country || '',
        email_updates: user.communication_preferences?.email ?? true,
        text_messages: user.communication_preferences?.sms ?? false,
        cruise_notifications: user.trip_updates_opt_in ?? true,
        marketing_emails: user.marketing_emails ?? false,
      });
    }
  }, [user, reset]);

  const createUser = useMutation({
    mutationFn: async (data: UserFormData) => {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          full_name: data.full_name,
        },
      });

      if (authError) throw authError;

      // Step 2: Update profile with additional data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone_number: data.phone_number,
          role: data.role,
          account_status: data.account_status,
          bio: data.bio,
          location: {
            city: data.city,
            state: data.state,
            country: data.country,
          },
          communication_preferences: {
            email: data.email_updates,
            sms: data.text_messages,
          },
          trip_updates_opt_in: data.cruise_notifications,
          marketing_emails: data.marketing_emails,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authData.user!.id);

      if (profileError) throw profileError;

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'User created',
        description: 'The new user has been successfully created.',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Creation failed',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    },
  });

  const updateUser = useMutation({
    mutationFn: async (data: UserFormData) => {
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      // Update profile via backend API with CSRF protection
      const headers = await addCsrfToken({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      });

      const profileResponse = await fetch(`/api/admin/users/${user.id}/profile`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          full_name: data.full_name,
          email: data.email,
          phone_number: data.phone_number,
          role: data.role,
          bio: data.bio,
          location: {
            city: data.city,
            state: data.state,
            country: data.country,
          },
          communication_preferences: {
            email: data.email_updates,
            sms: data.text_messages,
          },
          trip_updates_opt_in: data.cruise_notifications,
          marketing_emails: data.marketing_emails,
        })
      });

      if (!profileResponse.ok) {
        const error = await profileResponse.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      // Update password if provided (still using Supabase admin for this)
      if (data.password) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          user.id,
          { password: data.password }
        );
        if (passwordError) throw passwordError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'User updated',
        description: 'User information has been successfully updated.',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: UserFormData) => {
    setLoading(true);
    try {
      if (mode === 'add') {
        if (!data.password) {
          toast({
            title: 'Password required',
            description: 'Please provide a password for the new user',
            variant: 'destructive',
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">
                <User className="w-4 h-4 mr-2" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="location">
                <MapPin className="w-4 h-4 mr-2" />
                Location
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
                  <Label htmlFor="full_name">
                    <User className="inline w-4 h-4 mr-1" />
                    Full Name *
                  </Label>
                  <Input
                    id="full_name"
                    {...register('full_name')}
                    className={errors.full_name ? 'border-red-500' : ''}
                  />
                  {errors.full_name && (
                    <p className="text-sm text-red-600 mt-1">{errors.full_name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone_number">
                    <Phone className="inline w-4 h-4 mr-1" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    {...register('phone_number')}
                  />
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
                  <Select
                    value={watch('role')}
                    onValueChange={(value: any) => setValue('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="content_manager">Content Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="account_status">Account Status *</Label>
                  <Select
                    value={watch('account_status')}
                    onValueChange={(value: any) => setValue('account_status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="pending_verification">Pending Verification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                {errors.bio && (
                  <p className="text-sm text-red-600 mt-1">{errors.bio.message}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...register('city')} />
                </div>

                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input id="state" {...register('state')} />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" {...register('country')} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_updates">Email Updates</Label>
                    <p className="text-sm text-gray-500">
                      Receive updates via email
                    </p>
                  </div>
                  <Switch
                    id="email_updates"
                    checked={watch('email_updates')}
                    onCheckedChange={(checked) => setValue('email_updates', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="text_messages">Text Messages</Label>
                    <p className="text-sm text-gray-500">
                      Receive SMS notifications
                    </p>
                  </div>
                  <Switch
                    id="text_messages"
                    checked={watch('text_messages')}
                    onCheckedChange={(checked) => setValue('text_messages', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="cruise_notifications">Cruise Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Updates about cruises they're following
                    </p>
                  </div>
                  <Switch
                    id="cruise_notifications"
                    checked={watch('cruise_notifications')}
                    onCheckedChange={(checked) => setValue('cruise_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing_emails">Marketing Emails</Label>
                    <p className="text-sm text-gray-500">
                      Promotional offers and newsletters
                    </p>
                  </div>
                  <Switch
                    id="marketing_emails"
                    checked={watch('marketing_emails')}
                    onCheckedChange={(checked) => setValue('marketing_emails', checked)}
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