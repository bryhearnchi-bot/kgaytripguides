import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Artists & Talent Management</h1>
            <p className="text-sm text-white/60">Manage entertainment roster across Atlantis sailings.</p>
          </div>
          <Button
            onClick={() => {
              setEditingArtist(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 hover:from-[#38e0f6] hover:to-[#3b82f6]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Artist
          </Button>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search artists by name or category"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 rounded-full border-white/10 bg-white/10 pl-10 text-sm text-white placeholder:text-white/50 focus:border-[#22d3ee]/70"
            />
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-white/60">
            <Button variant="ghost" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">
              Active
            </Button>
            <Button variant="ghost" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">
              Category
            </Button>
            <Button variant="ghost" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">
              Cruise
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
        <header className="flex flex-col gap-2 border-b border-white/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">All Artists ({filteredArtists.length})</h2>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Across all voyages</p>
          </div>
        </header>

        {filteredArtists.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-white/60">
            <Users className="h-10 w-10 text-white/30" />
            <p className="text-sm">{searchTerm ? 'No artists match your search.' : 'Get started by adding your first artist.'}</p>
            {!searchTerm && (
              <Button
                onClick={() => {
                  setEditingArtist(null);
                  resetForm();
                  setShowAddModal(true);
                }}
                className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-4 py-2 text-sm text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Artist
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-full text-sm text-white/80">
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10">
                  <TableHead className="text-white/60">Artist</TableHead>
                  <TableHead className="text-white/60">Category</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  <TableHead className="text-right text-white/60">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArtists.map((artist) => (
                  <TableRow key={artist.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="py-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10">
                          {artist.profileImageUrl ? (
                            <img
                              src={artist.profileImageUrl}
                              alt={artist.name}
                              className="h-full w-full rounded-xl object-cover"
                            />
                          ) : (
                            <Users className="h-5 w-5 text-white/70" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-white">{artist.name}</p>
                          {artist.bio && (
                            <p className="text-xs text-white/60 line-clamp-2">{artist.bio}</p>
                          )}
                          {artist.knownFor && (
                            <p className="text-xs text-white/40">Known for: {artist.knownFor}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                        {getCategoryIcon(artist.category)}
                        <span>{artist.category}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#34d399]/15 px-3 py-1 text-xs font-medium text-[#34d399]">Active</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(artist)}
                          className="h-8 w-8 rounded-full border border-white/15 bg-white/5 p-0 text-white/80 hover:bg-white/10"
                          title="Edit Artist"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(artist.id!)}
                          className="h-8 w-8 rounded-full border border-[#fb7185]/30 bg-[#fb7185]/10 p-0 text-[#fb7185] hover:bg-[#fb7185]/20"
                          title="Delete Artist"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <footer className="border-t border-white/10 px-6 py-4 text-xs text-white/50">
          Showing {filteredArtists.length} artist{filteredArtists.length === 1 ? '' : 's'}
        </footer>
      </section>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10 bg-[#0f172a] text-white">
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
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-6"
                disabled={createArtistMutation.isPending || updateArtistMutation.isPending}
              >
                <Save className="mr-2" size={16} />
                {editingArtist ? 'Save Changes' : 'Create Artist'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
