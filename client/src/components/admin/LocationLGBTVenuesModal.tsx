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
import { Edit2, Trash2, Plus } from 'lucide-react';
import { EnhancedLocationsTable } from '@/components/admin/EnhancedLocationsTable';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

interface LGBTVenue {
  id: number;
  locationId: number;
  name: string;
  venueType?: string;
  description?: string;
  address?: string;
  imageUrl?: string;
  websiteUrl?: string;
  orderIndex: number;
}

interface LocationLGBTVenuesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: number;
  locationName?: string;
  onSuccess?: () => void;
}

const VENUE_TYPES = [
  'Bar',
  'Club',
  'Restaurant',
  'Hotel',
  'Beach',
  'Cafe',
  'Theater',
  'Spa',
  'Gym',
];

export function LocationLGBTVenuesModal({
  isOpen,
  onOpenChange,
  locationId,
  locationName,
  onSuccess,
}: LocationLGBTVenuesModalProps) {
  const [venues, setVenues] = useState<LGBTVenue[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    venueType: '',
    description: '',
    address: '',
    imageUrl: '',
    websiteUrl: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchVenues();
    }
  }, [isOpen, locationId]);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/locations/${locationId}/lgbt-venues`);
      if (response.ok) {
        const data = await response.json();
        setVenues(data);
      }
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to load LGBT venues',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (venue: LGBTVenue) => {
    setEditingId(venue.id);
    setFormData({
      name: venue.name,
      venueType: venue.venueType || '',
      description: venue.description || '',
      address: venue.address || '',
      imageUrl: venue.imageUrl || '',
      websiteUrl: venue.websiteUrl || '',
    });
    setIsAddingNew(false);
  };

  const handleDelete = async (venue: LGBTVenue) => {
    if (!confirm(`Are you sure you want to delete "${venue.name}"?`)) {
      return;
    }

    try {
      const response = await api.delete(`/api/locations/${locationId}/lgbt-venues/${venue.id}`, {
        requireAuth: true,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || error.error || 'Failed to delete LGBT venue');
      }

      toast.success('Success', {
        description: 'LGBT venue deleted successfully',
      });

      fetchVenues();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to delete LGBT venue',
      });
    }
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingId(null);
    setFormData({
      name: '',
      venueType: '',
      description: '',
      address: '',
      imageUrl: '',
      websiteUrl: '',
    });
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setFormData({
      name: '',
      venueType: '',
      description: '',
      address: '',
      imageUrl: '',
      websiteUrl: '',
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Validation Error', {
        description: 'Venue name is required',
      });
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        venueType: formData.venueType || null,
        description: formData.description.trim() || null,
        address: formData.address.trim() || null,
        imageUrl: formData.imageUrl.trim() || null,
        websiteUrl: formData.websiteUrl.trim() || null,
        orderIndex: venues.length,
      };

      let response;
      if (editingId) {
        response = await api.put(`/api/locations/${locationId}/lgbt-venues/${editingId}`, payload);
      } else {
        response = await api.post(`/api/locations/${locationId}/lgbt-venues`, payload);
      }

      if (!response.ok) {
        throw new Error(`Failed to ${editingId ? 'update' : 'create'} LGBT venue`);
      }

      toast.success('Success', {
        description: `LGBT venue ${editingId ? 'updated' : 'created'} successfully`,
      });

      handleCancel();
      fetchVenues();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Error', {
        description: `Failed to ${editingId ? 'update' : 'create'} LGBT venue`,
      });
    }
  };

  // Table configuration
  const columns = [
    {
      key: 'name',
      label: 'Name',
      priority: 'high' as const,
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'venueType',
      label: 'Type',
      priority: 'high' as const,
      render: (value: string) => <span className="text-white/80">{value || '-'}</span>,
    },
    {
      key: 'address',
      label: 'Address',
      priority: 'medium' as const,
      render: (value: string) => (
        <span className="text-white/70 text-xs line-clamp-1">{value || '-'}</span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      priority: 'low' as const,
      render: (value: string) => (
        <span className="text-white/70 text-xs line-clamp-2">{value || '-'}</span>
      ),
    },
  ];

  // Use individual icon buttons instead of dropdown to avoid nested modal conflicts
  const actions = [
    {
      label: 'Edit',
      icon: <Edit2 className="w-4 h-4" />,
      onClick: handleEdit,
      variant: 'default' as const,
      useDropdown: false, // Flag to use individual buttons
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDelete,
      variant: 'destructive' as const,
      useDropdown: false,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} modal={true}>
      <DialogContent
        className="admin-form-modal sm:max-w-5xl max-h-[90vh] border-white/10 bg-gradient-to-b from-[#10192f] to-[#0f1629] rounded-[20px] text-white flex flex-col"
        onInteractOutside={e => {
          // Prevent dialog from closing when clicking on dropdown menus or select items
          const target = e.target as HTMLElement;
          if (
            target.closest('[role="menu"]') ||
            target.closest('[data-radix-dropdown-menu-content]') ||
            target.closest('[data-radix-select-content]') ||
            target.closest('[role="listbox"]')
          ) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-white">Manage LGBT-Friendly Venues</DialogTitle>
              {locationName && <p className="text-sm text-white/60 mt-1">{locationName}</p>}
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleAddNew}
              disabled={isAddingNew || editingId !== null}
              className="h-8 px-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Venue
            </Button>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4 overflow-y-auto flex-1">
          {/* Add/Edit Form */}
          {(isAddingNew || editingId) && (
            <div className="p-4 border border-cyan-400/20 rounded-lg bg-cyan-400/5 space-y-3">
              <h3 className="text-sm font-semibold text-white">
                {editingId ? 'Edit LGBT Venue' : 'Add New LGBT Venue'}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/70">Name *</label>
                  <OceanInput
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Venue name"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/70">Type</label>
                  <Select
                    value={formData.venueType}
                    onValueChange={value => setFormData({ ...formData, venueType: value })}
                  >
                    <SelectTrigger className="bg-white/[0.04] border-white/10 text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/5 border-white/10 text-white">
                      {VENUE_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs text-white/70">Address</label>
                  <OceanInput
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/70">Image URL</label>
                  <OceanInput
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/70">Website URL</label>
                  <OceanInput
                    value={formData.websiteUrl}
                    onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs text-white/70">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the venue..."
                    className="w-full min-h-[80px] px-3 py-2 bg-white/[0.04] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-y"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="h-8 px-4 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 rounded-lg transition-all"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  className="h-8 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all shadow-sm"
                >
                  {editingId ? 'Update' : 'Add'} Venue
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <EnhancedLocationsTable
            data={venues}
            columns={columns}
            actions={actions}
            keyField="id"
            isLoading={loading}
            emptyMessage="No LGBT-friendly venues added yet. Click 'Add Venue' to get started."
            className="mt-4"
          />
        </div>

        <div className="flex justify-end pt-2 border-t border-white/10 flex-shrink-0">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all shadow-sm"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
