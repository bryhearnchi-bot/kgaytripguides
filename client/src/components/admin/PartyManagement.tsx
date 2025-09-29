import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../lib/supabase';
// CSRF token not needed with Bearer authentication
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Music,
  Users,
  Star,
  Calendar,
  MapPin,
  CheckCircle,
  Upload,
  Link,
  Filter,
  X,
  Sparkles,
  Award,
  Globe,
  Grid,
  List,
  TrendingUp
} from 'lucide-react';

interface Talent {
  id: number;
  name: string;
  role: string;
  bio: string;
  profileImageUrl?: string;
  instagramHandle?: string;
  country?: string;
  yearsPerforming?: number;
  specialties?: string;
  featured?: boolean;
  performanceCount?: number;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface PartyManagementProps {
  selectMode?: boolean;
  onSelect?: (talent: Talent) => void;
  selectedId?: number | null;
}

export default function PartyManagement({
  selectMode = false,
  onSelect,
  selectedId
}: PartyManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [imageUploadMode, setImageUploadMode] = useState<'upload' | 'url'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session } = useSupabaseAuth();

  // Form state for create/edit
  const [formData, setFormData] = useState<Partial<Talent>>({
    name: '',
    role: 'DJ',
    bio: '',
    profileImageUrl: '',
    instagramHandle: '',
    country: '',
    yearsPerforming: 0,
    specialties: '',
    featured: false
  });

