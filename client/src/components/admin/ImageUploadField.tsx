import React, { useState } from 'react';
import { Image, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploadPopup } from './ImageUploadPopup';
import { type ImageType, type ImageUploadResult } from '@/hooks/useImageUpload';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface ImageUploadFieldProps {
  label: string;
  value?: string;
  onChange: (url: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  imageType: ImageType;
  className?: string;
  autoSave?: boolean;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  placeholder = 'No image uploaded',
  disabled = false,
  imageType,
  className = '',
  autoSave = false,
}: ImageUploadFieldProps) {
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { user, refreshProfile } = useSupabaseAuthContext();
  const { toast } = useToast();

  const hasImage = value && value.trim() !== '';

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleImageUploaded = async (result: ImageUploadResult) => {
    console.log('handleImageUploaded called with result:', result);
    console.log('Updating image URL to:', result.url);
    onChange(result.url);

    // Auto-save to profile if enabled and this is a profile image
    if (autoSave && imageType === 'profiles' && user) {
      try {
        console.log('Auto-saving profile image to database...');

        // Get authentication token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('No authentication token');
        }

        // Save to profile via API
        const response = await fetch('/api/admin/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          credentials: 'include',
          body: JSON.stringify({
            profile_image_url: result.url
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save profile image');
        }

        console.log('Profile image auto-saved successfully');

        // Refresh the profile data
        await refreshProfile();

        toast({
          title: 'Profile photo updated',
          description: 'Your profile photo has been saved.',
        });
      } catch (error: any) {
        console.error('Auto-save profile image error:', error);
        toast({
          title: 'Save failed',
          description: error.message || 'Failed to save profile image',
          variant: 'destructive',
        });
      }
    }

    console.log('Closing upload popup');
    setShowUploadPopup(false);
  };

  const handleRemoveImage = () => {
    onChange(null);
  };

  const getImageName = (url: string): string => {
    try {
      // Extract filename from URL
      const urlPath = new URL(url).pathname;
      const filename = urlPath.split('/').pop() || 'image';

      // Remove any UUID prefixes that might be added by storage
      const cleanName = filename.replace(/^[a-f0-9-]{36}_/, '');

      return cleanName;
    } catch {
      return `${imageType} image`;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Image Upload Section */}
      <div
        data-image-upload="true"
        className="bg-white/3 border border-white/10 rounded-xl p-4"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          console.log('Form submit event captured and prevented');
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="flex items-center gap-4">
          {/* Image Preview */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <div className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-dashed border-blue-400/30 flex items-center justify-center">
              {hasImage && !imageError ? (
                <img
                  src={value}
                  alt={label}
                  className="w-full h-full object-cover"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  style={{ display: imageLoading ? 'none' : 'block' }}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 p-2">
                  <Image className="h-6 w-6 text-white/30" />
                  <span className="text-xs text-white/30 text-center leading-tight">
                    {imageError ? 'Error' : 'No Image'}
                  </span>
                </div>
              )}

              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                </div>
              )}
            </div>
          </div>

          {/* Image Info and Actions */}
          <div className="flex-1 min-w-0">
            <div className="space-y-2">
              {/* Image Name */}
              <div>
                <h4 className="text-sm font-medium text-white/90 truncate">
                  {hasImage && !imageError ? getImageName(value) : placeholder}
                </h4>
                {hasImage && !imageError && (
                  <p className="text-xs text-white/50">
                    Image uploaded • Stored in Supabase
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                {hasImage ? (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        console.log('Change button onClick triggered');
                        console.log('Event type:', e.type);
                        console.log('Button type:', e.currentTarget.type);
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Opening popup (now using portal)');
                        setShowUploadPopup(true);
                      }}
                      onKeyDown={(e) => {
                        console.log('Change button keyDown:', e.key);
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      disabled={disabled}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-solid border-transparent cursor-pointer transition-all duration-200 text-xs font-medium bg-blue-400/10 border-blue-400/30 text-blue-400 hover:bg-blue-400/20 hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={disabled}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-solid border-transparent cursor-pointer transition-all duration-200 text-xs font-medium bg-rose-400/10 border-rose-400/30 text-rose-400 hover:bg-rose-400/20 hover:border-rose-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowUploadPopup(true);
                    }}
                    disabled={disabled}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-solid border-transparent cursor-pointer transition-all duration-200 text-xs font-medium bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20 hover:border-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Image
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Popup */}
      <ImageUploadPopup
        isOpen={showUploadPopup}
        onClose={() => setShowUploadPopup(false)}
        onImageUploaded={handleImageUploaded}
        imageType={imageType}
        title={`Upload ${label}`}
      />
    </div>
  );
}