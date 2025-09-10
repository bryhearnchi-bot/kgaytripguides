import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Users,
  Plus
} from 'lucide-react';
import ArtistDatabaseManager from '../../components/admin/ArtistDatabaseManager';

function TalentManagementContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleBack = () => {
    setLocation('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-600" />
                <h1 className="text-xl font-semibold text-gray-900">Talent Directory</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Logged in as</span>
              <span className="text-sm font-medium text-gray-900">{user?.username}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <span>Artist Database</span>
            </CardTitle>
            <CardDescription>
              Manage performer profiles, bios, and social media links. Artists can be reused across multiple cruises.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ArtistDatabaseManager />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function TalentManagement() {
  return <TalentManagementContent />;
}