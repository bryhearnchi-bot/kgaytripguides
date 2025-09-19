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
  ArrowLeft,
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
              <h1 className="text-2xl font-bold text-gray-900">Artists & Talent</h1>
              <p className="text-sm text-gray-500">Manage entertainment roster</p>
            </div>
            <Button
              onClick={() => {
                setEditingArtist(null);
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6]"
            >
              <Plus className="mr-2" size={20} />
              Add New Artist
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-8 py-4 bg-white border-b">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search artists by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Artists Grid */}
      <div className="p-8">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading artists...</div>
        ) : filteredArtists.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-semibold mb-2">No artists found</h3>
              <p className="text-gray-500 mb-4">Start by adding your first artist</p>
              <Button
                onClick={() => {
                  setEditingArtist(null);
                  resetForm();
                  setShowAddModal(true);
                }}
                className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6]"
              >
                <Plus className="mr-2" size={20} />
                Add New Artist
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredArtists.map((artist) => (
              <Card key={artist.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-[#1e3a5f] to-[#0f2238] flex items-center justify-center relative">
                  {artist.profileImageUrl ? (
                    <img
                      src={artist.profileImageUrl}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                      <Users className="text-white/50" size={48} />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{artist.name}</CardTitle>
                      <Badge className={`mt-1 ${getCategoryColor(artist.category)}`}>
                        <span className="mr-1">{getCategoryIcon(artist.category)}</span>
                        {artist.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {artist.bio && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {artist.bio}
                    </p>
                  )}

                  {artist.socialLinks && (
                    <div className="flex gap-2 mb-4">
                      {artist.socialLinks.instagram && (
                        <a
                          href={artist.socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-pink-500"
                        >
                          <Instagram size={18} />
                        </a>
                      )}
                      {artist.website && (
                        <a
                          href={artist.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-blue-500"
                        >
                          <Globe size={18} />
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(artist)}
                      className="flex-1"
                    >
                      <Edit2 className="mr-1" size={16} />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(artist.id!)}
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
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