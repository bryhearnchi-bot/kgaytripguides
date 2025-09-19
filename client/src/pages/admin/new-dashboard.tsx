import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Plus,
  Calendar,
  Ship,
  MapPin,
  Users,
  Palette,
  Eye,
  Edit2,
  MoreVertical,
  Search,
  LayoutDashboard,
  Anchor,
  FileText,
  Settings,
  UserCircle,
  LogOut,
  Menu,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { dateOnly } from '@/lib/utils';

interface Trip {
  id: number;
  name: string;
  status: 'upcoming' | 'active' | 'past';
  startDate: string;
  endDate: string;
  shipName: string;
  cruiseLine?: string;
  shipId?: number;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function NewAdminDashboard() {
  const [, navigate] = useLocation();
  const { user, logout } = useSupabaseAuthContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPath] = useLocation();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch trips
  const { data: trips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ['trips'],
    queryFn: async () => {
      const response = await fetch('/api/cruises', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch trips');
      return response.json();
    }
  });

  // Persist sidebar state
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      setSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  const navSections: NavSection[] = [
    {
      title: 'CRUISES',
      items: [
        { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
        { label: 'Active Cruises', path: '/admin/cruises/active', icon: <Anchor size={20} /> },
        { label: 'Past Cruises', path: '/admin/cruises/past', icon: <Anchor size={20} /> },
      ]
    },
    {
      title: 'CONTENT MANAGEMENT',
      items: [
        { label: 'Ships', path: '/admin/ships', icon: <Ship size={20} /> },
        { label: 'Locations', path: '/admin/locations', icon: <MapPin size={20} /> },
        { label: 'Artists/Talent', path: '/admin/artists', icon: <Users size={20} /> },
        { label: 'Party Themes', path: '/admin/themes', icon: <Palette size={20} /> },
        { label: 'Info Sections', path: '/admin/info-sections', icon: <FileText size={20} /> },
      ]
    }
  ];

  const adminSection: NavSection = {
    title: 'ADMINISTRATION',
    items: [
      { label: 'Users', path: '/admin/users', icon: <Users size={20} /> },
      { label: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
      { label: 'Profile', path: '/admin/profile', icon: <UserCircle size={20} /> },
    ]
  };

  const isActive = (path: string) => {
    if (path === '/admin' && currentPath === '/admin') return true;
    if (path !== '/admin' && currentPath.startsWith(path)) return true;
    return false;
  };

  const filteredTrips = trips.filter(trip => {
    const matchesFilter = filter === 'all' || trip.status === filter;
    const matchesSearch = trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          trip.shipName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500';
      case 'past': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-[#1e3a5f] to-[#0f2238] transition-all duration-300 z-50 shadow-xl ${
        sidebarCollapsed ? 'w-20' : 'w-[280px]'
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00B4D8] to-[#90E0EF] rounded-lg flex items-center justify-center text-2xl">
              ⚓
            </div>
            {!sidebarCollapsed && (
              <span className="text-white text-xl font-bold">CruiseGuides</span>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-white/10 rounded-md transition-colors"
          >
            <Menu size={20} className="text-[#90E0EF]" />
          </button>
        </div>

        <nav className="py-6 h-[calc(100vh-88px)] overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              {!sidebarCollapsed && (
                <div className="px-6 mb-2 text-xs uppercase tracking-wider text-white/40">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center px-6 py-3 transition-all ${
                    isActive(item.path)
                      ? 'bg-[#00B4D8]/15 text-[#00B4D8] border-l-4 border-[#00B4D8]'
                      : 'text-white/70 hover:bg-white/5 hover:text-white/95'
                  } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && (
                    <>
                      <span className="ml-3 text-left">{item.label}</span>
                      {isActive(item.path) && (
                        <ChevronRight className="ml-auto" size={16} />
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>
          ))}

          <div className="border-t border-white/10 pt-6 mt-auto">
            {!sidebarCollapsed && (
              <div className="px-6 mb-2 text-xs uppercase tracking-wider text-white/40">
                {adminSection.title}
              </div>
            )}
            {adminSection.items.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center px-6 py-3 transition-all ${
                  isActive(item.path)
                    ? 'bg-[#00B4D8]/15 text-[#00B4D8] border-l-4 border-[#00B4D8]'
                    : 'text-white/70 hover:bg-white/5 hover:text-white/95'
                } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span className="ml-3 text-left">{item.label}</span>
                    {isActive(item.path) && (
                      <ChevronRight className="ml-auto" size={16} />
                    )}
                  </>
                )}
              </button>
            ))}

            <button
              onClick={handleLogout}
              className="w-full flex items-center px-6 py-3 text-white/70 hover:bg-white/5 hover:text-white/95 transition-all"
            >
              <LogOut size={20} />
              {!sidebarCollapsed && <span className="ml-3 text-left">Logout</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-20' : 'ml-[280px]'
      }`}>
        {/* Top Bar */}
        <div className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cruise Management Dashboard</h1>
            <p className="text-sm text-gray-500">Manage all your cruise guides in one place</p>
          </div>
          <Button
            onClick={() => navigate('/admin/trips/new')}
            className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6] hover:from-[#0077B6] hover:to-[#005577]"
          >
            <Plus className="mr-2" size={20} />
            Create New Cruise
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white px-8 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList>
                <TabsTrigger value="all">All Cruises</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="active">In Progress</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search cruises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Cruise Grid */}
        <div className="p-8">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading cruises...</div>
          ) : filteredTrips.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="text-center py-12">
                <Ship className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-semibold mb-2">No cruises found</h3>
                <p className="text-gray-500 mb-4">Start by creating your first cruise guide</p>
                <Button
                  onClick={() => navigate('/admin/trips/new')}
                  className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6]"
                >
                  <Plus className="mr-2" size={20} />
                  Create New Cruise
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrips.map((trip) => (
                <Card key={trip.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-2 bg-gradient-to-r from-[#1e3a5f] to-[#0f2238]" />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{trip.name}</CardTitle>
                      <Badge className={getStatusColor(trip.status)}>
                        {trip.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} />
                        <span>
                          {format(dateOnly(trip.startDate), 'MMM d')} - {format(dateOnly(trip.endDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Ship size={16} />
                        <span>{trip.shipName}</span>
                      </div>
                      {trip.cruiseLine && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Anchor size={16} />
                          <span>{trip.cruiseLine}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/trips/${trip.id}`)}
                      >
                        <Eye className="mr-1" size={16} />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/trips/${trip.id}/edit`)}
                      >
                        <Edit2 className="mr-1" size={16} />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-[#00B4D8] to-[#0077B6]"
                        onClick={() => navigate(`/admin/dashboard?trip=${trip.id}`)}
                      >
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}