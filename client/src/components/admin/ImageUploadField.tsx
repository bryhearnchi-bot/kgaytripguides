import React, { useState } from 'react';
import { Image, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploadPopup } from './ImageUploadPopup';
import { type ImageType, type ImageUploadResult } from '@/hooks/useImageUpload';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
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
    onChange(result.url);

    // Auto-save to profile if enabled and this is a profile image
    if (autoSave && imageType === 'profiles' && user) {
      try {
        // Get authentication token
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('No authentication token');
        }

        // Save to profile via API
        const response = await fetch('/api/admin/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            profile_image_url: result.url,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save profile image');
        }

        // Refresh the profile data
        await refreshProfile();

        toast.success('Profile photo updated', {
          description: 'Your profile photo has been saved.',
        });
      } catch (error: any) {
        toast.error('Save failed', {
          description: error.message || 'Failed to save profile image',
        });
      }
    }

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
    <div className={`space-y-0 ${className}`}>
      {/* Image Upload Section */}
      <div
        data-image-upload="true"
        className="bg-white/3 border border-white/10 rounded-xl p-3"
        onClick={e => e.stopPropagation()}
        onSubmit={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="flex items-center gap-3">
          {/* Image Preview */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <div className="w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-dashed border-blue-400/30 flex items-center justify-center">
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
                <div className="flex flex-col items-center gap-1 p-1">
                  <Image className="h-5 w-5 text-white/30" />
                  <span className="text-[9px] text-white/30 text-center leading-tight">
                    {imageError ? 'Error' : 'No Image'}
                  </span>
                </div>
              )}

              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                </div>
              )}
            </div>
          </div>

          {/* Image Info and Actions */}
          <div className="flex-1 min-w-0">
            <div className="space-y-1.5">
              {/* Image Name */}
              <div>
                <h4 className="text-xs font-medium text-white/90 truncate leading-tight">
                  {hasImage && !imageError ? getImageName(value) : placeholder}
                </h4>
                {hasImage && !imageError && (
                  <p className="text-[10px] text-white/50 mt-0.5">Stored in Supabase</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1.5 mt-1.5" onClick={e => e.stopPropagation()}>
                {hasImage ? (
                  <>
                    <button
                      type="button"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowUploadPopup(true);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      disabled={disabled}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-solid border-transparent cursor-pointer transition-all duration-200 text-[11px] font-medium bg-blue-400/10 border-blue-400/30 text-blue-400 hover:bg-blue-400/20 hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Edit2 className="w-3 h-3" />
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={disabled}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-solid border-transparent cursor-pointer transition-all duration-200 text-[11px] font-medium bg-rose-400/10 border-rose-400/30 text-rose-400 hover:bg-rose-400/20 hover:border-rose-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowUploadPopup(true);
                    }}
                    disabled={disabled}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-solid border-transparent cursor-pointer transition-all duration-200 text-[11px] font-medium bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20 hover:border-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3" />
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
