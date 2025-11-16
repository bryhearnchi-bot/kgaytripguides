import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
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
  Send,
} from 'lucide-react';
import { format } from 'date-fns';
import { dateOnly } from '@/lib/utils';
import type { ProfileName, ProfileLocation, ProfileSocialLinks } from '@shared/api-types';

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
      full: '',
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
      telegram: '',
    },
  });

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
          full: '',
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
          instagram: (profile.socialLinks as ProfileSocialLinks)?.instagram || '',
          twitter: (profile.socialLinks as ProfileSocialLinks)?.twitter || '',
          facebook: (profile.socialLinks as ProfileSocialLinks)?.facebook || '',
          telegram: (profile.socialLinks as ProfileSocialLinks)?.telegram || '',
        },
      });
    }
  }, [profile]);

  // Handle avatar upload from our custom popup
  const handleAvatarImageUploaded = async (result: {
    url: string;
    filename: string;
    size: number;
  }) => {
    setIsUploadingAvatar(true);

    try {
      setAvatarPreview(result.url);

      // Update profile with new avatar URL
      await api.put('/api/admin/profile', { profile_image_url: result.url });

      toast.success('Success', {
        description: 'Avatar updated successfully',
      });

      queryClient.invalidateQueries({ queryKey: ['auth-profile'] });
      setShowAvatarUploadPopup(false);
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to update avatar',
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
      toast.success('Success', {
        description: 'Profile updated successfully',
      });

      setTimeout(() => {
        refreshProfile();
      }, 500);

      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error.message || 'Failed to update profile',
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

      social_links: formData.socialLinks,
    };

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
          full: '',
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
        },
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
        ...(prev[field] as any),
        [subField]: value,
      },
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
    <div className="space-y-4" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header Section - Sticky with Safari fix */}
      <div className="safari-sticky-header sticky top-16 z-20 pb-[0.85rem] space-y-4">
        <div className="flex items-center justify-between px-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Shield className="h-5 w-5" />
            Profile
          </h1>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                // TODO: Implement change password functionality
                toast.info('Change password feature coming soon');
              }}
              className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/15"
              aria-label="Change Password"
              title="Change Password"
            >
              <Shield className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(!isEditing)}
              className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/15"
              aria-label={isEditing ? 'View Profile' : 'Edit Profile'}
              title={isEditing ? 'View Profile' : 'Edit Profile'}
            >
              {isEditing ? <Eye className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Sidebar */}
        <div className="w-full space-y-4">
          {/* Profile Card */}
          <div className="border border-white/10 bg-white/5 backdrop-blur-xl rounded-xl p-4 shadow-lg">
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
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAvatarUploadPopup(true);
                  }}
                  disabled={isUploadingAvatar}
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h2 className="mt-3 text-base font-semibold text-white">
                {profile.name?.first && profile.name?.last
                  ? `${profile.name.first} ${profile.name.last}`
                  : 'No Name Set'}
              </h2>
              <p className="text-white/70 text-xs mt-1">{profile.email}</p>
              <div className="mt-2 flex justify-center">
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-medium rounded-full border border-emerald-500/30">
                  {profile.role === 'super_admin' ? 'Super Admin' : profile.role}
                </span>
              </div>
            </div>

            {/* Contact Info Display */}
            <div className="mt-4 space-y-2">
              {profile.phoneNumber && (
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Phone className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="truncate">{profile.phoneNumber}</span>
                </div>
              )}
              {(profile.location_text ||
                profile.city ||
                profile.state_province ||
                profile.country ||
                profile.location?.city ||
                profile.location?.state ||
                profile.location?.country) && (
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="truncate">
                    {profile.location_text ||
                      [profile.city, profile.state_province, profile.country]
                        .filter(Boolean)
                        .join(', ') ||
                      [profile.location?.city, profile.location?.state, profile.location?.country]
                        .filter(Boolean)
                        .join(', ')}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Calendar className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span>
                  Joined{' '}
                  {profile.created_at
                    ? format(dateOnly(profile.created_at), 'MMM yyyy')
                    : 'Unknown'}
                </span>
              </div>
            </div>

            {/* Social Links Display */}
            {!isEditing &&
              ((profile.socialLinks as ProfileSocialLinks)?.instagram ||
                (profile.socialLinks as ProfileSocialLinks)?.twitter ||
                (profile.socialLinks as ProfileSocialLinks)?.facebook ||
                (profile.socialLinks as ProfileSocialLinks)?.telegram) && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex justify-center gap-3">
                    {(profile.socialLinks as ProfileSocialLinks).instagram && (
                      <a
                        href={`https://instagram.com/${(profile.socialLinks as ProfileSocialLinks).instagram!.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/60 hover:text-pink-400 transition-colors"
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {(profile.socialLinks as ProfileSocialLinks).twitter && (
                      <a
                        href={`https://twitter.com/${(profile.socialLinks as ProfileSocialLinks).twitter!.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/60 hover:text-sky-400 transition-colors"
                      >
                        <Twitter className="w-4 h-4" />
                      </a>
                    )}
                    {(profile.socialLinks as ProfileSocialLinks).facebook && (
                      <a
                        href={(profile.socialLinks as ProfileSocialLinks).facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/60 hover:text-blue-400 transition-colors"
                      >
                        <Facebook className="w-4 h-4" />
                      </a>
                    )}
                    {(profile.socialLinks as ProfileSocialLinks).telegram && (
                      <a
                        href={`https://t.me/${(profile.socialLinks as ProfileSocialLinks).telegram!.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/60 hover:text-blue-400 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="border border-white/10 bg-white/5 backdrop-blur-xl rounded-xl p-4 shadow-lg">
            {/* Edit Mode Action Buttons */}
            {isEditing && (
              <div className="flex justify-end gap-2 mb-6">
                <Button
                  onClick={handleCancel}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full border border-white/10 bg-white/10 hover:bg-white/15 text-white transition-colors"
                  aria-label="Cancel"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full border border-white/10 bg-white/10 hover:bg-white/15 text-green-400 hover:text-green-300 transition-colors"
                  aria-label="Save changes"
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Content */}
            {isEditing ? (
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-base font-semibold text-white mb-3 pb-2 border-b border-white/10">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-white/70 block mb-2">
                        First Name
                      </Label>
                      <Input
                        type="text"
                        value={formData.name.first}
                        onChange={e => updateNestedFormData('name', 'first', e.target.value)}
                        className="h-11 rounded-lg border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-white/20 focus:ring-0 focus:ring-offset-0 focus:shadow-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/20 focus-visible:outline-none min-h-[44px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-white/70 block mb-2">
                        Last Name
                      </Label>
                      <Input
                        type="text"
                        value={formData.name.last}
                        onChange={e => updateNestedFormData('name', 'last', e.target.value)}
                        className="h-11 rounded-lg border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-white/20 focus:ring-0 focus:ring-offset-0 focus:shadow-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/20 focus-visible:outline-none min-h-[44px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-white/70 block mb-2">
                        Email Address
                      </Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={e => updateFormData('email', e.target.value)}
                        className="h-11 rounded-lg border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-white/20 focus:ring-0 focus:ring-offset-0 focus:shadow-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/20 focus-visible:outline-none min-h-[44px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-white/70 block mb-2">
                        Username
                      </Label>
                      <Input
                        type="text"
                        value={formData.username}
                        onChange={e => updateFormData('username', e.target.value)}
                        placeholder="Choose a username"
                        className="h-11 rounded-lg border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-white/20 focus:ring-0 focus:ring-offset-0 focus:shadow-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/20 focus-visible:outline-none min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Location & Contact */}
                <div>
                  <h3 className="text-base font-semibold text-white mb-3 pb-2 border-b border-white/10">
                    Location & Contact
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-white/70 block mb-2">Phone</Label>
                      <Input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={e => updateFormData('phoneNumber', e.target.value)}
                        className="h-11 rounded-lg border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-white/20 focus:ring-0 focus:ring-offset-0 focus:shadow-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/20 focus-visible:outline-none min-h-[44px]"
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
                          countryCode: formData.countryCode || '',
                        }}
                        onChange={location => {
                          setFormData(prev => ({
                            ...prev,
                            locationText: location.formatted || '',
                            city: location.city || '',
                            stateProvince: location.state || '',
                            country: location.country || '',
                            countryCode: location.countryCode || '',
                          }));
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  <h3 className="text-base font-semibold text-white mb-3 pb-2 border-b border-white/10">
                    Social Media
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-white/70 block mb-2 flex items-center gap-2">
                        <Instagram className="w-3.5 h-3.5 text-pink-400" />
                        Instagram
                      </Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 bg-white/10 border border-r-0 border-white/10 rounded-l-lg text-white/70 text-sm">
                          @
                        </span>
                        <Input
                          type="text"
                          value={formData.socialLinks.instagram}
                          onChange={e =>
                            updateNestedFormData('socialLinks', 'instagram', e.target.value)
                          }
                          placeholder="username"
                          className="h-11 rounded-l-none rounded-r-lg border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-white/20 focus:ring-0 focus:ring-offset-0 focus:shadow-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/20 focus-visible:outline-none min-h-[44px]"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-white/70 block mb-2 flex items-center gap-2">
                        <Twitter className="w-3.5 h-3.5 text-sky-400" />
                        Twitter/X
                      </Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 bg-white/10 border border-r-0 border-white/10 rounded-l-lg text-white/70 text-sm">
                          @
                        </span>
                        <Input
                          type="text"
                          value={formData.socialLinks.twitter}
                          onChange={e =>
                            updateNestedFormData('socialLinks', 'twitter', e.target.value)
                          }
                          placeholder="username"
                          className="h-11 rounded-l-none rounded-r-lg border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-white/20 focus:ring-0 focus:ring-offset-0 focus:shadow-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/20 focus-visible:outline-none min-h-[44px]"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-white/70 block mb-2 flex items-center gap-2">
                        <Facebook className="w-3.5 h-3.5 text-blue-400" />
                        Facebook
                      </Label>
                      <Input
                        type="text"
                        value={formData.socialLinks.facebook}
                        onChange={e =>
                          updateNestedFormData('socialLinks', 'facebook', e.target.value)
                        }
                        placeholder="facebook.com/username"
                        className="h-11 rounded-lg border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-white/20 focus:ring-0 focus:ring-offset-0 focus:shadow-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/20 focus-visible:outline-none min-h-[44px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-white/70 block mb-2 flex items-center gap-2">
                        <Send className="w-3.5 h-3.5 text-blue-400" />
                        Telegram
                      </Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 bg-white/10 border border-r-0 border-white/10 rounded-l-lg text-white/70 text-sm">
                          @
                        </span>
                        <Input
                          type="text"
                          value={formData.socialLinks.telegram}
                          onChange={e =>
                            updateNestedFormData('socialLinks', 'telegram', e.target.value)
                          }
                          placeholder="username"
                          className="h-11 rounded-l-none rounded-r-lg border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-white/20 focus:ring-0 focus:ring-offset-0 focus:shadow-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/20 focus-visible:outline-none min-h-[44px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <h3 className="text-base font-semibold text-white mb-3 pb-2 border-b border-white/10">
                    About You
                  </h3>
                  <div>
                    <Label className="text-xs font-medium text-white/70 block mb-2">Bio</Label>
                    <Textarea
                      rows={4}
                      value={formData.bio}
                      onChange={e => updateFormData('bio', e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="rounded-lg border-white/10 bg-white/5 text-white placeholder:text-white/40 resize-none focus:border-white/20 focus:ring-0 focus:ring-offset-0 focus:shadow-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/20 focus-visible:outline-none min-h-[88px]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              // View Mode - Only Bio
              <div>
                <h3 className="text-base font-semibold text-white mb-3 pb-2 border-b border-white/10">
                  About You
                </h3>
                <div className="text-white/90 text-sm leading-relaxed">
                  {profile.bio || (
                    <span className="text-white/50 italic">
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
