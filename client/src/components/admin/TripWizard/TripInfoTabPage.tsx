import { useState, useEffect } from 'react';
import {
  Info,
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
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';
import type { TripInfoSection } from '@/types/trip-info';
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
import { TripInfoFormModal } from './TripInfoFormModal';

// Sortable Item Component
function SortableTripInfoItem({
  section,
  onEdit,
  onDelete,
}: {
  section: TripInfoSection;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isAlways = section.section_type === 'always';
  const isGeneral = section.section_type === 'general';

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

            {/* Accordion Trigger - Title and Badge */}
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
                {/* Title */}
                <span className="text-sm font-semibold text-white">{section.title}</span>
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

          {/* Accordion Content - Description */}
          <AccordionContent className="px-3 pb-3 pt-0">
            {section.content && (
              <p className="text-xs text-white/70 whitespace-pre-wrap">{section.content}</p>
            )}
            {!section.content && <p className="text-xs text-white/40 italic">No content</p>}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function TripInfoTabPage() {
  const { state } = useTripWizard();
  const [sections, setSections] = useState<TripInfoSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSection, setEditingSection] = useState<TripInfoSection | undefined>(undefined);

  const tripId = state.tripData.id;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch sections on mount
  useEffect(() => {
    if (tripId) {
      fetchSections();
    }
  }, [tripId]);

  const fetchSections = async () => {
    if (!tripId) return;

    try {
      setLoading(true);
      const response = await api.get(`/api/trip-info-sections/trip/${tripId}`);
      if (!response.ok) throw new Error('Failed to fetch trip info sections');
      const data = await response.json();
      setSections(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load trip info sections',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);

    const newSections = arrayMove(sections, oldIndex, newIndex);

    // Update order_index for all sections
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      assignment: {
        ...section.assignment!,
        order_index: index,
      },
    }));

    // Optimistically update UI
    setSections(updatedSections);

    // Batch update on server
    try {
      const assignments = updatedSections.map((section, index) => ({
        id: section.assignment!.id,
        order_index: index,
      }));

      const response = await api.put(`/api/trips/${tripId}/section-assignments/reorder`, {
        assignments,
      });

      if (!response.ok) throw new Error('Failed to reorder sections');

      toast({
        title: 'Success',
        description: 'Sections reordered successfully',
      });
    } catch (error) {
      // Revert on error
      fetchSections();
      toast({
        title: 'Error',
        description: 'Failed to reorder sections',
        variant: 'destructive',
      });
    }
  };

  const handleCreate = () => {
    setEditingSection(undefined);
    setShowFormModal(true);
  };

  const handleEdit = (section: TripInfoSection) => {
    setEditingSection(section);
    setShowFormModal(true);
  };

  const handleDelete = async (section: TripInfoSection) => {
    if (section.section_type === 'always') {
      toast({
        title: 'Cannot Delete',
        description: '"Always" sections cannot be removed from trips',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Are you sure you want to remove "${section.title}" from this trip?`)) {
      return;
    }

    try {
      // Delete assignment (not the section itself for general sections)
      if (section.assignment) {
        const response = await api.delete(`/api/trip-section-assignments/${section.assignment.id}`);
        if (!response.ok) throw new Error('Failed to delete assignment');
      }

      // Refresh list
      await fetchSections();

      toast({
        title: 'Success',
        description: 'Section removed from trip',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove section',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    await fetchSections();
    setShowFormModal(false);
    setEditingSection(undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/70">Loading trip info sections...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-white/70">
          Manage trip information sections like packing lists, important dates, and policies
        </p>
        <Button
          onClick={handleCreate}
          className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Section
        </Button>
      </div>

      {/* Sections List */}
      {sections.length === 0 ? (
        <div className="p-8 rounded-[10px] bg-white/[0.02] border-2 border-white/10 text-center">
          <Info className="w-12 h-12 mx-auto mb-3 text-white/30" />
          <p className="text-sm text-white/70 mb-1">No trip info sections added yet</p>
          <p className="text-xs text-white/50">Click "Add Section" to create your first section</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2.5">
              {sections.map(section => (
                <SortableTripInfoItem
                  key={section.id}
                  section={section}
                  onEdit={() => handleEdit(section)}
                  onDelete={() => handleDelete(section)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Info Notice */}
      <div className="mt-4 p-3 rounded-lg bg-cyan-400/5 border border-cyan-400/20">
        <p className="text-[11px] text-white/70 leading-relaxed">
          <span className="font-semibold text-cyan-400">Note:</span> Sections marked as "Always" are
          automatically included in every trip and cannot be removed. "General" sections can be
          added to multiple trips. "Trip-Specific" sections are unique to this trip.
        </p>
      </div>

      {/* Form Modal */}
      {showFormModal && (
        <TripInfoFormModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setEditingSection(undefined);
          }}
          onSave={handleSave}
          tripId={tripId!}
          editingSection={editingSection}
        />
      )}
    </div>
  );
}
