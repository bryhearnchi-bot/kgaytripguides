import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { EnhancedShipsTable } from '@/components/admin/EnhancedShipsTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ShipFormModal } from '@/components/admin/ShipFormModal';
import { api } from '@/lib/api-client';
import { Ship, Plus, PlusSquare, Edit2, Trash2, Search, Users, Calendar, Anchor } from 'lucide-react';

interface Ship {
  id?: number;
  name: string;
  cruiseLine: string;
  capacity?: number;
  decks?: number;
  imageUrl?: string;
  deckPlansUrl?: string;
  description?: string;
  cruiseCount?: number;
}

export default function ShipsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingShip, setEditingShip] = useState<Ship | null>(null);

  const handleModalOpenChange = (open: boolean) => {
    setShowAddModal(open);
    if (!open) {
      setEditingShip(null);
    }
  };

  // Fetch ships
  const { data: ships = [], isLoading } = useQuery<Ship[]>({
    queryKey: ['ships'],
    queryFn: async () => {
      const response = await api.get('/api/ships');
      if (!response.ok) throw new Error('Failed to fetch ships');
      return response.json();
    }
  });

  // Delete ship mutation
  const deleteShipMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/api/ships/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete ship');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ships'] });
      toast({
        title: 'Success',
        description: 'Ship deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message.includes('Cannot delete')
          ? 'This ship is assigned to cruises and cannot be deleted'
          : 'Failed to delete ship',
        variant: 'destructive',
      });
    }
  });

  const handleEdit = (ship: Ship) => {
    setEditingShip(ship);
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this ship?')) {
      deleteShipMutation.mutate(id);
    }
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['ships'] });
    setShowAddModal(false);
    setEditingShip(null);
  };

  const filteredShips = ships.filter(ship =>
    ship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ship.cruiseLine.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
              <Ship className="h-6 w-6" />
              Cruise Ships
            </h1>
            <p className="text-sm text-white/60">Manage your fleet information and specifications</p>
          </div>
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search ships by name or cruise line"
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
            <h2 className="text-lg font-semibold text-white">All Ships</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingShip(null);
              setShowAddModal(true);
            }}
            className="h-4 w-4 rounded-xl border border-white/15 bg-blue-500/10 text-white/80 hover:bg-blue-500/15"
            title="Add New Ship"
          >
            <PlusSquare className="h-5 w-5 text-blue-400/80" />
          </Button>
        </header>

        {filteredShips.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-white/60">
            <Ship className="h-10 w-10 text-white/30" />
            <p className="text-sm">{searchTerm ? 'No ships match your search.' : 'Get started by adding your first ship.'}</p>
            {!searchTerm && (
              <Button
                onClick={() => {
                  setEditingShip(null);
                  setShowAddModal(true);
                }}
                className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-4 py-2 text-sm text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Ship
              </Button>
            )}
          </div>
        ) : (
          <EnhancedShipsTable
            data={filteredShips}
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
                render: (_value, ship) => (
                  <div className="flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10">
                      {ship.imageUrl ? (
                        <img
                          src={ship.imageUrl}
                          alt={ship.name}
                          className="h-full w-full rounded-xl object-cover"
                        />
                      ) : (
                        <Ship className="h-6 w-6 text-white/70" />
                      )}
                    </div>
                  </div>
                ),
              },
              {
                key: 'name',
                label: 'Ship Name',
                priority: 'high',
                sortable: true,
                minWidth: 200,
                render: (value) => (
                  <p className="font-bold text-xs text-white">{value}</p>
                ),
              },
              {
                key: 'cruiseLine',
                label: 'Cruise Line',
                priority: 'high',
                sortable: true,
                minWidth: 150,
                render: (value) => (
                  <span className="text-white/80">{value}</span>
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
                label: 'Capacity',
                priority: 'medium',
                sortable: true,
                minWidth: 100,
                render: (value) => (
                  <span className="text-white/80">
                    {value ? `${value.toLocaleString()} guests` : 'N/A'}
                  </span>
                ),
              },
              {
                key: 'cruiseCount',
                label: 'Usage',
                priority: 'medium',
                sortable: true,
                minWidth: 80,
                render: (value) => (
                  <span className="text-white/80">
                    {value || 0} cruise{(value || 0) === 1 ? '' : 's'}
                  </span>
                ),
              },
            ]}
            actions={[
              {
                label: 'Edit Ship',
                icon: <Edit2 className="h-4 w-4" />,
                onClick: handleEdit,
              },
              {
                label: 'Delete Ship',
                icon: <Trash2 className="h-4 w-4" />,
                onClick: (ship) => handleDelete(ship.id!),
                variant: 'destructive',
              },
            ]}
            keyField="id"
            isLoading={isLoading}
            emptyMessage={searchTerm ? 'No ships match your search.' : 'Get started by adding your first ship.'}
          />
        )}

        {filteredShips.length > 0 && (
          <footer className="flex items-center justify-between border-t border-white/10 px-6 py-4">
            <div className="text-xs text-white/50">
              Showing {filteredShips.length} of {ships.length} ships
            </div>
          </footer>
        )}
      </section>

      {/* Ship Form Modal */}
      <ShipFormModal
        isOpen={showAddModal}
        onOpenChange={handleModalOpenChange}
        ship={editingShip}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}