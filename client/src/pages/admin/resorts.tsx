import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { EnhancedResortsTable } from '@/components/admin/EnhancedResortsTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ResortFormModal } from '@/components/admin/ResortFormModal';
import { api } from '@/lib/api-client';
import {
  Building,
  Plus,
  PlusSquare,
  Edit2,
  Trash2,
  Search,
  Users,
  MapPin,
  Hotel,
} from 'lucide-react';

interface Resort {
  id?: number;
  name: string;
  resortCompanyId?: number;
  location: string;
  locationId?: number;
  city?: string;
  stateProvince?: string;
  country?: string;
  countryCode?: string;
  capacity?: number;
  numberOfRooms?: number;
  roomCount?: number; // Deprecated alias
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
  const [showSearch, setShowSearch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

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
    },
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
    },
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
    return (
      resort.name.toLowerCase().includes(searchLower) ||
      resort.location.toLowerCase().includes(searchLower) ||
      resort.city?.toLowerCase().includes(searchLower) ||
      resort.country?.toLowerCase().includes(searchLower)
    );
  });

  // Reset to page 1 when search term changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredResorts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResorts = filteredResorts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4">
      {/* Header Section - Sticky with Safari fix */}
      <div className="safari-sticky-header sticky top-16 z-20 pb-[0.85rem] space-y-4">
        <div className="flex items-center justify-between px-1">
          <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold text-white">
            <Building className="h-5 w-5 sm:h-6 sm:w-6" />
            Resort Properties
          </h1>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
              className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/15"
              aria-label="Search resorts"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingResort(null);
                setShowAddModal(true);
              }}
              className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/15"
              aria-label="Add new resort"
              title="Add New Resort"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="relative px-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              value={searchTerm}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search resorts by name or location"
              className="h-11 rounded-full border-white/5 bg-white/10 pl-10 text-sm text-white placeholder:text-white/50 focus-visible:border-white/20 focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0 focus:border-white/20 focus:ring-1 focus:ring-white/10 focus:ring-offset-0 transition-all"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Subheader - Non-sticky, scrolls with content */}
      <div className="sm:hidden px-1">
        <h2 className="text-lg font-semibold text-white">All Resorts</h2>
      </div>

      <section className="relative sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/5 sm:shadow-2xl sm:shadow-black/40 sm:backdrop-blur">
        <header className="hidden sm:flex flex-col gap-2 border-b border-white/10 px-3 sm:pl-6 sm:pr-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">All Resorts</h2>
          </div>
        </header>

        {filteredResorts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-white/60">
            <Building className="h-10 w-10 text-white/30" />
            <p className="text-sm">
              {searchTerm
                ? 'No resorts match your search.'
                : 'Get started by adding your first resort.'}
            </p>
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
            data={paginatedResorts}
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
                  <div className="flex flex-col gap-0.5">
                    <p className="font-bold text-sm text-white">{resort.name}</p>
                    {resort.location && <p className="text-xs text-white/60">{resort.location}</p>}
                  </div>
                ),
              },
              {
                key: 'description',
                label: 'Description',
                priority: 'medium',
                sortable: false,
                minWidth: 200,
                render: value => (
                  <span className="text-white/70 line-clamp-2">{value || 'No description'}</span>
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
                render: value => (
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
                onClick: resort => handleDelete(resort.id!),
                variant: 'destructive',
              },
            ]}
            keyField="id"
            isLoading={isLoading}
            emptyMessage={
              searchTerm
                ? 'No resorts match your search.'
                : 'Get started by adding your first resort.'
            }
          />
        )}

        {filteredResorts.length > 0 && (
          <footer className="border-t border-white/10 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-white/50">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredResorts.length)} of{' '}
                {filteredResorts.length} resorts
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 px-3 rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNumber}
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePageChange(pageNumber)}
                          className={`h-8 w-8 rounded-full ${
                            currentPage === pageNumber
                              ? 'bg-white/15 text-white'
                              : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 px-3 rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </footer>
        )}
      </section>

      {/* Resort Form Modal */}
      <ResortFormModal
        isOpen={showAddModal}
        onOpenChange={handleModalOpenChange}
        resort={editingResort || undefined}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
