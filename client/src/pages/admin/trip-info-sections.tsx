import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EnhancedTripInfoSectionsTable } from '@/components/admin/EnhancedTripInfoSectionsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AdminFormModal } from '@/components/admin/AdminFormModal';
import { api } from '@/lib/api-client';
import {
  FileText,
  Plus,
  PlusSquare,
  Edit2,
  Trash2,
  Search,
  Filter,
  Globe,
  MapPin,
  Lock,
  Bold,
  Italic,
  List,
  ListOrdered,
} from 'lucide-react';

interface TripInfoSection {
  id?: number;
  title: string;
  content?: string;
  section_type: 'general' | 'trip-specific' | 'always';
  updated_by?: string;
  updated_at?: string;
  trip_id?: number;
  trip_name?: string;
}

type SectionTypeFilter = 'all' | 'general' | 'trip_specific';

export default function TripInfoSectionsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<SectionTypeFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSection, setEditingSection] = useState<TripInfoSection | null>(null);
  const [formData, setFormData] = useState<TripInfoSection>({
    title: '',
    content: '',
    section_type: 'general',
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch all trip info sections (only general and always types)
  const { data: sections = [], isLoading } = useQuery<TripInfoSection[]>({
    queryKey: ['trip-info-sections'],
    queryFn: async () => {
      const response = await api.get('/api/trip-info-sections');
      if (!response.ok) throw new Error('Failed to fetch trip info sections');
      const allSections = await response.json();
      // Filter to only show general and always sections (not trip-specific)
      return allSections.filter(
        (s: TripInfoSection) => s.section_type === 'general' || s.section_type === 'always'
      );
    },
  });

  // Create section mutation
  const createSectionMutation = useMutation({
    mutationFn: async (data: TripInfoSection) => {
      const response = await api.post('/api/trip-info-sections', data);
      if (!response.ok) throw new Error('Failed to create section');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-info-sections'] });
      setShowAddModal(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Trip info section created successfully',
      });
    },
    onError: error => {
      toast({
        title: 'Error',
        description: 'Failed to create trip info section',
        variant: 'destructive',
      });
    },
  });

  // Update section mutation
  const updateSectionMutation = useMutation({
    mutationFn: async (data: TripInfoSection) => {
      const response = await api.put(`/api/trip-info-sections/${data.id}`, data);
      if (!response.ok) throw new Error('Failed to update section');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-info-sections'] });
      setEditingSection(null);
      setShowAddModal(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Trip info section updated successfully',
      });
    },
    onError: error => {
      toast({
        title: 'Error',
        description: 'Failed to update trip info section',
        variant: 'destructive',
      });
    },
  });

  // Delete section mutation
  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: number) => {
      const response = await api.delete(`/api/trip-info-sections/${sectionId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete section');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-info-sections'] });
      toast({
        title: 'Success',
        description: 'Trip info section deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete trip info section',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      section_type: 'general',
    });
  };

  // Rich text formatting functions
  const wrapSelection = (before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content || '';
    const selectedText = text.substring(start, end);

    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);

    setFormData({ ...formData, content: newText });

    // Restore selection after state update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const content = formData.content || '';
    const newText = content.substring(0, start) + text + content.substring(start);

    setFormData({ ...formData, content: newText });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSection) {
      updateSectionMutation.mutate({ ...formData, id: editingSection.id });
    } else {
      createSectionMutation.mutate(formData);
    }
  };

  const handleModalOpenChange = (open: boolean) => {
    setShowAddModal(open);
    if (!open) {
      setEditingSection(null);
      resetForm();
    }
  };

  const handleEdit = (section: TripInfoSection) => {
    setEditingSection(section);
    setFormData(section);
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this info section?')) {
      deleteSectionMutation.mutate(id);
    }
  };

  const filteredSections = sections.filter(section => {
    const matchesSearch =
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.trip_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || section.section_type === typeFilter;

    return matchesSearch && matchesType;
  });

  const getSectionTypeIcon = (type: string) => {
    if (type === 'always') return <Lock className="h-3 w-3" />;
    if (type === 'general') return <Globe className="h-3 w-3" />;
    return <MapPin className="h-3 w-3" />;
  };

  const getSectionTypeLabel = (type: string) => {
    if (type === 'always') return 'Always';
    if (type === 'general') return 'General';
    return 'Trip-Specific';
  };

  const getSectionTypeBadgeClass = (type: string) => {
    if (type === 'always') return 'border-red-400/30 bg-red-500/20 text-red-400';
    if (type === 'general') return 'border-blue-400/30 bg-blue-500/20 text-blue-400';
    return 'border-cyan-400/30 bg-cyan-500/20 text-cyan-400';
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
              <FileText className="h-6 w-6" />
              Trip Info Sections Management
            </h1>
            <p className="text-sm text-white/60">
              Manage reusable and trip-specific information sections
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Type Filter */}
            <Select
              value={typeFilter}
              onValueChange={(value: SectionTypeFilter) => setTypeFilter(value)}
            >
              <SelectTrigger className="w-full sm:w-48 h-11 rounded-full border-white/10 bg-white/10 text-white">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="general">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    Reusable Sections
                  </div>
                </SelectItem>
                <SelectItem value="trip_specific">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    Trip-Specific
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                placeholder="Search sections..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-11 rounded-full border-white/10 bg-white/10 pl-10 text-sm text-white placeholder:text-white/50 focus:border-[#22d3ee]/70"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
        <header className="flex flex-col gap-2 border-b border-white/10 pl-6 pr-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">All Sections</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingSection(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="h-4 w-4 rounded-xl border border-white/15 bg-blue-500/10 text-white/80 hover:bg-blue-500/15"
            title="Add New Section"
          >
            <PlusSquare className="h-5 w-5 text-blue-400/80" />
          </Button>
        </header>

        {filteredSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-white/60">
            <FileText className="h-10 w-10 text-white/30" />
            <p className="text-sm">
              {searchTerm || typeFilter !== 'all'
                ? 'No sections match your criteria.'
                : 'Get started by adding your first section.'}
            </p>
            {!searchTerm && typeFilter === 'all' && (
              <Button
                onClick={() => {
                  setEditingSection(null);
                  resetForm();
                  setShowAddModal(true);
                }}
                className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-4 py-2 text-sm text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Section
              </Button>
            )}
          </div>
        ) : (
          <EnhancedTripInfoSectionsTable
            data={filteredSections}
            columns={[
              {
                key: 'title',
                label: 'Section',
                priority: 'high',
                sortable: true,
                minWidth: 200,
                render: value => <p className="font-bold text-xs text-white">{value}</p>,
              },
              {
                key: 'section_type',
                label: 'Type',
                priority: 'high',
                sortable: true,
                minWidth: 120,
                render: value => (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getSectionTypeBadgeClass(value)}`}
                  >
                    {getSectionTypeIcon(value)}
                    {getSectionTypeLabel(value)}
                  </span>
                ),
              },
              {
                key: 'content',
                label: 'Content',
                priority: 'medium',
                sortable: false,
                minWidth: 250,
                render: value => (
                  <span className="text-white/70 line-clamp-2">
                    {value ? `${value.slice(0, 100)}...` : 'No content'}
                  </span>
                ),
              },
              {
                key: 'trip_name',
                label: 'Associated Trip',
                priority: 'medium',
                sortable: true,
                minWidth: 150,
                render: (value, section) =>
                  section.section_type === 'trip_specific' ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                      {value || `Trip #${section.trip_id}`}
                    </span>
                  ) : (
                    <span className="text-xs text-white/40 italic">Available to all trips</span>
                  ),
              },
            ]}
            actions={[
              {
                label: 'Edit Section',
                icon: <Edit2 className="h-4 w-4" />,
                onClick: handleEdit,
              },
              {
                label: 'Delete Section',
                icon: <Trash2 className="h-4 w-4" />,
                onClick: section => handleDelete(section.id!),
                variant: 'destructive',
              },
            ]}
            keyField="id"
            isLoading={isLoading}
            emptyMessage={
              searchTerm || typeFilter !== 'all'
                ? 'No sections match your criteria.'
                : 'Get started by adding your first section.'
            }
          />
        )}

        {filteredSections.length > 0 && (
          <footer className="flex items-center justify-between border-t border-white/10 px-6 py-4">
            <div className="text-xs text-white/50">
              Showing {filteredSections.length} of {sections.length} sections
            </div>
          </footer>
        )}
      </section>

      {/* Add/Edit Modal */}
      <AdminFormModal
        isOpen={showAddModal}
        onOpenChange={handleModalOpenChange}
        title={editingSection ? 'Edit Info Section' : 'Add New Info Section'}
        icon={<FileText className="h-5 w-5" />}
        description="Enter section information below"
        onSubmit={handleSubmit}
        primaryAction={{
          label: editingSection ? 'Save Changes' : 'Create Section',
          loading: editingSection
            ? updateSectionMutation.isPending
            : createSectionMutation.isPending,
          loadingLabel: editingSection ? 'Saving...' : 'Creating...',
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => handleModalOpenChange(false),
        }}
        contentClassName="grid gap-4"
        maxWidthClassName="max-w-2xl"
      >
        <div className="space-y-2">
          <Label htmlFor="title" className="text-white/80">
            Section Title *
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Entertainment Booking, Dining Information"
            required
            className="border-white/10 bg-white/5 text-white placeholder:text-white/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="section_type" className="text-white/80">
            Section Type *
          </Label>
          <Select
            value={formData.section_type}
            onValueChange={(value: 'general' | 'trip-specific' | 'always') =>
              setFormData({ ...formData, section_type: value })
            }
          >
            <SelectTrigger className="w-full h-10 px-3 font-normal bg-white/[0.04] border border-white/10 rounded-[10px] text-white text-sm hover:bg-white/[0.06] hover:border-white/10 transition-all focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:border-cyan-400/60 focus-visible:bg-cyan-400/[0.03] focus-visible:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-400" />
                  <div>
                    <div className="font-medium">General</div>
                    <div className="text-xs text-muted-foreground">
                      Can be added to multiple trips
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="always">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-red-400" />
                  <div>
                    <div className="font-medium">Always</div>
                    <div className="text-xs text-muted-foreground">
                      Automatically included in every trip
                    </div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-white/40">
            {formData.section_type === 'general'
              ? 'This section can be added to multiple trips in the library.'
              : formData.section_type === 'always'
                ? 'This section is automatically included in every trip and cannot be removed.'
                : 'This section will be specific to one trip and cannot be reused.'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content" className="text-white/80">
            Content
          </Label>

          {/* Formatting toolbar */}
          <div className="flex items-center gap-1 p-2 border border-white/10 bg-white/5 rounded-t-md">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => wrapSelection('<strong>', '</strong>')}
              className="h-8 px-2 text-white/70 hover:text-white hover:bg-white/10"
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => wrapSelection('<em>', '</em>')}
              className="h-8 px-2 text-white/70 hover:text-white hover:bg-white/10"
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertText('\n• ')}
              className="h-8 px-2 text-white/70 hover:text-white hover:bg-white/10"
              title="Bulleted list"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertText('\n1. ')}
              className="h-8 px-2 text-white/70 hover:text-white hover:bg-white/10"
              title="Numbered list"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>

          <Textarea
            ref={textareaRef}
            id="content"
            value={formData.content || ''}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
            placeholder="Enter the section content... Use the toolbar above for formatting."
            rows={10}
            className="border-white/10 border-t-0 bg-white/5 text-white placeholder:text-white/50 rounded-t-none font-mono text-sm"
          />
          <p className="text-xs text-white/40">
            Use <strong>&lt;strong&gt;</strong> for bold, <em>&lt;em&gt;</em> for italic, and bullet
            points (•) or numbers for lists. HTML tags will be rendered on the trip info page.
          </p>
        </div>
      </AdminFormModal>
    </div>
  );
}
