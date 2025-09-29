import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { EnhancedResortsTable } from '@/components/admin/EnhancedResortsTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ResortFormModal } from '@/components/admin/ResortFormModal';
import { api } from '@/lib/api-client';
import { Building, Plus, PlusSquare, Edit2, Trash2, Search, Users, MapPin, Hotel } from 'lucide-react';

interface Resort {
  id?: number;
  name: string;
  location: string;
  city?: string;
  state_province?: string;
  country?: string;
  country_code?: string;
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

  const filteredResorts = resorts.filter(resort => {
    const searchLower = searchTerm.toLowerCase();
    return resort.name.toLowerCase().includes(searchLower) ||
           resort.location.toLowerCase().includes(searchLower) ||
           (resort.city?.toLowerCase().includes(searchLower)) ||
           (resort.country?.toLowerCase().includes(searchLower));
  });

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
        <header className="flex flex-col gap-2 border-b border-white/10 pl-6 pr-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">All Resorts</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingResort(null);
              setShowAddModal(true);
            }}
            className="h-4 w-4 rounded-xl border border-white/15 bg-blue-500/10 text-white/80 hover:bg-blue-500/15"
            title="Add New Resort"
          >
            <PlusSquare className="h-5 w-5 text-blue-400/80" />
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
          <EnhancedResortsTable
            data={filteredResorts}
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
                render: (_value, resort) => (
                  <div className="flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10">
                      {resort.imageUrl ? (
                        <img
                          src={resort.imageUrl}
                          alt={resort.name}
                          className="h-full w-full rounded-xl object-cover"
                        />
                      ) : (
                        <Building className="h-6 w-6 text-white/70" />
                      )}
                    </div>
                  </div>
                ),
              },
              {
                key: 'name',
                label: 'Resort',
                priority: 'high',
                sortable: true,
                minWidth: 200,
                render: (_value, resort) => (
                  <p className="font-bold text-xs text-white">{resort.name}</p>
                ),
              },
              {
                key: 'location',
                label: 'Location',
                priority: 'high',
                sortable: true,
                minWidth: 150,
                render: (value) => (
                  <span className="text-xs text-white/80">{value || 'N/A'}</span>
                ),
              },
              {
                key: 'description',
                label: 'Description',
                priority: 'medium',
                sortable: false,
                minWidth: 200,
                render: (value) => (
                  <span className="text-white/70 line-clamp-2">
                    {value || 'No description'}
                  </span>
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

        {filteredResorts.length > 0 && (
          <footer className="flex items-center justify-between border-t border-white/10 px-6 py-4">
            <div className="text-xs text-white/50">
              Showing {filteredResorts.length} of {resorts.length} resorts
            </div>
          </footer>
        )}
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