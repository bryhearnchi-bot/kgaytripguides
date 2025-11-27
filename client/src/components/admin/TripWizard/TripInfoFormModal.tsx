import { useState, useEffect } from 'react';
import { AdminBottomSheet } from '@/components/admin/AdminBottomSheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { TripInfoSection } from '@/types/trip-info';
import { Info } from 'lucide-react';

interface TripInfoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  tripId: number;
  editingSection?: TripInfoSection;
}

export function TripInfoFormModal({
  isOpen,
  onClose,
  onSave,
  tripId,
  editingSection,
}: TripInfoFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    if (editingSection) {
      setFormData({
        title: editingSection.title,
        content: editingSection.content || '',
      });
    } else {
      setFormData({
        title: '',
        content: '',
      });
    }
  }, [editingSection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Always use trip_specific type (note: database uses underscores)
      const payload = {
        ...formData,
        section_type: 'trip_specific',
      };

      if (editingSection) {
        // Update existing section
        const response = await api.put(`/api/trip-info-sections/${editingSection.id}`, payload);
        if (!response.ok) {
          throw new Error('Failed to update section');
        }

        toast.success('Success', {
          description: 'Trip info section updated successfully',
        });
      } else {
        // Create new section
        const createResponse = await api.post('/api/trip-info-sections', payload);
        if (!createResponse.ok) {
          throw new Error('Failed to create section');
        }
        const newSection = await createResponse.json();

        // Assign to trip
        const assignResponse = await api.post('/api/trip-section-assignments', {
          trip_id: tripId,
          section_id: newSection.id,
          order_index: 999, // Will be at the end
        });
        if (!assignResponse.ok) throw new Error('Failed to assign section to trip');

        toast.success('Success', {
          description: 'Trip info section created and added to trip',
        });
      }

      onSave();
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to save trip info section',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminBottomSheet
      isOpen={isOpen}
      onOpenChange={onClose}
      title={editingSection ? 'Edit Trip Info Section' : 'Create Trip Info Section'}
      description={editingSection ? 'Edit trip info section' : 'Create a new trip info section'}
      icon={<Info className="h-5 w-5 text-white" />}
      onSubmit={handleSubmit}
      primaryAction={{
        label: editingSection ? 'Save Changes' : 'Create Section',
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
        {/* Title */}
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Packing List, Important Dates"
            required
          />
        </div>

        {/* Content */}
        <div>
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
            placeholder="Enter section content..."
            rows={6}
          />
        </div>
      </div>
    </AdminBottomSheet>
  );
}
