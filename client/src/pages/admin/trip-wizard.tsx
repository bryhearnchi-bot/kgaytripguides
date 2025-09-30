import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Ship,
  MapPin,
  Users,
  FileText,
  Calendar,
  Plus,
  X
} from 'lucide-react';
import { format } from 'date-fns';

interface TripWizardProps {
  isEditing?: boolean;
}

interface TripFormData {
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  shipId?: number;
  shipName: string;
  cruiseLine: string;
  description?: string;
  heroImageUrl?: string;
  highlights?: string[];
  includesInfo?: any;
  pricing?: any;
}

export default function TripWizard({ isEditing = false }: TripWizardProps) {
  const [, navigate] = useLocation();
  const params = useParams();
  const tripId = params.id ? parseInt(params.id) : undefined;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState('basic');
  const [selectedLocations, setSelectedLocations] = useState<number[]>([]);
  const [selectedTalent, setSelectedTalent] = useState<number[]>([]);

  const [formData, setFormData] = useState<TripFormData>({
    name: '',
    slug: '',
    startDate: '',
    endDate: '',
    shipName: '',
    cruiseLine: '',
  });

  // Fetch existing trip data if editing
  const { data: existingTrip } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      if (!tripId) return null;
      const response = await fetch(`/api/trips/${tripId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch trip');
      return response.json();
    },
    enabled: isEditing && !!tripId
  });

  // Fetch ships
  const { data: ships = [] } = useQuery({
    queryKey: ['ships'],
    queryFn: async () => {
      const response = await fetch('/api/ships', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch ships');
      return response.json();
    }
  });

  // Fetch locations
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await fetch('/api/locations', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    }
  });

  // Fetch talent
  const { data: talent = [] } = useQuery({
    queryKey: ['talent'],
    queryFn: async () => {
      const response = await fetch('/api/talent', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch talent');
      return response.json();
    }
  });

  // Populate form with existing data
  useEffect(() => {
    if (existingTrip) {
      setFormData({
        name: existingTrip.name,
        slug: existingTrip.slug,
        startDate: existingTrip.startDate,
        endDate: existingTrip.endDate,
        shipId: existingTrip.shipId,
        shipName: existingTrip.shipName,
        cruiseLine: existingTrip.cruiseLine,
        description: existingTrip.description,
        heroImageUrl: existingTrip.heroImageUrl,
        highlights: existingTrip.highlights,
        includesInfo: existingTrip.includesInfo,
        pricing: existingTrip.pricing,
      });
    }
  }, [existingTrip]);

  // Create/Update trip mutation
  const saveTripMutation = useMutation({
    mutationFn: async (data: TripFormData) => {
      const url = isEditing ? `/api/trips/${tripId}` : '/api/trips';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to save trip');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast({
        title: 'Success',
        description: `Trip ${isEditing ? 'updated' : 'created'} successfully`,
      });
      navigate('/admin');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} trip`,
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = () => {
    saveTripMutation.mutate(formData);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleShipSelect = (shipId: string) => {
    const ship = ships.find((s: any) => s.id === parseInt(shipId));
    if (ship) {
      setFormData({
        ...formData,
        shipId: ship.id,
        shipName: ship.name,
        cruiseLine: ship.cruiseLine
      });
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: <FileText size={16} /> },
    { id: 'ship', label: 'Ship Details', icon: <Ship size={16} /> },
    { id: 'itinerary', label: 'Itinerary', icon: <MapPin size={16} /> },
    { id: 'entertainment', label: 'Entertainment', icon: <Users size={16} /> },
    { id: 'info', label: 'Info Sections', icon: <FileText size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Edit Trip' : 'Create New Trip'}
              </h1>
              <p className="text-sm text-gray-500">
                Complete all sections to {isEditing ? 'update' : 'create'} your trip guide
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6]"
              disabled={saveTripMutation.isPending}
            >
              <Save className="mr-2" size={20} />
              {isEditing ? 'Update Trip' : 'Create Trip'}
            </Button>
          </div>
        </div>
      </div>

      {/* Wizard Content */}
      <div className="p-8">
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="mb-6">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Trip Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          name: e.target.value,
                          slug: generateSlug(e.target.value)
                        });
                      }}
                      placeholder="e.g., Greek Isles Paradise 2025"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="greek-isles-paradise-2025"
                    />
                  </div>

                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    placeholder="Enter trip description..."
                  />
                </div>

                <div>
                  <Label htmlFor="heroImage">Hero Image URL</Label>
                  <Input
                    id="heroImage"
                    value={formData.heroImageUrl || ''}
                    onChange={(e) => setFormData({ ...formData, heroImageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ship Selection Tab */}
          <TabsContent value="ship">
            <Card>
              <CardHeader>
                <CardTitle>Ship Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="shipSelect">Select Ship</Label>
                  <Select
                    value={formData.shipId?.toString()}
                    onValueChange={handleShipSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a ship" />
                    </SelectTrigger>
                    <SelectContent>
                      {ships.map((ship: any) => (
                        <SelectItem key={ship.id} value={ship.id.toString()}>
                          {ship.name} - {ship.cruiseLine}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.shipId && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Selected Ship Details</h4>
                    <p><strong>Name:</strong> {formData.shipName}</p>
                    <p><strong>Cruise Line:</strong> {formData.cruiseLine}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/admin/ships')}
                  >
                    <Plus className="mr-2" size={16} />
                    Add New Ship
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Itinerary Tab */}
          <TabsContent value="itinerary">
            <Card>
              <CardHeader>
                <CardTitle>Itinerary & Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label>Select Locations</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {locations.map((location: any) => (
                      <label
                        key={location.id}
                        className="flex items-center p-2 border rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLocations.includes(location.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLocations([...selectedLocations, location.id]);
                            } else {
                              setSelectedLocations(selectedLocations.filter(id => id !== location.id));
                            }
                          }}
                          className="mr-2"
                        />
                        <div>
                          <div className="font-medium">{location.name}</div>
                          <div className="text-sm text-gray-500">{location.country}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Entertainment Tab */}
          <TabsContent value="entertainment">
            <Card>
              <CardHeader>
                <CardTitle>Entertainment & Talent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label>Select Artists/Talent</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {talent.map((artist: any) => (
                      <label
                        key={artist.id}
                        className="flex items-center p-2 border rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTalent.includes(artist.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTalent([...selectedTalent, artist.id]);
                            } else {
                              setSelectedTalent(selectedTalent.filter(id => id !== artist.id));
                            }
                          }}
                          className="mr-2"
                        />
                        <div>
                          <div className="font-medium">{artist.name}</div>
                          <div className="text-sm text-gray-500">{artist.category}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Info Sections Tab */}
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Information Sections</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Add and manage information sections for this trip.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/admin/info-sections')}
                >
                  <FileText className="mr-2" size={16} />
                  Manage Info Sections
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => {
              const currentIndex = tabs.findIndex(t => t.id === currentTab);
              const prevTab = tabs[currentIndex - 1];
              if (currentIndex > 0 && prevTab) {
                setCurrentTab(prevTab.id);
              }
            }}
            disabled={currentTab === 'basic'}
          >
            <ArrowLeft className="mr-2" size={16} />
            Previous
          </Button>

          <Button
            onClick={() => {
              const currentIndex = tabs.findIndex(t => t.id === currentTab);
              const nextTab = tabs[currentIndex + 1];
              if (currentIndex < tabs.length - 1 && nextTab) {
                setCurrentTab(nextTab.id);
              }
            }}
            disabled={currentTab === 'info'}
            className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6]"
          >
            Next
            <ArrowRight className="ml-2" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}