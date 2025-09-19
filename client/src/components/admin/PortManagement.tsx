import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Globe,
  Anchor,
  Navigation,
  Filter,
  Download,
  Upload,
  BarChart3,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { ImageUpload } from './ImageUpload';

interface Port {
  id: number;
  name: string;
  country: string;
  region?: string;
  port_type: 'port' | 'sea_day' | 'embark' | 'disembark';
  coordinates?: { lat: number; lng: number } | null;
  description?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface PortStatistics {
  total: number;
  byType: Record<string, number>;
  byRegion: Record<string, number>;
  byCountry: Record<string, number>;
}

interface PortManagementProps {
  onSelectPort?: (port: Port) => void;
  showSelectMode?: boolean;
  allowInlineCreate?: boolean;
}

const PORT_TYPES = [
  { value: 'port', label: 'Port of Call', icon: Anchor },
  { value: 'sea_day', label: 'Sea Day', icon: Navigation },
  { value: 'embark', label: 'Embarkation', icon: Upload },
  { value: 'disembark', label: 'Disembarkation', icon: Download },
];

const REGIONS = [
  'Mediterranean',
  'Caribbean',
  'Northern Europe',
  'Alaska',
  'Asia',
  'Australia & New Zealand',
  'South America',
  'Transatlantic',
  'Other'
];

export default function PortManagement({
  onSelectPort,
  showSelectMode = false,
  allowInlineCreate = false
}: PortManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [editingPort, setEditingPort] = useState<Port | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch ports with search and filters
  const { data: ports = [], isLoading } = useQuery({
    queryKey: ['ports', searchQuery, selectedType, selectedRegion],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedType) params.append('type', selectedType);
      if (selectedRegion) params.append('region', selectedRegion);

      const response = await fetch(`/api/ports?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch ports');
      return response.json();
    },
  });

  // Fetch port statistics
  const { data: stats } = useQuery({
    queryKey: ['port-stats'],
    queryFn: async () => {
      const response = await fetch('/api/ports/stats', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch port statistics');
      return response.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (portData: Partial<Port>) => {
      const response = await fetch('/api/ports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(portData),
      });
      if (!response.ok) throw new Error('Failed to create port');
      return response.json();
    },
    onSuccess: (newPort) => {
      queryClient.invalidateQueries({ queryKey: ['ports'] });
      queryClient.invalidateQueries({ queryKey: ['port-stats'] });
      setShowCreateDialog(false);
      setEditingPort(null);
      toast({
        title: "Port Added",
        description: `${newPort.name} has been added to the port database.`,
      });

      if (showSelectMode && onSelectPort) {
        onSelectPort(newPort);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create port.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...portData }: Partial<Port> & { id: number }) => {
      const response = await fetch(`/api/ports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(portData),
      });
      if (!response.ok) throw new Error('Failed to update port');
      return response.json();
    },
    onSuccess: (updatedPort) => {
      queryClient.invalidateQueries({ queryKey: ['ports'] });
      queryClient.invalidateQueries({ queryKey: ['port-stats'] });
      setEditingPort(null);
      toast({
        title: "Port Updated",
        description: `${updatedPort.name} has been updated.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update port.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/ports/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete port');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ports'] });
      queryClient.invalidateQueries({ queryKey: ['port-stats'] });
      toast({
        title: "Port Deleted",
        description: "Port has been deleted from the database.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete port.",
        variant: "destructive",
      });
    },
  });

  // Filter ports based on search and filters
  const filteredPorts = useMemo(() => {
    return ports.filter(port => {
      const matchesSearch = !searchQuery ||
        port.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (port.country && port.country.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (port.region && port.region.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = !selectedType || port.port_type === selectedType;
      const matchesRegion = !selectedRegion || port.region === selectedRegion;

      return matchesSearch && matchesType && matchesRegion;
    });
  }, [ports, searchQuery, selectedType, selectedRegion]);

  const handleSubmit = (formData: Partial<Port>) => {
    if (editingPort) {
      updateMutation.mutate({ ...formData, id: editingPort.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const PortForm = ({ port, onSubmit, onCancel }: {
    port?: Port | null;
    onSubmit: (data: Partial<Port>) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState<Partial<Port>>({
      name: port?.name || '',
      country: port?.country || '',
      region: port?.region || '',
      port_type: port?.port_type || 'port',
      description: port?.description || '',
      image_url: port?.image_url || '',
      coordinates: port?.coordinates || null,
    });

    const handleCoordinatesChange = (lat: string, lng: string) => {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (!isNaN(latitude) && !isNaN(longitude)) {
        setFormData(prev => ({
          ...prev,
          coordinates: { lat: latitude, lng: longitude }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          coordinates: null
        }));
      }
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Port Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter port name"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Country *</label>
            <Input
              value={formData.country}
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              placeholder="Enter country"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Region</label>
            <Select
              value={formData.region || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map(region => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Port Type *</label>
            <Select
              value={formData.port_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, port_type: value as Port['port_type'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PORT_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Latitude</label>
            <Input
              type="number"
              step="any"
              value={formData.coordinates?.lat || ''}
              onChange={(e) => handleCoordinatesChange(e.target.value, formData.coordinates?.lng?.toString() || '')}
              placeholder="e.g., 40.7128"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Longitude</label>
            <Input
              type="number"
              step="any"
              value={formData.coordinates?.lng || ''}
              onChange={(e) => handleCoordinatesChange(formData.coordinates?.lat?.toString() || '', e.target.value)}
              placeholder="e.g., -74.0060"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Port description, attractions, etc."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Port Image</label>
          <ImageUpload
            imageType="itinerary"
            onImageUploaded={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
            currentImageUrl={formData.image_url}
            allowUrlInput={true}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={() => onSubmit(formData)}
            disabled={!formData.name || !formData.country || createMutation.isPending || updateMutation.isPending}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {editingPort ? 'Update Port' : 'Create Port'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  const PortCard = ({ port }: { port: Port }) => {
    const portType = PORT_TYPES.find(t => t.value === port.port_type);
    const Icon = portType?.icon || Anchor;

    return (
      <Card className="group hover:shadow-lg transition-all duration-200 border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">{port.name}</CardTitle>
            </div>
            <Badge variant={port.port_type === 'sea_day' ? 'secondary' : 'default'}>
              {portType?.label || port.port_type}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {port.image_url && (
            <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={port.image_url}
                alt={port.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Globe className="w-4 h-4" />
              <span>{port.country || 'N/A'}</span>
              {port.region && (
                <>
                  <span>•</span>
                  <span>{port.region}</span>
                </>
              )}
            </div>

            {port.coordinates && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>
                  {port.coordinates.lat.toFixed(4)}, {port.coordinates.lng.toFixed(4)}
                </span>
              </div>
            )}

            {port.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {port.description}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            {showSelectMode ? (
              <Button
                onClick={() => onSelectPort?.(port)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Select Port
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPort(port)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMutation.mutate(port.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const StatsDialog = () => (
    <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Port Statistics
          </DialogTitle>
        </DialogHeader>

        {stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Ports</div>
                </CardContent>
              </Card>

              {Object.entries(stats.byType).map(([type, count]) => {
                const portType = PORT_TYPES.find(t => t.value === type);
                const Icon = portType?.icon || Anchor;
                return (
                  <Card key={type}>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Icon className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="text-xl font-bold">{count}</div>
                      <div className="text-xs text-gray-600">{portType?.label}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">By Region</h4>
                <div className="space-y-2">
                  {Object.entries(stats.byRegion).map(([region, count]) => (
                    <div key={region} className="flex justify-between">
                      <span className="text-sm">{region}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Top Countries</h4>
                <div className="space-y-2">
                  {Object.entries(stats.byCountry)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 8)
                    .map(([country, count]) => (
                    <div key={country} className="flex justify-between">
                      <span className="text-sm">{country}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header with Ocean Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Anchor className="w-6 h-6" />
              Port Management
            </h1>
            <p className="text-blue-100 mt-1">
              Manage ports, destinations, and sea days for your cruises
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowStatsDialog(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Statistics
            </Button>
            {!showSelectMode && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Port
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search ports, countries, or regions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'bg-blue-50 border-blue-200' : ''}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Port Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {PORT_TYPES.map(type => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Region</label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All regions</SelectItem>
                  {REGIONS.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedType('');
                  setSelectedRegion('');
                  setSearchQuery('');
                }}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredPorts.length} of {ports.length} ports
        </span>
        {(selectedType || selectedRegion || searchQuery) && (
          <span>Filters active</span>
        )}
      </div>

      {/* Port Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-32 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPorts.length === 0 ? (
        <Card className="p-8 text-center">
          <Anchor className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No ports found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedType || selectedRegion
              ? "No ports match your current filters."
              : "Get started by adding your first port."
            }
          </p>
          {!showSelectMode && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Port
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPorts.map((port) => (
            <PortCard key={port.id} port={port} />
          ))}
        </div>
      )}

      {/* Create Port Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Port</DialogTitle>
          </DialogHeader>
          <PortForm
            onSubmit={handleSubmit}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Port Dialog */}
      <Dialog open={!!editingPort} onOpenChange={(open) => !open && setEditingPort(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Port</DialogTitle>
          </DialogHeader>
          <PortForm
            port={editingPort}
            onSubmit={handleSubmit}
            onCancel={() => setEditingPort(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Statistics Dialog */}
      <StatsDialog />
    </div>
  );
}