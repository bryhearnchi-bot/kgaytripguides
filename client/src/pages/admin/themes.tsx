import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Party Themes Management</h1>
          <p className="text-sm text-gray-600 mt-1">Create reusable party theme templates for events</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => {
              setEditingTheme(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Theme
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search themes by name, venue, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Themes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Party Themes ({filteredThemes.length})</CardTitle>
          <CardDescription>
            Manage reusable theme templates for all party events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Palette className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-600" />
              <p>Loading party themes...</p>
            </div>
          ) : filteredThemes.length === 0 ? (
            <div className="text-center py-12">
              <Palette className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No party themes found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating your first party theme template.'}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => {
                    setEditingTheme(null);
                    resetForm();
                    setShowAddModal(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Theme
                </Button>
              )}
            </div>
          ) : (
            <ThemesTable
              themes={filteredThemes}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              getVenueColor={getVenueColor}
              getVenueIcon={getVenueIcon}
            />
          )}
        </CardContent>
      </Card>

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

// Themes Table Component
interface ThemesTableProps {
  themes: PartyTheme[];
  onEdit: (theme: PartyTheme) => void;
  onDelete: (id: number) => void;
  onDuplicate: (theme: PartyTheme) => void;
  getVenueColor: (venue?: string) => string;
  getVenueIcon: (venue?: string) => string;
}

function ThemesTable({
  themes,
  onEdit,
  onDelete,
  onDuplicate,
  getVenueColor,
  getVenueIcon
}: ThemesTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Theme Details</TableHead>
            <TableHead>Venue & Capacity</TableHead>
            <TableHead>Usage Stats</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {themes.map((theme) => (
            <TableRow key={theme.id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg ${getVenueColor(theme.venue_type)}`}>
                    {getVenueIcon(theme.venue_type)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{theme.name}</div>
                    <div className="text-sm text-gray-500">
                      {theme.theme && (
                        <span className="flex items-center gap-1">
                          <Sparkles size={12} />
                          {theme.theme}
                        </span>
                      )}
                      {theme.description && (
                        <div className="mt-1 text-xs line-clamp-1">{theme.description}</div>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <Badge className={`text-white ${getVenueColor(theme.venue_type)}`}>
                    {theme.venue_type?.toUpperCase()}
                  </Badge>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {theme.capacity && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {theme.capacity}
                      </div>
                    )}
                    {theme.duration_hours && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {theme.duration_hours}h
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{theme.usage_count || 0}</span>
                  <span className="text-sm text-gray-500">events</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(theme)}
                    title="Edit Theme"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDuplicate(theme)}
                    title="Duplicate Theme"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(theme.id!)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Delete Theme"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}