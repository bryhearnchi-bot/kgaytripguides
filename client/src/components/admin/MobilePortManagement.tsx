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
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useToast } from '../../hooks/use-toast';
import { ImageUpload } from './ImageUpload';
import { BottomSheetModal } from '../mobile/BottomSheetModal';
import { SwipeableActions } from '../mobile/SwipeableActions';
import { MobileDataTable } from '../mobile/MobileDataTable';
import { TouchOptimizedForm } from '../mobile/TouchOptimizedForm';

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

interface MobilePortManagementProps {
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

export default function MobilePortManagement({
  onSelectPort,
  showSelectMode = false,
  allowInlineCreate = false
}: MobilePortManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
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
      setShowCreateModal(false);
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

  const handleSubmitForm = (formData: Record<string, any>) => {
    if (editingPort) {
      updateMutation.mutate({ ...formData, id: editingPort.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Mobile Data Table Configuration
  const columns = [
    {
      key: 'name',
      label: 'Port Name',
      primary: true,
      render: (value: string, row: Port) => (
        <div className="flex items-center gap-2">
          {PORT_TYPES.find(t => t.value === row.port_type)?.icon &&
            React.createElement(PORT_TYPES.find(t => t.value === row.port_type)!.icon, { className: "w-4 h-4 text-blue-600" })
          }
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'country',
      label: 'Country',
      secondary: true,
      render: (value: string, row: Port) => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Globe className="w-4 h-4" />
          <span>{value}</span>
          {row.region && (
            <>
              <span>•</span>
              <span>{row.region}</span>
            </>
          )}
        </div>
      )
    },
    {
      key: 'port_type',
      label: 'Type',
      render: (value: string) => {
        const portType = PORT_TYPES.find(t => t.value === value);
        return (
          <Badge variant={value === 'sea_day' ? 'secondary' : 'default'}>
            {portType?.label || value}
          </Badge>
        );
      }
    },
    {
      key: 'coordinates',
      label: 'Coordinates',
      render: (value: { lat: number; lng: number } | null) =>
        value ? `${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}` : 'N/A'
    },
    {
      key: 'description',
      label: 'Description',
      mobileHidden: true,
      render: (value: string) => value ? value.substring(0, 100) + (value.length > 100 ? '...' : '') : 'N/A'
    }
  ];

  const actions = [
    {
      label: 'Edit',
      icon: <Edit2 className="w-4 h-4" />,
      onClick: (port: Port) => setEditingPort(port)
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (port: Port) => deleteMutation.mutate(port.id),
      variant: 'destructive' as const
    }
  ];

  const selectActions = [
    {
      label: 'Select',
      icon: <Plus className="w-4 h-4" />,
      onClick: (port: Port) => onSelectPort?.(port)
    }
  ];

  // Form configuration for TouchOptimizedForm
  const formSections = [
    {
      title: 'Basic Information',
      fields: [
        {
          name: 'name',
          label: 'Port Name',
          type: 'text' as const,
          placeholder: 'Enter port name',
          required: true,
          icon: <Anchor className="w-4 h-4" />
        },
        {
          name: 'country',
          label: 'Country',
          type: 'text' as const,
          placeholder: 'Enter country',
          required: true,
          icon: <Globe className="w-4 h-4" />
        },
        {
          name: 'region',
          label: 'Region',
          type: 'select' as const,
          placeholder: 'Select region',
          options: REGIONS.map(region => ({ value: region, label: region }))
        },
        {
          name: 'port_type',
          label: 'Port Type',
          type: 'select' as const,
          required: true,
          options: PORT_TYPES.map(type => ({ value: type.value, label: type.label }))
        }
      ]
    },
    {
      title: 'Location Details',
      collapsible: true,
      defaultExpanded: false,
      fields: [
        {
          name: 'coordinates_lat',
          label: 'Latitude',
          type: 'number' as const,
          placeholder: 'e.g., 40.7128',
          icon: <MapPin className="w-4 h-4" />
        },
        {
          name: 'coordinates_lng',
          label: 'Longitude',
          type: 'number' as const,
          placeholder: 'e.g., -74.0060',
          icon: <MapPin className="w-4 h-4" />
        }
      ]
    },
    {
      title: 'Additional Information',
      collapsible: true,
      defaultExpanded: false,
      fields: [
        {
          name: 'description',
          label: 'Description',
          type: 'textarea' as const,
          placeholder: 'Port description, attractions, etc.',
          description: 'Brief description of the port and its attractions'
        }
      ]
    }
  ];

  // Form values transformation
  const getFormValues = (port?: Port | null) => {
    return {
      name: port?.name || '',
      country: port?.country || '',
      region: port?.region || '',
      port_type: port?.port_type || 'port',
      coordinates_lat: port?.coordinates?.lat || '',
      coordinates_lng: port?.coordinates?.lng || '',
      description: port?.description || '',
      image_url: port?.image_url || ''
    };
  };

  const transformFormData = (values: Record<string, any>) => {
    const { coordinates_lat, coordinates_lng, ...rest } = values;

    let coordinates = null;
    if (coordinates_lat && coordinates_lng) {
      coordinates = {
        lat: parseFloat(coordinates_lat),
        lng: parseFloat(coordinates_lng)
      };
    }

    return {
      ...rest,
      coordinates
    };
  };

  return (
    <div className="space-y-4">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="mobile-heading-2 flex items-center gap-2">
              <Anchor className="w-6 h-6" />
              Port Management
            </h1>
            <p className="mobile-body text-blue-100 mt-1">
              Manage ports, destinations, and sea days
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowStatsModal(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-0 flex-1"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Stats
            </Button>
            {!showSelectMode && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-white text-blue-600 hover:bg-gray-100 flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Port
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search ports, countries, or regions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 mobile-input"
          />
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`w-full ${showFilters ? 'bg-blue-50 border-blue-200' : ''}`}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {showFilters ? <ChevronDown className="w-4 h-4 ml-auto" /> : <ChevronRight className="w-4 h-4 ml-auto" />}
        </Button>

        {/* Expandable Filters */}
        {showFilters && (
          <Card className="mobile-card">
            <CardContent className="mobile-card-content space-y-4">
              <div className="space-y-2">
                <label className="mobile-form-label">Port Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="mobile-select"
                >
                  <option value="">All types</option>
                  {PORT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="mobile-form-label">Region</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="mobile-select"
                >
                  <option value="">All regions</option>
                  {REGIONS.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

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
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredPorts.length} of {ports.length} ports
        </span>
        {(selectedType || selectedRegion || searchQuery) && (
          <Badge variant="secondary">Filters active</Badge>
        )}
      </div>

      {/* Mobile Data Table */}
      <MobileDataTable
        data={filteredPorts}
        columns={columns}
        actions={showSelectMode ? selectActions : actions}
        loading={isLoading}
        emptyMessage={
          searchQuery || selectedType || selectedRegion
            ? "No ports match your current filters."
            : "Get started by adding your first port."
        }
        enableSearch={false} // We handle search above
        enableExpandableRows={true}
        keyField="id"
        expandedRowRender={(port) => (
          <div className="space-y-2">
            {port.description && (
              <div>
                <span className="text-sm font-medium text-gray-700">Description:</span>
                <p className="text-sm text-gray-600 mt-1">{port.description}</p>
              </div>
            )}
            {port.image_url && (
              <div>
                <span className="text-sm font-medium text-gray-700">Image:</span>
                <img
                  src={port.image_url}
                  alt={port.name}
                  className="w-full h-32 object-cover rounded-lg mt-1"
                />
              </div>
            )}
          </div>
        )}
      />

      {/* Create Port Modal */}
      <BottomSheetModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Port"
        snapPoints={[0.4, 0.7, 0.95]}
        initialSnapPoint={0.7}
      >
        <TouchOptimizedForm
          sections={formSections}
          values={getFormValues()}
          onChange={() => {}} // Will be handled by form state
          onSubmit={() => {}} // Will be handled by form submission
          onCancel={() => setShowCreateModal(false)}
          submitLabel="Create Port"
          loading={createMutation.isPending}
        />
      </BottomSheetModal>

      {/* Edit Port Modal */}
      <BottomSheetModal
        isOpen={!!editingPort}
        onClose={() => setEditingPort(null)}
        title="Edit Port"
        snapPoints={[0.4, 0.7, 0.95]}
        initialSnapPoint={0.7}
      >
        <TouchOptimizedForm
          sections={formSections}
          values={getFormValues(editingPort)}
          onChange={() => {}} // Will be handled by form state
          onSubmit={() => {}} // Will be handled by form submission
          onCancel={() => setEditingPort(null)}
          submitLabel="Update Port"
          loading={updateMutation.isPending}
        />
      </BottomSheetModal>

      {/* Statistics Modal */}
      <BottomSheetModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title="Port Statistics"
        snapPoints={[0.5, 0.8]}
        initialSnapPoint={0.8}
      >
        {stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="mobile-card">
                <CardContent className="mobile-card-content text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Ports</div>
                </CardContent>
              </Card>

              {Object.entries(stats.byType).slice(0, 3).map(([type, count]) => {
                const portType = PORT_TYPES.find(t => t.value === type);
                const Icon = portType?.icon || Anchor;
                return (
                  <Card key={type} className="mobile-card">
                    <CardContent className="mobile-card-content text-center">
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

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3">By Region</h4>
                <div className="space-y-2">
                  {Object.entries(stats.byRegion).map(([region, count]) => (
                    <div key={region} className="flex justify-between items-center">
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
                    .slice(0, 5)
                    .map(([country, count]) => (
                    <div key={country} className="flex justify-between items-center">
                      <span className="text-sm">{country}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </BottomSheetModal>
    </div>
  );
}