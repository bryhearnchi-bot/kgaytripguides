import { useState } from 'react';
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
} from 'lucide-react';

interface TripInfoSection {
  id?: number;
  title: string;
  content?: string;
  section_type: 'general' | 'trip_specific';
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

  // Fetch all trip info sections
  const { data: sections = [], isLoading } = useQuery<TripInfoSection[]>({
    queryKey: ['trip-info-sections'],
    queryFn: async () => {
      const response = await api.get('/api/trip-info-sections');
      if (!response.ok) throw new Error('Failed to fetch trip info sections');
      return response.json();
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
    return type === 'general' ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />;
  };

  const getSectionTypeLabel = (type: string) => {
    return type === 'general' ? 'Reusable' : 'Trip-Specific';
  };

  const getSectionTypeBadgeClass = (type: string) => {
    return type === 'general'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
      : 'border-amber-500/30 bg-amber-500/10 text-amber-400';
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
                key: 'image',
                label: '',
                priority: 'high',
                sortable: false,
                resizable: false,
                width: 80,
                minWidth: 80,
                maxWidth: 80,
                render: (_value, section) => (
                  <div className="flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10">
                      <FileText className="h-6 w-6 text-white/70" />
                    </div>
                  </div>
                ),
              },
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
            onValueChange={(value: 'general' | 'trip_specific') =>
              setFormData({ ...formData, section_type: value })
            }
          >
            <SelectTrigger className="border-white/10 bg-white/5 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-emerald-400" />
                  <div>
                    <div className="font-medium">Reusable Section</div>
                    <div className="text-xs text-muted-foreground">
                      Can be used across multiple trips
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="trip_specific">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-amber-400" />
                  <div>
                    <div className="font-medium">Trip-Specific Section</div>
                    <div className="text-xs text-muted-foreground">Tied to a specific trip</div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-white/40">
            {formData.section_type === 'general'
              ? 'This section can be reused across multiple trips in the library.'
              : 'This section will be specific to one trip and cannot be reused.'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content" className="text-white/80">
            Content
          </Label>
          <Textarea
            id="content"
            value={formData.content || ''}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
            placeholder="Enter the section content..."
            rows={6}
            className="border-white/10 bg-white/5 text-white placeholder:text-white/50"
          />
          <p className="text-xs text-white/40">
            Use line breaks to separate different points or instructions.
          </p>
        </div>
      </AdminFormModal>
    </div>
  );
}
