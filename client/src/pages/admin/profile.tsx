import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { addCsrfToken } from '@/utils/csrf';
import {
  User,
  Save,
  Eye,
  EyeOff,
  Shield,
  Calendar,
  Mail,
  Key,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { dateOnly } from '@/lib/utils';

interface ProfileFormData {
  fullName: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  ipAddress?: string;
  details?: string;
}

export default function AdminProfile() {
  const [, setLocation] = useLocation();
  const { profile, user } = useSupabaseAuthContext();
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Initialize form data
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        fullName: profile.full_name || '',
        email: profile.email || '',
      }));
    }
  }, [profile]);

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (data: Partial<ProfileFormData>) => {
      // Map camelCase to snake_case for server API
      const serverData = {
        full_name: data.fullName,
        email: data.email,
      };

      const headers = await addCsrfToken({
        'Content-Type': 'application/json',
      });

      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(serverData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update profile');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['auth-profile'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });

  // Change password mutation
  const changePassword = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const headers = await addCsrfToken({
        'Content-Type': 'application/json',
      });

      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to change password');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Password changed successfully',
      });
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setIsChangingPassword(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive',
      });
    },
  });

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateProfile = () => {
    if (!formData.fullName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Full name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Email is required',
        variant: 'destructive',
      });
      return;
    }

    updateProfile.mutate({
      fullName: formData.fullName,
      email: formData.email,
    });
  };

  const handleChangePassword = () => {
    if (!formData.currentPassword) {
      toast({
        title: 'Validation Error',
        description: 'Current password is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.newPassword) {
      toast({
        title: 'Validation Error',
        description: 'New password is required',
        variant: 'destructive',
      });
      return;
    }

    if (formData.newPassword.length < 8) {
      toast({
        title: 'Validation Error',
        description: 'New password must be at least 8 characters long',
        variant: 'destructive',
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    changePassword.mutate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'trip_admin': return 'default';
      case 'content_editor': return 'secondary';
      case 'media_manager': return 'outline';
      default: return 'secondary';
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <User className="w-8 h-8 animate-pulse mx-auto mb-4 text-[#22d3ee]" />
          <p className="text-white">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">My Profile</h1>
            <p className="text-sm text-white/60">Manage your account settings and preferences</p>
          </div>
        </div>
      </section>
      {/* Profile Overview */}
      <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="px-6 py-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#22d3ee] to-[#2563eb] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {profile.full_name?.charAt(0) || profile.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">{profile.full_name || 'Admin User'}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <Mail className="w-4 h-4 text-white/60" />
                <span className="text-white/80">{profile.email}</span>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                  <Shield className="w-3 h-3" />
                  <span>{profile.role?.replace('_', ' ').toUpperCase() || 'USER'}</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#34d399]/15 px-3 py-1 text-xs font-medium text-[#34d399]">
                  <CheckCircle className="w-3 h-3" />
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Account Information */}
      <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
        <header className="border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Account Information</h2>
          <p className="text-sm text-white/60">
            Update your personal information and preferences
          </p>
        </header>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-white/80">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                className="border-white/10 bg-white/5 text-white placeholder:text-white/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email address"
                className="border-white/10 bg-white/5 text-white placeholder:text-white/50"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleUpdateProfile}
              disabled={updateProfile.isPending}
              className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-6 text-white hover:from-[#38e0f6] hover:to-[#3b82f6]"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </section>

      {/* Security Settings */}
      <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
        <header className="border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>Security Settings</span>
          </h2>
          <p className="text-sm text-white/60">
            Manage your password and security preferences
          </p>
        </header>
        <div className="p-6 space-y-6">
          {!isChangingPassword ? (
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div>
                <h3 className="font-medium text-white">Password</h3>
                <p className="text-sm text-white/60">Last changed: Not available</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsChangingPassword(true)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Change Password
              </Button>
            </div>
          ) : (
            <div className="space-y-4 p-4 border border-white/20 rounded-lg bg-white/5">
              <div className="flex items-center space-x-2 mb-4">
                <Key className="w-4 h-4 text-[#22d3ee]" />
                <h3 className="font-medium text-white">Change Password</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-white/80">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={formData.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                      placeholder="Enter your current password"
                      className="border-white/10 bg-white/5 text-white placeholder:text-white/50"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/60"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-white/80">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      placeholder="Enter your new password"
                      className="border-white/10 bg-white/5 text-white placeholder:text-white/50"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/60"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-white/40">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white/80">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm your new password"
                      className="border-white/10 bg-white/5 text-white placeholder:text-white/50"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/60"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setFormData(prev => ({
                      ...prev,
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    }));
                  }}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleChangePassword}
                  disabled={changePassword.isPending}
                  className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-6 text-white hover:from-[#38e0f6] hover:to-[#3b82f6]"
                >
                  {changePassword.isPending ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Account Details */}
      <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
        <header className="border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Account Details</span>
          </h2>
        </header>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-white/60" />
                <div>
                  <p className="text-sm font-medium text-white">Member Since</p>
                  <p className="text-sm text-white/80">
                    {profile.created_at ? format(dateOnly(profile.created_at), 'MMMM dd, yyyy') : 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-white/60" />
                <div>
                  <p className="text-sm font-medium text-white">Last Login</p>
                  <p className="text-sm text-white/80">
                    {profile.last_sign_in_at ? format(dateOnly(profile.last_sign_in_at), 'MMMM dd, yyyy') : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-white/60" />
                <div>
                  <p className="text-sm font-medium text-white">Role</p>
                  <p className="text-sm text-white/80">
                    {profile.role?.replace('_', ' ').toUpperCase() || 'USER'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-[#34d399]" />
                <div>
                  <p className="text-sm font-medium text-white">Account Status</p>
                  <p className="text-sm text-white/80">Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="rounded-2xl border border-[#fb7185]/30 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
        <header className="border-b border-[#fb7185]/30 px-6 py-4">
          <h2 className="text-lg font-semibold text-[#fb7185] flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Danger Zone</span>
          </h2>
          <p className="text-sm text-[#fb7185]/80">
            Irreversible and destructive actions
          </p>
        </header>
        <div className="p-6">
          <div className="p-4 border border-[#fb7185]/30 rounded-lg bg-[#fb7185]/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[#fb7185]">Delete Account</h3>
                <p className="text-sm text-[#fb7185]/80">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-[#fb7185] text-white hover:bg-[#f43f5e]">
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border border-white/10 bg-[#0f172a] text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-white/60">
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-[#fb7185] hover:bg-[#f43f5e]">
                      Yes, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}