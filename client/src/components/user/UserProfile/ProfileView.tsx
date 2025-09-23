import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Edit,
  Settings,
  Download,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

interface ProfileViewProps {
  onEdit?: () => void;
}

export function ProfileView({ onEdit }: ProfileViewProps) {
  const { user, profile } = useSupabaseAuthContext();

  if (!user || !profile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  // Get initials for avatar fallback
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const memberSince = profile.created_at
    ? format(new Date(profile.created_at), 'MMMM yyyy')
    : 'Unknown';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={(profile as any).profile_photo_url} />
                <AvatarFallback className="text-lg bg-ocean-100 text-ocean-700">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>

              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile.full_name || 'User'}
                </h2>
                <p className="text-sm text-gray-600">Member since {memberSince}</p>
                {profile.role === 'admin' && (
                  <Badge className="mt-2" variant="destructive">
                    <Shield className="w-3 h-3 mr-1" />
                    Administrator
                  </Badge>
                )}
              </div>
            </div>

            <Button onClick={onEdit} className="gap-2">
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-medium">{profile.full_name || 'Not provided'}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Mail className="w-4 h-4" />
                Email Address
              </p>
              <p className="font-medium">{profile.email}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Phone className="w-4 h-4" />
                Phone Number
              </p>
              <p className="font-medium">
                {(profile as any).phone_number || 'Not provided'}
                {(profile as any).phone_verified && (
                  <Badge className="ml-2" variant="outline">Verified</Badge>
                )}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Location
              </p>
              <p className="font-medium">
                {(profile as any).location ?
                  `${(profile as any).location.city}, ${(profile as any).location.state}` :
                  'Not provided'}
              </p>
            </div>
          </div>

          {(profile as any).bio && (
            <div className="space-y-1 pt-4 border-t">
              <p className="text-sm text-gray-500">About</p>
              <p className="text-gray-700">{(profile as any).bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Communication Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Communication Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Updates</p>
                <p className="text-sm text-gray-500">Receive updates via email</p>
              </div>
              <Badge variant={(profile as any).communication_preferences?.email ? 'default' : 'secondary'}>
                {(profile as any).communication_preferences?.email ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Text Messages</p>
                <p className="text-sm text-gray-500">Receive updates via SMS</p>
              </div>
              <Badge variant={(profile as any).communication_preferences?.sms ? 'default' : 'secondary'}>
                {(profile as any).communication_preferences?.sms ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cruise Updates</p>
                <p className="text-sm text-gray-500">Notifications about cruises you're following</p>
              </div>
              <Badge variant={(profile as any).trip_updates_opt_in ? 'default' : 'secondary'}>
                {(profile as any).trip_updates_opt_in ? 'Subscribed' : 'Unsubscribed'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Account Status</p>
              <Badge variant="outline" className="w-fit">
                {(profile as any).account_status || 'Active'}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-gray-500">Account ID</p>
              <p className="font-mono text-xs text-gray-600">{user.id}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-gray-500">Email Verified</p>
              <Badge variant={user.email_confirmed_at ? 'default' : 'secondary'}>
                {user.email_confirmed_at ? 'Verified' : 'Pending'}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Last Active
              </p>
              <p className="font-medium">
                {(profile as any).last_active ?
                  format(new Date((profile as any).last_active), 'PPp') :
                  'Recently'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy & Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Download className="w-4 h-4 mr-2" />
            Download My Data (GDPR)
          </Button>

          <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete My Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}