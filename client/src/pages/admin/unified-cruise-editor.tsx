import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Save, 
  Ship, 
  Calendar, 
  Info, 
  MapPin,
  Clock,
  Users,
  Sparkles
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Tab Components
import SetupAndItineraryTab from '../../components/admin/SetupAndItineraryTab';
import EventsAndEntertainmentTab from '../../components/admin/EventsAndEntertainmentTab';  
import InfoAndUpdatesTab from '../../components/admin/InfoAndUpdatesTab';
import AiAssistPanel from '../../components/admin/AiAssistPanel';

interface UnifiedCruiseEditorProps {
  cruiseId?: number;
}

export default function UnifiedCruiseEditor({ cruiseId: initialCruiseId }: UnifiedCruiseEditorProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("setup");
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [cruiseId, setCruiseId] = useState(initialCruiseId);

  const queryClient = useQueryClient();
  const isEditing = !!cruiseId;

  // Fetch cruise data if editing
  const { data: cruise, isLoading } = useQuery({
    queryKey: ['cruise', cruiseId],
    queryFn: async () => {
      if (!cruiseId) return null;
      const response = await fetch(`/api/cruises/id/${cruiseId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch cruise');
      return response.json();
    },
    enabled: !!cruiseId,
  });

  // Determine which tabs are accessible based on cruise state
  const getTabAccess = () => {
    if (!isEditing) {
      // New cruise - only setup tab initially
      return {
        setup: true,
        events: false,
        info: false
      };
    }
    
    // Existing cruise - all tabs accessible
    return {
      setup: true,
      events: true,
      info: true
    };
  };

  const tabAccess = getTabAccess();

  const handleTabChange = (newTab: string) => {
    if (!tabAccess[newTab as keyof typeof tabAccess]) {
      toast({
        title: "Tab Not Available",
        description: "Complete the setup first to access other tabs.",
        variant: "destructive",
      });
      return;
    }

    if (hasUnsavedChanges) {
      // TODO: Show confirmation dialog
      console.log("Unsaved changes warning");
    }
    
    setActiveTab(newTab);
  };

  // Create cruise mutation
  const createCruiseMutation = useMutation({
    mutationFn: async (cruiseData: any) => {
      const response = await fetch('/api/cruises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(cruiseData),
      });
      if (!response.ok) throw new Error('Failed to create cruise');
      return response.json();
    },
    onSuccess: (newCruise) => {
      setCruiseId(newCruise.id);
      queryClient.invalidateQueries({ queryKey: ['cruises'] });
      toast({
        title: "Cruise Created",
        description: "Your cruise has been created successfully. You can now add events and information.",
      });
      setHasUnsavedChanges(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create cruise. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update cruise mutation
  const updateCruiseMutation = useMutation({
    mutationFn: async (cruiseData: any) => {
      const response = await fetch(`/api/cruises/${cruiseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(cruiseData),
      });
      if (!response.ok) throw new Error('Failed to update cruise');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cruise', cruiseId] });
      queryClient.invalidateQueries({ queryKey: ['cruises'] });
      toast({
        title: "Changes Saved",
        description: "Your cruise updates have been saved successfully.",
      });
      setHasUnsavedChanges(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Ref to get current form data from active tab
  const [getCurrentFormData, setGetCurrentFormData] = useState<(() => any) | null>(null);

  const handleSave = async (data?: any) => {
    try {
      // If no data provided, try to get current form data from active tab
      let saveData = data;
      if (!saveData && getCurrentFormData) {
        saveData = getCurrentFormData();
      }
      
      if (!saveData) {
        toast({
          title: "Error",
          description: "No data to save. Please fill out the form.",
          variant: "destructive",
        });
        return;
      }

      if (isEditing) {
        updateCruiseMutation.mutate(saveData);
      } else {
        createCruiseMutation.mutate(saveData);
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Ship className="w-8 h-8 mx-auto mb-4 animate-pulse text-blue-600" />
          <p className="text-gray-600">Loading cruise data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation('/admin/cruises')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Cruises
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-3">
                <Ship className="w-6 h-6 text-blue-600" />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {isEditing ? cruise?.name || 'Loading...' : 'New Cruise'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isEditing ? 'Edit cruise details' : 'Create a new cruise'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  Unsaved Changes
                </Badge>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAiPanel(!showAiPanel)}
                className={showAiPanel ? 'bg-purple-50 border-purple-200' : ''}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Assist
              </Button>
              
              <Button 
                onClick={() => {
                  if (activeTab === 'setup') {
                    // For setup tab, disable header save and let form handle it
                    toast({
                      title: "Use Form Save",
                      description: "Please use the 'Save Cruise Details' button in the form below.",
                    });
                  } else {
                    handleSave();
                  }
                }} 
                disabled={!hasUnsavedChanges || createCruiseMutation.isPending || updateCruiseMutation.isPending}
              >
                {(createCruiseMutation.isPending || updateCruiseMutation.isPending) ? (
                  <>
                    <Ship className="w-4 h-4 mr-2 animate-pulse" />
                    {isEditing ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditing ? 'Save Changes' : 'Create Cruise'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Main Editor */}
          <div className={showAiPanel ? "flex-1" : "w-full"}>
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Cruise Management</CardTitle>
                    <CardDescription>
                      Manage all aspects of your cruise in three stages
                    </CardDescription>
                  </div>
                  {isEditing && (
                    <Badge variant="secondary">
                      ID: {cruiseId}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                  <div className="px-6 border-b">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger 
                        value="setup" 
                        className="flex items-center space-x-2"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Setup & Itinerary</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="events" 
                        disabled={!tabAccess.events}
                        className="flex items-center space-x-2"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Events & Entertainment</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="info" 
                        disabled={!tabAccess.info}
                        className="flex items-center space-x-2"
                      >
                        <Info className="w-4 h-4" />
                        <span>Info & Updates</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="setup" className="mt-0">
                    <SetupAndItineraryTab 
                      cruise={cruise}
                      isEditing={isEditing}
                      onDataChange={() => setHasUnsavedChanges(true)}
                      onSave={handleSave}
                    />
                  </TabsContent>

                  <TabsContent value="events" className="mt-0">
                    <EventsAndEntertainmentTab 
                      cruise={cruise}
                      onDataChange={() => setHasUnsavedChanges(true)}
                    />
                  </TabsContent>

                  <TabsContent value="info" className="mt-0">
                    <InfoAndUpdatesTab 
                      cruise={cruise}
                      onDataChange={() => setHasUnsavedChanges(true)}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* AI Assist Panel */}
          {showAiPanel && (
            <div className="w-96">
              <AiAssistPanel 
                cruise={cruise}
                activeTab={activeTab}
                onClose={() => setShowAiPanel(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}