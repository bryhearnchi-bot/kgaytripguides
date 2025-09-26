import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ResponsiveAdminTable } from '@/components/admin/ResponsiveAdminTable';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAdminQueryOptions } from '@/hooks/use-admin-prefetch';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Ship, Plus, Edit2, Trash2, Search, Users, Calendar, Anchor, CheckCircle, Wrench, AlertCircle } from 'lucide-react';
import { AdminFormModal } from '@/components/admin/AdminFormModal';

const fieldBaseClasses = "h-11 rounded-xl border border-white/15 bg-white/10 text-sm text-white placeholder:text-white/60 focus:border-[#22d3ee]/70 focus:ring-0 focus:ring-offset-0";
const textareaBaseClasses = "rounded-xl border border-white/15 bg-white/10 text-sm text-white placeholder:text-white/60 focus:border-[#22d3ee]/70 focus:ring-0 focus:ring-offset-0";

interface ShipData {
  id?: number;
  name: string;
  cruiseLine: string;
  shipCode?: string;
  capacity?: number;
  crewSize?: number;
  grossTonnage?: number;
  lengthMeters?: number;
  beamMeters?: number;
  decks?: number;
  builtYear?: number;
  refurbishedYear?: number;
  shipClass?: string;
  flag?: string;
  imageUrl?: string;
  description?: string;
  highlights?: string[];
  amenities?: string[];
  status?: 'active' | 'maintenance' | 'retired';
}

