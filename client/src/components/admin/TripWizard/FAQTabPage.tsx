import { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  GripVertical,
  Lock,
  Globe,
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronDown,
} from 'lucide-react';
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

  const isAlways = faq.section_type === 'always';
  const isGeneral = faq.section_type === 'general';

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

            {/* Accordion Trigger - Question and Badge */}
            <AccordionTrigger className="flex-1 hover:no-underline py-3 pr-12">
              <div className="flex items-center gap-2 flex-1">
                {/* Section Type Badge */}
                {isAlways && (
                  <div className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-400 border border-red-400/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Always
                  </div>
                )}
                {isGeneral && (
                  <div className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    General
                  </div>
                )}
                {!isAlways && !isGeneral && (
                  <div className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Trip-Specific
                  </div>
                )}
                {/* Question */}
                <span className="text-sm font-semibold text-white">{faq.question}</span>
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
                <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                  <DropdownMenuItem
                    onClick={onEdit}
                    className="text-white/70 hover:text-cyan-400 hover:bg-white/5 cursor-pointer"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  {!isAlways && (
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="text-white/70 hover:text-red-400 hover:bg-white/5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isGeneral ? 'Remove' : 'Delete'}
                    </DropdownMenuItem>
                  )}
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
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
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
    setShowFormModal(true);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setShowFormModal(true);
  };

  const handleDelete = async (faq: FAQ) => {
    if (faq.section_type === 'always') {
      toast.error('Cannot Delete', {
        description: '"Always" FAQs cannot be removed from trips',
      });
      return;
    }

    if (!confirm(`Are you sure you want to remove this FAQ from this trip?`)) {
      return;
    }

    try {
      // Delete assignment (not the FAQ itself for general FAQs)
      if (faq.assignment) {
        const response = await api.delete(`/api/trip-faq-assignments/${faq.assignment.id}`);
        if (!response.ok) throw new Error('Failed to delete assignment');
      }

      // Refresh list
      await fetchFaqs();

      toast.success('Success', {
        description: 'FAQ removed from trip',
      });
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to remove FAQ',
      });
    }
  };

  const handleSave = async () => {
    await fetchFaqs();
    setShowFormModal(false);
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
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-white/70">Manage frequently asked questions for this trip</p>
        <Button
          onClick={handleCreate}
          className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add FAQ
        </Button>
      </div>

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

      {/* Info Notice */}
      <div className="mt-4 p-3 rounded-lg bg-cyan-400/5 border border-cyan-400/20">
        <p className="text-[11px] text-white/70 leading-relaxed">
          <span className="font-semibold text-cyan-400">Note:</span> FAQs marked as "Always" are
          automatically included in every trip and cannot be removed. "General" FAQs can be added to
          multiple trips. "Trip-Specific" FAQs are unique to this trip.
        </p>
      </div>

      {/* Form Modal */}
      {showFormModal && (
        <FAQFormModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
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
