import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Palette,
  Plus,
  Edit2,
  Trash2,
  Search,
  Clock,
  Users,
  MapPin,
  ArrowLeft,
  Save,
  Sparkles,
  Copy
} from 'lucide-react';

interface PartyTheme {
  id?: number;
  name: string;
  theme?: string;
  venue_type?: 'pool' | 'deck' | 'club' | 'theater' | 'lounge';
  capacity?: number;
  duration_hours?: number;
  requirements?: string[];
  image_url?: string;
  usage_count?: number;
  description?: string;
  dress_code?: string;
}

export default function ThemesManagement() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState<PartyTheme | null>(null);
  const [formData, setFormData] = useState<PartyTheme>({
    name: '',
    venue_type: 'deck',
  });

  // Fetch themes
  const { data: themes = [], isLoading } = useQuery<PartyTheme[]>({
    queryKey: ['parties'],
    queryFn: async () => {
      const response = await fetch('/api/parties', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch themes');
      return response.json();
    }
  });

  // Create theme mutation
  const createThemeMutation = useMutation({
    mutationFn: async (data: PartyTheme) => {
      const response = await fetch('/api/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create theme');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      setShowAddModal(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Party theme created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create party theme',
        variant: 'destructive',
      });
    }
  });

  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: async (data: PartyTheme) => {
      const response = await fetch(`/api/parties/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update theme');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      setEditingTheme(null);
      resetForm();
      toast({
        title: 'Success',
        description: 'Party theme updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update party theme',
        variant: 'destructive',
      });
    }
  });

  // Delete theme mutation
  const deleteThemeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/parties/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete theme');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      toast({
        title: 'Success',
        description: 'Party theme deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message.includes('Cannot delete')
          ? 'This theme is being used and cannot be deleted'
          : 'Failed to delete party theme',
        variant: 'destructive',
      });
    }
  });

  // Duplicate theme mutation
  const duplicateThemeMutation = useMutation({
    mutationFn: async (theme: PartyTheme) => {
      const newTheme = { ...theme, id: undefined, name: `${theme.name} (Copy)`, usage_count: 0 };
      const response = await fetch('/api/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newTheme)
      });
      if (!response.ok) throw new Error('Failed to duplicate theme');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      toast({
        title: 'Success',
        description: 'Party theme duplicated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to duplicate party theme',
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      venue_type: 'deck',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTheme) {
      updateThemeMutation.mutate({ ...formData, id: editingTheme.id });
    } else {
      createThemeMutation.mutate(formData);
    }
  };

  const handleEdit = (theme: PartyTheme) => {
    setEditingTheme(theme);
    setFormData(theme);
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this party theme?')) {
      deleteThemeMutation.mutate(id);
    }
  };

  const handleDuplicate = (theme: PartyTheme) => {
    duplicateThemeMutation.mutate(theme);
  };

  const filteredThemes = themes.filter(theme =>
    theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theme.theme?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theme.venue_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getVenueColor = (venue?: string) => {
    switch (venue) {
      case 'pool': return 'bg-blue-500';
      case 'deck': return 'bg-green-500';
      case 'club': return 'bg-purple-500';
      case 'theater': return 'bg-red-500';
      case 'lounge': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getVenueIcon = (venue?: string) => {
    switch (venue) {
      case 'pool': return '🏊';
      case 'deck': return '⚓';
      case 'club': return '🎉';
      case 'theater': return '🎭';
      case 'lounge': return '🍸';
      default: return '🎊';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
              >
                <ArrowLeft className="mr-2" size={16} />
                Back to Dashboard
              </Button>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Party Themes</h1>
              <p className="text-sm text-gray-500">Create reusable party theme templates</p>
            </div>
            <Button
              onClick={() => {
                setEditingTheme(null);
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6]"
            >
              <Plus className="mr-2" size={20} />
              Add New Theme
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-8 py-4 bg-white border-b">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search themes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Themes Grid */}
      <div className="p-8">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading party themes...</div>
        ) : filteredThemes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Palette className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-semibold mb-2">No party themes found</h3>
              <p className="text-gray-500 mb-4">Start by creating your first party theme template</p>
              <Button
                onClick={() => {
                  setEditingTheme(null);
                  resetForm();
                  setShowAddModal(true);
                }}
                className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6]"
              >
                <Plus className="mr-2" size={20} />
                Add New Theme
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredThemes.map((theme) => (
              <Card key={theme.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-32 bg-gradient-to-br from-[#1e3a5f] to-[#0f2238] flex items-center justify-center relative">
                  {theme.image_url ? (
                    <img src={theme.image_url} alt={theme.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-6xl">{getVenueIcon(theme.venue_type)}</div>
                  )}
                  <Badge className={`absolute top-2 right-2 ${getVenueColor(theme.venue_type)}`}>
                    {theme.venue_type?.toUpperCase()}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle>{theme.name}</CardTitle>
                  {theme.theme && (
                    <CardDescription className="flex items-center gap-1">
                      <Sparkles size={14} />
                      {theme.theme}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {theme.capacity && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users size={16} />
                        <span>Capacity: {theme.capacity}</span>
                      </div>
                    )}
                    {theme.duration_hours && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={16} />
                        <span>Duration: {theme.duration_hours}h</span>
                      </div>
                    )}
                    {theme.usage_count !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={16} />
                        <span>Used {theme.usage_count} times</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(theme)}
                    >
                      <Edit2 className="mr-1" size={16} />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(theme)}
                    >
                      <Copy className="mr-1" size={16} />
                      Duplicate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(theme.id!)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="mr-1" size={16} />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTheme ? 'Edit Party Theme' : 'Add New Party Theme'}
            </DialogTitle>
            <DialogDescription>
              Create a reusable party theme template
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2">
                <Label htmlFor="name">Theme Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., White Party, Glow Night"
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="theme">Theme Description</Label>
                <Input
                  id="theme"
                  value={formData.theme || ''}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  placeholder="e.g., All white attire, UV lights and neon"
                />
              </div>

              <div>
                <Label htmlFor="venue_type">Venue Type</Label>
                <Select
                  value={formData.venue_type}
                  onValueChange={(value) => setFormData({ ...formData, venue_type: value as PartyTheme['venue_type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pool">Pool Deck</SelectItem>
                    <SelectItem value="deck">Main Deck</SelectItem>
                    <SelectItem value="club">Night Club</SelectItem>
                    <SelectItem value="theater">Theater</SelectItem>
                    <SelectItem value="lounge">Lounge</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity || ''}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || undefined })}
                  placeholder="e.g., 500"
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration (hours)</Label>
                <Input
                  id="duration"
                  type="number"
                  step="0.5"
                  value={formData.duration_hours || ''}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) || undefined })}
                  placeholder="e.g., 2.5"
                />
              </div>

              <div>
                <Label htmlFor="dress_code">Dress Code</Label>
                <Input
                  id="dress_code"
                  value={formData.dress_code || ''}
                  onChange={(e) => setFormData({ ...formData, dress_code: e.target.value })}
                  placeholder="e.g., All White, Casual, Formal"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the party theme and atmosphere..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTheme(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6]"
                disabled={createThemeMutation.isPending || updateThemeMutation.isPending}
              >
                <Save className="mr-2" size={16} />
                {editingTheme ? 'Update Theme' : 'Create Theme'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}