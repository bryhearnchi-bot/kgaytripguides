import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Ship, 
  Calendar, 
  Users, 
  Image, 
  LogOut, 
  Settings, 
  BarChart3,
  MapPin,
  Music
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Authentication is handled by ProtectedRoute wrapper

  const handleLogout = () => {
    logout();
    setLocation('/admin/login');
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'cruise_admin': return 'default';
      case 'content_editor': return 'secondary';
      case 'media_manager': return 'outline';
      default: return 'secondary';
    }
  };

  const managementSections = [
    {
      title: 'Cruise Management',
      description: 'Create and manage cruise itineraries, dates, and destinations',
      icon: Ship,
      path: '/admin/cruises',
      color: 'bg-blue-500',
      requiresRole: ['super_admin', 'cruise_admin', 'content_editor']
    },
    {
      title: 'Events & Entertainment',
      description: 'Manage party themes, shows, and daily entertainment schedules',
      icon: Calendar,
      path: '/admin/events',
      color: 'bg-purple-500',
      requiresRole: ['super_admin', 'cruise_admin', 'content_editor']
    },
    {
      title: 'Talent Directory',
      description: 'Manage performer profiles, bios, and social media links',
      icon: Users,
      path: '/admin/talent',
      color: 'bg-green-500',
      requiresRole: ['super_admin', 'cruise_admin', 'content_editor']
    },
    {
      title: 'Port Activities',
      description: 'Manage port information, excursions, and local attractions',
      icon: MapPin,
      path: '/admin/ports',
      color: 'bg-orange-500',
      requiresRole: ['super_admin', 'cruise_admin', 'content_editor']
    },
    {
      title: 'Media Library',
      description: 'Upload and organize photos, videos, and promotional materials',
      icon: Image,
      path: '/admin/media',
      color: 'bg-pink-500',
      requiresRole: ['super_admin', 'cruise_admin', 'content_editor', 'media_manager']
    },
    {
      title: 'Analytics & Reports',
      description: 'View engagement statistics and user activity reports',
      icon: BarChart3,
      path: '/admin/analytics',
      color: 'bg-indigo-500',
      requiresRole: ['super_admin', 'cruise_admin']
    }
  ];

  const canAccess = (requiredRoles: string[]) => {
    return user?.role && requiredRoles.includes(user.role);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Ship className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Cruise Guide Admin
                </h1>
                <p className="text-sm text-gray-500">
                  Atlantis Events Management Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={getRoleBadgeVariant(user?.role || '')}>
                    {user?.role?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.fullName?.split(' ')[0]}!
          </h2>
          <p className="text-gray-600">
            Manage your cruise guide content and settings from this dashboard.
          </p>
        </div>

        {/* Management Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {managementSections.map((section) => {
            const Icon = section.icon;
            const hasAccess = canAccess(section.requiresRole);
            
            return (
              <Card 
                key={section.path}
                className={`transition-all hover:shadow-lg ${
                  hasAccess ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => hasAccess && setLocation(section.path)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg ${section.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      {!hasAccess && (
                        <Badge variant="outline" className="text-xs">
                          Access Restricted
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{section.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2"
                onClick={() => setLocation('/admin/cruises/new')}
                disabled={!canAccess(['super_admin', 'cruise_admin', 'content_editor'])}
              >
                <Ship className="w-5 h-5" />
                <span>New Cruise</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2"
                onClick={() => setLocation('/admin/events/new')}
                disabled={!canAccess(['super_admin', 'cruise_admin', 'content_editor'])}
              >
                <Music className="w-5 h-5" />
                <span>Add Event</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2"
                onClick={() => setLocation('/admin/talent/new')}
                disabled={!canAccess(['super_admin', 'cruise_admin', 'content_editor'])}
              >
                <Users className="w-5 h-5" />
                <span>Add Talent</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2"
                onClick={() => setLocation('/admin/media')}
                disabled={!canAccess(['super_admin', 'cruise_admin', 'content_editor', 'media_manager'])}
              >
                <Image className="w-5 h-5" />
                <span>Upload Media</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}