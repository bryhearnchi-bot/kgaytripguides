import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Upload, Link, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  imageType: 'talent' | 'event' | 'itinerary' | 'cruise';
  currentImageUrl?: string;
  onImageChange: (imageUrl: string | null) => void;
  disabled?: boolean;
  label?: string;
}

export function ImageUpload({
  imageType,
  currentImageUrl,
  onImageChange,
  disabled = false,
  label = 'Image',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Error', {
        description: 'Please select an image file',
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Error', {
        description: 'File size must be less than 10MB',
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('imageType', imageType);

      const response = await fetch(`/api/images/upload/${imageType}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      onImageChange(result.imageUrl);
      toast.success('Success', {
        description: 'Image uploaded successfully',
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to upload image',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlDownload = async () => {
    if (!urlInput.trim()) {
      toast.error('Error', {
        description: 'Please enter a valid URL',
      });
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch('/api/images/download-from-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: urlInput.trim(),
          imageType,
          name: `${imageType}-image`,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Download failed');
      }

      const result = await response.json();
      onImageChange(result.imageUrl);
      toast.success('Success', {
        description: 'Image downloaded and saved successfully',
      });
      setUrlInput('');
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to download image',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return;

    try {
      const response = await fetch('/api/images', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: currentImageUrl,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        // Continue anyway - the image reference will be removed
      }

      onImageChange(null);
      toast.success('Success', {
        description: 'Image removed successfully',
      });
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to remove image',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Image Preview */}
        {currentImageUrl && (
          <div className="space-y-2">
            <div className="relative group">
              <img
                src={currentImageUrl}
                alt={`Current ${imageType} image`}
                className="w-full h-32 object-cover rounded-md border"
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleRemoveImage}
                disabled={disabled}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground truncate">{currentImageUrl}</p>
          </div>
        )}

        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor={`file-${imageType}`}>Upload Image File</Label>
          <div className="flex gap-2">
            <Input
              id={`file-${imageType}`}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={disabled || isUploading}
              ref={fileInputRef}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* URL Download */}
        <div className="space-y-2">
          <Label htmlFor={`url-${imageType}`}>Or Download from URL</Label>
          <div className="flex gap-2">
            <Input
              id={`url-${imageType}`}
              type="url"
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              disabled={disabled || isDownloading}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleUrlDownload}
              disabled={disabled || isDownloading || !urlInput.trim()}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Supported formats: JPG, PNG, WebP, GIF. Max size: 10MB.
        </p>
      </CardContent>
    </Card>
  );
}
