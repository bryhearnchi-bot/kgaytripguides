import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Ship,
  Plus,
  Edit2,
  Trash2,
  Search,
  Users,
  Calendar,
  Anchor,
  ArrowLeft,
  Save,
  X
} from 'lucide-react';

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
}

export default function ShipsManagement() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingShip, setEditingShip] = useState<ShipData | null>(null);
  const [formData, setFormData] = useState<ShipData>({
    name: '',
    cruiseLine: '',
  });

  // Fetch ships
  const { data: ships = [], isLoading } = useQuery<ShipData[]>({
    queryKey: ['ships'],
    queryFn: async () => {
      const response = await fetch('/api/ships', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch ships');
      return response.json();
    }
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
    ship.cruiseLine.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
              >
                <ArrowLeft className="mr-2" size={16} />
                Back to Dashboard
              </Button>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cruise Ships</h1>
              <p className="text-sm text-gray-500">Manage your fleet information and specifications</p>
            </div>
            <Button
              onClick={() => {
                setEditingShip(null);
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6]"
            >
              <Plus className="mr-2" size={20} />
              Add New Ship
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-8 py-4 bg-white border-b">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search ships by name or cruise line..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Ships Grid */}
      <div className="p-8">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading ships...</div>
        ) : filteredShips.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Ship className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-semibold mb-2">No ships found</h3>
              <p className="text-gray-500 mb-4">Start by adding your first ship</p>
              <Button
                onClick={() => {
                  setEditingShip(null);
                  resetForm();
                  setShowAddModal(true);
                }}
                className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6]"
              >
                <Plus className="mr-2" size={20} />
                Add New Ship
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShips.map((ship) => (
              <Card key={ship.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-32 bg-gradient-to-br from-[#1e3a5f] to-[#0f2238] flex items-center justify-center">
                  <Ship className="text-white/20" size={64} />
                </div>
                <CardHeader>
                  <CardTitle>{ship.name}</CardTitle>
                  <CardDescription>{ship.cruiseLine}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {ship.capacity && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users size={16} />
                        <span>{ship.capacity.toLocaleString()} Guests</span>
                      </div>
                    )}
                    {ship.decks && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Anchor size={16} />
                        <span>{ship.decks} Decks</span>
                      </div>
                    )}
                    {ship.builtYear && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} />
                        <span>Built {ship.builtYear}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(ship)}
                    >
                      <Edit2 className="mr-1" size={16} />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(ship.id!)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="mr-1" size={16} />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingShip ? 'Edit Ship' : 'Add New Ship'}
            </DialogTitle>
            <DialogDescription>
              Enter the ship information below
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2">
                <Label htmlFor="name">Ship Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="cruiseLine">Cruise Line *</Label>
                <Input
                  id="cruiseLine"
                  value={formData.cruiseLine}
                  onChange={(e) => setFormData({ ...formData, cruiseLine: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="shipCode">Ship Code</Label>
                <Input
                  id="shipCode"
                  value={formData.shipCode || ''}
                  onChange={(e) => setFormData({ ...formData, shipCode: e.target.value })}
                  placeholder="e.g., VL"
                />
              </div>

              <div>
                <Label htmlFor="shipClass">Ship Class</Label>
                <Input
                  id="shipClass"
                  value={formData.shipClass || ''}
                  onChange={(e) => setFormData({ ...formData, shipClass: e.target.value })}
                  placeholder="e.g., Lady Ships"
                />
              </div>

              <div>
                <Label htmlFor="capacity">Passenger Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity || ''}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || undefined })}
                />
              </div>

              <div>
                <Label htmlFor="crewSize">Crew Size</Label>
                <Input
                  id="crewSize"
                  type="number"
                  value={formData.crewSize || ''}
                  onChange={(e) => setFormData({ ...formData, crewSize: parseInt(e.target.value) || undefined })}
                />
              </div>

              <div>
                <Label htmlFor="decks">Number of Decks</Label>
                <Input
                  id="decks"
                  type="number"
                  value={formData.decks || ''}
                  onChange={(e) => setFormData({ ...formData, decks: parseInt(e.target.value) || undefined })}
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
                />
              </div>

              <div>
                <Label htmlFor="flag">Flag/Registry</Label>
                <Input
                  id="flag"
                  value={formData.flag || ''}
                  onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                  placeholder="e.g., Malta"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingShip(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6]"
                disabled={createShipMutation.isPending || updateShipMutation.isPending}
              >
                <Save className="mr-2" size={16} />
                {editingShip ? 'Update Ship' : 'Create Ship'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}