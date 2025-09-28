import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EnhancedTripInfoSectionsTable } from '@/components/admin/EnhancedTripInfoSectionsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AdminFormModal } from '@/components/admin/AdminFormModal';
import { api } from '@/lib/api-client';
import {
  FileText,
  Plus,
  PlusSquare,
  Edit2,
  Trash2,
  Search
} from 'lucide-react';

interface TripInfoSection {
  id?: number;
  trip_id: number;
  title: string;
  content?: string;
  order_index: number;
  updated_by?: string;
  updated_at?: string;
  trip_name?: string;
}

export default function TripInfoSectionsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSection, setEditingSection] = useState<TripInfoSection | null>(null);
  const [formData, setFormData] = useState<TripInfoSection>({
    trip_id: 0,
    title: '',
    content: '',
    order_index: 1,
  });

  // Fetch all trip info sections
  const { data: sections = [], isLoading } = useQuery<TripInfoSection[]>({
    queryKey: ['trip-info-sections'],
    queryFn: async () => {
      const response = await api.get('/api/trip-info-sections');
      if (!response.ok) throw new Error('Failed to fetch trip info sections');
      return response.json();
    }
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
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create trip info section',
        variant: 'destructive',
      });
    }
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
      resetForm();
      toast({
        title: 'Success',
        description: 'Trip info section updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update trip info section',
        variant: 'destructive',
      });
    }
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
    }
  });


  const resetForm = () => {
    setFormData({
      trip_id: 0,
      title: '',
      content: '',
      order_index: 1,
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


  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.trip_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <p className="text-sm text-white/60">Manage information sections across all trips</p>
          </div>
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search sections by title, content, or trip"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 rounded-full border-white/10 bg-white/10 pl-10 text-sm text-white placeholder:text-white/50 focus:border-[#22d3ee]/70"
            />
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
            <p className="text-sm">{searchTerm ? 'No sections match your search.' : 'Get started by adding your first section.'}</p>
            {!searchTerm && (
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
                render: (value) => (
                  <p className="font-bold text-xs text-white">{value}</p>
                ),
              },
              {
                key: 'content',
                label: 'Content',
                priority: 'medium',
                sortable: false,
                minWidth: 250,
                render: (value) => (
                  <span className="text-white/70 line-clamp-2">
                    {value ? value.slice(0, 100) + '...' : 'No content'}
                  </span>
                ),
              },
              {
                key: 'trip_name',
                label: 'Trip',
                priority: 'high',
                sortable: true,
                minWidth: 150,
                render: (value, section) => (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                    {value || `Trip #${section.trip_id}`}
                  </span>
                ),
              },
              {
                key: 'order_index',
                label: 'Order',
                priority: 'low',
                sortable: true,
                minWidth: 100,
                render: (value) => (
                  <span className="text-xs text-white/60">#{value}</span>
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
                onClick: (section) => handleDelete(section.id!),
                variant: 'destructive',
              },
            ]}
            keyField="id"
            isLoading={isLoading}
            emptyMessage={searchTerm ? 'No sections match your search.' : 'Get started by adding your first section.'}
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
          loading: editingSection ? updateSectionMutation.isPending : createSectionMutation.isPending,
          loadingLabel: editingSection ? 'Saving...' : 'Creating...'
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => handleModalOpenChange(false)
        }}
        contentClassName="grid gap-4"
        maxWidthClassName="max-w-2xl"
      >
        <div className="space-y-2">
          <Label htmlFor="title" className="text-white/80">Section Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Entertainment Booking, Dining Information"
            required
            className="border-white/10 bg-white/5 text-white placeholder:text-white/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content" className="text-white/80">Content</Label>
          <Textarea
            id="content"
            value={formData.content || ''}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Enter the section content..."
            rows={6}
            className="border-white/10 bg-white/5 text-white placeholder:text-white/50"
          />
          <p className="text-xs text-white/40">
            Use line breaks to separate different points or instructions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="trip_id" className="text-white/80">Trip ID *</Label>
            <Input
              id="trip_id"
              type="number"
              min="1"
              value={formData.trip_id || ''}
              onChange={(e) => setFormData({ ...formData, trip_id: parseInt(e.target.value) || 0 })}
              placeholder="Enter trip ID"
              required
              className="border-white/10 bg-white/5 text-white placeholder:text-white/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order_index" className="text-white/80">Display Order *</Label>
            <Input
              id="order_index"
              type="number"
              min="1"
              value={formData.order_index}
              onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 1 })}
              required
              className="border-white/10 bg-white/5 text-white"
            />
          </div>
        </div>
      </AdminFormModal>
    </div>
  );
}