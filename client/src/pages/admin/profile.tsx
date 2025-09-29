import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';
import { ImageUploadPopup } from '@/components/admin/ImageUploadPopup';
import { useImageUpload } from '@/hooks/useImageUpload';
import { LocationSearchBar } from '@/components/admin/LocationSearchBar';
import {
  User,
  Edit3,
  Save,
  X,
  Upload,
  MapPin,
  Globe,
  Instagram,
  Twitter,
  Shield,
  Facebook,
  Camera,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Eye,
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import { dateOnly } from '@/lib/utils';
import type { ProfileName, ProfileLocation, ProfileSocialLinks } from '@/shared/api-types';

interface FormData {
  name: ProfileName;
  email: string;
  username: string;
  bio: string;
  phoneNumber: string;
  locationText: string;
  city: string;
  stateProvince: string;
  country: string;
  countryCode: string;
  socialLinks: ProfileSocialLinks;
}

export default function AdminProfile() {
  const { profile, refreshProfile } = useSupabaseAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showAvatarUploadPopup, setShowAvatarUploadPopup] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: {
      first: '',
      last: '',
      middle: '',
      suffix: '',
      preferred: '',
      full: ''
    },
    email: '',
    username: '',
    bio: '',
    phoneNumber: '',
    locationText: '',
    city: '',
    stateProvince: '',
    country: '',
    countryCode: '',
    socialLinks: {
      instagram: '',
      twitter: '',
      facebook: '',
      telegram: ''
    }
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || {
          first: '',
          last: '',
          middle: '',
          suffix: '',
          preferred: '',
          full: ''
        },
        email: profile.email || '',
        username: profile.username || '',
        bio: profile.bio || '',
        phoneNumber: profile.phoneNumber || '',
        locationText: profile.location_text || '',
        city: profile.city || profile.location?.city || '',
        stateProvince: profile.state_province || profile.location?.state || '',
        country: profile.country || profile.location?.country || '',
        countryCode: profile.country_code || '',
        socialLinks: {
          instagram: profile.socialLinks?.instagram || '',
          twitter: profile.socialLinks?.twitter || '',
          facebook: profile.socialLinks?.facebook || '',
          telegram: profile.socialLinks?.telegram || ''
        }
      });
    }
  }, [profile]);

  // Handle avatar upload from our custom popup
  const handleAvatarImageUploaded = async (result: { url: string; filename: string; size: number }) => {
    setIsUploadingAvatar(true);

    try {
      setAvatarPreview(result.url);

      // Update profile with new avatar URL
      await api.put('/api/admin/profile', { profile_image_url: result.url });

      toast({
        title: 'Success',
        description: 'Avatar updated successfully',
      });

      queryClient.invalidateQueries({ queryKey: ['auth-profile'] });
      setShowAvatarUploadPopup(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update avatar',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (data: Partial<FormData>) => {
      const response = await api.put('/api/admin/profile', data);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update profile: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      setTimeout(() => {
        refreshProfile();
      }, 500);

      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    // Map FormData to API schema field names
    const apiData = {
      name: formData.name,
      bio: formData.bio,
      phone_number: formData.phoneNumber,

      // New location fields (using snake_case for API)
      location_text: formData.locationText,
      city: formData.city,
      state_province: formData.stateProvince,
      country: formData.country,
      country_code: formData.countryCode,

      social_links: formData.socialLinks
    };

    console.log('🔍 Profile form data being sent:', apiData);
    updateProfile.mutate(apiData);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || {
          first: '',
          last: '',
          middle: '',
          suffix: '',
          preferred: '',
          full: ''
        },
        email: profile.email || '',
        username: profile.username || '',
        bio: profile.bio || '',
        phoneNumber: profile.phoneNumber || '',
        locationText: profile.location_text || '',
        city: profile.city || profile.location?.city || '',
        stateProvince: profile.state_province || profile.location?.state || '',
        country: profile.country || profile.location?.country || '',
        countryCode: profile.country_code || '',
        socialLinks: {
          instagram: profile.socialLinks?.instagram || '',
          twitter: profile.socialLinks?.twitter || '',
          facebook: profile.socialLinks?.facebook || ''
        }
      });
    }
    setIsEditing(false);
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedFormData = (field: keyof FormData, subField: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field] as any,
        [subField]: value
      }
    }));
  };

  // Generate avatar initials
  const getInitials = () => {
    if (profile?.name?.first && profile?.name?.last) {
      return `${profile.name.first[0]}${profile.name.last[0]}`.toUpperCase();
    }
    if (profile?.name?.full) {
      const names = profile.name.full.split(' ');
      return `${names[0]?.[0] || ''}${names[1]?.[0] || ''}`.toUpperCase();
    }
    return profile?.email?.[0]?.toUpperCase() || 'U';
  };

  if (!profile) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Account Management
            </p>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
              <Shield className="h-6 w-6" />
              Profile
            </h1>
            <p className="text-sm text-white/60">
              Manage your account information and preferences.
            </p>
          </div>
        </div>
      </section>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-80 space-y-6">
          {/* Profile Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-xl">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 mx-auto rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {avatarPreview || profile.avatarUrl ? (
                    <img
                      src={avatarPreview || profile.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials()
                  )}
                </div>
                <button
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white cursor-pointer transition-colors shadow-lg"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAvatarUploadPopup(true);
                  }}
                  disabled={isUploadingAvatar}
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-white">
                {profile.name?.first && profile.name?.last
                  ? `${profile.name.first} ${profile.name.last}`
                  : 'No Name Set'}
              </h2>
              <p className="text-slate-300 text-sm">{profile.email}</p>
              <div className="mt-3 flex justify-center">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-medium rounded-full border border-emerald-500/30">
                  {profile.role === 'super_admin' ? 'Super Admin' : profile.role}
                </span>
              </div>
            </div>

            {/* Contact Info Display */}
            <div className="mt-6 space-y-3">
              {profile.phoneNumber && (
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Phone className="w-4 h-4 text-blue-400" />
                  {profile.phoneNumber}
                </div>
              )}
              {(profile.location_text || profile.city || profile.state_province || profile.country || profile.location?.city || profile.location?.state || profile.location?.country) && (
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  {profile.location_text || [profile.city, profile.state_province, profile.country].filter(Boolean).join(', ') || [profile.location?.city, profile.location?.state, profile.location?.country].filter(Boolean).join(', ')}
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Calendar className="w-4 h-4 text-blue-400" />
                Joined {profile.created_at ? format(dateOnly(profile.created_at), 'MMM yyyy') : 'Unknown'}
              </div>
            </div>

            {/* Social Links Display */}
            {!isEditing && (profile.socialLinks?.instagram || profile.socialLinks?.twitter || profile.socialLinks?.facebook || profile.socialLinks?.telegram) && (
              <div className="mt-4 pt-4 border-t border-slate-600/50">
                <div className="flex justify-center gap-3">
                  {profile.socialLinks.instagram && (
                    <a href={`https://instagram.com/${profile.socialLinks.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-pink-400 transition-colors">
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {profile.socialLinks.twitter && (
                    <a href={`https://twitter.com/${profile.socialLinks.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-sky-400 transition-colors">
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  {profile.socialLinks.facebook && (
                    <a href={profile.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-400 transition-colors">
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {profile.socialLinks.telegram && (
                    <a href={`https://t.me/${profile.socialLinks.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-400 transition-colors">
                      <Send className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 shadow-xl">
            <h3 className="text-sm font-semibold text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-md transition-colors flex items-center gap-2"
              >
                {isEditing ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                {isEditing ? 'View Profile' : 'Edit Profile'}
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-md transition-colors flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Change Password
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-md transition-colors flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Download Data
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 shadow-xl">
            {/* Edit Mode Action Buttons */}
            {isEditing && (
              <div className="flex justify-end gap-2 mb-8">
                <Button
                  onClick={handleCancel}
                  className="bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}

            {/* Content */}
            {isEditing ? (
              <div className="space-y-8">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-slate-600/50">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-slate-300 block mb-2">First Name</Label>
                      <Input
                        type="text"
                        value={formData.name.first}
                        onChange={(e) => updateNestedFormData('name', 'first', e.target.value)}
                        className="bg-slate-800/50 border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-300 block mb-2">Last Name</Label>
                      <Input
                        type="text"
                        value={formData.name.last}
                        onChange={(e) => updateNestedFormData('name', 'last', e.target.value)}
                        className="bg-slate-800/50 border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-300 block mb-2">Email Address</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        className="bg-slate-800/50 border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-300 block mb-2">Username</Label>
                      <Input
                        type="text"
                        value={formData.username}
                        onChange={(e) => updateFormData('username', e.target.value)}
                        placeholder="Choose a username"
                        className="bg-slate-800/50 border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Location & Contact */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-slate-600/50">Location & Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-300 block mb-2">Phone</Label>
                      <Input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => updateFormData('phoneNumber', e.target.value)}
                        className="bg-slate-800/50 border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <LocationSearchBar
                        label="Location"
                        placeholder="Search for city, state, or country..."
                        value={{
                          city: formData.city || '',
                          state: formData.stateProvince || '',
                          country: formData.country || '',
                          countryCode: formData.countryCode || ''
                        }}
                        onChange={(location) => {
                          setFormData(prev => ({
                            ...prev,
                            locationText: location.formatted || '',
                            city: location.city || '',
                            stateProvince: location.state || '',
                            country: location.country || '',
                            countryCode: location.countryCode || ''
                          }));
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-slate-600/50">Social Media</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-slate-300 block mb-2 flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-pink-400" />
                        Instagram
                      </Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-4 bg-slate-700/50 border border-r-0 border-slate-600 rounded-l-lg text-slate-300">@</span>
                        <Input
                          type="text"
                          value={formData.socialLinks.instagram}
                          onChange={(e) => updateNestedFormData('socialLinks', 'instagram', e.target.value)}
                          placeholder="username"
                          className="bg-slate-800/50 border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500 rounded-l-none"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-300 block mb-2 flex items-center gap-2">
                        <Twitter className="w-4 h-4 text-sky-400" />
                        Twitter/X
                      </Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-4 bg-slate-700/50 border border-r-0 border-slate-600 rounded-l-lg text-slate-300">@</span>
                        <Input
                          type="text"
                          value={formData.socialLinks.twitter}
                          onChange={(e) => updateNestedFormData('socialLinks', 'twitter', e.target.value)}
                          placeholder="username"
                          className="bg-slate-800/50 border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500 rounded-l-none"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-300 block mb-2 flex items-center gap-2">
                        <Facebook className="w-4 h-4 text-blue-400" />
                        Facebook
                      </Label>
                      <Input
                        type="text"
                        value={formData.socialLinks.facebook}
                        onChange={(e) => updateNestedFormData('socialLinks', 'facebook', e.target.value)}
                        placeholder="facebook.com/username"
                        className="bg-slate-800/50 border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-300 block mb-2 flex items-center gap-2">
                        <Send className="w-4 h-4 text-blue-400" />
                        Telegram
                      </Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-4 bg-slate-700/50 border border-r-0 border-slate-600 rounded-l-lg text-slate-300">@</span>
                        <Input
                          type="text"
                          value={formData.socialLinks.telegram}
                          onChange={(e) => updateNestedFormData('socialLinks', 'telegram', e.target.value)}
                          placeholder="username"
                          className="bg-slate-800/50 border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500 rounded-l-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-slate-600/50">About You</h3>
                  <div>
                    <Label className="text-sm font-medium text-slate-300 block mb-2">Bio</Label>
                    <Textarea
                      rows={4}
                      value={formData.bio}
                      onChange={(e) => updateFormData('bio', e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="bg-slate-800/50 border-slate-600 text-white resize-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              // View Mode - Only Bio
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-slate-600/50">About You</h3>
                <div className="text-white leading-relaxed">
                  {profile.bio || (
                    <span className="text-slate-400 italic">
                      No bio added yet. Click "Edit Profile" to add information about yourself.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avatar Upload Popup */}
      <ImageUploadPopup
        isOpen={showAvatarUploadPopup}
        onClose={() => setShowAvatarUploadPopup(false)}
        onImageUploaded={handleAvatarImageUploaded}
        imageType="profiles"
        title="Upload Profile Photo"
      />
    </div>
  );
}