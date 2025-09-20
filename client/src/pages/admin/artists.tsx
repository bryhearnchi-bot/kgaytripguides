import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Music,
  Mic,
  Instagram,
  Globe,
  Save
} from 'lucide-react';

interface Talent {
  id?: number;
  name: string;
  category: string;
  bio?: string;
  knownFor?: string;
  profileImageUrl?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    website?: string;
  };
  website?: string;
}

export default function ArtistsManagement() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Talent | null>(null);
  const [formData, setFormData] = useState<Talent>({
    name: '',
    category: 'DJ',
  });

  // Fetch artists
  const { data: artists = [], isLoading } = useQuery<Talent[]>({
    queryKey: ['talent'],
    queryFn: async () => {
      const response = await fetch('/api/talent', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch artists');
      return response.json();
    }
  });

  // Create artist mutation
  const createArtistMutation = useMutation({
    mutationFn: async (data: Talent) => {
      const response = await fetch('/api/talent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create artist');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent'] });
      setShowAddModal(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Artist created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create artist',
        variant: 'destructive',
      });
    }
  });

  // Update artist mutation
  const updateArtistMutation = useMutation({
    mutationFn: async (data: Talent) => {
      const response = await fetch(`/api/talent/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update artist');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent'] });
      setEditingArtist(null);
      resetForm();
      toast({
        title: 'Success',
        description: 'Artist updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update artist',
        variant: 'destructive',
      });
    }
  });

  // Delete artist mutation
  const deleteArtistMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/talent/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete artist');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent'] });
      toast({
        title: 'Success',
        description: 'Artist deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message.includes('Cannot delete')
          ? 'This artist is assigned to events and cannot be deleted'
          : 'Failed to delete artist',
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'DJ',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingArtist) {
      updateArtistMutation.mutate({ ...formData, id: editingArtist.id });
    } else {
      createArtistMutation.mutate(formData);
    }
  };

  const handleEdit = (artist: Talent) => {
    setEditingArtist(artist);
    setFormData(artist);
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this artist?')) {
      deleteArtistMutation.mutate(id);
    }
  };

  const filteredArtists = artists.filter(artist =>
    artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artist.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'dj':
      case 'djs': return 'bg-purple-500';
      case 'drag': return 'bg-pink-500';
      case 'comedy':
      case 'comedian': return 'bg-yellow-500';
      case 'band':
      case 'music': return 'bg-blue-500';
      case 'magician': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'dj':
      case 'djs': return <Music size={16} />;
      case 'drag':
      case 'comedy':
      case 'comedian': return <Mic size={16} />;
      default: return <Users size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Artists & Talent Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage entertainment roster across all cruises</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => {
              setEditingArtist(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Artist
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search artists by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Artists Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Artists ({filteredArtists.length})</CardTitle>
          <CardDescription>
            Manage talent and performers across all entertainment venues
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-600" />
              <p>Loading artists...</p>
            </div>
          ) : filteredArtists.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No artists found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding your first artist.'}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => {
                    setEditingArtist(null);
                    resetForm();
                    setShowAddModal(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Artist
                </Button>
              )}
            </div>
          ) : (
            <ArtistsTable
              artists={filteredArtists}
              onEdit={handleEdit}
              onDelete={handleDelete}
              getCategoryColor={getCategoryColor}
              getCategoryIcon={getCategoryIcon}
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingArtist ? 'Edit Artist' : 'Add New Artist'}
            </DialogTitle>
            <DialogDescription>
              Enter the artist information below
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2">
                <Label htmlFor="name">Artist Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., DJ, Drag, Comedy, Band"
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="bio">Biography</Label>
                <Textarea
                  id="bio"
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  placeholder="Artist biography..."
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="knownFor">Known For</Label>
                <Input
                  id="knownFor"
                  value={formData.knownFor || ''}
                  onChange={(e) => setFormData({ ...formData, knownFor: e.target.value })}
                  placeholder="e.g., RuPaul's Drag Race, Comedy Central"
                />
              </div>

              <div>
                <Label htmlFor="instagram">Instagram URL</Label>
                <Input
                  id="instagram"
                  value={formData.socialLinks?.instagram || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                  })}
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingArtist(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6]"
                disabled={createArtistMutation.isPending || updateArtistMutation.isPending}
              >
                <Save className="mr-2" size={16} />
                {editingArtist ? 'Update Artist' : 'Create Artist'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Artists Table Component
interface ArtistsTableProps {
  artists: Talent[];
  onEdit: (artist: Talent) => void;
  onDelete: (id: number) => void;
  getCategoryColor: (category: string) => string;
  getCategoryIcon: (category: string) => JSX.Element;
}

function ArtistsTable({
  artists,
  onEdit,
  onDelete,
  getCategoryColor,
  getCategoryIcon
}: ArtistsTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Artist Details</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {artists.map((artist) => (
            <TableRow key={artist.id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                    {artist.profileImageUrl ? (
                      <img
                        src={artist.profileImageUrl}
                        alt={artist.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Users className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{artist.name}</div>
                    <div className="text-sm text-gray-500">
                      {artist.bio && (
                        <span className="line-clamp-1">{artist.bio.substring(0, 50)}...</span>
                      )}
                      {artist.knownFor && (
                        <div className="text-xs text-gray-400 mt-1">Known for: {artist.knownFor}</div>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={`text-white ${getCategoryColor(artist.category)}`}>
                  <span className="mr-1">{getCategoryIcon(artist.category)}</span>
                  {artist.category}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Active
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(artist)}
                    title="Edit Artist"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(artist.id!)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Delete Artist"
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