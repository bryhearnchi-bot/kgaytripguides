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
import { toast } from 'sonner';
import { AdminFormModal } from '@/components/admin/AdminFormModal';
import { api } from '@/lib/api-client';
import {
  HelpCircle,
  Plus,
  PlusSquare,
  Edit2,
  Trash2,
  Search,
  Filter,
  Globe,
  Lock,
} from 'lucide-react';

interface FAQ {
  id?: number;
  question: string;
  answer?: string;
  section_type: 'general' | 'trip-specific' | 'always';
  updated_by?: string;
  updated_at?: string;
  trip_id?: number;
  trip_name?: string;
}

type SectionTypeFilter = 'all' | 'general' | 'always';

export default function FAQsManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<SectionTypeFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState<FAQ>({
    question: '',
    answer: '',
    section_type: 'general',
  });

  // Fetch all FAQs (only general and always types)
  const { data: faqs = [], isLoading } = useQuery<FAQ[]>({
    queryKey: ['faqs'],
    queryFn: async () => {
      const response = await api.get('/api/faqs');
      if (!response.ok) throw new Error('Failed to fetch FAQs');
      const allFAQs = await response.json();
      // Filter to only show general and always FAQs (not trip-specific)
      return allFAQs.filter(
        (faq: FAQ) => faq.section_type === 'general' || faq.section_type === 'always'
      );
    },
  });

  // Create FAQ mutation
  const createFAQMutation = useMutation({
    mutationFn: async (data: FAQ) => {
      const response = await api.post('/api/faqs', data);
      if (!response.ok) throw new Error('Failed to create FAQ');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      setShowAddModal(false);
      resetForm();
      toast.success('Success', {
        description: 'FAQ created successfully',
      });
    },
    onError: error => {
      toast.error('Error', {
        description: 'Failed to create FAQ',
      });
    },
  });

  // Update FAQ mutation
  const updateFAQMutation = useMutation({
    mutationFn: async (data: FAQ) => {
      const response = await api.put(`/api/faqs/${data.id}`, data);
      if (!response.ok) throw new Error('Failed to update FAQ');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      setEditingFAQ(null);
      setShowAddModal(false);
      resetForm();
      toast.success('Success', {
        description: 'FAQ updated successfully',
      });
    },
    onError: error => {
      toast.error('Error', {
        description: 'Failed to update FAQ',
      });
    },
  });

  // Delete FAQ mutation
  const deleteFAQMutation = useMutation({
    mutationFn: async (faqId: number) => {
      const response = await api.delete(`/api/faqs/${faqId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete FAQ');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast.success('Success', {
        description: 'FAQ deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast.error('Error', {
        description: 'Failed to delete FAQ',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      section_type: 'general',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFAQ) {
      updateFAQMutation.mutate({ ...formData, id: editingFAQ.id });
    } else {
      createFAQMutation.mutate(formData);
    }
  };

  const handleModalOpenChange = (open: boolean) => {
    setShowAddModal(open);
    if (!open) {
      setEditingFAQ(null);
      resetForm();
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFormData(faq);
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this FAQ?')) {
      deleteFAQMutation.mutate(id);
    }
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.trip_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || faq.section_type === typeFilter;

    return matchesSearch && matchesType;
  });

  const getSectionTypeIcon = (type: string) => {
    if (type === 'always') return <Lock className="h-3 w-3" />;
    if (type === 'general') return <Globe className="h-3 w-3" />;
    return null;
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
              <HelpCircle className="h-6 w-6" />
              FAQ Management
            </h1>
            <p className="text-sm text-white/60">
              Manage general and always-included frequently asked questions
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
                    General FAQs
                  </div>
                </SelectItem>
                <SelectItem value="always">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3 w-3" />
                    Always Included
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-11 rounded-full border-white/10 bg-white/10 pl-10 text-sm text-white placeholder:text-white/50 focus:border-[#22d3ee]/70"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur">
        <header className="flex flex-col gap-2 border-b border-white/10 pl-6 pr-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">All FAQs</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingFAQ(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="h-4 w-4 rounded-xl border border-white/15 bg-blue-500/10 text-white/80 hover:bg-blue-500/15"
            title="Add New FAQ"
          >
            <PlusSquare className="h-5 w-5 text-blue-400/80" />
          </Button>
        </header>

        {filteredFAQs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-white/60">
            <HelpCircle className="h-10 w-10 text-white/30" />
            <p className="text-sm">
              {searchTerm || typeFilter !== 'all'
                ? 'No FAQs match your criteria.'
                : 'Get started by adding your first FAQ.'}
            </p>
            {!searchTerm && typeFilter === 'all' && (
              <Button
                onClick={() => {
                  setEditingFAQ(null);
                  resetForm();
                  setShowAddModal(true);
                }}
                className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-4 py-2 text-sm text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First FAQ
              </Button>
            )}
          </div>
        ) : (
          <EnhancedTripInfoSectionsTable
            data={filteredFAQs}
            columns={[
              {
                key: 'question',
                label: 'Question',
                priority: 'high',
                sortable: true,
                minWidth: 250,
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
                key: 'answer',
                label: 'Answer',
                priority: 'medium',
                sortable: false,
                minWidth: 250,
                render: value => (
                  <span className="text-white/70 line-clamp-2">
                    {value ? `${value.slice(0, 100)}...` : 'No answer'}
                  </span>
                ),
              },
            ]}
            actions={[
              {
                label: 'Edit FAQ',
                icon: <Edit2 className="h-4 w-4" />,
                onClick: handleEdit,
              },
              {
                label: 'Delete FAQ',
                icon: <Trash2 className="h-4 w-4" />,
                onClick: faq => handleDelete(faq.id!),
                variant: 'destructive',
              },
            ]}
            keyField="id"
            isLoading={isLoading}
            emptyMessage={
              searchTerm || typeFilter !== 'all'
                ? 'No FAQs match your criteria.'
                : 'Get started by adding your first FAQ.'
            }
          />
        )}

        {filteredFAQs.length > 0 && (
          <footer className="flex items-center justify-between border-t border-white/10 px-6 py-4">
            <div className="text-xs text-white/50">
              Showing {filteredFAQs.length} of {faqs.length} FAQs
            </div>
          </footer>
        )}
      </section>

      {/* Add/Edit Modal */}
      <AdminFormModal
        isOpen={showAddModal}
        onOpenChange={handleModalOpenChange}
        title={editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}
        icon={<HelpCircle className="h-5 w-5" />}
        description="Enter FAQ information below"
        onSubmit={handleSubmit}
        primaryAction={{
          label: editingFAQ ? 'Save Changes' : 'Create FAQ',
          loading: editingFAQ ? updateFAQMutation.isPending : createFAQMutation.isPending,
          loadingLabel: editingFAQ ? 'Saving...' : 'Creating...',
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => handleModalOpenChange(false),
        }}
        contentClassName="grid gap-4"
        maxWidthClassName="max-w-2xl"
      >
        <div className="space-y-2">
          <Label htmlFor="question" className="text-white/80">
            Question *
          </Label>
          <Input
            id="question"
            value={formData.question}
            onChange={e => setFormData({ ...formData, question: e.target.value })}
            placeholder="e.g., What time is check-in?"
            required
            className="border-white/10 bg-white/5 text-white placeholder:text-white/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="section_type" className="text-white/80">
            FAQ Type *
          </Label>
          <Select
            value={formData.section_type}
            onValueChange={(value: 'general' | 'trip-specific' | 'always') =>
              setFormData({ ...formData, section_type: value })
            }
          >
            <SelectTrigger className="border-white/10 bg-white/5 text-white">
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
              ? 'This FAQ can be added to multiple trips in the library.'
              : formData.section_type === 'always'
                ? 'This FAQ is automatically included in every trip and cannot be removed.'
                : 'This FAQ will be specific to one trip and cannot be reused.'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="answer" className="text-white/80">
            Answer
          </Label>
          <Textarea
            id="answer"
            value={formData.answer || ''}
            onChange={e => setFormData({ ...formData, answer: e.target.value })}
            placeholder="Enter the answer to this question..."
            rows={6}
            className="border-white/10 bg-white/5 text-white placeholder:text-white/50"
          />
          <p className="text-xs text-white/40">
            Provide a clear and concise answer to the question above.
          </p>
        </div>
      </AdminFormModal>
    </div>
  );
}
