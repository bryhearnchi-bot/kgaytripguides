import { useState, useEffect } from 'react';
import { HelpCircle, GripVertical, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { useFAQNavigation } from '@/contexts/FAQNavigationContext';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { FAQ } from '@/types/trip-info';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FAQFormModal } from './FAQFormModal';

// Sortable Item Component
function SortableFAQItem({
  faq,
  onEdit,
  onDelete,
}: {
  faq: FAQ;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: faq.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] hover:border-cyan-400/40 transition-all"
    >
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" className="border-none">
          <div className="flex items-center gap-2 relative">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="flex-shrink-0 cursor-grab active:cursor-grabbing pl-3 py-3"
            >
              <GripVertical className="w-4 h-4 text-white/30 hover:text-white/60" />
            </div>

            {/* Accordion Trigger - Question */}
            <AccordionTrigger className="flex-1 hover:no-underline py-3 pr-12">
              <div className="flex items-start gap-2 flex-1 text-left">
                {/* Question */}
                <span className="text-xs font-semibold text-white">{faq.question}</span>
              </div>
            </AccordionTrigger>

            {/* Three-dot Menu - Positioned absolutely to the right */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
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
                    onClick={onEdit}
                    className="text-white/70 hover:text-cyan-400 hover:bg-white/5 cursor-pointer"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-white/70 hover:text-red-400 hover:bg-white/5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Accordion Content - Answer */}
          <AccordionContent className="px-3 pb-3 pt-0">
            {faq.answer && (
              <p className="text-xs text-white/70 whitespace-pre-wrap">{faq.answer}</p>
            )}
            {!faq.answer && <p className="text-xs text-white/40 italic">No answer</p>}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function FAQTabPage() {
  const { state } = useTripWizard();
  const { showAddFAQModal, setShowAddFAQModal } = useFAQNavigation();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFaq, setEditingFaq] = useState<FAQ | undefined>(undefined);

  const tripId = state.tripData.id;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch FAQs on mount
  useEffect(() => {
    if (tripId) {
      fetchFaqs();
    }
  }, [tripId]);

  const fetchFaqs = async () => {
    if (!tripId) return;

    try {
      setLoading(true);
      const response = await api.get(`/api/faqs/trip/${tripId}`);
      if (!response.ok) throw new Error('Failed to fetch FAQs');
      const data = await response.json();
      setFaqs(data);
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to load FAQs',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = faqs.findIndex(f => f.id === active.id);
    const newIndex = faqs.findIndex(f => f.id === over.id);

    const newFaqs = arrayMove(faqs, oldIndex, newIndex);

    // Update order_index for all FAQs
    const updatedFaqs = newFaqs.map((faq, index) => ({
      ...faq,
      assignment: {
        ...faq.assignment!,
        order_index: index,
      },
    }));

    // Optimistically update UI
    setFaqs(updatedFaqs);

    // Batch update on server
    try {
      const assignments = updatedFaqs.map((faq, index) => ({
        id: faq.assignment!.id,
        order_index: index,
      }));

      const response = await api.put(`/api/trips/${tripId}/faq-assignments/reorder`, {
        assignments,
      });

      if (!response.ok) throw new Error('Failed to reorder FAQs');

      toast.success('Success', {
        description: 'FAQs reordered successfully',
      });
    } catch (error) {
      // Revert on error
      fetchFaqs();
      toast.error('Error', {
        description: 'Failed to reorder FAQs',
      });
    }
  };

  const handleCreate = () => {
    setEditingFaq(undefined);
    setShowAddFAQModal(true);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setShowAddFAQModal(true);
  };

  const handleDelete = async (faq: FAQ) => {
    if (!confirm(`Are you sure you want to delete this FAQ?`)) {
      return;
    }

    try {
      // Delete the FAQ (cascade will remove assignment)
      const response = await api.delete(`/api/faqs/${faq.id}`);
      if (!response.ok) throw new Error('Failed to delete FAQ');

      // Refresh list
      await fetchFaqs();

      toast.success('Success', {
        description: 'FAQ deleted',
      });
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to delete FAQ',
      });
    }
  };

  const handleSave = async () => {
    await fetchFaqs();
    setShowAddFAQModal(false);
    setEditingFaq(undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/70">Loading FAQs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 max-w-3xl mx-auto pt-3">
      {/* FAQs List */}
      {faqs.length === 0 ? (
        <div className="p-8 rounded-[10px] bg-white/[0.02] border-2 border-white/10 text-center">
          <HelpCircle className="w-12 h-12 mx-auto mb-3 text-white/30" />
          <p className="text-sm text-white/70 mb-1">No FAQs added yet</p>
          <p className="text-xs text-white/50">Click "Add FAQ" to create your first FAQ</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={faqs.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2.5">
              {faqs.map(faq => (
                <SortableFAQItem
                  key={faq.id}
                  faq={faq}
                  onEdit={() => handleEdit(faq)}
                  onDelete={() => handleDelete(faq)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Form Modal */}
      {showAddFAQModal && (
        <FAQFormModal
          isOpen={showAddFAQModal}
          onClose={() => {
            setShowAddFAQModal(false);
            setEditingFaq(undefined);
          }}
          onSave={handleSave}
          tripId={tripId!}
          editingFaq={editingFaq}
        />
      )}
    </div>
  );
}
