import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Edit3,
  Trash2,
  Info,
  FileText,
  Bell,
  Save,
  GripVertical
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
  content: string;
  orderIndex: number;
  updatedAt: string;
}

interface InfoAndUpdatesTabProps {
  trip?: any;
  onDataChange: () => void;
}

// Sortable Item Component
function SortableSection({
  section,
  isEditing,
  editingSection,
  onEdit,
  onDelete,
  onSave,
  onCancelEdit,
  setEditingSection
}: {
  section: InfoSection;
  isEditing: boolean;
  editingSection: InfoSection | null;
  onEdit: (section: InfoSection) => void;
  onDelete: (id: number) => void;
  onSave: (section: InfoSection) => void;
  onCancelEdit: () => void;
  setEditingSection: (section: InfoSection | null) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 ${isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''}`}
    >
      {isEditing ? (
        <div className="space-y-3">
          <Input
            value={editingSection!.title}
            onChange={(e) => setEditingSection({
              ...editingSection!,
              title: e.target.value
            })}
          />
          <Textarea
            value={editingSection!.content}
            onChange={(e) => setEditingSection({
              ...editingSection!,
              content: e.target.value
            })}
            rows={6}
          />
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => onSave(editingSection!)}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancelEdit}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <button
                className="cursor-grab hover:cursor-grabbing touch-none"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
              <h3 className="font-medium">{section.title}</h3>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(section)}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(section.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-2">
            {section.content.length > 200
              ? `${section.content.substring(0, 200)}...`
              : section.content
            }
          </p>
          <div className="text-xs text-gray-500">
            Last updated: {new Date(section.updatedAt).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InfoAndUpdatesTab({
  trip,
  onDataChange
}: InfoAndUpdatesTabProps) {
  const [infoSections, setInfoSections] = useState<InfoSection[]>([]);
  const [editingSection, setEditingSection] = useState<InfoSection | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionContent, setNewSectionContent] = useState('');
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

  const addNewSection = () => {
    if (!newSectionTitle.trim()) return;

    const newSection: InfoSection = {
      id: Date.now(),
      title: newSectionTitle,
      content: newSectionContent,
      orderIndex: infoSections.length,
      updatedAt: new Date().toISOString(),
    };

    setInfoSections(prev => [...prev, newSection]);
    setNewSectionTitle('');
    setNewSectionContent('');
    onDataChange();
  };

  const updateSection = (id: number, updates: Partial<InfoSection>) => {
    setInfoSections(prev =>
      prev.map(section =>
        section.id === id
          ? { ...section, ...updates, updatedAt: new Date().toISOString() }
          : section
      )
    );
    onDataChange();
  };

  const deleteSection = (id: number) => {
    setInfoSections(prev => {
      const filtered = prev.filter(section => section.id !== id);
      // Re-index after deletion
      return filtered.map((section, index) => ({
        ...section,
        orderIndex: index
      }));
    });
    onDataChange();
  };

  const saveSection = (section: InfoSection) => {
    updateSection(section.id, section);
    setEditingSection(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(Number(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setInfoSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === Number(active.id));
        const newIndex = items.findIndex((item) => item.id === Number(over.id));

        const newArray = arrayMove(items, oldIndex, newIndex);

        // Update orderIndex for all items
        return newArray.map((item, index) => ({
          ...item,
          orderIndex: index,
          updatedAt: item.id === Number(active.id) ? new Date().toISOString() : item.updatedAt
        }));
      });
      onDataChange();
    }

    setActiveId(null);
  };

  const predefinedSections = [
    { title: 'Embarkation Information', icon: '🚢' },
    { title: 'Dress Codes', icon: '👔' },
    { title: 'Dining Reservations', icon: '🍽️' },
    { title: 'Excursion Details', icon: '🗺️' },
    { title: 'Onboard Activities', icon: '🎯' },
    { title: 'WiFi & Communications', icon: '📱' },
    { title: 'Health & Safety', icon: '🏥' },
    { title: 'Disembarkation Info', icon: '🧳' },
  ];

  const activeDragItem = activeId ? infoSections.find(s => s.id === activeId) : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Information & Updates</h2>
          <p className="text-gray-600">Manage trip information and announcements</p>
        </div>
        <Button>
          <Bell className="w-4 h-4 mr-2" />
          Send Announcement
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add New Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Add Information Section</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  placeholder="Section title (e.g., Embarkation Information)"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Section content..."
                  value={newSectionContent}
                  onChange={(e) => setNewSectionContent(e.target.value)}
                  rows={4}
                />
              </div>
              <Button
                onClick={addNewSection}
                disabled={!newSectionTitle.trim()}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </CardContent>
          </Card>

          {/* Existing Sections with Drag and Drop */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Information Sections</span>
                <Badge variant="secondary">{infoSections.length}</Badge>
              </CardTitle>
              {infoSections.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Drag sections to reorder them
                </p>
              )}
            </CardHeader>
            <CardContent>
              {infoSections.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">No Information Sections</h3>
                  <p className="text-sm">Add sections to provide important cruise information</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={infoSections.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {infoSections
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map(section => (
                          <SortableSection
                            key={section.id}
                            section={section}
                            isEditing={editingSection?.id === section.id}
                            editingSection={editingSection}
                            onEdit={setEditingSection}
                            onDelete={deleteSection}
                            onSave={saveSection}
                            onCancelEdit={() => setEditingSection(null)}
                            setEditingSection={setEditingSection}
                          />
                        ))}
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {activeDragItem ? (
                      <div className="border rounded-lg p-4 bg-white shadow-xl">
                        <div className="flex items-center space-x-2 mb-2">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <h3 className="font-medium">{activeDragItem.title}</h3>
                        </div>
                        <p className="text-gray-600 text-sm">
                          {activeDragItem.content.length > 100
                            ? `${activeDragItem.content.substring(0, 100)}...`
                            : activeDragItem.content
                          }
                        </p>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-4">
          {/* Quick Add Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Add Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {predefinedSections.map((template, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setNewSectionTitle(template.title);
                      setNewSectionContent('');
                    }}
                  >
                    <span className="mr-2">{template.icon}</span>
                    {template.title}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Updates</CardTitle>
            </CardHeader>
            <CardContent>
              {infoSections.length === 0 ? (
                <p className="text-sm text-gray-500">No recent updates</p>
              ) : (
                <div className="space-y-2">
                  {infoSections
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .slice(0, 3)
                    .map(section => (
                      <div key={section.id} className="text-sm">
                        <div className="font-medium truncate">{section.title}</div>
                        <div className="text-gray-500 text-xs">
                          {new Date(section.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Sections</span>
                <span className="font-medium">{infoSections.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Words</span>
                <span className="font-medium">
                  {infoSections.reduce((acc, section) =>
                    acc + section.content.split(' ').length, 0
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last Update</span>
                <span className="font-medium">
                  {infoSections.length > 0
                    ? new Date(Math.max(...infoSections.map(s => new Date(s.updatedAt).getTime()))).toLocaleDateString()
                    : 'Never'
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}