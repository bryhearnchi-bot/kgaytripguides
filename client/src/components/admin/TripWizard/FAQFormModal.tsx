import { useState, useEffect } from 'react';
import { AdminBottomSheet } from '@/components/admin/AdminBottomSheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { FAQ } from '@/types/trip-info';
import { HelpCircle } from 'lucide-react';

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
  });

  useEffect(() => {
    if (editingFaq) {
      setFormData({
        question: editingFaq.question,
        answer: editingFaq.answer,
      });
    } else {
      setFormData({
        question: '',
        answer: '',
      });
    }
  }, [editingFaq]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Always use trip-specific type
      const payload = {
        ...formData,
        section_type: 'trip-specific',
      };

      if (editingFaq) {
        // Update existing FAQ
        const response = await api.put(`/api/faqs/${editingFaq.id}`, payload);
        if (!response.ok) throw new Error('Failed to update FAQ');

        toast.success('Success', {
          description: 'FAQ updated successfully',
        });
      } else {
        // Create new FAQ
        const createResponse = await api.post('/api/faqs', payload);
        if (!createResponse.ok) throw new Error('Failed to create FAQ');
        const newFaq = await createResponse.json();

        // Assign to trip
        const assignResponse = await api.post('/api/trip-faq-assignments', {
          trip_id: tripId,
          faq_id: newFaq.id,
          order_index: 999, // Will be at the end
        });
        if (!assignResponse.ok) throw new Error('Failed to assign FAQ to trip');

        toast.success('Success', {
          description: 'FAQ created and added to trip',
        });
      }

      onSave();
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to save FAQ',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminBottomSheet
      isOpen={isOpen}
      onOpenChange={onClose}
      title={editingFaq ? 'Edit FAQ' : 'Create FAQ'}
      description={editingFaq ? 'Edit FAQ details' : 'Create a new FAQ'}
      icon={<HelpCircle className="h-5 w-5 text-white" />}
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
      fullScreen={true}
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
      </div>
    </AdminBottomSheet>
  );
}
