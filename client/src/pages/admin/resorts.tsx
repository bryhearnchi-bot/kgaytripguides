import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveAdminTable } from '@/components/admin/ResponsiveAdminTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ResortFormModal } from '@/components/admin/ResortFormModal';
import { api } from '@/lib/api-client';
import { Building, Plus, Edit2, Trash2, Search, Users, MapPin, Hotel } from 'lucide-react';

interface Resort {
  id?: number;
  name: string;
  location: string;
  capacity?: number;
  roomCount?: number;
  imageUrl?: string;
  propertyMapUrl?: string;
  checkInTime?: string;
  checkOutTime?: string;
  description?: string;
  tripCount?: number;
}

export default function ResortsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResort, setEditingResort] = useState<Resort | null>(null);

  const handleModalOpenChange = (open: boolean) => {
    setShowAddModal(open);
    if (!open) {
      setEditingResort(null);
    }
  };

  // Fetch resorts
  const { data: resorts = [], isLoading } = useQuery<Resort[]>({
    queryKey: ['resorts'],
    queryFn: async () => {
      const response = await api.get('/api/resorts');
      if (!response.ok) throw new Error('Failed to fetch resorts');
      return response.json();
    }
  });

  // Delete resort mutation
  const deleteResortMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/api/resorts/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete resort');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resorts'] });
      toast({
        title: 'Success',
        description: 'Resort deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message.includes('Cannot delete')
          ? 'This resort is assigned to trips and cannot be deleted'
          : 'Failed to delete resort',
        variant: 'destructive',
      });
    }
  });

  const handleEdit = (resort: Resort) => {
    setEditingResort(resort);
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this resort?')) {
      deleteResortMutation.mutate(id);
    }
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['resorts'] });
    setShowAddModal(false);
    setEditingResort(null);
  };

  const filteredResorts = resorts.filter(resort =>
    resort.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resort.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
              <Building className="h-6 w-6" />
              Resort Properties
            </h1>
            <p className="text-sm text-white/60">Manage resort accommodations and amenities</p>
          </div>
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search resorts by name or location"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 rounded-full border-white/10 bg-white/10 pl-10 text-sm text-white placeholder:text-white/50 focus:border-[#22d3ee]/70"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
        <header className="flex flex-col gap-2 border-b border-white/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">All Resorts ({filteredResorts.length})</h2>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Across all destinations</p>
          </div>
          <Button
            onClick={() => {
              setEditingResort(null);
              setShowAddModal(true);
            }}
            className="rounded-full bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors min-w-[80px]"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Resort
          </Button>
        </header>

        {filteredResorts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-white/60">
            <Building className="h-10 w-10 text-white/30" />
            <p className="text-sm">{searchTerm ? 'No resorts match your search.' : 'Get started by adding your first resort.'}</p>
            {!searchTerm && (
              <Button
                onClick={() => {
                  setEditingResort(null);
                  setShowAddModal(true);
                }}
                className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-4 py-2 text-sm text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Resort
              </Button>
            )}
          </div>
        ) : (
          <ResponsiveAdminTable
            data={filteredResorts}
            columns={[
              {
                key: 'name',
                label: 'Resort',
                priority: 'high',
                render: (_value, resort) => (
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10">
                      {resort.imageUrl ? (
                        <img
                          src={resort.imageUrl}
                          alt={resort.name}
                          className="h-full w-full rounded-xl object-cover"
                        />
                      ) : (
                        <Building className="h-5 w-5 text-white/70" />
                      )}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium text-white">{resort.name}</p>
                      <div className="flex items-center gap-1 text-xs text-white/60">
                        <MapPin className="h-3 w-3" />
                        <span>{resort.location}</span>
                      </div>
                      {resort.description && (
                        <p className="text-xs text-white/60 line-clamp-2">{resort.description}</p>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                key: 'capacity',
                label: 'Specs',
                priority: 'medium',
                render: (_value, resort) => (
                  <div className="space-y-1">
                    {resort.capacity && (
                      <div className="flex items-center gap-1 text-xs text-white/70">
                        <Users className="h-3 w-3" />
                        <span>{resort.capacity.toLocaleString()} guests</span>
                      </div>
                    )}
                    {resort.roomCount && (
                      <div className="flex items-center gap-1 text-xs text-white/70">
                        <Hotel className="h-3 w-3" />
                        <span>{resort.roomCount} rooms</span>
                      </div>
                    )}
                    {resort.checkInTime && resort.checkOutTime && (
                      <div className="text-xs text-white/70">
                        {resort.checkInTime} - {resort.checkOutTime}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: 'tripCount',
                label: 'Usage',
                priority: 'medium',
                render: (value) => (
                  <span className="text-xs text-white/60">
                    {value || 0} trip{(value || 0) === 1 ? '' : 's'}
                  </span>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                priority: 'medium',
                render: () => <StatusBadge variant="default">Active</StatusBadge>,
              },
            ]}
            actions={[
              {
                label: 'Edit Resort',
                icon: <Edit2 className="h-4 w-4" />,
                onClick: handleEdit,
              },
              {
                label: 'Delete Resort',
                icon: <Trash2 className="h-4 w-4" />,
                onClick: (resort) => handleDelete(resort.id!),
                variant: 'destructive',
              },
            ]}
            keyField="id"
            isLoading={isLoading}
            emptyMessage={searchTerm ? 'No resorts match your search.' : 'Get started by adding your first resort.'}
          />
        )}

        <footer className="border-t border-white/10 px-6 py-4 text-xs text-white/50">
          Showing {filteredResorts.length} resort{filteredResorts.length === 1 ? '' : 's'}
        </footer>
      </section>

      {/* Resort Form Modal */}
      <ResortFormModal
        isOpen={showAddModal}
        onOpenChange={handleModalOpenChange}
        resort={editingResort}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}