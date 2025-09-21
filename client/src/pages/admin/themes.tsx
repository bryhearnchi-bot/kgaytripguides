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
import { Textarea } from '@/components/ui/textarea';
import {
  Palette,
  Plus,
  Edit2,
  Trash2,
  Search,
  Save,
  Copy
} from 'lucide-react';

interface PartyTheme {
  id?: number;
  name: string;
  longDescription?: string;
  shortDescription?: string;
  costumeIdeas?: string;
  imageUrl?: string;
  amazonShoppingListUrl?: string;
  usage_count?: number;
  createdAt?: Date;
  updatedAt?: Date;
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
    longDescription: '',
    shortDescription: '',
    costumeIdeas: '',
    imageUrl: '',
    amazonShoppingListUrl: '',
  });

  // Fetch themes
  const { data: themes = [], isLoading } = useQuery<PartyTheme[]>({
    queryKey: ['party-themes'],
    queryFn: async () => {
      const response = await fetch('/api/party-themes', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch themes');
      return response.json();
    }
  });

  // Create theme mutation
  const createThemeMutation = useMutation({
    mutationFn: async (data: PartyTheme) => {
      const response = await fetch('/api/party-themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create theme');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party-themes'] });
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
      const response = await fetch(`/api/party-themes/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update theme');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party-themes'] });
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
      const response = await fetch(`/api/party-themes/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete theme');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party-themes'] });
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
      const response = await fetch(`/api/party-themes/${theme.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: `${theme.name} (Copy)` })
      });
      if (!response.ok) throw new Error('Failed to duplicate theme');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party-themes'] });
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
      longDescription: '',
      shortDescription: '',
      costumeIdeas: '',
      imageUrl: '',
      amazonShoppingListUrl: '',
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
    theme.longDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theme.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theme.costumeIdeas?.toLowerCase().includes(searchTerm.toLowerCase())
  );


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
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input
                  id="shortDescription"
                  value={formData.shortDescription || ''}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Brief theme summary"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="longDescription">Long Description</Label>
                <Textarea
                  id="longDescription"
                  value={formData.longDescription || ''}
                  onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                  placeholder="Detailed description of the party theme"
                  rows={3}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="costumeIdeas">Costume Ideas</Label>
                <Textarea
                  id="costumeIdeas"
                  value={formData.costumeIdeas || ''}
                  onChange={(e) => setFormData({ ...formData, costumeIdeas: e.target.value })}
                  placeholder="e.g., All white attire, UV reactive clothing, neon accessories"
                  rows={3}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={formData.imageUrl || ''}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="amazonShoppingListUrl">Amazon Shopping List URL</Label>
                <Input
                  id="amazonShoppingListUrl"
                  type="url"
                  value={formData.amazonShoppingListUrl || ''}
                  onChange={(e) => setFormData({ ...formData, amazonShoppingListUrl: e.target.value })}
                  placeholder="https://www.amazon.com/shop/..."
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
}

function ThemesTable({
  themes,
  onEdit,
  onDelete,
  onDuplicate
}: ThemesTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Theme Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Costume Ideas</TableHead>
            <TableHead>Shopping List</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {themes.map((theme) => (
            <TableRow key={theme.id}>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium text-gray-900">{theme.name}</div>
                  {theme.imageUrl && (
                    <div className="text-xs text-blue-600 hover:underline truncate max-w-xs">
                      <a href={theme.imageUrl} target="_blank" rel="noopener noreferrer">
                        View Image
                      </a>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {theme.shortDescription && (
                    <div className="text-sm text-gray-700 line-clamp-1">{theme.shortDescription}</div>
                  )}
                  {theme.longDescription && (
                    <div className="text-xs text-gray-500 line-clamp-2">{theme.longDescription}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600">
                  {theme.costumeIdeas ? (
                    <div className="line-clamp-2">{theme.costumeIdeas}</div>
                  ) : (
                    <span className="text-gray-400">No costume ideas</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {theme.amazonShoppingListUrl ? (
                  <a
                    href={theme.amazonShoppingListUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View List
                  </a>
                ) : (
                  <span className="text-gray-400 text-sm">Not set</span>
                )}
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