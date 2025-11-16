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

interface Attraction {
  id: number;
  locationId: number;
  name: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  websiteUrl?: string;
  orderIndex: number;
}

interface LocationAttractionsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: number;
  locationName?: string;
  onSuccess?: () => void;
}

const ATTRACTION_CATEGORIES = [
  'Historical',
  'Cultural',
  'Nature',
  'Entertainment',
  'Shopping',
  'Dining',
];

export function LocationAttractionsModal({
  isOpen,
  onOpenChange,
  locationId,
  locationName,
  onSuccess,
}: LocationAttractionsModalProps) {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    imageUrl: '',
    websiteUrl: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchAttractions();
    }
  }, [isOpen, locationId]);

  const fetchAttractions = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/locations/${locationId}/attractions`);
      if (response.ok) {
        const data = await response.json();
        setAttractions(data);
      }
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to load attractions',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (attraction: Attraction) => {
    setEditingId(attraction.id);
    setFormData({
      name: attraction.name,
      category: attraction.category || '',
      description: attraction.description || '',
      imageUrl: attraction.imageUrl || '',
      websiteUrl: attraction.websiteUrl || '',
    });
    setIsAddingNew(false);
  };

  const handleDelete = async (attraction: Attraction) => {
    if (!confirm(`Are you sure you want to delete "${attraction.name}"?`)) {
      return;
    }

    try {
      const response = await api.delete(
        `/api/locations/${locationId}/attractions/${attraction.id}`
      );

      if (!response.ok) {
        throw new Error('Failed to delete attraction');
      }

      toast.success('Success', {
        description: 'Attraction deleted successfully',
      });

      fetchAttractions();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to delete attraction',
      });
    }
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingId(null);
    setFormData({
      name: '',
      category: '',
      description: '',
      imageUrl: '',
      websiteUrl: '',
    });
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setFormData({
      name: '',
      category: '',
      description: '',
      imageUrl: '',
      websiteUrl: '',
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Validation Error', {
        description: 'Attraction name is required',
      });
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category || null,
        description: formData.description.trim() || null,
        imageUrl: formData.imageUrl.trim() || null,
        websiteUrl: formData.websiteUrl.trim() || null,
        orderIndex: attractions.length,
      };

      let response;
      if (editingId) {
        response = await api.put(`/api/locations/${locationId}/attractions/${editingId}`, payload);
      } else {
        response = await api.post(`/api/locations/${locationId}/attractions`, payload);
      }

      if (!response.ok) {
        throw new Error(`Failed to ${editingId ? 'update' : 'create'} attraction`);
      }

      toast.success('Success', {
        description: `Attraction ${editingId ? 'updated' : 'created'} successfully`,
      });

      handleCancel();
      fetchAttractions();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Error', {
        description: `Failed to ${editingId ? 'update' : 'create'} attraction`,
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
      key: 'category',
      label: 'Category',
      priority: 'high' as const,
      render: (value: string) => <span className="text-white/80">{value || '-'}</span>,
    },
    {
      key: 'description',
      label: 'Description',
      priority: 'medium' as const,
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
              <DialogTitle className="text-white">Manage Attractions</DialogTitle>
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
              Add Attraction
            </Button>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4 overflow-y-auto flex-1">
          {/* Add/Edit Form */}
          {(isAddingNew || editingId) && (
            <div className="p-4 border border-cyan-400/20 rounded-lg bg-cyan-400/5 space-y-3">
              <h3 className="text-sm font-semibold text-white">
                {editingId ? 'Edit Attraction' : 'Add New Attraction'}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/70">Name *</label>
                  <OceanInput
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Attraction name"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/70">Category</label>
                  <Select
                    value={formData.category}
                    onValueChange={value => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="bg-white/[0.04] border-white/10 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/5 border-white/10 text-white">
                      {ATTRACTION_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    placeholder="Brief description of the attraction..."
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
                  {editingId ? 'Update' : 'Add'} Attraction
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <EnhancedLocationsTable
            data={attractions}
            columns={columns}
            actions={actions}
            keyField="id"
            isLoading={loading}
            emptyMessage="No attractions added yet. Click 'Add Attraction' to get started."
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
