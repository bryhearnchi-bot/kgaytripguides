import React, { useState, useEffect } from 'react';
import {
  User,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  Users,
  MoreVertical,
  Pencil,
  Music,
  Mic,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { useTalentNavigation } from '@/contexts/TalentNavigationContext';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { AdminBottomSheet } from '@/components/admin/AdminBottomSheet';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { StandardDropdown } from '@/components/ui/dropdowns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface TalentWithEvents {
  id: number;
  name: string;
  talentCategoryId: number;
  talentCategoryName?: string;
  bio?: string;
  knownFor?: string;
  profileImageUrl?: string;
  socialLinks?: Record<string, string>;
  website?: string;
  assignedEvents: Array<{
    id: number;
    title: string;
    date: string;
    dayNumber?: number;
  }>;
  isUnassigned: boolean;
}

interface TalentCategory {
  id: number;
  category: string;
}

interface TalentFormData {
  name: string;
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

export function TalentTabPage() {
  const { state, setTripTalent, removeTalentFromTrip } = useTripWizard();
  const {
    showAddTalentModal,
    setShowAddTalentModal,
    filteredTalent: contextFilteredTalent,
    setSelectedCategoryFilter,
  } = useTalentNavigation();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTalent, setEditingTalent] = useState<TalentWithEvents | null>(null);
  const [removingTalentId, setRemovingTalentId] = useState<number | null>(null);
  const [talentToRemove, setTalentToRemove] = useState<TalentWithEvents | null>(null);
  const [selectedTalentId, setSelectedTalentId] = useState<number | null>(null);
  const [talent, setTalent] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingTalent, setLoadingTalent] = useState(true);
  const [formData, setFormData] = useState<TalentFormData>({
    name: '',
    talentCategoryId: 0,
  });
  // Track which dropdown is open (by talent id) to use controlled state

  const tripId = state.tripData.id || 0;
  const tripType = state.tripType || (state.tripData.tripTypeId === 1 ? 'cruise' : 'resort');
  // Ensure tripTalent and events are always arrays
  const tripTalent = Array.isArray(state.tripTalent) ? state.tripTalent : [];
  const events = Array.isArray(state.events) ? state.events : [];

  // Fetch talent categories
  const { data: talentCategories = [] } = useQuery<TalentCategory[]>({
    queryKey: ['talent-categories'],
    queryFn: async () => {
      const response = await api.get('/api/talent-categories');
      if (!response.ok) throw new Error('Failed to fetch talent categories');
      return response.json();
    },
  });

  // Create artist mutation
  const createArtistMutation = useMutation({
    mutationFn: async (data: TalentFormData) => {
      const response = await api.post('/api/talent', data);
      if (!response.ok) throw new Error('Failed to create artist');
      return response.json();
    },
    onSuccess: async newArtist => {
      queryClient.invalidateQueries({ queryKey: ['talent'] });
      // Add to trip
      await handleAddTalent(newArtist.id);
      setShowCreateModal(false);
      setShowAddTalentModal(false);
      resetForm();
      toast.success('Success', {
        description: 'Artist created and added to trip',
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
    mutationFn: async (data: TalentFormData & { id: number }) => {
      const response = await api.put(`/api/talent/${data.id}`, data);
      if (!response.ok) throw new Error('Failed to update artist');
      return response.json();
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['talent'] });
      await fetchTripTalent();
      setShowEditModal(false);
      setEditingTalent(null);
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

  // Create talent category handler for StandardDropdown
  const handleCreateCategory = async (name: string): Promise<{ value: string; label: string }> => {
    try {
      const response = await api.post('/api/talent-categories', { category: name.trim() });
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
      talentCategoryId: 0,
    });
  };

  // Build talent with event assignments
  const talentWithEvents: TalentWithEvents[] = tripTalent.map((talent: any) => {
    const assignedEvents = events
      .filter(event => event.talentIds && event.talentIds.includes(talent.id))
      .map(event => ({
        id: event.id || 0,
        title: event.title,
        date: event.date,
      }));

    return {
      ...talent,
      assignedEvents,
      isUnassigned: assignedEvents.length === 0,
    };
  });

  // Fetch trip talent on mount
  useEffect(() => {
    if (tripId) {
      fetchTripTalent();
    }
  }, [tripId]);

  // Fetch all talent for dropdown
  useEffect(() => {
    fetchAllTalent();
  }, []);

  const fetchAllTalent = async () => {
    try {
      setLoadingTalent(true);
      const response = await api.get('/api/admin/talent');
      const data = await response.json();
      setTalent(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to load talent',
      });
    } finally {
      setLoadingTalent(false);
    }
  };

  const handleCreateTalent = async (name: string) => {
    try {
      const response = await api.post('/api/admin/talent', {
        name: name.trim(),
        talentCategoryId: formData.talentCategoryId || 1,
      });
      if (response.ok) {
        const newTalent = await response.json();
        setTalent(prev => [...prev, newTalent]);
        return { value: newTalent.id.toString(), label: newTalent.name };
      }
      throw new Error('Failed to create talent');
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to create talent',
      });
      throw error;
    }
  };

  const fetchTripTalent = async () => {
    try {
      const response = await api.get(`/api/admin/trips/${tripId}/talent`);
      const data = await response.json();
      setTripTalent(data);
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to load talent',
      });
    }
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

    if (editingTalent) {
      updateArtistMutation.mutate({ ...formData, id: editingTalent.id });
    } else {
      createArtistMutation.mutate(formData);
    }
  };

  const handleEditTalent = (talent: TalentWithEvents) => {
    setEditingTalent(talent);
    setFormData({
      name: talent.name,
      talentCategoryId: talent.talentCategoryId,
      bio: talent.bio,
      knownFor: talent.knownFor,
      profileImageUrl: talent.profileImageUrl,
      socialLinks: talent.socialLinks,
      website: talent.website,
    });
    setShowEditModal(true);
  };

  const handleAddTalent = async (talentId: number) => {
    try {
      const response = await api.post(`/api/admin/trips/${tripId}/talent`, {
        talentIds: [talentId],
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add talent');
      }

      // Fetch updated talent list to refresh UI
      await fetchTripTalent();

      // Auto-filter to the added talent's category
      const addedTalent = tripTalent.find(t => t.id === talentId);
      if (addedTalent?.talentCategoryName) {
        setSelectedCategoryFilter(addedTalent.talentCategoryName);
      }

      toast.success('Success', {
        description: 'Talent added to trip',
      });

      setSelectedTalentId(null);
      setShowAddTalentModal(false);
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to add talent to trip',
      });
    }
  };

  const handleRemoveTalent = (talent: TalentWithEvents) => {
    if (talent.assignedEvents.length > 0) {
      // Show warning modal
      setTalentToRemove(talent);
    } else {
      // Direct removal
      confirmRemoveTalent(talent.id);
    }
  };

  const confirmRemoveTalent = async (talentId: number) => {
    try {
      setRemovingTalentId(talentId);
      const response = await api.delete(`/api/admin/trips/${tripId}/talent/${talentId}`);

      if (!response.ok) {
        throw new Error('Failed to remove talent from trip');
      }

      // Update local state
      await removeTalentFromTrip(talentId);

      // Refresh talent list from server to ensure state is in sync
      await fetchTripTalent();

      toast.success('Success', {
        description: 'Talent removed from trip',
      });

      setTalentToRemove(null);
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to remove talent from trip',
      });
    } finally {
      setRemovingTalentId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(`${dateStr.split('T')[0]}T00:00:00`);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Get icon for talent category
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'dj':
      case 'djs':
        return <Music size={12} />;
      case 'drag':
      case 'comedy':
      case 'comedian':
        return <Mic size={12} />;
      default:
        return <Users size={12} />;
    }
  };

  // Get filtered talent IDs from context and filter talentWithEvents accordingly
  const filteredTalentIds = new Set(contextFilteredTalent.map(t => t.id));
  const filteredTalent = talentWithEvents
    .filter(t => filteredTalentIds.has(t.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-3 max-w-3xl mx-auto pt-3">
      {/* Talent Cards */}
      {talentWithEvents.length === 0 ? (
        <div className="p-8 rounded-[10px] bg-white/[0.02] border-2 border-white/10 text-center">
          <User className="w-12 h-12 mx-auto mb-3 text-white/30" />
          <p className="text-sm text-white/70 mb-1">No talent added yet</p>
          <p className="text-xs text-white/50">Click the + button to add performers to this trip</p>
        </div>
      ) : filteredTalent.length === 0 ? (
        <div className="p-8 rounded-[10px] bg-white/[0.02] border-2 border-white/10 text-center">
          <User className="w-12 h-12 mx-auto mb-3 text-white/30" />
          <p className="text-sm text-white/70">No talent in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTalent.map(talent => (
            <div
              key={talent.id}
              className="p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] hover:border-cyan-400/40 transition-all"
            >
              <div className="flex items-start gap-3 pr-10 relative">
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10">
                    {talent.profileImageUrl ? (
                      <img
                        src={talent.profileImageUrl}
                        alt={talent.name}
                        className="h-full w-full rounded-xl object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <User className="h-7 w-7 text-white/70" />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Name and Category Badge Row */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-semibold text-white">{talent.name}</h3>
                    {/* Talent Category Badge */}
                    {talent.talentCategoryName && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-[10px] font-medium text-cyan-400">
                        {getCategoryIcon(talent.talentCategoryName)}
                        <span>{talent.talentCategoryName}</span>
                      </span>
                    )}
                  </div>

                  {/* Assignment Status */}
                  {talent.isUnassigned ? (
                    <div className="mt-2">
                      <span className="px-2 py-1 text-[10px] bg-orange-500/20 text-orange-400 border border-orange-400/30 rounded font-medium">
                        Not assigned to events yet
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wide">
                        Performing At:
                      </p>
                      <div className="space-y-0.5">
                        {talent.assignedEvents.map(event => (
                          <div
                            key={event.id}
                            className="flex items-center gap-2 text-[11px] text-white/60"
                          >
                            <Calendar className="w-3 h-3" />
                            <span>
                              {event.title} - {formatDate(event.date)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Three-dot Menu - Positioned absolutely to the right */}
                <div className="absolute right-3 top-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 rounded-full text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
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
                      <DropdownMenuItem
                        onClick={() => handleEditTalent(talent)}
                        className="text-white/70 hover:text-cyan-400 hover:bg-white/5 cursor-pointer"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRemoveTalent(talent)}
                        disabled={removingTalentId === talent.id}
                        className="text-white/70 hover:text-red-400 hover:bg-white/5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Notice */}
      <div className="mt-4 p-3 rounded-lg bg-cyan-400/5 border border-cyan-400/20">
        <p className="text-[11px] text-white/70 leading-relaxed">
          <span className="font-semibold text-cyan-400">Note:</span> Talent added here can be
          assigned to events in the Events tab. Removing talent from the trip will also remove them
          from all events.
        </p>
      </div>

      {/* Add Talent Modal - Select from existing */}
      <AdminBottomSheet
        isOpen={showAddTalentModal}
        onOpenChange={setShowAddTalentModal}
        title="Add Talent to Trip"
        description="Select talent from the global pool or create a new artist"
        icon={<User className="w-5 h-5 text-cyan-400" />}
        primaryAction={{
          label: 'Done',
          onClick: () => setShowAddTalentModal(false),
        }}
        maxWidthClassName="max-w-md"
      >
        <div className="space-y-4">
          <StandardDropdown
            variant="single-search-add"
            label="Talent"
            placeholder="Select talent..."
            searchPlaceholder="Search talent..."
            emptyMessage="No talent found"
            addLabel="Add New Talent"
            options={talent.map(t => ({
              value: t.id.toString(),
              label: t.name,
            }))}
            value={selectedTalentId?.toString() || ''}
            onChange={value => {
              if (value) {
                const talentId = Number(value);
                setSelectedTalentId(talentId);
                handleAddTalent(talentId);
              }
            }}
            onCreateNew={handleCreateTalent}
            disabled={loadingTalent}
          />

          <div className="pt-2 border-t border-white/10">
            <Button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="w-full h-10 bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Artist
            </Button>
          </div>
        </div>
      </AdminBottomSheet>

      {/* Create New Artist Modal */}
      <AdminBottomSheet
        isOpen={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Add New Artist"
        icon={<Users className="h-5 w-5" />}
        description="Create a new artist and add to this trip"
        onSubmit={handleSubmit}
        primaryAction={{
          label: 'Create Artist',
          loading: createArtistMutation.isPending,
          loadingLabel: 'Creating...',
        }}
        maxWidthClassName="max-w-3xl"
        contentClassName="grid grid-cols-1 lg:grid-cols-2 gap-5"
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
          <StandardDropdown
            variant="single-search-add"
            placeholder="Select talent category..."
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
            disabled={createArtistMutation.isPending}
          />
        </div>
      </AdminBottomSheet>

      {/* Edit Artist Modal */}
      {showEditModal && (
        <AdminBottomSheet
          isOpen={showEditModal}
          onOpenChange={setShowEditModal}
          title="Edit Artist"
          icon={<Pencil className="h-5 w-5" />}
          description="Update artist information"
          onSubmit={handleSubmit}
          primaryAction={{
            label: 'Update Artist',
            loading: updateArtistMutation.isPending,
            loadingLabel: 'Updating...',
          }}
          fullScreen={true}
          contentClassName="grid grid-cols-1 lg:grid-cols-2 gap-5"
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
            <StandardDropdown
              variant="single-search-add"
              placeholder="Select talent category..."
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
              disabled={updateArtistMutation.isPending}
            />
          </div>
        </AdminBottomSheet>
      )}

      {/* Remove Talent Warning Modal */}
      {talentToRemove && (
        <Dialog open={!!talentToRemove} onOpenChange={() => setTalentToRemove(null)}>
          <DialogContent
            className="admin-form-modal sm:max-w-md border-white/10 rounded-[20px] text-white"
            style={{
              backgroundColor: 'rgba(0, 33, 71, 1)',
              backgroundImage:
                'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                Remove Talent from Trip?
              </DialogTitle>
              <DialogDescription className="text-white/70">
                This will remove {talentToRemove.name} from {talentToRemove.assignedEvents.length}{' '}
                event(s):
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-2">
              {talentToRemove.assignedEvents.map(event => (
                <div
                  key={event.id}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded text-xs text-white/70"
                >
                  • {event.title} - {formatDate(event.date)}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTalentToRemove(null)}
                className="h-9 px-4 bg-white/4 border-[1.5px] border-white/10 text-white/90 hover:bg-white/10 hover:text-white transition-all"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => confirmRemoveTalent(talentToRemove.id)}
                disabled={removingTalentId === talentToRemove.id}
                className="h-9 px-4 bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
              >
                {removingTalentId === talentToRemove.id ? 'Removing...' : 'Remove Talent'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
