import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';
import {
  Plus,
  PlusSquare,
  Trash2,
  Info,
  FileText,
  Save,
  GripVertical,
  Globe,
  MapPin,
  Library,
  List,
  Search,
  X
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface InfoSection {
  id: number;
  title: string;
  content?: string;
  section_type: 'general' | 'trip_specific';
  updated_by?: string;
  updated_at?: string;
  assignment?: {
    id: number;
    trip_id: number;
    order_index: number;
  };
}

interface SectionAssignment {
  trip_id: number;
  section_id: number;
  order_index: number;
}

interface InfoAndUpdatesTabProps {
  trip: any;
  onDataChange: () => void;
}

// Sortable Item Component for Assigned Sections (Left Panel)
function SortableAssignedSection({
  section,
  onRemove
}: {
  section: InfoSection;
  onRemove: (assignmentId: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.assignment!.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getSectionTypeIcon = (type: string) => {
    return type === 'general' ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />;
  };

  const getSectionTypeBadgeClass = (type: string) => {
    return type === 'general'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
      : 'border-amber-500/30 bg-amber-500/10 text-amber-400';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4 ${
        isDragging ? 'shadow-lg ring-2 ring-[#22d3ee]/50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          className="cursor-grab hover:cursor-grabbing touch-none mt-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-white/40 hover:text-white/60" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-sm text-white truncate">{section.title}</h3>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${getSectionTypeBadgeClass(section.section_type)}`}>
              {getSectionTypeIcon(section.section_type)}
              {section.section_type === 'general' ? 'Reusable' : 'Trip-Specific'}
            </span>
          </div>

          {section.content && (
            <p className="text-xs text-white/60 line-clamp-2">
              {section.content.length > 150
                ? `${section.content.substring(0, 150)}...`
                : section.content
              }
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(section.assignment!.id)}
          className="h-6 w-6 rounded-lg border border-white/15 bg-red-500/10 text-white/80 hover:bg-red-500/15 hover:text-red-400"
          title="Remove from trip"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// Library Section Item Component (Right Panel)
function LibrarySectionItem({
  section,
  onAssign,
  isAssigned
}: {
  section: InfoSection;
  onAssign: (sectionId: number) => void;
  isAssigned: boolean;
}) {
  const getSectionTypeIcon = (type: string) => {
    return type === 'general' ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />;
  };

  const getSectionTypeBadgeClass = (type: string) => {
    return type === 'general'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
      : 'border-amber-500/30 bg-amber-500/10 text-amber-400';
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10 flex-shrink-0">
          <FileText className="h-5 w-5 text-white/70" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-xs text-white truncate">{section.title}</h4>
            <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs font-medium ${getSectionTypeBadgeClass(section.section_type)}`}>
              {getSectionTypeIcon(section.section_type)}
            </span>
          </div>

          {section.content && (
            <p className="text-xs text-white/50 line-clamp-2">
              {section.content.length > 100
                ? `${section.content.substring(0, 100)}...`
                : section.content
              }
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onAssign(section.id)}
          disabled={isAssigned}
          className={`h-6 w-6 rounded-lg border border-white/15 ${
            isAssigned
              ? 'bg-white/5 text-white/30 cursor-not-allowed'
              : 'bg-blue-500/10 text-white/80 hover:bg-blue-500/15 hover:text-blue-400'
          }`}
          title={isAssigned ? 'Already assigned' : 'Add to trip'}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default function InfoAndUpdatesTab({
  trip,
  onDataChange
}: InfoAndUpdatesTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSectionData, setNewSectionData] = useState({
    title: '',
    content: '',
    section_type: 'general' as 'general' | 'trip_specific'
  });
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch trip sections (assigned sections)
  const { data: assignedSections = [], isLoading: isLoadingAssigned, refetch: refetchAssigned } = useQuery<InfoSection[]>({
    queryKey: ['trip-sections', trip?.id],
    queryFn: async () => {
      if (!trip?.id) return [];
      const response = await api.get(`/api/trip-info-sections/trip/${trip.id}`);
      if (!response.ok) throw new Error('Failed to fetch trip sections');
      return response.json();
    },
    enabled: !!trip?.id
  });

  // Fetch all available sections (library)
  const { data: allSections = [], isLoading: isLoadingLibrary } = useQuery<InfoSection[]>({
    queryKey: ['trip-info-sections'],
    queryFn: async () => {
      const response = await api.get('/api/trip-info-sections');
      if (!response.ok) throw new Error('Failed to fetch sections');
      return response.json();
    }
  });

  // Create section mutation
  const createSectionMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; section_type: 'general' | 'trip_specific' }) => {
      const response = await api.post('/api/trip-info-sections', data);
      if (!response.ok) throw new Error('Failed to create section');
      return response.json();
    },
    onSuccess: (newSection) => {
      queryClient.invalidateQueries({ queryKey: ['trip-info-sections'] });
      setShowCreateForm(false);
      setNewSectionData({ title: '', content: '', section_type: 'general' });
      toast({
        title: 'Success',
        description: 'Section created successfully',
      });
      // Auto-assign if trip-specific
      if (newSection.section_type === 'trip_specific') {
        assignSectionMutation.mutate({
          trip_id: trip.id,
          section_id: newSection.id,
          order_index: assignedSections.length + 1
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create section',
        variant: 'destructive',
      });
    }
  });

  // Assign section mutation
  const assignSectionMutation = useMutation({
    mutationFn: async (data: SectionAssignment) => {
      const response = await api.post('/api/trip-section-assignments', data);
      if (!response.ok) throw new Error('Failed to assign section');
      return response.json();
    },
    onSuccess: () => {
      refetchAssigned();
      onDataChange();
      toast({
        title: 'Success',
        description: 'Section added to trip',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to assign section',
        variant: 'destructive',
      });
    }
  });

  // Remove assignment mutation
  const removeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      const response = await api.delete(`/api/trip-section-assignments/${assignmentId}`);
      if (!response.ok) throw new Error('Failed to remove assignment');
    },
    onSuccess: () => {
      refetchAssigned();
      onDataChange();
      toast({
        title: 'Success',
        description: 'Section removed from trip',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove section',
        variant: 'destructive',
      });
    }
  });

  // Update assignment order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ assignmentId, orderIndex }: { assignmentId: number; orderIndex: number }) => {
      const response = await api.put(`/api/trip-section-assignments/${assignmentId}`, { order_index: orderIndex });
      if (!response.ok) throw new Error('Failed to update order');
      return response.json();
    },
    onSuccess: () => {
      refetchAssigned();
      onDataChange();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update section order',
        variant: 'destructive',
      });
    }
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(Number(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && assignedSections.length > 1) {
      const oldIndex = assignedSections.findIndex((item) => item.assignment!.id === Number(active.id));
      const newIndex = assignedSections.findIndex((item) => item.assignment!.id === Number(over.id));

      if (oldIndex !== -1 && newIndex !== -1) {
        const newArray = arrayMove(assignedSections, oldIndex, newIndex);

        // Update all order indexes
        newArray.forEach((item, index) => {
          const newOrderIndex = index + 1;
          if (item.assignment!.order_index !== newOrderIndex) {
            updateOrderMutation.mutate({
              assignmentId: item.assignment!.id,
              orderIndex: newOrderIndex
            });
          }
        });
      }
    }

    setActiveId(null);
  };

  const handleAssignSection = (sectionId: number) => {
    const nextOrderIndex = Math.max(0, ...assignedSections.map(s => s.assignment!.order_index)) + 1;
    assignSectionMutation.mutate({
      trip_id: trip.id,
      section_id: sectionId,
      order_index: nextOrderIndex
    });
  };

  const handleCreateSection = () => {
    if (!newSectionData.title.trim()) return;
    createSectionMutation.mutate(newSectionData);
  };

  // Filter library sections (exclude already assigned ones)
  const assignedSectionIds = new Set(assignedSections.map(s => s.id));
  const filteredLibrarySections = allSections.filter(section => {
    const matchesSearch = section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const notAssigned = !assignedSectionIds.has(section.id);
    return matchesSearch && notAssigned;
  });

  const activeDragItem = activeId ? assignedSections.find(s => s.assignment!.id === activeId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
              <List className="h-5 w-5" />
              Trip Information Sections
            </h2>
            <p className="text-sm text-white/60">Assign and organize sections for this trip</p>
          </div>
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT PANEL: Assigned Sections (Current sections with drag to reorder) */}
        <div className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
          <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="flex items-center gap-2">
              <List className="h-5 w-5 text-white" />
              <h3 className="text-lg font-semibold text-white">Assigned Sections</h3>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                {assignedSections.length}
              </Badge>
            </div>
          </header>

          <div className="p-6">
            {isLoadingAssigned ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-white/50">Loading sections...</div>
              </div>
            ) : assignedSections.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-white/60">
                <List className="h-12 w-12 text-white/30" />
                <h4 className="font-medium text-white/80">No Sections Assigned</h4>
                <p className="text-sm text-center">Add sections from the library on the right to get started.</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={assignedSections.map(s => s.assignment!.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {assignedSections
                      .sort((a, b) => a.assignment!.order_index - b.assignment!.order_index)
                      .map((section) => (
                        <SortableAssignedSection
                          key={section.assignment!.id}
                          section={section}
                          onRemove={removeAssignmentMutation.mutate}
                        />
                      ))}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeDragItem ? (
                    <SortableAssignedSection
                      section={activeDragItem}
                      onRemove={() => {}}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}

            {assignedSections.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-white/40">
                  Drag sections to reorder them. They will appear in this order on the trip guide.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Available Sections Library + Create New */}
        <div className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
          <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="flex items-center gap-2">
              <Library className="h-5 w-5 text-white" />
              <h3 className="text-lg font-semibold text-white">Section Library</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="h-8 w-8 rounded-xl border border-white/15 bg-blue-500/10 text-white/80 hover:bg-blue-500/15"
              title="Create New Section"
            >
              <PlusSquare className="h-4 w-4 text-blue-400/80" />
            </Button>
          </header>

          <div className="p-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                placeholder="Search available sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 rounded-xl border-white/10 bg-white/5 pl-10 text-sm text-white placeholder:text-white/50 focus:border-[#22d3ee]/70"
              />
            </div>

            {/* Create New Section Form */}
            {showCreateForm && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-blue-400" />
                  <h4 className="font-medium text-white">Create New Section</h4>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80">Title</Label>
                  <Input
                    placeholder="Section title"
                    value={newSectionData.title}
                    onChange={(e) => setNewSectionData({ ...newSectionData, title: e.target.value })}
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80">Type</Label>
                  <Select
                    value={newSectionData.section_type}
                    onValueChange={(value: 'general' | 'trip_specific') =>
                      setNewSectionData({ ...newSectionData, section_type: value })
                    }
                  >
                    <SelectTrigger className="border-white/10 bg-white/5 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3 w-3 text-emerald-400" />
                          Reusable (can be used on other trips)
                        </div>
                      </SelectItem>
                      <SelectItem value="trip_specific">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-amber-400" />
                          Trip-Specific (only for this trip)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80">Content</Label>
                  <Textarea
                    placeholder="Section content..."
                    value={newSectionData.content}
                    onChange={(e) => setNewSectionData({ ...newSectionData, content: e.target.value })}
                    rows={3}
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/50"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateSection}
                    disabled={!newSectionData.title.trim() || createSectionMutation.isPending}
                    size="sm"
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {createSectionMutation.isPending ? 'Creating...' : 'Create'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewSectionData({ title: '', content: '', section_type: 'general' });
                    }}
                    className="text-white/60 hover:text-white/80"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Available Sections */}
            <div className="space-y-3">
              {isLoadingLibrary ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-white/50">Loading library...</div>
                </div>
              ) : filteredLibrarySections.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-white/60">
                  <Library className="h-10 w-10 text-white/30" />
                  <p className="text-sm text-center">
                    {searchTerm
                      ? 'No sections match your search.'
                      : assignedSectionIds.size === allSections.length
                        ? 'All available sections are already assigned.'
                        : 'No sections available in the library.'
                    }
                  </p>
                </div>
              ) : (
                filteredLibrarySections.map((section) => (
                  <LibrarySectionItem
                    key={section.id}
                    section={section}
                    onAssign={handleAssignSection}
                    isAssigned={assignedSectionIds.has(section.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}