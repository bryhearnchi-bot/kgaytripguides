import { useState, useEffect } from 'react';
import { AdminFormModal } from '@/components/admin/AdminFormModal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SingleDropDownNew } from '@/components/ui/single-drop-down-new';
import { api } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import type { TripInfoSection } from '@/types/trip-info';
import { Lock, Globe, FileText } from 'lucide-react';

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
    section_type: 'trip-specific' as 'trip-specific' | 'general' | 'always',
  });

  useEffect(() => {
    if (editingSection) {
      setFormData({
        title: editingSection.title,
        content: editingSection.content || '',
        section_type: editingSection.section_type,
      });
    } else {
      setFormData({
        title: '',
        content: '',
        section_type: 'trip-specific',
      });
    }
  }, [editingSection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔵 TripInfoFormModal - Submitting form data:', formData);

      if (editingSection) {
        // Update existing section
        console.log('🔵 TripInfoFormModal - Updating section:', editingSection.id);
        const response = await api.put(`/api/trip-info-sections/${editingSection.id}`, formData);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ TripInfoFormModal - Update failed:', errorData);
          throw new Error('Failed to update section');
        }

        toast({
          title: 'Success',
          description: 'Trip info section updated successfully',
        });
      } else {
        // Create new section
        console.log('🔵 TripInfoFormModal - Creating new section');
        const createResponse = await api.post('/api/trip-info-sections', formData);
        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({}));
          console.error('❌ TripInfoFormModal - Create failed with status:', createResponse.status);
          console.error(
            '❌ TripInfoFormModal - Error details:',
            JSON.stringify(errorData, null, 2)
          );
          console.error('❌ TripInfoFormModal - Errors object:', errorData.errors);
          throw new Error('Failed to create section');
        }
        const newSection = await createResponse.json();
        console.log('✅ TripInfoFormModal - Section created:', newSection);

        // Assign to trip
        const assignResponse = await api.post('/api/trip-section-assignments', {
          trip_id: tripId,
          section_id: newSection.id,
          order_index: 999, // Will be at the end
        });
        if (!assignResponse.ok) throw new Error('Failed to assign section to trip');

        toast({
          title: 'Success',
          description: 'Trip info section created and added to trip',
        });
      }

      onSave();
    } catch (error) {
      console.error('Error saving trip info section:', error);
      toast({
        title: 'Error',
        description: 'Failed to save trip info section',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminFormModal
      isOpen={isOpen}
      onOpenChange={onClose}
      title={editingSection ? 'Edit Trip Info Section' : 'Create Trip Info Section'}
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

        {/* Section Type */}
        <div className="space-y-1">
          <SingleDropDownNew
            label="Section Type"
            placeholder="Select section type"
            emptyMessage="No section types available"
            options={[
              {
                value: 'trip-specific',
                label: 'Trip-Specific',
                icon: FileText,
              },
              {
                value: 'general',
                label: 'General (Reusable)',
                icon: Globe,
              },
              {
                value: 'always',
                label: 'Always (Auto-assigned)',
                icon: Lock,
              },
            ]}
            value={formData.section_type}
            onChange={(value: any) => setFormData({ ...formData, section_type: value })}
            required
            showSearch={false}
          />
          <p className="text-xs text-white/50 mt-1">
            {formData.section_type === 'trip-specific' && 'Only for this trip'}
            {formData.section_type === 'general' && 'Can be added to multiple trips'}
            {formData.section_type === 'always' && 'Automatically included in every trip'}
          </p>
        </div>
      </div>
    </AdminFormModal>
  );
}
