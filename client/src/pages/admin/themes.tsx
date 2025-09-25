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
  Palette,
  Plus,
  Edit2,
  Trash2,
  Search,
  Save,
  Copy,
  Sparkles
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

  const filteredThemes = themes.filter(theme =>
    theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theme.longDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theme.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theme.costumeIdeas?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getThemeIcon = (theme: string) => {
    return <Sparkles className="h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Party Themes Management</h1>
            <p className="text-sm text-white/60">Manage reusable party themes across Atlantis sailings.</p>
          </div>
          <Button
            onClick={() => {
              setEditingTheme(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 hover:from-[#38e0f6] hover:to-[#3b82f6]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Theme
          </Button>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search themes by name or description"
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
              Popular
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
        <header className="flex flex-col gap-2 border-b border-white/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">All Themes ({filteredThemes.length})</h2>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Across all events</p>
          </div>
        </header>

        {filteredThemes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-white/60">
            <Palette className="h-10 w-10 text-white/30" />
            <p className="text-sm">{searchTerm ? 'No themes match your search.' : 'Get started by adding your first theme.'}</p>
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
          <div className="overflow-x-auto">
            <Table className="min-w-full text-sm text-white/80">
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10">
                  <TableHead className="text-white/60">Theme</TableHead>
                  <TableHead className="text-white/60">Category</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  <TableHead className="text-right text-white/60">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredThemes.map((theme) => (
                  <TableRow key={theme.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="py-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10">
                          {theme.imageUrl ? (
                            <img
                              src={theme.imageUrl}
                              alt={theme.name}
                              className="h-full w-full rounded-xl object-cover"
                            />
                          ) : (
                            <Palette className="h-5 w-5 text-white/70" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-white">{theme.name}</p>
                          {theme.shortDescription && (
                            <p className="text-xs text-white/60 line-clamp-2">{theme.shortDescription}</p>
                          )}
                          {theme.costumeIdeas && (
                            <p className="text-xs text-white/40">Ideas: {theme.costumeIdeas.slice(0, 50)}...</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                        {getThemeIcon(theme.name)}
                        <span>Party Theme</span>
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
                          onClick={() => handleEdit(theme)}
                          className="h-8 w-8 rounded-full border border-white/15 bg-white/5 p-0 text-white/80 hover:bg-white/10"
                          title="Edit Theme"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(theme.id!)}
                          className="h-8 w-8 rounded-full border border-[#fb7185]/30 bg-[#fb7185]/10 p-0 text-[#fb7185] hover:bg-[#fb7185]/20"
                          title="Delete Theme"
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
          Showing {filteredThemes.length} theme{filteredThemes.length === 1 ? '' : 's'}
        </footer>
      </section>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10 bg-[#0f172a] text-white">
          <DialogHeader>
            <DialogTitle>
              {editingTheme ? 'Edit Party Theme' : 'Add New Party Theme'}
            </DialogTitle>
            <DialogDescription>
              Enter the theme information below
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

              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={formData.imageUrl || ''}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="amazonShoppingListUrl">Shopping List URL</Label>
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
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-6"
                disabled={createThemeMutation.isPending || updateThemeMutation.isPending}
              >
                <Save className="mr-2" size={16} />
                {editingTheme ? 'Save Changes' : 'Create Theme'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}