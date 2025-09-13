import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  Calendar,
  Music,
  Users,
  PartyPopper,
  Clock
} from 'lucide-react';
import PartyTemplatesManager from './PartyTemplatesManager';
import ArtistDatabaseManager from './ArtistDatabaseManager';

interface EventsAndEntertainmentTabProps {
  trip?: any;
  onDataChange: () => void;
}

export default function EventsAndEntertainmentTab({ 
  trip, 
  onDataChange 
}: EventsAndEntertainmentTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [showPartyTemplates, setShowPartyTemplates] = useState(false);
  const [showArtistDatabase, setShowArtistDatabase] = useState(false);

  const eventTypes = [
    { type: 'party', icon: PartyPopper, label: 'Party', color: 'bg-pink-100 text-pink-800' },
    { type: 'show', icon: Music, label: 'Show', color: 'bg-purple-100 text-purple-800' },
    { type: 'dining', icon: Users, label: 'Dining', color: 'bg-orange-100 text-orange-800' },
    { type: 'lounge', icon: Music, label: 'Lounge', color: 'bg-blue-100 text-blue-800' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Events & Entertainment</h2>
          <p className="text-gray-600">Manage parties, shows, and entertainment lineup</p>
        </div>
        <div className="flex items-center space-x-3">
          <Dialog open={showArtistDatabase} onOpenChange={setShowArtistDatabase}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Users className="w-4 h-4 mr-2" />
                Browse Artists
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Select Artist for Trip</DialogTitle>
              </DialogHeader>
              <ArtistDatabaseManager 
                showSelectMode={true}
                onSelectArtist={async (artist) => {
                  if (!trip?.id) {
                    alert('Please save the trip first before adding artists');
                    return;
                  }
                  
                  try {
                    const response = await fetch(`/api/trips/${trip.id}/talent/${artist.id}`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ role: 'performer' }),
                    });

                    if (!response.ok) {
                      throw new Error('Failed to associate artist with trip');
                    }

                    alert(`Successfully added ${artist.name} to the trip lineup!`);
                    setShowArtistDatabase(false);
                    onDataChange();
                  } catch (error) {
                    console.error('Error associating artist:', error);
                    alert('Failed to add artist to trip. Please try again.');
                  }
                }}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={showPartyTemplates} onOpenChange={setShowPartyTemplates}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <PartyPopper className="w-4 h-4 mr-2" />
                Party Templates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Party Templates</DialogTitle>
              </DialogHeader>
              <PartyTemplatesManager />
            </DialogContent>
          </Dialog>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search events, artists, or venues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
            <div className="flex items-center space-x-2">
              {eventTypes.map(({ type, label, color }) => (
                <Badge key={type} className={color}>
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Calendar/Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Event Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Events Scheduled</h3>
                    <p className="mb-4">Start building your entertainment lineup</p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Event
                    </Button>
                  </div>
                ) : (
                  <div>Events list will appear here...</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-4">
          {/* Artist Database */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Artist Database</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog open={showArtistDatabase} onOpenChange={setShowArtistDatabase}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Search className="w-4 h-4 mr-2" />
                    Search Artists
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Select Artist for Event</DialogTitle>
                  </DialogHeader>
                  <ArtistDatabaseManager 
                    showSelectMode={true}
                    onSelectArtist={(artist) => {
                      console.log('Selected artist:', artist);
                      // TODO: Associate artist with current trip/event
                      setShowArtistDatabase(false);
                      onDataChange();
                    }}
                  />
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Artist
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Artist Database</DialogTitle>
                  </DialogHeader>
                  <ArtistDatabaseManager />
                </DialogContent>
              </Dialog>
              <div className="text-xs text-gray-500 pt-2">
                Reusable performer database
              </div>
            </CardContent>
          </Card>

          {/* Party Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <PartyPopper className="w-4 h-4" />
                <span>Party Templates</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog open={showPartyTemplates} onOpenChange={setShowPartyTemplates}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Search className="w-4 h-4 mr-2" />
                    Browse Templates
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Party Templates</DialogTitle>
                  </DialogHeader>
                  <PartyTemplatesManager />
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Party Templates</DialogTitle>
                  </DialogHeader>
                  <PartyTemplatesManager />
                </DialogContent>
              </Dialog>
              <div className="text-xs text-gray-500 pt-2">
                Reusable party themes
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Total Events</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Parties</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shows</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Artists Booked</span>
                <span className="font-medium">0</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}