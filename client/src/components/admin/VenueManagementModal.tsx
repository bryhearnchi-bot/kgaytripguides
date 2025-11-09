import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { OceanInput } from '@/components/ui/ocean-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit2, Trash2, X, Check, Plus } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

interface Venue {
  id: number;
  name: string;
  venueTypeId: number;
  venueTypeName?: string;
  description?: string;
}

interface VenueType {
  id: number;
  name: string;
}

interface VenueManagementModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: number;
  propertyType: 'resort' | 'ship'; // resort or ship
  pendingMode?: boolean; // If true, work with pending venues in state instead of API
  initialPendingVenues?: Array<{ name: string; venueTypeId: number; description?: string }>;
  onPendingVenuesChange?: (
    venues: Array<{ name: string; venueTypeId: number; description?: string }>
  ) => void;
  onSuccess?: () => void;
}

export function VenueManagementModal({
  isOpen,
  onOpenChange,
  propertyId,
  propertyType,
  pendingMode = false,
  initialPendingVenues = [],
  onPendingVenuesChange,
  onSuccess,
}: VenueManagementModalProps) {
  const { toast } = useToast();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueTypes, setVenueTypes] = useState<VenueType[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', venueTypeId: '', description: '' });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newVenueForm, setNewVenueForm] = useState({ name: '', venueTypeId: '', description: '' });

  // Fetch venues and venue types
  useEffect(() => {
    if (isOpen) {
      if (pendingMode) {
        // In pending mode, load from initialPendingVenues
        const pendingVenuesWithIds = initialPendingVenues.map((v, idx) => ({
          id: -(idx + 1), // Negative IDs for pending venues
          name: v.name,
          venueTypeId: v.venueTypeId,
          description: v.description,
        }));
        setVenues(pendingVenuesWithIds);
      } else {
        // Normal mode, fetch from API
        fetchVenues();
      }
      fetchVenueTypes();
    }
  }, [isOpen, propertyId, pendingMode, initialPendingVenues]);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const endpoint = `/api/admin/${propertyType}s/${propertyId}/venues`;
      const response = await api.get(endpoint);
      if (response.ok) {
        const data = await response.json();
        setVenues(data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load venues',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVenueTypes = async () => {
    try {
      const response = await api.get('/api/venue-types');
      if (response.ok) {
        const data = await response.json();
        setVenueTypes(data);
      }
    } catch (error) {}
  };

  const handleEdit = (venue: Venue) => {
    setEditingId(venue.id);
    setEditForm({
      name: venue.name,
      venueTypeId: venue.venueTypeId.toString(),
      description: venue.description || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', venueTypeId: '', description: '' });
  };

  const handleSaveEdit = async (venueId: number) => {
    if (!editForm.name.trim() || !editForm.venueTypeId) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in name and type',
        variant: 'destructive',
      });
      return;
    }

    if (pendingMode) {
      // Update pending venue in local state
      const updatedVenues = venues.map(v =>
        v.id === venueId
          ? {
              ...v,
              name: editForm.name.trim(),
              venueTypeId: parseInt(editForm.venueTypeId),
              description: editForm.description.trim() || undefined,
            }
          : v
      );
      setVenues(updatedVenues);

      // Notify parent component
      if (onPendingVenuesChange) {
        onPendingVenuesChange(
          updatedVenues.map(v => ({
            name: v.name,
            venueTypeId: v.venueTypeId,
            description: v.description,
          }))
        );
      }

      setEditingId(null);
      toast({
        title: 'Success',
        description: 'Venue updated',
      });
      return;
    }

    try {
      const response = await api.put(
        `/api/admin/${propertyType}s/${propertyId}/venues/${venueId}`,
        {
          name: editForm.name.trim(),
          venueTypeId: parseInt(editForm.venueTypeId),
          description: editForm.description.trim() || null,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update venue');
      }

      toast({
        title: 'Success',
        description: 'Venue updated successfully',
      });

      setEditingId(null);
      fetchVenues();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update venue',
        variant: 'destructive',
      });
    }
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setNewVenueForm({ name: '', venueTypeId: '', description: '' });
  };

  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setNewVenueForm({ name: '', venueTypeId: '', description: '' });
  };

  const handleSaveNew = async () => {
    if (!newVenueForm.name.trim() || !newVenueForm.venueTypeId) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in name and type',
        variant: 'destructive',
      });
      return;
    }

    if (pendingMode) {
      // Add to pending venues in local state
      const newPendingVenue = {
        id: -(venues.length + 1), // Negative ID for pending venue
        name: newVenueForm.name.trim(),
        venueTypeId: parseInt(newVenueForm.venueTypeId),
        description: newVenueForm.description.trim() || undefined,
      };

      const updatedVenues = [...venues, newPendingVenue];
      setVenues(updatedVenues);

      // Notify parent component
      if (onPendingVenuesChange) {
        onPendingVenuesChange(
          updatedVenues.map(v => ({
            name: v.name,
            venueTypeId: v.venueTypeId,
            description: v.description,
          }))
        );
      }

      setIsAddingNew(false);
      setNewVenueForm({ name: '', venueTypeId: '', description: '' });
      toast({
        title: 'Success',
        description: 'Venue added (will be saved when you create the ship/resort)',
      });
      return;
    }

    try {
      // Create the new venue directly on the ship/resort
      const endpoint = `/api/admin/${propertyType}s/${propertyId}/venues`;
      const createResponse = await api.post(endpoint, {
        name: newVenueForm.name.trim(),
        venueTypeId: parseInt(newVenueForm.venueTypeId),
        description: newVenueForm.description.trim() || null,
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData?.error?.message || 'Failed to create venue');
      }

      toast({
        title: 'Success',
        description: 'Venue created successfully',
      });

      setIsAddingNew(false);
      setNewVenueForm({ name: '', venueTypeId: '', description: '' });
      fetchVenues();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create venue',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (venueId: number, venueName: string) => {
    if (!confirm(`Are you sure you want to delete "${venueName}"?`)) {
      return;
    }

    if (pendingMode) {
      // Remove from pending venues in local state
      const updatedVenues = venues.filter(v => v.id !== venueId);
      setVenues(updatedVenues);

      // Notify parent component
      if (onPendingVenuesChange) {
        onPendingVenuesChange(
          updatedVenues.map(v => ({
            name: v.name,
            venueTypeId: v.venueTypeId,
            description: v.description,
          }))
        );
      }

      toast({
        title: 'Success',
        description: 'Venue removed',
      });
      return;
    }

    try {
      // Delete the venue directly
      const endpoint = `/api/admin/${propertyType}s/${propertyId}/venues/${venueId}`;
      const response = await api.delete(endpoint);

      if (!response.ok) {
        throw new Error('Failed to delete venue');
      }

      toast({
        title: 'Success',
        description: 'Venue deleted successfully',
      });

      fetchVenues();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete venue',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="admin-form-modal sm:max-w-3xl border-white/10 bg-gradient-to-b from-[#10192f] to-[#0f1629] rounded-[20px] text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white">Manage Venues</DialogTitle>
            <Button
              type="button"
              size="sm"
              onClick={handleAddNew}
              disabled={isAddingNew}
              className="h-8 px-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-all"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Venue
            </Button>
          </div>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="text-center py-8 text-white/60">Loading venues...</div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_2fr_80px] gap-3 pb-2 border-b border-white/10">
                <div className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Venue Name
                </div>
                <div className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Venue Type
                </div>
                <div className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Description
                </div>
                <div className="text-xs font-semibold text-white/70 uppercase tracking-wider text-right">
                  Actions
                </div>
              </div>

              {/* Add New Venue Row */}
              {isAddingNew && (
                <div className="grid grid-cols-[1fr_1fr_2fr_80px] gap-3 items-start py-2 border-b border-white/5 bg-cyan-400/5">
                  <OceanInput
                    value={newVenueForm.name}
                    onChange={e => setNewVenueForm({ ...newVenueForm, name: e.target.value })}
                    placeholder="New venue name"
                    className="h-9"
                    autoFocus
                  />
                  <Select
                    value={newVenueForm.venueTypeId}
                    onValueChange={value =>
                      setNewVenueForm({ ...newVenueForm, venueTypeId: value })
                    }
                  >
                    <SelectTrigger className="h-9 bg-white/[0.04] border-white/10 text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/5 border-white/10 text-white">
                      {venueTypes.map(type => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <textarea
                    value={newVenueForm.description}
                    onChange={e =>
                      setNewVenueForm({ ...newVenueForm, description: e.target.value })
                    }
                    placeholder="Description (optional)"
                    className="min-h-[36px] max-h-[72px] px-3 py-2 bg-white/[0.04] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-y"
                    rows={1}
                  />
                  <div className="flex items-start justify-end gap-1 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveNew}
                      className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelAdd}
                      className="h-7 w-7 p-0 text-white/60 hover:text-white/90 hover:bg-white/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {venues.map(venue => (
                <div
                  key={venue.id}
                  className="grid grid-cols-[1fr_1fr_2fr_80px] gap-3 items-start py-2 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  {editingId === venue.id ? (
                    <>
                      {/* Edit Mode */}
                      <OceanInput
                        value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Venue name"
                        className="h-9"
                      />
                      <Select
                        value={editForm.venueTypeId}
                        onValueChange={value => setEditForm({ ...editForm, venueTypeId: value })}
                      >
                        <SelectTrigger className="h-9 bg-white/[0.04] border-white/10 text-white">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white/5 border-white/10 text-white">
                          {venueTypes.map(type => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <textarea
                        value={editForm.description}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Description (optional)"
                        className="min-h-[36px] max-h-[72px] px-3 py-2 bg-white/[0.04] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-y"
                        rows={1}
                      />
                      <div className="flex items-start justify-end gap-1 pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSaveEdit(venue.id)}
                          className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="h-7 w-7 p-0 text-white/60 hover:text-white/90 hover:bg-white/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* View Mode */}
                      <div className="text-sm text-white pt-1">{venue.name}</div>
                      <div className="text-sm text-white/80 pt-1">{venue.venueTypeName}</div>
                      <div className="text-sm text-white/70 pt-1">{venue.description || '-'}</div>
                      <div className="flex items-start justify-end gap-1 pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(venue)}
                          className="h-7 w-7 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(venue.id, venue.name)}
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Empty state */}
              {venues.length === 0 && !isAddingNew && (
                <div className="text-center py-8 text-white/60 text-sm">
                  No venues added yet. Click "Add Venue" to get started.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-all"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
