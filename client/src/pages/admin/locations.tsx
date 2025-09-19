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
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Search,
  Globe,
  Anchor,
  ArrowLeft,
  Save,
  X,
  Map
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
              <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
              <p className="text-sm text-gray-500">Manage ports and destinations</p>
            </div>
            <Button
              onClick={() => {
                setEditingPort(null);
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6]"
            >
              <Plus className="mr-2" size={20} />
              Add New Location
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-8 py-4 bg-white border-b">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Locations Grid */}
      <div className="p-8">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading locations...</div>
        ) : filteredPorts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-semibold mb-2">No locations found</h3>
              <p className="text-gray-500 mb-4">Start by adding your first location</p>
              <Button
                onClick={() => {
                  setEditingPort(null);
                  resetForm();
                  setShowAddModal(true);
                }}
                className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6]"
              >
                <Plus className="mr-2" size={20} />
                Add New Location
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPorts.map((port) => (
              <Card key={port.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-32 bg-gradient-to-br from-[#1e3a5f] to-[#0f2238] flex items-center justify-center relative">
                  {port.image_url ? (
                    <img src={port.image_url} alt={port.name} className="w-full h-full object-cover" />
                  ) : (
                    <MapPin className="text-white/20" size={64} />
                  )}
                  <Badge className={`absolute top-2 right-2 ${getTypeColor(port.port_type)}`}>
                    {getTypeLabel(port.port_type)}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle>{port.name}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-1">
                      <Globe size={14} />
                      {port.country}
                      {port.region && ` • ${port.region}`}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {port.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {port.description}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(port)}
                    >
                      <Edit2 className="mr-1" size={16} />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(port.id!)}
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