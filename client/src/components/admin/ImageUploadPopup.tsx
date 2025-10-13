import React, { useState, useRef } from 'react';
import { X, Upload, Link, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useImageUpload, type ImageType, type ImageUploadResult } from '@/hooks/useImageUpload';

interface ImageUploadPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onImageUploaded: (result: ImageUploadResult) => void;
  imageType: ImageType;
  title?: string;
}

export function ImageUploadPopup({
  isOpen,
  onClose,
  onImageUploaded,
  imageType,
  title = 'Upload Image',
}: ImageUploadPopupProps) {
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isUploading, error, progress, uploadFile, uploadFromUrl, resetState } = useImageUpload();

  const handleClose = () => {
    if (isUploading) return; // Prevent closing during upload
    setUrlInput('');
    setShowUrlInput(false);
    resetState();
    onClose();
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const result = await uploadFile(file, imageType);
      onImageUploaded(result);
      handleClose();
    } catch (error) {
      // Error is already handled in the hook
      // Don't close popup on error so user can see the error message
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) return;

    try {
      const result = await uploadFromUrl(urlInput.trim(), imageType);
      onImageUploaded(result);
      handleClose();
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const toggleUrlInput = () => {
    setShowUrlInput(!showUrlInput);
    if (!showUrlInput) {
      setUrlInput('');
    }
  };

  if (!isOpen) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4">
        <div
          className="bg-slate-900/95 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Upload className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">{title}</h2>
            </div>
            {!isUploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClose();
                }}
                className="h-8 w-8 p-0 hover:bg-white/10 relative z-[10002]"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                <span className="text-sm text-white/80">Uploading... {progress}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Upload Options */}
          <div className="space-y-4">
            {/* Option 1: Upload from Device */}
            <button
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                handleFileSelect();
              }}
              disabled={isUploading}
              className="w-full p-4 border-2 border-dashed border-white/20 rounded-xl hover:border-blue-400/50 hover:bg-blue-500/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative z-[10002]"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Camera className="h-6 w-6 text-blue-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-white">Upload from Device</h3>
                  <p className="text-sm text-white/60">Choose from your computer or camera roll</p>
                </div>
              </div>
            </button>

            {/* Option 2: Upload from URL */}
            <div>
              <button
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleUrlInput();
                }}
                disabled={isUploading}
                className="w-full p-4 border-2 border-dashed border-white/20 rounded-xl hover:border-blue-400/50 hover:bg-blue-500/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative z-[10002]"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Link className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-white">Upload from URL</h3>
                    <p className="text-sm text-white/60">Enter an image URL from the web</p>
                  </div>
                </div>
              </button>

              {/* URL Input */}
              {showUrlInput && (
                <div className="mt-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      disabled={isUploading}
                      className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleUrlUpload();
                        }
                      }}
                    />
                    <Button
                      onClick={handleUrlUpload}
                      disabled={!urlInput.trim() || isUploading}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Upload
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Supported Formats */}
          <div className="mt-6 text-center">
            <p className="text-xs text-white/40">
              Supported formats: JPEG, PNG, WebP, GIF, AVIF • Max size: 5MB
            </p>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
