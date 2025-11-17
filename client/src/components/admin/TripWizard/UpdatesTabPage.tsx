import { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  GripVertical,
  MoreVertical,
  Pencil,
  Trash2,
  Home,
  ExternalLink,
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
import type { Update, UpdateType } from '@/types/trip-info';
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
import { UpdateFormModal } from './UpdateFormModal';

// Helper function to get update type display info
function getUpdateTypeBadge(updateType: UpdateType) {
  const badgeConfig = {
    new_cruise: {
      label: 'New Cruise',
      className: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30',
    },
    party_themes_released: {
      label: 'Themes Released',
      className: 'bg-orange-500/20 text-orange-400 border-orange-400/30',
    },
    guide_updated: {
      label: 'Guide Updated',
      className: 'bg-blue-500/20 text-blue-400 border-blue-400/30',
    },
    guide_live: {
      label: 'Guide Live',
      className: 'bg-purple-500/20 text-purple-400 border-purple-400/30',
    },
    new_event: {
      label: 'New Event',
      className: 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30',
    },
    new_artist: {
      label: 'New Artist',
      className: 'bg-pink-500/20 text-pink-400 border-pink-400/30',
    },
    schedule_updated: {
      label: 'Schedule',
      className: 'bg-amber-500/20 text-amber-400 border-amber-400/30',
    },
    ship_info_updated: {
      label: 'Ship Info',
      className: 'bg-slate-500/20 text-slate-400 border-slate-400/30',
    },
    custom: {
      label: 'Custom',
      className: 'bg-white/20 text-white/70 border-white/30',
    },
  };

  return badgeConfig[updateType] || badgeConfig.custom;
}

// Sortable Item Component
function SortableUpdateItem({
  update,
  onEdit,
  onDelete,
}: {
  update: Update;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: update.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const badgeInfo = getUpdateTypeBadge(update.update_type);
  const displayTitle = update.custom_title || update.title;

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

            {/* Accordion Trigger - Title and Badges */}
            <AccordionTrigger className="flex-1 hover:no-underline py-3 pr-12">
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                {/* Update Type Badge */}
                <div
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeInfo.className}`}
                >
                  {badgeInfo.label}
                </div>

                {/* Homepage Indicator */}
                {update.show_on_homepage && (
                  <div className="px-2 py-0.5 rounded text-[10px] font-semibold bg-green-500/20 text-green-400 border border-green-400/30 flex items-center gap-1">
                    <Home className="w-3 h-3" />
                    On Homepage
                  </div>
                )}

                {/* Link Section Indicator */}
                {update.link_section !== 'none' && (
                  <div className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Links to {update.link_section}
                  </div>
                )}

                {/* Title */}
                <span className="text-sm font-semibold text-white">{displayTitle}</span>
              </div>
            </AccordionTrigger>

            {/* Three-dot Menu */}
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

          {/* Accordion Content - Description */}
          <AccordionContent className="px-3 pb-3 pt-0">
            {update.description && (
              <p className="text-xs text-white/70 whitespace-pre-wrap line-clamp-3">
                {update.description}
              </p>
            )}
            {!update.description && <p className="text-xs text-white/40 italic">No description</p>}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function UpdatesTabPage() {
  const { state } = useTripWizard();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<Update | undefined>(undefined);

  const tripId = state.tripData.id;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch updates on mount
  useEffect(() => {
    if (tripId) {
      fetchUpdates();
    }
  }, [tripId]);

  const fetchUpdates = async () => {
    if (!tripId) return;

    try {
      setLoading(true);
      const response = await api.get(`/api/trips/${tripId}/updates`);
      if (!response.ok) throw new Error('Failed to fetch updates');
      const data = await response.json();
      setUpdates(data);
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to load updates',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = updates.findIndex(u => u.id === active.id);
    const newIndex = updates.findIndex(u => u.id === over.id);

    const newUpdates = arrayMove(updates, oldIndex, newIndex);

    // Update order_index for all updates
    const updatedUpdates = newUpdates.map((update, index) => ({
      ...update,
      order_index: index,
    }));

    // Optimistically update UI
    setUpdates(updatedUpdates);

    // Batch update on server
    try {
      const updatesList = updatedUpdates.map((update, index) => ({
        id: update.id,
        order_index: index,
      }));

      const response = await api.put(`/api/trips/${tripId}/updates/reorder`, {
        updates: updatesList,
      });

      if (!response.ok) throw new Error('Failed to reorder updates');

      toast.success('Success', {
        description: 'Updates reordered successfully',
      });
    } catch (error) {
      // Revert on error
      fetchUpdates();
      toast.error('Error', {
        description: 'Failed to reorder updates',
      });
    }
  };

  const handleCreate = () => {
    setEditingUpdate(undefined);
    setShowFormModal(true);
  };

  const handleEdit = (update: Update) => {
    setEditingUpdate(update);
    setShowFormModal(true);
  };

  const handleDelete = async (update: Update) => {
    if (!confirm(`Are you sure you want to delete this update?`)) {
      return;
    }

    try {
      const response = await api.delete(`/api/updates/${update.id}`);
      if (!response.ok) throw new Error('Failed to delete update');

      // Refresh list
      await fetchUpdates();

      toast.success('Success', {
        description: 'Update deleted successfully',
      });
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to delete update',
      });
    }
  };

  const handleSave = async () => {
    await fetchUpdates();
    setShowFormModal(false);
    setEditingUpdate(undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/70">Loading updates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-white/70">
          Manage trip updates and announcements for this cruise
        </p>
        <Button
          onClick={handleCreate}
          className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Update
        </Button>
      </div>

      {/* Updates List */}
      {updates.length === 0 ? (
        <div className="p-8 rounded-[10px] bg-white/[0.02] border-2 border-white/10 text-center">
          <Bell className="w-12 h-12 mx-auto mb-3 text-white/30" />
          <p className="text-sm text-white/70 mb-1">No updates added yet</p>
          <p className="text-xs text-white/50">Click "Add Update" to create your first update</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={updates.map(u => u.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2.5">
              {updates.map(update => (
                <SortableUpdateItem
                  key={update.id}
                  update={update}
                  onEdit={() => handleEdit(update)}
                  onDelete={() => handleDelete(update)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Info Notice */}
      <div className="mt-4 p-3 rounded-lg bg-cyan-400/5 border border-cyan-400/20">
        <p className="text-[11px] text-white/70 leading-relaxed">
          <span className="font-semibold text-cyan-400">Note:</span> Updates marked "On Homepage"
          will appear in the Latest News section. The order here determines how they appear on the
          trip guide. Link sections create clickable updates that navigate to specific parts of the
          guide.
        </p>
      </div>

      {/* Form Modal */}
      {showFormModal && (
        <UpdateFormModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setEditingUpdate(undefined);
          }}
          onSave={handleSave}
          tripId={tripId!}
          editingUpdate={editingUpdate}
        />
      )}
    </div>
  );
}
