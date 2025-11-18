import { useState, useEffect } from 'react';
import { AdminBottomSheet } from '@/components/admin/AdminBottomSheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { StandardDropdown } from '@/components/ui/dropdowns';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Update, UpdateType, LinkSection } from '@/types/trip-info';
import {
  Sparkles,
  Calendar,
  BookOpen,
  Rocket,
  Music,
  User,
  Clock,
  Ship,
  Edit3,
  Bell,
} from 'lucide-react';

interface UpdateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  tripId: number;
  editingUpdate?: Update;
}

// Helper to get default title from update type
function getDefaultTitle(updateType: UpdateType): string {
  const titles: Record<UpdateType, string> = {
    new_cruise: 'New Cruise Released',
    party_themes_released: 'Party Themes Released',
    guide_updated: 'Trip Guide Updated',
    guide_live: 'Trip Guide Now Live',
    new_event: 'New Event Added',
    new_artist: 'New Artist Added',
    schedule_updated: 'Schedule Updated',
    ship_info_updated: 'Ship Information Updated',
    custom: '',
  };
  return titles[updateType] || '';
}

export function UpdateFormModal({
  isOpen,
  onClose,
  onSave,
  tripId,
  editingUpdate,
}: UpdateFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    update_type: 'guide_updated' as UpdateType,
    custom_title: '',
    link_section: 'none' as LinkSection,
    show_on_homepage: false,
  });

  useEffect(() => {
    if (editingUpdate) {
      setFormData({
        title: editingUpdate.title,
        description: editingUpdate.description,
        update_type: editingUpdate.update_type,
        custom_title: editingUpdate.custom_title || '',
        link_section: editingUpdate.link_section,
        show_on_homepage: editingUpdate.show_on_homepage,
      });
    } else {
      setFormData({
        title: getDefaultTitle('guide_updated'),
        description: '',
        update_type: 'guide_updated',
        custom_title: '',
        link_section: 'none',
        show_on_homepage: false,
      });
    }
  }, [editingUpdate]);

  // Update title when update type changes
  useEffect(() => {
    if (formData.update_type !== 'custom') {
      setFormData(prev => ({
        ...prev,
        title: getDefaultTitle(prev.update_type),
      }));
    }
  }, [formData.update_type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get the next order_index
      const updatesResponse = await api.get(`/api/trips/${tripId}/updates`);
      const existingUpdates = updatesResponse.ok ? await updatesResponse.json() : [];
      const nextOrderIndex = existingUpdates.length;

      // Prepare data
      const updateData = {
        title: formData.update_type === 'custom' ? formData.custom_title : formData.title,
        description: formData.description,
        update_type: formData.update_type,
        custom_title: formData.update_type === 'custom' ? formData.custom_title : undefined,
        link_section: formData.link_section,
        show_on_homepage: formData.show_on_homepage,
        order_index: editingUpdate ? editingUpdate.order_index : nextOrderIndex,
      };

      if (editingUpdate) {
        // Update existing update
        const response = await api.put(`/api/updates/${editingUpdate.id}`, updateData);
        if (!response.ok) throw new Error('Failed to update');

        toast.success('Success', {
          description: 'Update saved successfully',
        });
      } else {
        // Create new update
        const response = await api.post(`/api/trips/${tripId}/updates`, updateData);
        if (!response.ok) throw new Error('Failed to create update');

        toast.success('Success', {
          description: 'Update created successfully',
        });
      }

      onSave();
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to save update',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminBottomSheet
      isOpen={isOpen}
      onOpenChange={onClose}
      title={editingUpdate ? 'Edit Update' : 'Create Update'}
      description={editingUpdate ? 'Edit trip update' : 'Create a new trip update'}
      icon={<Bell className="h-5 w-5 text-white" />}
      onSubmit={handleSubmit}
      primaryAction={{
        label: editingUpdate ? 'Save Changes' : 'Create Update',
        type: 'submit',
        loading,
        loadingLabel: 'Saving...',
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: onClose,
      }}
      fullScreen={true}
    >
      <div className="space-y-4">
        {/* Update Type */}
        <StandardDropdown
          variant="single-basic"
          label="Update Type"
          placeholder="Select update type"
          emptyMessage="No update types available"
          options={[
            {
              value: 'new_cruise',
              label: 'New Cruise Released',
              icon: Sparkles,
            },
            {
              value: 'party_themes_released',
              label: 'Party Themes Released',
              icon: Calendar,
            },
            {
              value: 'guide_updated',
              label: 'Trip Guide Updated',
              icon: BookOpen,
            },
            {
              value: 'guide_live',
              label: 'Trip Guide Now Live',
              icon: Rocket,
            },
            {
              value: 'new_event',
              label: 'New Event Added',
              icon: Music,
            },
            {
              value: 'new_artist',
              label: 'New Artist Added',
              icon: User,
            },
            {
              value: 'schedule_updated',
              label: 'Schedule Updated',
              icon: Clock,
            },
            {
              value: 'ship_info_updated',
              label: 'Ship Information Updated',
              icon: Ship,
            },
            {
              value: 'custom',
              label: 'Custom Update',
              icon: Edit3,
            },
          ]}
          value={formData.update_type}
          onChange={(value: string | string[]) =>
            setFormData({ ...formData, update_type: value as UpdateType })
          }
          required
        />

        {/* Custom Title (only shown if update type is custom) */}
        {formData.update_type === 'custom' && (
          <div>
            <Label htmlFor="custom_title">Custom Title</Label>
            <Input
              id="custom_title"
              value={formData.custom_title}
              onChange={e => setFormData({ ...formData, custom_title: e.target.value })}
              placeholder="e.g., Special Announcement"
              required
            />
          </div>
        )}

        {/* Auto Title Display (for non-custom types) */}
        {formData.update_type !== 'custom' && (
          <div>
            <Label>Title (Auto-Generated)</Label>
            <div className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm text-white/70">
              {formData.title}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what's new or what changed..."
            rows={4}
            required
          />
        </div>

        {/* Link Section */}
        <div className="space-y-1">
          <StandardDropdown
            variant="single-basic"
            label="Link To Section"
            placeholder="Select section to link to"
            emptyMessage="No sections available"
            options={[
              {
                value: 'none',
                label: 'None (No Link)',
              },
              {
                value: 'overview',
                label: 'Overview',
              },
              {
                value: 'events',
                label: 'Events & Performers',
              },
              {
                value: 'artists',
                label: 'Artists',
              },
              {
                value: 'schedule',
                label: 'Daily Schedule',
              },
              {
                value: 'faqs',
                label: 'FAQs',
              },
              {
                value: 'ship',
                label: 'Ship Information',
              },
            ]}
            value={formData.link_section}
            onChange={(value: string | string[]) =>
              setFormData({ ...formData, link_section: value as LinkSection })
            }
            required
          />
          <p className="text-xs text-white/50">
            When clicked, this update will navigate to the selected section
          </p>
        </div>

        {/* Show on Homepage */}
        <div className="flex items-start space-x-3 p-3 rounded-lg bg-white/5 border border-white/10">
          <Checkbox
            id="show_on_homepage"
            checked={formData.show_on_homepage}
            onCheckedChange={checked => setFormData({ ...formData, show_on_homepage: !!checked })}
          />
          <div className="flex-1">
            <Label
              htmlFor="show_on_homepage"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Show on Homepage
            </Label>
            <p className="text-xs text-white/50 mt-1">
              Display this update in the "Latest News" section on the main landing page
            </p>
          </div>
        </div>
      </div>
    </AdminBottomSheet>
  );
}
