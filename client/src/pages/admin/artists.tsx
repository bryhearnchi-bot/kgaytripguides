import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EnhancedArtistsTable } from '@/components/admin/EnhancedArtistsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AdminFormModal } from '@/components/admin/AdminFormModal';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { api } from '@/lib/api-client';
import { Users, Plus, PlusSquare, Edit2, Trash2, Search, Music, Mic } from 'lucide-react';
import { useAdminQueryOptions } from '@/hooks/use-admin-prefetch';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import SingleSelectWithCreate from '@/components/admin/SingleSelectWithCreate';

interface TalentCategory {
  id: number;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Talent {
  id?: number;
  name: string;
  category?: string;
  talentCategoryId: number;
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
  const adminQueryOptions = useAdminQueryOptions();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Talent | null>(null);
  const [formData, setFormData] = useState<Talent>({
    name: '',
    talentCategoryId: 0, // No default selection
  });

  // Fetch talent categories
  const { data: talentCategories = [] } = useQuery<TalentCategory[]>({
    queryKey: ['talent-categories'],
    queryFn: async () => {
      const response = await api.get('/api/talent-categories');
      if (!response.ok) throw new Error('Failed to fetch talent categories');
      return response.json();
    },
    ...adminQueryOptions,
    placeholderData: [],
  });

  // Fetch artists with optimized caching
  const {
    data: artists = [],
    isLoading,
    isPlaceholderData,
  } = useQuery<Talent[]>({
    queryKey: ['talent'],
    queryFn: async () => {
      const response = await api.get('/api/talent');
      if (!response.ok) throw new Error('Failed to fetch artists');
      return response.json();
    },
    ...adminQueryOptions,
    placeholderData: [],
  });

  // Create artist mutation
  const createArtistMutation = useMutation({
    mutationFn: async (data: Talent) => {
      const response = await api.post('/api/talent', data);
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
    onError: error => {
      toast({
        title: 'Error',
        description: 'Failed to create artist',
        variant: 'destructive',
      });
    },
  });

  // Update artist mutation
  const updateArtistMutation = useMutation({
    mutationFn: async (data: Talent) => {
      const response = await api.put(`/api/talent/${data.id}`, data);
      if (!response.ok) throw new Error('Failed to update artist');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent'] });
      setShowAddModal(false);
      setEditingArtist(null);
      resetForm();
      toast({
        title: 'Success',
        description: 'Artist updated successfully',
      });
    },
    onError: error => {
      toast({
        title: 'Error',
        description: 'Failed to update artist',
        variant: 'destructive',
      });
    },
  });

  // Delete artist mutation
  const deleteArtistMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/api/talent/${id}`);
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
    },
  });

  // Create talent category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryName: string) => {
      const response = await api.post('/api/talent-categories', { category: categoryName });
      if (!response.ok) throw new Error('Failed to create talent category');
      return response.json();
    },
    onSuccess: newCategory => {
      queryClient.invalidateQueries({ queryKey: ['talent-categories'] });
      // Update form data to use the new category
      setFormData(prev => ({ ...prev, talentCategoryId: newCategory.id }));
      toast({
        title: 'Success',
        description: 'Talent category created successfully',
      });
    },
    onError: error => {
      toast({
        title: 'Error',
        description: 'Failed to create talent category',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      talentCategoryId: 0, // No default selection
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Artist name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.talentCategoryId || formData.talentCategoryId === 0) {
      toast({
        title: 'Error',
        description: 'Please select a talent category',
        variant: 'destructive',
      });
      return;
    }

    if (editingArtist) {
      updateArtistMutation.mutate({ ...formData, id: editingArtist.id });
    } else {
      createArtistMutation.mutate(formData);
    }
  };

  const handleModalOpenChange = (open: boolean) => {
    setShowAddModal(open);
    if (!open) {
      setEditingArtist(null);
      resetForm();
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

  const filteredArtists = artists.filter(
    artist =>
      artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artist.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'dj':
      case 'djs':
        return <Music size={16} />;
      case 'drag':
      case 'comedy':
      case 'comedian':
        return <Mic size={16} />;
      default:
        return <Users size={16} />;
    }
  };

  // Show skeleton while loading initial data
  if (isLoading && artists.length === 0) {
    return <AdminTableSkeleton rows={5} />;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
              <Users className="h-6 w-6" />
              Artists & Talent Management
            </h1>
            <p className="text-sm text-white/60">
              Manage entertainment roster across Atlantis sailings.
            </p>
          </div>
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search artists by name or category"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-11 rounded-full border-white/10 bg-white/10 pl-10 text-sm text-white placeholder:text-white/50 focus:border-[#22d3ee]/70"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur">
        <header className="flex flex-col gap-2 border-b border-white/10 pl-6 pr-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">All Artists</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingArtist(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="h-4 w-4 rounded-xl border border-white/15 bg-blue-500/10 text-white/80 hover:bg-blue-500/15"
            title="Add New Artist"
          >
            <PlusSquare className="h-5 w-5 text-blue-400/80" />
          </Button>
        </header>

        {filteredArtists.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-white/60">
            <Users className="h-10 w-10 text-white/30" />
            <p className="text-sm">
              {searchTerm
                ? 'No artists match your search.'
                : 'Get started by adding your first artist.'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => {
                  setEditingArtist(null);
                  resetForm();
                  setShowAddModal(true);
                }}
                className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-4 py-2 text-sm text-white min-h-[44px] touch-manipulation"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Artist
              </Button>
            )}
          </div>
        ) : (
          <EnhancedArtistsTable
            data={filteredArtists}
            columns={[
              {
                key: 'image',
                label: '',
                priority: 'high',
                sortable: false,
                resizable: false,
                width: 80,
                minWidth: 80,
                maxWidth: 80,
                render: (_value, artist) => (
                  <div className="flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10">
                      {artist.profileImageUrl ? (
                        <img
                          src={artist.profileImageUrl}
                          alt={artist.name}
                          className="h-full w-full rounded-xl object-cover"
                        />
                      ) : (
                        <Users className="h-6 w-6 text-white/70" />
                      )}
                    </div>
                  </div>
                ),
              },
              {
                key: 'name',
                label: 'Artist',
                priority: 'high',
                sortable: true,
                minWidth: 200,
                render: value => <p className="font-bold text-xs text-white">{value}</p>,
              },
              {
                key: 'category',
                label: 'Category',
                priority: 'high',
                sortable: true,
                minWidth: 150,
                render: (value, artist) => (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                    {getCategoryIcon(artist.category)}
                    <span>{artist.category}</span>
                  </span>
                ),
              },
              {
                key: 'bio',
                label: 'Bio',
                priority: 'medium',
                sortable: false,
                minWidth: 250,
                render: value => (
                  <span className="text-white/70 line-clamp-2">{value || 'No bio'}</span>
                ),
              },
              {
                key: 'knownFor',
                label: 'Known For',
                priority: 'low',
                sortable: false,
                minWidth: 200,
                render: value => (
                  <span className="text-xs text-white/60">{value || 'Not specified'}</span>
                ),
              },
            ]}
            actions={[
              {
                label: 'Edit Artist',
                icon: <Edit2 className="h-4 w-4" />,
                onClick: handleEdit,
              },
              {
                label: 'Delete Artist',
                icon: <Trash2 className="h-4 w-4" />,
                onClick: artist => handleDelete(artist.id!),
                variant: 'destructive',
              },
            ]}
            keyField="id"
            isLoading={isLoading}
            emptyMessage={
              searchTerm
                ? 'No artists match your search.'
                : 'Get started by adding your first artist.'
            }
          />
        )}

        {filteredArtists.length > 0 && (
          <footer className="flex items-center justify-between border-t border-white/10 px-6 py-4">
            <div className="text-xs text-white/50">
              Showing {filteredArtists.length} of {artists.length} artists
            </div>
          </footer>
        )}
      </section>

      {/* Add/Edit Modal */}
      <AdminFormModal
        isOpen={showAddModal}
        onOpenChange={handleModalOpenChange}
        title={editingArtist ? 'Edit Artist' : 'Add New Artist'}
        icon={<Users className="h-5 w-5" />}
        description="Artist information and social details"
        onSubmit={handleSubmit}
        primaryAction={{
          label: editingArtist ? 'Save Changes' : 'Create Artist',
          loading: editingArtist ? updateArtistMutation.isPending : createArtistMutation.isPending,
          loadingLabel: editingArtist ? 'Saving...' : 'Creating...',
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => handleModalOpenChange(false),
        }}
        maxWidthClassName="max-w-3xl"
        contentClassName="grid grid-cols-1 lg:grid-cols-2 gap-5 max-h-[calc(85vh-180px)] overflow-y-scroll"
      >
        {/* Basic Information */}
        <div className="space-y-2">
          <Label htmlFor="name">Artist Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Enter artist name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <SingleSelectWithCreate
            options={talentCategories.map(cat => ({ id: cat.id, name: cat.category }))}
            value={formData.talentCategoryId}
            onValueChange={value => setFormData({ ...formData, talentCategoryId: Number(value) })}
            onCreateNew={createCategoryMutation.mutateAsync}
            placeholder="Select talent category..."
            searchPlaceholder="Search categories..."
            createLabel="Create new category"
          />
        </div>

        {/* Biography - spans full width */}
        <div className="lg:col-span-2 space-y-2">
          <Label htmlFor="bio">Biography</Label>
          <Textarea
            id="bio"
            value={formData.bio || ''}
            onChange={e => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            placeholder="Artist biography and background..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="knownFor">Known For</Label>
          <Input
            id="knownFor"
            value={formData.knownFor || ''}
            onChange={e => setFormData({ ...formData, knownFor: e.target.value })}
            placeholder="e.g., RuPaul's Drag Race, Comedy Central"
          />
        </div>

        {/* Social Links - use remaining space */}
        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram URL</Label>
          <Input
            id="instagram"
            value={formData.socialLinks?.instagram || ''}
            onChange={e =>
              setFormData({
                ...formData,
                socialLinks: { ...formData.socialLinks, instagram: e.target.value },
              })
            }
            placeholder="https://instagram.com/..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={formData.website || ''}
            onChange={e => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://..."
          />
        </div>

        {/* Profile Image - spans full width */}
        <div className="lg:col-span-2 space-y-2">
          <Label htmlFor="profileImage">Profile Image</Label>
          <ImageUploadField
            label="Profile Image"
            value={formData.profileImageUrl || ''}
            onChange={url => setFormData({ ...formData, profileImageUrl: url || '' })}
            imageType="talent"
            placeholder="No profile image uploaded"
            disabled={
              editingArtist ? updateArtistMutation.isPending : createArtistMutation.isPending
            }
          />
        </div>
      </AdminFormModal>
    </div>
  );
}