  // Fetch talent
  const { data: talents = [], isLoading } = useQuery({
    queryKey: ['talent', searchQuery, filterRole],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterRole && filterRole !== 'all') params.append('role', filterRole);

      // Get fresh session token
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/talent?${params}`, {
        credentials: 'include',
        headers,
      });
      if (!response.ok) throw new Error('Failed to fetch talent');
      return response.json();
    }
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['talent-stats'],
    queryFn: async () => {
      // Get fresh session token
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/talent/stats', {
        credentials: 'include',
        headers,
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<Talent>) => {
      // Get fresh session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/talent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create talent' }));
        throw new Error(error.error || 'Failed to create talent');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent'] });
      queryClient.invalidateQueries({ queryKey: ['talent-stats'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Talent profile created successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Talent> }) => {
      // Get fresh session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/talent/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to update talent' }));
        throw new Error(error.error || 'Failed to update talent');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent'] });
      setIsEditDialogOpen(false);
      setSelectedTalent(null);
      resetForm();
      toast({
        title: 'Success',
        description: 'Talent profile updated successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      // Get fresh session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/talent/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to delete talent' }));
        throw new Error(error.error || 'Failed to delete talent');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent'] });
      queryClient.invalidateQueries({ queryKey: ['talent-stats'] });
      toast({
        title: 'Success',
        description: 'Talent profile deleted successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      role: 'DJ',
      bio: '',
      profileImageUrl: '',
      instagramHandle: '',
      country: '',
      yearsPerforming: 0,
      specialties: '',
      featured: false
    });
    setImageUrl('');
  };

  const handleEdit = (talent: Talent) => {
    setSelectedTalent(talent);
    setFormData(talent);
    setImageUrl(talent.profileImageUrl || '');
    setIsEditDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSubmit = {
      ...formData,
      profileImageUrl: imageUrl
    };

    if (selectedTalent) {
      updateMutation.mutate({ id: selectedTalent.id, data: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In production, this would upload to Supabase Storage
    // For now, we'll create a local URL
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    toast({
      title: 'Image uploaded',
      description: 'Image ready for use'
    });
  };

  const handleImageUrlDownload = async () => {
    if (!imageUrl) return;
    
    // In production, this would download and re-upload to Supabase Storage
    toast({
      title: 'Image processed',
      description: 'Image URL saved successfully'
    });
  };

  const roles = ['DJ', 'Dancer', 'Performer', 'Host', 'Vocalist', 'Musician', 'Drag Queen', 'Special Guest'];
  const countries = ['USA', 'UK', 'Brazil', 'Spain', 'Mexico', 'Canada', 'Australia', 'Netherlands', 'Germany', 'France'];

  if (selectMode) {
    return (
      <div className="space-y-6">
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search talent by name, role, or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Talent Grid for Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {talents.map((talent: Talent) => (
            <Card
              key={talent.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedId === talent.id
                  ? 'ring-2 ring-blue-500 bg-blue-50/50'
                  : 'hover:ring-1 hover:ring-gray-300'
              }`}
              onClick={() => onSelect?.(talent)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {talent.profileImageUrl ? (
                    <img
                      src={talent.profileImageUrl}
                      alt={talent.name}
                      className="w-16 h-16 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{talent.name}</h3>
                      {talent.featured && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <Badge variant="secondary" className="mt-1">{talent.role}</Badge>
                    {talent.country && (
                      <div className="flex items-center mt-2 text-sm text-gray-600">
                        <MapPin className="w-3 h-3 mr-1" />
                        {talent.country}
                      </div>
                    )}
                    {selectedId === talent.id && (
                      <div className="mt-2">
                        <Badge className="bg-blue-500">Selected</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            Party & Talent Management
          </h2>
          <p className="text-gray-600 mt-1">Manage performers, DJs, and entertainers</p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Talent
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Talent</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Featured</p>
                <p className="text-2xl font-bold">{stats?.featured || 0}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Countries</p>
                <p className="text-2xl font-bold">{stats?.countries || 0}</p>
              </div>
              <Globe className="w-8 h-8 text-teal-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold">{stats?.avgRating?.toFixed(1) || '0.0'}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, role, specialty, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex rounded-lg border">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Talent Display */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : talents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Music className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No talent profiles found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filterRole !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first talent profile'}
            </p>
            {!searchQuery && filterRole === 'all' && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Talent
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {talents.map((talent: Talent) => (
            <Card key={talent.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-teal-100">
                  {talent.profileImageUrl ? (
                    <img
                      src={talent.profileImageUrl}
                      alt={talent.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="w-16 h-16 text-blue-500 opacity-50" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{talent.name}</h3>
                      <Badge variant="secondary" className="mt-1">{talent.role}</Badge>
                    </div>
                    {talent.featured && (
                      <Star className="w-5 h-5 text-yellow-500 fill-current flex-shrink-0" />
                    )}
                  </div>
                  {talent.country && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-3 h-3 mr-1" />
                      {talent.country}
                    </div>
                  )}
                  {talent.instagramHandle && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Sparkles className="w-3 h-3 mr-1" />
                      @{talent.instagramHandle}
                    </div>
                  )}
                  <p className="text-sm text-gray-600 line-clamp-2">{talent.bio}</p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(talent)}
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        if (confirm(`Delete ${talent.name}?`)) {
                          deleteMutation.mutate(talent.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {talents.map((talent: Talent) => (
                <div key={talent.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {talent.profileImageUrl ? (
                        <img
                          src={talent.profileImageUrl}
                          alt={talent.name}
                          className="w-12 h-12 rounded-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{talent.name}</h3>
                          {talent.featured && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <Badge variant="secondary">{talent.role}</Badge>
                          {talent.country && (
                            <span className="text-sm text-gray-600 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {talent.country}
                            </span>
                          )}
                          {talent.instagramHandle && (
                            <span className="text-sm text-gray-600">@{talent.instagramHandle}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(talent)}>
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete ${talent.name}?`)) {
                            deleteMutation.mutate(talent.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={() => {
        setIsCreateDialogOpen(false);
        setIsEditDialogOpen(false);
        setSelectedTalent(null);
        resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTalent ? 'Edit Talent Profile' : 'Add New Talent'}
            </DialogTitle>
            <DialogDescription>
              {selectedTalent ? 'Update the talent profile information' : 'Create a new talent profile for the cruise'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Biography</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                placeholder="Tell us about this performer..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={formData.country || ''}
                  onValueChange={(value) => setFormData({ ...formData, country: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instagramHandle">Instagram Handle</Label>
                <Input
                  id="instagramHandle"
                  value={formData.instagramHandle}
                  onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                  placeholder="username (without @)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yearsPerforming">Years Performing</Label>
                <Input
                  id="yearsPerforming"
                  type="number"
                  value={formData.yearsPerforming}
                  onChange={(e) => setFormData({ ...formData, yearsPerforming: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="specialties">Specialties</Label>
                <Input
                  id="specialties"
                  value={formData.specialties}
                  onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                  placeholder="e.g., House, Techno, Voguing"
                />
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>Profile Image</Label>
              <Tabs value={imageUploadMode} onValueChange={(v) => setImageUploadMode(v as 'upload' | 'url')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">Image URL</TabsTrigger>
                  <TabsTrigger value="upload">Upload Image</TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleImageUrlDownload}
                      disabled={!imageUrl}
                    >
                      <Link className="w-4 h-4" />
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="upload" className="space-y-2">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Click to upload image</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </TabsContent>
              </Tabs>
              {imageUrl && (
                <div className="mt-2">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg"
                    loading="lazy"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="featured" className="flex items-center cursor-pointer">
                <Star className="w-4 h-4 mr-2 text-yellow-500" />
                Featured Talent
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setSelectedTalent(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {selectedTalent ? 'Update' : 'Create'} Talent
                  </div>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}