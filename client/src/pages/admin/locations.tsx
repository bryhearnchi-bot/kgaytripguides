import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Search,
  Globe,
  Anchor,
  Save,
  X,
  Map,
  Eye
} from 'lucide-react';

interface Port {
  id?: number;
  name: string;
  country: string;
  region?: string;
  port_type?: 'port' | 'sea_day' | 'embark' | 'disembark';
  coordinates?: { lat: number; lng: number };
  description?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export default function LocationsManagement() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPort, setEditingPort] = useState<Port | null>(null);
  const [formData, setFormData] = useState<Port>({
    name: '',
    country: '',
    port_type: 'port',
  });

  // Fetch ports
  const { data: ports = [], isLoading } = useQuery<Port[]>({
    queryKey: ['ports'],
    queryFn: async () => {
      const response = await fetch('/api/ports', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch ports');
      return response.json();
    }
  });

  // Create port mutation
  const createPortMutation = useMutation({
    mutationFn: async (data: Port) => {
      const response = await fetch('/api/ports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create port');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ports'] });
      setShowAddModal(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Location created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create location',
        variant: 'destructive',
      });
    }
  });

  // Update port mutation
  const updatePortMutation = useMutation({
    mutationFn: async (data: Port) => {
      const response = await fetch(`/api/ports/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update port');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ports'] });
      setEditingPort(null);
      resetForm();
      toast({
        title: 'Success',
        description: 'Location updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update location',
        variant: 'destructive',
      });
    }
  });

  // Delete port mutation
  const deletePortMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/ports/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete port');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ports'] });
      toast({
        title: 'Success',
        description: 'Location deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message.includes('Cannot delete')
          ? 'This location is being used and cannot be deleted'
          : 'Failed to delete location',
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      country: '',
      port_type: 'port',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPort) {
      updatePortMutation.mutate({ ...formData, id: editingPort.id });
    } else {
      createPortMutation.mutate(formData);
    }
  };

  const handleEdit = (port: Port) => {
    setEditingPort(port);
    setFormData(port);
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this location?')) {
      deletePortMutation.mutate(id);
    }
  };

  const filteredPorts = ports.filter(port =>
    port.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    port.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    port.region?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'port': return 'bg-blue-500';
      case 'sea_day': return 'bg-cyan-500';
      case 'embark': return 'bg-green-500';
      case 'disembark': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'port': return 'Port';
      case 'sea_day': return 'Sea Day';
      case 'embark': return 'Embarkation';
      case 'disembark': return 'Disembarkation';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage ports and destinations across all cruises</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => {
              setEditingPort(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Location
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search locations by name, country, or region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Locations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Locations ({filteredPorts.length})</CardTitle>
          <CardDescription>
            Manage ports and destinations across all cruises
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <MapPin className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-600" />
              <p>Loading locations...</p>
            </div>
          ) : filteredPorts.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating your first location.'}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => {
                    setEditingPort(null);
                    resetForm();
                    setShowAddModal(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Location
                </Button>
              )}
            </div>
          ) : (
            <LocationsTable
              ports={filteredPorts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              getTypeColor={getTypeColor}
              getTypeLabel={getTypeLabel}
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPort ? 'Edit Location' : 'Add New Location'}
            </DialogTitle>
            <DialogDescription>
              Enter the location information below
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2">
                <Label htmlFor="name">Location Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={formData.region || ''}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="e.g., Caribbean, Mediterranean"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="port_type">Location Type</Label>
                <Select
                  value={formData.port_type}
                  onValueChange={(value) => setFormData({ ...formData, port_type: value as Port['port_type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="port">Port</SelectItem>
                    <SelectItem value="sea_day">Sea Day</SelectItem>
                    <SelectItem value="embark">Embarkation Port</SelectItem>
                    <SelectItem value="disembark">Disembarkation Port</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Brief description of the location..."
                />
              </div>

              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  value={formData.coordinates?.lat || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    coordinates: {
                      lat: parseFloat(e.target.value),
                      lng: formData.coordinates?.lng || 0
                    }
                  })}
                />
              </div>

              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  value={formData.coordinates?.lng || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    coordinates: {
                      lat: formData.coordinates?.lat || 0,
                      lng: parseFloat(e.target.value)
                    }
                  })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingPort(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6]"
                disabled={createPortMutation.isPending || updatePortMutation.isPending}
              >
                <Save className="mr-2" size={16} />
                {editingPort ? 'Update Location' : 'Create Location'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Locations Table Component
interface LocationsTableProps {
  ports: Port[];
  onEdit: (port: Port) => void;
  onDelete: (id: number) => void;
  getTypeColor: (type?: string) => string;
  getTypeLabel: (type?: string) => string;
}

function LocationsTable({
  ports,
  onEdit,
  onDelete,
  getTypeColor,
  getTypeLabel
}: LocationsTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Location Details</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type & Region</TableHead>
            <TableHead>Coordinates</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ports.map((port) => (
            <TableRow key={port.id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#1e3a5f] to-[#0f2238] rounded-lg flex items-center justify-center relative overflow-hidden">
                    {port.image_url ? (
                      <img src={port.image_url} alt={port.name} className="w-full h-full object-cover" />
                    ) : (
                      <MapPin className="text-white/60 w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{port.name}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Globe size={12} />
                      {port.country}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-xs">
                  {port.description ? (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {port.description}
                    </p>
                  ) : (
                    <span className="text-sm text-gray-400 italic">No description</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <Badge className={`text-white ${getTypeColor(port.port_type)}`}>
                    {getTypeLabel(port.port_type)}
                  </Badge>
                  {port.region && (
                    <div className="text-sm text-gray-500">{port.region}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {port.coordinates ? (
                  <div className="text-sm space-y-1">
                    <div className="text-gray-600">
                      Lat: {port.coordinates.lat.toFixed(4)}
                    </div>
                    <div className="text-gray-600">
                      Lng: {port.coordinates.lng.toFixed(4)}
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">Not set</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(port)}
                    title="Edit Location"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(port.id!)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Delete Location"
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
  );
}