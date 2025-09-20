import React, { useState } from 'react';
import { ProfileView } from '@/components/user/UserProfile/ProfileView';
import { ProfileEditForm } from '@/components/user/UserProfile/ProfileEditForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function UserProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [, setLocation] = useLocation();

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSuccess = () => {
    setIsEditing(false);
  };

  const handleBack = () => {
    // Go back to previous page or dashboard
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditing ? 'Edit Profile' : 'My Profile'}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {isEditing
                  ? 'Update your personal information and preferences'
                  : 'View and manage your account information'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {isEditing ? (
            <div className="p-6">
              <ProfileEditForm
                onCancel={handleCancel}
                onSuccess={handleSuccess}
              />
            </div>
          ) : (
            <div className="p-6">
              <ProfileView onEdit={handleEdit} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}