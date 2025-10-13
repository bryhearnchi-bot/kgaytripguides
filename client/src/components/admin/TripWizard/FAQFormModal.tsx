import { useState, useEffect } from 'react';
import { AdminFormModal } from '@/components/admin/AdminFormModal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SingleDropDownNew } from '@/components/ui/single-drop-down-new';
import { api } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import type { FAQ } from '@/types/trip-info';
import { Lock, Globe, FileText } from 'lucide-react';

interface FAQFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  tripId: number;
  editingFaq?: FAQ;
}

export function FAQFormModal({ isOpen, onClose, onSave, tripId, editingFaq }: FAQFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    section_type: 'trip-specific' as 'trip-specific' | 'general' | 'always',
  });

  useEffect(() => {
    if (editingFaq) {
      setFormData({
        question: editingFaq.question,
        answer: editingFaq.answer,
        section_type: editingFaq.section_type,
      });
    } else {
      setFormData({
        question: '',
        answer: '',
        section_type: 'trip-specific',
      });
    }
  }, [editingFaq]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingFaq) {
        // Update existing FAQ
        const response = await api.put(`/api/faqs/${editingFaq.id}`, formData);
        if (!response.ok) throw new Error('Failed to update FAQ');

        toast({
          title: 'Success',
          description: 'FAQ updated successfully',
        });
      } else {
        // Create new FAQ
        const createResponse = await api.post('/api/faqs', formData);
        if (!createResponse.ok) throw new Error('Failed to create FAQ');
        const newFaq = await createResponse.json();

        // Assign to trip
        const assignResponse = await api.post('/api/trip-faq-assignments', {
          trip_id: tripId,
          faq_id: newFaq.id,
          order_index: 999, // Will be at the end
        });
        if (!assignResponse.ok) throw new Error('Failed to assign FAQ to trip');

        toast({
          title: 'Success',
          description: 'FAQ created and added to trip',
        });
      }

      onSave();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save FAQ',
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
      title={editingFaq ? 'Edit FAQ' : 'Create FAQ'}
      onSubmit={handleSubmit}
      primaryAction={{
        label: editingFaq ? 'Save Changes' : 'Create FAQ',
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
        {/* Question */}
        <div>
          <Label htmlFor="question">Question</Label>
          <Input
            id="question"
            value={formData.question}
            onChange={e => setFormData({ ...formData, question: e.target.value })}
            placeholder="e.g., What should I pack?"
            required
          />
        </div>

        {/* Answer */}
        <div>
          <Label htmlFor="answer">Answer</Label>
          <Textarea
            id="answer"
            value={formData.answer}
            onChange={e => setFormData({ ...formData, answer: e.target.value })}
            placeholder="Enter answer..."
            rows={6}
            required
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
