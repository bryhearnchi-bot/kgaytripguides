import { useState } from 'react';
import { api, apiClient } from '@/lib/api-client';

export interface ImageUploadState {
  isUploading: boolean;
  error: string | null;
  progress: number;
}

export interface ImageUploadResult {
  url: string;
  filename: string;
  size: number;
}

export type ImageType =
  | 'ships'
  | 'resorts'
  | 'locations'
  | 'events'
  | 'talent'
  | 'profiles'
  | 'general';

export function useImageUpload() {
  const [state, setState] = useState<ImageUploadState>({
    isUploading: false,
    error: null,
    progress: 0,
  });

  const resetState = () => {
    setState({
      isUploading: false,
      error: null,
      progress: 0,
    });
  };

  const uploadFile = async (file: File, imageType: ImageType): Promise<ImageUploadResult> => {
    setState({ isUploading: true, error: null, progress: 0 });

    try {
      // Validate file
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/avif',
      ];

      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only JPEG, PNG, WebP, GIF, and AVIF images are allowed');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('image', file);

      setState(prev => ({ ...prev, progress: 25 }));

      // Upload to backend using api client for proper authentication
      const response = await apiClient(`/api/images/upload/${imageType}`, {
        method: 'POST',
        body: formData,
      });

      setState(prev => ({ ...prev, progress: 75 }));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const result = await response.json();

      setState(prev => ({ ...prev, progress: 100 }));

      // Reset state after a brief delay
      setTimeout(resetState, 1000);

      return {
        url: result.url,
        filename: result.filename || file.name,
        size: result.size || file.size,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      setState({ isUploading: false, error: errorMessage, progress: 0 });
      throw error;
    }
  };

  const uploadFromUrl = async (
    url: string,
    imageType: ImageType,
    name: string = 'image'
  ): Promise<ImageUploadResult> => {
    setState({ isUploading: true, error: null, progress: 0 });

    try {
      // Basic URL validation
      try {
        new URL(url);
      } catch {
        throw new Error('Please enter a valid URL');
      }

      setState(prev => ({ ...prev, progress: 25 }));

      // Send to backend for download and upload
      const response = await api.post('/api/images/download-from-url', {
        url,
        type: imageType,
        name,
      });

      setState(prev => ({ ...prev, progress: 75 }));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download and upload image');
      }

      const result = await response.json();

      setState(prev => ({ ...prev, progress: 100 }));

      // Reset state after a brief delay
      setTimeout(resetState, 1000);

      return {
        url: result.url,
        filename: name,
        size: 0, // Size not available from URL downloads
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download image';
      setState({ isUploading: false, error: errorMessage, progress: 0 });
      throw error;
    }
  };

  const deleteImage = async (url: string): Promise<void> => {
    setState({ isUploading: true, error: null, progress: 0 });

    try {
      setState(prev => ({ ...prev, progress: 50 }));

      const response = await api.delete(`/api/images?url=${encodeURIComponent(url)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete image');
      }

      setState(prev => ({ ...prev, progress: 100 }));

      // Reset state after a brief delay
      setTimeout(resetState, 500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete image';
      setState({ isUploading: false, error: errorMessage, progress: 0 });
      throw error;
    }
  };

  return {
    ...state,
    uploadFile,
    uploadFromUrl,
    deleteImage,
    resetState,
  };
}