export default function ShipsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const adminQueryOptions = useAdminQueryOptions();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingShip, setEditingShip] = useState<ShipData | null>(null);
  const [formData, setFormData] = useState<ShipData>({
    name: '',
    cruiseLine: '',
    status: 'active',
  });
  const { profile } = useSupabaseAuthContext();
  const canDelete = profile?.role && ['admin', 'content_manager', 'super_admin'].includes(profile.role);

  const handleModalOpenChange = (open: boolean) => {
    setShowAddModal(open);
    if (!open) {
      setEditingShip(null);
      resetForm();
    }
  };

  // Fetch ships with optimized caching
  const { data: ships = [], isLoading, isPlaceholderData } = useQuery<ShipData[]>({
    queryKey: ['ships'],
    queryFn: async () => {
      const response = await fetch('/api/ships', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch ships');
      return response.json();
    },
    ...adminQueryOptions,
    placeholderData: []
  });

  // Create ship mutation
  const createShipMutation = useMutation({
    mutationFn: async (data: ShipData) => {
      const response = await fetch('/api/ships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create ship');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ships'] });
      setShowAddModal(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Ship created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create ship',
        variant: 'destructive',
      });
    }
  });

  // Update ship mutation
  const updateShipMutation = useMutation({
    mutationFn: async (data: ShipData) => {
      const response = await fetch(`/api/ships/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update ship');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ships'] });
      setEditingShip(null);
      resetForm();
      toast({
        title: 'Success',
        description: 'Ship updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update ship',
        variant: 'destructive',
      });
    }
  });

  // Delete ship mutation
  const deleteShipMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/ships/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
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
        description: error.message.includes('Cannot delete ship')
          ? 'This ship is assigned to cruises and cannot be deleted'
          : 'Failed to delete ship',
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      cruiseLine: '',
      status: 'active',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingShip) {
      updateShipMutation.mutate({ ...formData, id: editingShip.id });
    } else {
      createShipMutation.mutate(formData);
    }
  };

  const handleEdit = (ship: ShipData) => {
    setEditingShip(ship);
    setFormData(ship);
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this ship?')) {
      deleteShipMutation.mutate(id);
    }
  };

  const filteredShips = ships.filter(ship =>
    ship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ship.cruiseLine.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ship.shipCode && ship.shipCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getFleetIcon = (cruiseLine: string) => {
    return <Anchor className="h-3.5 w-3.5" />;
  };

  // Show skeleton while loading initial data
  if (isLoading && ships.length === 0) {
    return <AdminTableSkeleton rows={5} />;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Ships & Fleet Management</h1>
            <p className="text-sm text-white/60">Manage vessel fleet across Atlantis sailings.</p>
          </div>
          <Button
            onClick={() => {
              setEditingShip(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 hover:from-[#38e0f6] hover:to-[#3b82f6] min-h-[44px] touch-manipulation"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Ship
          </Button>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search ships by name, cruise line, or code"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 rounded-full border-white/10 bg-white/10 pl-10 text-sm text-white placeholder:text-white/50 focus:border-[#22d3ee]/70"
            />
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-white/60">
            <Button variant="ghost" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10 min-h-[36px] touch-manipulation">
              Active
            </Button>
            <Button variant="ghost" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10 min-h-[36px] touch-manipulation">
              Status
            </Button>
            <Button variant="ghost" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10 min-h-[36px] touch-manipulation">
              Fleet
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
        <header className="flex flex-col gap-2 border-b border-white/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">All Ships ({filteredShips.length})</h2>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Across all fleets</p>
          </div>
        </header>

        {filteredShips.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-white/60">
            <Ship className="h-10 w-10 text-white/30" />
            <p className="text-sm">{searchTerm ? 'No ships match your search.' : 'Get started by adding your first ship.'}</p>
            {!searchTerm && (
              <Button
                onClick={() => {
                  setEditingShip(null);
                  resetForm();
                  setShowAddModal(true);
                }}
                className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-4 py-2 text-sm text-white min-h-[44px] touch-manipulation"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Ship
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-full text-sm text-white/80">
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10">
                  <TableHead className="text-white/60">Ship</TableHead>
                  <TableHead className="text-white/60">Fleet</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  <TableHead className="text-right text-white/60">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShips.map((ship) => (
                  <TableRow key={ship.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="py-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10">
                          {ship.imageUrl ? (
                            <img
                              src={ship.imageUrl}
                              alt={ship.name}
                              className="h-full w-full rounded-xl object-cover"
                            />
                          ) : (
                            <Ship className="h-5 w-5 text-white/70" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-white">{ship.name}</p>
                          {ship.description && (
                            <p className="text-xs text-white/60 line-clamp-2">{ship.description}</p>
                          )}
                          {ship.shipCode && (
                            <p className="text-xs text-white/40">Code: {ship.shipCode}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                        {getFleetIcon(ship.cruiseLine)}
                        <span>{ship.cruiseLine}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ship.status || 'active'} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(ship)}
                          className="h-8 w-8 rounded-full border border-white/15 bg-white/5 p-0 text-white/80 hover:bg-white/10"
                          title="Edit Ship"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(ship.id!)}
                          className="h-8 w-8 rounded-full border border-[#fb7185]/30 bg-[#fb7185]/10 p-0 text-[#fb7185] hover:bg-[#fb7185]/20"
                          title="Delete Ship"
                          disabled={!canDelete}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <footer className="border-t border-white/10 px-6 py-4 text-xs text-white/50">
          Showing {filteredShips.length} ship{filteredShips.length === 1 ? '' : 's'}
        </footer>
      </section>

      {/* Add/Edit Modal */}
      <AdminFormModal
        isOpen={showAddModal}
        onOpenChange={handleModalOpenChange}
        title={editingShip ? 'Edit Ship' : 'Add New Ship'}
        description="Enter the ship information below"
        onSubmit={handleSubmit}
        primaryAction={{
          label: editingShip ? 'Save Changes' : 'Create Ship',
          loading: editingShip ? updateShipMutation.isPending : createShipMutation.isPending,
          loadingLabel: editingShip ? 'Saving...' : 'Creating...'
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => handleModalOpenChange(false)
        }}
        contentClassName="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto px-1"
      >
        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="name">Ship Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className={fieldBaseClasses}
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="cruiseLine">Cruise Line *</Label>
          <Input
            id="cruiseLine"
            value={formData.cruiseLine}
            onChange={(e) => setFormData({ ...formData, cruiseLine: e.target.value })}
            required
            className={fieldBaseClasses}
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status || 'active'}
            onValueChange={(value: 'active' | 'maintenance' | 'retired') => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger className={`${fieldBaseClasses} text-left`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="shipCode">Ship Code</Label>
          <Input
            id="shipCode"
            value={formData.shipCode || ''}
            onChange={(e) => setFormData({ ...formData, shipCode: e.target.value })}
            placeholder="e.g., VL"
            className={fieldBaseClasses}
          />
        </div>

        <div>
          <Label htmlFor="shipClass">Ship Class</Label>
          <Input
            id="shipClass"
            value={formData.shipClass || ''}
            onChange={(e) => setFormData({ ...formData, shipClass: e.target.value })}
            placeholder="e.g., Lady Ships"
            className={fieldBaseClasses}
          />
        </div>

        <div>
          <Label htmlFor="capacity">Passenger Capacity</Label>
          <Input
            id="capacity"
            type="number"
            value={formData.capacity || ''}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || undefined })}
            className={fieldBaseClasses}
          />
        </div>

        <div>
          <Label htmlFor="crewSize">Crew Size</Label>
          <Input
            id="crewSize"
            type="number"
            value={formData.crewSize || ''}
            onChange={(e) => setFormData({ ...formData, crewSize: parseInt(e.target.value) || undefined })}
            className={fieldBaseClasses}
          />
        </div>

        <div>
          <Label htmlFor="decks">Number of Decks</Label>
          <Input
            id="decks"
            type="number"
            value={formData.decks || ''}
            onChange={(e) => setFormData({ ...formData, decks: parseInt(e.target.value) || undefined })}
            className={fieldBaseClasses}
          />
        </div>

        <div>
          <Label htmlFor="builtYear">Year Built</Label>
          <Input
            id="builtYear"
            type="number"
            value={formData.builtYear || ''}
            onChange={(e) => setFormData({ ...formData, builtYear: parseInt(e.target.value) || undefined })}
            placeholder="e.g., 2021"
            className={fieldBaseClasses}
          />
        </div>

        <div>
          <Label htmlFor="lengthMeters">Length (meters)</Label>
          <Input
            id="lengthMeters"
            type="number"
            step="0.01"
            value={formData.lengthMeters || ''}
            onChange={(e) => setFormData({ ...formData, lengthMeters: parseFloat(e.target.value) || undefined })}
            className={fieldBaseClasses}
          />
        </div>

        <div>
          <Label htmlFor="flag">Flag/Registry</Label>
          <Input
            id="flag"
            value={formData.flag || ''}
            onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
            placeholder="e.g., Malta"
            className={fieldBaseClasses}
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className={textareaBaseClasses}
          />
        </div>
      </AdminFormModal>
    </div>
  );
}
