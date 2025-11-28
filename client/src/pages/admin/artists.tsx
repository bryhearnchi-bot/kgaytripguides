import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EnhancedArtistsTable } from '@/components/admin/EnhancedArtistsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AdminBottomSheet } from '@/components/admin/AdminBottomSheet';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { api } from '@/lib/api-client';
import { Users, Plus, PlusSquare, Edit2, Trash2, Search, Music, Mic, Filter } from 'lucide-react';
import { NoImageFilterButton } from '@/components/admin/NoImageFilterButton';
import { useAdminQueryOptions } from '@/hooks/use-admin-prefetch';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import { StandardDropdown } from '@/components/ui/dropdowns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const queryClient = useQueryClient();
  const adminQueryOptions = useAdminQueryOptions();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNoImageFilter, setShowNoImageFilter] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Talent | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
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

  // Fetch all artists for filtering and pagination
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
      const response = await api.post('/api/talent', data, { requireAuth: true });
      if (!response.ok) throw new Error('Failed to create artist');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent'] });
      setShowAddModal(false);
      resetForm();
      toast.success('Success', {
        description: 'Artist created successfully',
      });
    },
    onError: error => {
      toast.error('Error', {
        description: 'Failed to create artist',
      });
    },
  });

  // Update artist mutation
  const updateArtistMutation = useMutation({
    mutationFn: async (data: Talent) => {
      const response = await api.put(`/api/talent/${data.id}`, data, { requireAuth: true });
      if (!response.ok) throw new Error('Failed to update artist');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent'] });
      setShowAddModal(false);
      setEditingArtist(null);
      resetForm();
      toast.success('Success', {
        description: 'Artist updated successfully',
      });
    },
    onError: error => {
      toast.error('Error', {
        description: 'Failed to update artist',
      });
    },
  });

  // Delete artist mutation
  const deleteArtistMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/api/talent/${id}`, { requireAuth: true });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete artist');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent'] });
      toast.success('Success', {
        description: 'Artist deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast.error('Error', {
        description: error.message.includes('Cannot delete')
          ? 'This artist is assigned to events and cannot be deleted'
          : 'Failed to delete artist',
      });
    },
  });

  // Create talent category handler for StandardDropdown
  const handleCreateCategory = async (name: string): Promise<{ value: string; label: string }> => {
    try {
      const response = await api.post(
        '/api/talent-categories',
        { category: name.trim() },
        { requireAuth: true }
      );
      if (!response.ok) throw new Error('Failed to create talent category');
      const newCategory = await response.json();
      queryClient.invalidateQueries({ queryKey: ['talent-categories'] });
      setFormData(prev => ({ ...prev, talentCategoryId: newCategory.id }));
      toast.success('Success', {
        description: 'Talent category created successfully',
      });
      return { value: newCategory.id.toString(), label: newCategory.category };
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to create talent category',
      });
      throw error;
    }
  };

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
      toast.error('Error', {
        description: 'Artist name is required',
      });
      return;
    }

    if (!formData.talentCategoryId || formData.talentCategoryId === 0) {
      toast.error('Error', {
        description: 'Please select a talent category',
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

  const filteredArtists = artists.filter(artist => {
    // Search filter
    const matchesSearch =
      artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artist.category?.toLowerCase().includes(searchTerm.toLowerCase());

    // Category filter
    const matchesCategory =
      selectedCategory === null || artist.talentCategoryId === selectedCategory;

    // No image filter
    const matchesImageFilter =
      !showNoImageFilter || !artist.profileImageUrl || artist.profileImageUrl === '';

    return matchesSearch && matchesCategory && matchesImageFilter;
  });

  // Reset to page 1 when search term changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Reset to page 1 when category filter changes
  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  // Get display name for current view
  const getViewDisplayName = () => {
    if (selectedCategory === null) {
      return 'All Artists';
    }
    const category = talentCategories.find(c => c.id === selectedCategory);
    return category ? category.category : 'All Artists';
  };

  // Build category filters with counts
  const categoryFilters = [
    {
      label: 'All',
      value: null,
      count: artists.length,
    },
    ...talentCategories.map(category => ({
      label: category.category,
      value: category.id,
      count: artists.filter(artist => artist.talentCategoryId === category.id).length,
    })),
  ];

  // Pagination logic
  const totalPages = Math.ceil(filteredArtists.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedArtists = filteredArtists.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    <div className="space-y-4">
      {/* Header Section - Sticky with Safari fix */}
      <div className="sticky top-16 z-20 pb-[0.85rem] space-y-4">
        <div className="flex items-center justify-between px-1">
          <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold text-white">
            <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            Artists & Talent
          </h1>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
              className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/15"
              aria-label="Search artists"
            >
              <Search className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/15"
                  aria-label="Filter artists"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-white/10"
                style={{
                  backgroundColor: 'rgba(0, 33, 71, 1)',
                  backgroundImage:
                    'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
                }}
              >
                {categoryFilters
                  .filter(filter => typeof filter.count === 'number' && filter.count > 0)
                  .map(filter => {
                    const isActive = selectedCategory === filter.value;
                    return (
                      <DropdownMenuItem
                        key={filter.value ?? 'all'}
                        onClick={() => handleCategoryChange(filter.value)}
                        className={`text-white hover:bg-white/10 focus:bg-white/10 transition-colors ${
                          isActive ? 'bg-white/20 font-medium' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between w-full gap-3">
                          <span>{filter.label}</span>
                          <span className="text-xs text-white/60">{filter.count}</span>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingArtist(null);
                resetForm();
                setShowAddModal(true);
              }}
              className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/15"
              aria-label="Add new artist"
              title="Add New Artist"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="relative px-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              value={searchTerm}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search artists by name or category"
              className="h-11 rounded-full border-white/5 bg-white/10 pl-10 text-sm text-white placeholder:text-white/50 focus-visible:border-white/20 focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0 focus:border-white/20 focus:ring-1 focus:ring-white/10 focus:ring-offset-0 transition-all"
              autoFocus
            />
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 px-1">
          <NoImageFilterButton
            items={artists}
            imageField="profileImageUrl"
            isActive={showNoImageFilter}
            onToggle={active => {
              setShowNoImageFilter(active);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Subheader - Non-sticky, scrolls with content */}
      <div className="px-1">
        <h2 className="text-lg font-semibold text-white">{getViewDisplayName()}</h2>
      </div>

      <section className="relative sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/5 sm:shadow-2xl sm:shadow-black/40 sm:backdrop-blur">
        <header className="hidden sm:flex flex-col gap-2 border-b border-white/10 px-3 sm:pl-6 sm:pr-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{getViewDisplayName()}</h2>
          </div>
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
            data={paginatedArtists}
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
                render: (_value, artist) => (
                  <div className="flex flex-col gap-1.5">
                    <p className="font-bold text-sm text-white">{artist.name}</p>
                    {artist.category && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-white/70 w-fit">
                        {getCategoryIcon(artist.category)}
                        <span>{artist.category}</span>
                      </span>
                    )}
                  </div>
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
          <footer className="border-t border-white/10 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-white/50">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredArtists.length)} of{' '}
                {filteredArtists.length} artists
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 px-3 rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNumber}
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePageChange(pageNumber)}
                          className={`h-8 w-8 rounded-full ${
                            currentPage === pageNumber
                              ? 'bg-white/15 text-white'
                              : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 px-3 rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </footer>
        )}
      </section>

      {/* Add/Edit Bottom Sheet */}
      <AdminBottomSheet
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
        contentClassName="space-y-4"
        maxHeight="85vh"
        sidePanel={true}
        sidePanelWidth="500px"
      >
        {/* Basic Info Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="name">Artist Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter artist name"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="category">Category *</Label>
            <StandardDropdown
              variant="single-search-add"
              placeholder="Select category..."
              searchPlaceholder="Search categories..."
              emptyMessage="No categories found"
              addLabel="Add New Category"
              options={talentCategories.map(cat => ({
                value: cat.id.toString(),
                label: cat.category,
              }))}
              value={formData.talentCategoryId?.toString() || ''}
              onChange={value => setFormData({ ...formData, talentCategoryId: Number(value) })}
              onCreateNew={handleCreateCategory}
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="knownFor">Known For</Label>
          <Input
            id="knownFor"
            value={formData.knownFor || ''}
            onChange={e => setFormData({ ...formData, knownFor: e.target.value })}
            placeholder="e.g., RuPaul's Drag Race, Comedy Central"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="bio">Biography</Label>
          <Textarea
            id="bio"
            value={formData.bio || ''}
            onChange={e => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            placeholder="Artist biography and background..."
          />
        </div>

        {/* Social Links Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
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
          <div className="space-y-1">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website || ''}
              onChange={e => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="space-y-1">
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
      </AdminBottomSheet>
    </div>
  );
}
