import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
      const response = await api.get('/api/ships');
      if (!response.ok) throw new Error('Failed to fetch ships');
      return response.json();
    }
  });

  // Create ship mutation
  const createShipMutation = useMutation({
    mutationFn: async (data: ShipData) => {
      const response = await api.post('/api/ships', data);
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
      const response = await api.put(`/api/ships/${data.id}`, data);
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cruise Ships</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your fleet information and specifications</p>
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

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search ships by name or cruise line..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Ships Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading ships...</div>
          ) : filteredShips.length === 0 ? (
            <div className="text-center py-12">
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
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ship Details</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Ports</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShips.map((ship) => (
                    <TableRow key={ship.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#1e3a5f] to-[#0f2238] rounded-lg flex items-center justify-center text-white">
                            <Ship className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{ship.name}</div>
                            <div className="text-sm text-gray-500">{ship.cruiseLine}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {ship.capacity ? (
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">{ship.capacity.toLocaleString()}</span>
                              <span className="text-gray-500">guests</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not specified</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <Anchor className="w-3 h-3 mr-1" />
                            Multiple Ports
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <Calendar className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(ship)}
                            title="Edit Ship"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(ship.id!)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete Ship"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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