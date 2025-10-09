import React, { useState, useEffect } from 'react';
import { User, Plus, Trash2, Calendar, AlertTriangle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';
import { AdminFormModal } from '@/components/admin/AdminFormModal';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import SingleSelectWithCreate from '@/components/admin/SingleSelectWithCreate';
import { TalentDropdown } from './TalentDropdown';
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
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [removingTalentId, setRemovingTalentId] = useState<number | null>(null);
  const [talentToRemove, setTalentToRemove] = useState<TalentWithEvents | null>(null);
  const [selectedTalentId, setSelectedTalentId] = useState<number | null>(null);
  const [formData, setFormData] = useState<TalentFormData>({
    name: '',
    talentCategoryId: 0,
  });

  const tripId = state.tripData.id || 0;
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
      setShowAddModal(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Artist created and added to trip',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create artist',
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
      setFormData(prev => ({ ...prev, talentCategoryId: newCategory.id }));
      toast({
        title: 'Success',
        description: 'Talent category created successfully',
      });
    },
    onError: () => {
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
      talentCategoryId: 0,
    });
  };

  // DEBUG: Log state
  console.log('🎭 TalentTabPage - State:', {
    tripId,
    'state.tripTalent': state.tripTalent,
    'state.tripTalent type': typeof state.tripTalent,
    'state.tripTalent isArray': Array.isArray(state.tripTalent),
    tripTalent,
    tripTalentLength: tripTalent.length,
    events,
    eventsLength: events.length,
  });

  // Build talent with event assignments
  const talentWithEvents: TalentWithEvents[] = tripTalent.map(talent => {
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

  const fetchTripTalent = async () => {
    try {
      const response = await api.get(`/api/admin/trips/${tripId}/talent`);
      const data = await response.json();
      setTripTalent(data);
    } catch (error) {
      console.error('Error fetching trip talent:', error);
      toast({
        title: 'Error',
        description: 'Failed to load talent',
        variant: 'destructive',
      });
    }
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

    createArtistMutation.mutate(formData);
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

      toast({
        title: 'Success',
        description: 'Talent added to trip',
      });

      setSelectedTalentId(null);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding talent:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add talent to trip',
        variant: 'destructive',
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

      toast({
        title: 'Success',
        description: 'Talent removed from trip',
      });

      setTalentToRemove(null);
    } catch (error) {
      console.error('Error removing talent:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove talent from trip',
        variant: 'destructive',
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

  return (
    <div className="space-y-2.5">
      {/* Add Talent Button */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-white/70">Manage all talent performing at this trip</p>
        <Button
          onClick={() => setShowAddModal(true)}
          className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Talent
        </Button>
      </div>

      {/* Talent List */}
      {talentWithEvents.length === 0 ? (
        <div className="p-8 rounded-[10px] bg-white/[0.02] border-2 border-white/10 text-center">
          <User className="w-12 h-12 mx-auto mb-3 text-white/30" />
          <p className="text-sm text-white/70 mb-1">No talent added yet</p>
          <p className="text-xs text-white/50">Click "Add Talent" to add performers to this trip</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {talentWithEvents.map(talent => (
            <div
              key={talent.id}
              className="p-4 rounded-[10px] bg-white/[0.02] border-2 border-white/10 hover:bg-white/[0.04] hover:border-cyan-400/40 transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10">
                    {talent.profileImageUrl ? (
                      <img
                        src={talent.profileImageUrl}
                        alt={talent.name}
                        className="h-full w-full rounded-xl object-cover"
                      />
                    ) : (
                      <Users className="h-7 w-7 text-white/70" />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Talent Name & Category */}
                  <h3 className="text-sm font-semibold text-white mb-1">{talent.name}</h3>
                  {talent.talentCategoryName && (
                    <p className="text-xs text-white/60 mb-2">{talent.talentCategoryName}</p>
                  )}

                  {/* Known For */}
                  {talent.knownFor && (
                    <p className="text-xs text-white/50 mb-2 line-clamp-1">{talent.knownFor}</p>
                  )}

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

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleRemoveTalent(talent)}
                    variant="outline"
                    size="sm"
                    disabled={removingTalentId === talent.id}
                    className="h-8 w-8 p-0 bg-white/4 border-white/10 hover:bg-red-500/20 hover:border-red-400/40 text-white/70 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
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
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="admin-form-modal sm:max-w-md border-white/10 bg-gradient-to-b from-[#10192f] to-[#0f1629] rounded-[20px] text-white overflow-visible">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Add Talent to Trip
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4 overflow-visible">
            <p className="text-xs text-white/70">
              Select talent from the global pool or create a new artist
            </p>

            <TalentDropdown
              tripId={tripId}
              value={selectedTalentId}
              onChange={talentId => {
                if (talentId) {
                  setSelectedTalentId(talentId);
                  handleAddTalent(talentId);
                }
              }}
              label="Talent"
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
        </DialogContent>
      </Dialog>

      {/* Create New Artist Modal */}
      <AdminFormModal
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
        secondaryAction={{
          label: 'Cancel',
          onClick: () => {
            setShowCreateModal(false);
            resetForm();
          },
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
            disabled={createArtistMutation.isPending}
          />
        </div>
      </AdminFormModal>

      {/* Remove Talent Warning Modal */}
      {talentToRemove && (
        <Dialog open={!!talentToRemove} onOpenChange={() => setTalentToRemove(null)}>
          <DialogContent className="admin-form-modal sm:max-w-md border-white/10 bg-gradient-to-b from-[#10192f] to-[#0f1629] rounded-[20px] text-white">
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
