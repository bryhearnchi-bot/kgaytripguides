import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EnhancedThemesTable } from '@/components/admin/EnhancedThemesTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AdminFormModal } from '@/components/admin/AdminFormModal';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api-client';
import { Palette, Plus, PlusSquare, Edit2, Trash2, Search, Sparkles } from 'lucide-react';
import { useAdminQueryOptions } from '@/hooks/use-admin-prefetch';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const adminQueryOptions = useAdminQueryOptions();
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

  // Fetch themes with optimized caching
  const {
    data: themes = [],
    isLoading,
    isPlaceholderData,
  } = useQuery<PartyTheme[]>({
    queryKey: ['party-themes'],
    queryFn: async () => {
      const response = await api.get('/api/party-themes');
      if (!response.ok) throw new Error('Failed to fetch themes');
      return response.json();
    },
    ...adminQueryOptions,
    placeholderData: [],
  });

  // Create theme mutation
  const createThemeMutation = useMutation({
    mutationFn: async (data: PartyTheme) => {
      const response = await api.post('/api/party-themes', data);
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
    onError: error => {
      toast({
        title: 'Error',
        description: 'Failed to create party theme',
        variant: 'destructive',
      });
    },
  });

  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: async (data: PartyTheme) => {
      const response = await api.put(`/api/party-themes/${data.id}`, data);
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
    onError: error => {
      toast({
        title: 'Error',
        description: 'Failed to update party theme',
        variant: 'destructive',
      });
    },
  });

  // Delete theme mutation
  const deleteThemeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/api/party-themes/${id}`);
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
    },
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

  const handleModalOpenChange = (open: boolean) => {
    setShowAddModal(open);
    if (!open) {
      setEditingTheme(null);
      resetForm();
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

  const filteredThemes = themes.filter(
    theme =>
      theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      theme.longDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      theme.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      theme.costumeIdeas?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getThemeIcon = (theme: string) => {
    return <Sparkles className="h-3.5 w-3.5" />;
  };

  // Show skeleton while loading initial data
  if (isLoading && themes.length === 0) {
    return <AdminTableSkeleton rows={5} />;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
              <Palette className="h-6 w-6" />
              Party Themes Management
            </h1>
            <p className="text-sm text-white/60">
              Manage reusable party themes across Atlantis sailings.
            </p>
          </div>
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search themes by name or description"
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
            <h2 className="text-lg font-semibold text-white">All Themes</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingTheme(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="h-4 w-4 rounded-xl border border-white/15 bg-blue-500/10 text-white/80 hover:bg-blue-500/15"
            title="Add New Theme"
          >
            <PlusSquare className="h-5 w-5 text-blue-400/80" />
          </Button>
        </header>

        {filteredThemes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-white/60">
            <Palette className="h-10 w-10 text-white/30" />
            <p className="text-sm">
              {searchTerm
                ? 'No themes match your search.'
                : 'Get started by adding your first theme.'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => {
                  setEditingTheme(null);
                  resetForm();
                  setShowAddModal(true);
                }}
                className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-4 py-2 text-sm text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Theme
              </Button>
            )}
          </div>
        ) : (
          <EnhancedThemesTable
            data={filteredThemes}
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
                render: (_value, theme) => (
                  <div className="flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10">
                      {theme.imageUrl ? (
                        <img
                          src={theme.imageUrl}
                          alt={theme.name}
                          className="h-full w-full rounded-xl object-cover"
                        />
                      ) : (
                        <Palette className="h-6 w-6 text-white/70" />
                      )}
                    </div>
                  </div>
                ),
              },
              {
                key: 'name',
                label: 'Theme',
                priority: 'high',
                sortable: true,
                minWidth: 200,
                render: value => <p className="font-bold text-xs text-white">{value}</p>,
              },
              {
                key: 'shortDescription',
                label: 'Description',
                priority: 'medium',
                sortable: false,
                minWidth: 250,
                render: value => (
                  <span className="text-white/70 line-clamp-2">{value || 'No description'}</span>
                ),
              },
              {
                key: 'costumeIdeas',
                label: 'Costume Ideas',
                priority: 'low',
                sortable: false,
                minWidth: 250,
                render: value => (
                  <span className="text-xs text-white/60 line-clamp-2">
                    {value || 'No ideas specified'}
                  </span>
                ),
              },
            ]}
            actions={[
              {
                label: 'Edit Theme',
                icon: <Edit2 className="h-4 w-4" />,
                onClick: handleEdit,
              },
              {
                label: 'Delete Theme',
                icon: <Trash2 className="h-4 w-4" />,
                onClick: theme => handleDelete(theme.id!),
                variant: 'destructive',
              },
            ]}
            keyField="id"
            isLoading={isLoading}
            emptyMessage={
              searchTerm
                ? 'No themes match your search.'
                : 'Get started by adding your first theme.'
            }
          />
        )}

        {filteredThemes.length > 0 && (
          <footer className="flex items-center justify-between border-t border-white/10 px-6 py-4">
            <div className="text-xs text-white/50">
              Showing {filteredThemes.length} of {themes.length} themes
            </div>
          </footer>
        )}
      </section>

      {/* Add/Edit Modal */}
      <AdminFormModal
        isOpen={showAddModal}
        onOpenChange={handleModalOpenChange}
        title={editingTheme ? 'Edit Party Theme' : 'Add New Party Theme'}
        icon={<Palette className="h-5 w-5" />}
        description="Party theme details and costume ideas"
        onSubmit={handleSubmit}
        primaryAction={{
          label: editingTheme ? 'Save Changes' : 'Create Theme',
          loading: editingTheme ? updateThemeMutation.isPending : createThemeMutation.isPending,
          loadingLabel: editingTheme ? 'Saving...' : 'Creating...',
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => handleModalOpenChange(false),
        }}
        maxWidthClassName="max-w-3xl"
        contentClassName="grid grid-cols-1 lg:grid-cols-2 gap-5 max-h-[calc(85vh-180px)] overflow-y-scroll"
      >
        {/* Theme Name - spans full width */}
        <div className="lg:col-span-2 space-y-2">
          <Label htmlFor="name">Theme Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., White Party, Glow Night"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shortDescription">Short Description</Label>
          <Input
            id="shortDescription"
            value={formData.shortDescription || ''}
            onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
            placeholder="Brief theme summary"
          />
        </div>

        {/* Theme Image - use remaining space */}
        <div className="space-y-2">
          <Label htmlFor="imageUrl">Theme Image</Label>
          <ImageUploadField
            label="Theme Image"
            value={formData.imageUrl || ''}
            onChange={url => setFormData({ ...formData, imageUrl: url || '' })}
            imageType="general"
            placeholder="No theme image uploaded"
            disabled={editingTheme ? updateThemeMutation.isPending : createThemeMutation.isPending}
          />
        </div>

        {/* Long Description - spans full width */}
        <div className="lg:col-span-2 space-y-2">
          <Label htmlFor="longDescription">Long Description</Label>
          <Textarea
            id="longDescription"
            value={formData.longDescription || ''}
            onChange={e => setFormData({ ...formData, longDescription: e.target.value })}
            placeholder="Detailed description of the party theme"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="costumeIdeas">Costume Ideas</Label>
          <Textarea
            id="costumeIdeas"
            value={formData.costumeIdeas || ''}
            onChange={e => setFormData({ ...formData, costumeIdeas: e.target.value })}
            placeholder="e.g., All white attire, UV reactive clothing, neon accessories"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amazonShoppingListUrl">Shopping List URL</Label>
          <Input
            id="amazonShoppingListUrl"
            type="url"
            value={formData.amazonShoppingListUrl || ''}
            onChange={e => setFormData({ ...formData, amazonShoppingListUrl: e.target.value })}
            placeholder="https://www.amazon.com/shop/..."
          />
        </div>
      </AdminFormModal>
    </div>
  );
}
