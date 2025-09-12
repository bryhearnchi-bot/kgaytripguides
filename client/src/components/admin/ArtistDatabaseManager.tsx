import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, Trash2, User, Star, ExternalLink, Music } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { useToast } from '../../hooks/use-toast';
import { ImageUpload } from './ImageUpload';

interface Artist {
  id: number;
  name: string;
  category?: string; // Maps to performanceType in UI
  bio?: string;
  knownFor?: string;
  profileImageUrl?: string;
  socialLinks?: Record<string, string>;
  website?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ArtistDatabaseManagerProps {
  onSelectArtist?: (artist: Artist) => void;
  showSelectMode?: boolean;
  allowInlineCreate?: boolean;
}

export default function ArtistDatabaseManager({ 
  onSelectArtist, 
  showSelectMode = false,
  allowInlineCreate = false
}: ArtistDatabaseManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [selectedPerformanceType, setSelectedPerformanceType] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Performance types for filtering
  const performanceTypes = [
    'DJ', 'Singer', 'Dancer', 'Comedian', 'Drag Performer', 'Band', 'Host', 'Performer', 'Other'
  ];

  // Fetch artists with search and filters
  const { data: artists = [], isLoading } = useQuery({
    queryKey: ['artists', searchQuery, selectedPerformanceType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedPerformanceType) params.append('type', selectedPerformanceType);
      
      const response = await fetch(`/api/talent?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch artists');
      return response.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (artistData: Partial<Artist>) => {
      const response = await fetch('/api/talent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(artistData),
      });
      if (!response.ok) throw new Error('Failed to create artist');
      return response.json();
    },
    onSuccess: (newArtist) => {
      queryClient.invalidateQueries({ queryKey: ['artists'] });
      setShowCreateDialog(false);
      toast({
        title: "Artist Added",
        description: `${newArtist.name} has been added to the artist database.`,
      });
      
      // If in select mode, automatically select the newly created artist
      if (showSelectMode && onSelectArtist) {
        onSelectArtist(newArtist);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create artist.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...artistData }: Partial<Artist> & { id: number }) => {
      const response = await fetch(`/api/talent/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(artistData),
      });
      if (!response.ok) throw new Error('Failed to update artist');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artists'] });
      setEditingArtist(null);
      toast({
        title: "Artist Updated",
        description: "Artist information has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update artist.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/talent/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete artist');
      // Handle 204 No Content response (no JSON body)
      if (response.status === 204) return;
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artists'] });
      toast({
        title: "Artist Removed",
        description: "Artist has been removed from the database.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete artist.",
        variant: "destructive",
      });
    },
  });

  const handleCreateArtist = (data: any) => {
    const socialLinks: Record<string, string> = {};
    if (data.instagram) socialLinks.instagram = data.instagram;
    if (data.twitter) socialLinks.twitter = data.twitter;

    createMutation.mutate({
      name: data.name,
      category: data.category || null,
      bio: data.bio || null,
      knownFor: data.knownFor || null,
      profileImageUrl: data.profileImageUrl || null,
      socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
      website: data.website || null,
    });
  };

  const handleUpdateArtist = (data: any) => {
    if (!editingArtist) return;
    const socialLinks: Record<string, string> = {};
    if (data.instagram) socialLinks.instagram = data.instagram;
    if (data.twitter) socialLinks.twitter = data.twitter;

    updateMutation.mutate({
      id: editingArtist.id,
      name: data.name,
      category: data.category || null,
      bio: data.bio || null,
      knownFor: data.knownFor || null,
      profileImageUrl: data.profileImageUrl || null,
      socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
      website: data.website || null,
    });
  };

  const handleDeleteArtist = (id: number, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from the artist database?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading artist database...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Artist Database</h2>
          <p className="text-gray-600">Manage performers and entertainers for your cruises</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Artist
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Artist</DialogTitle>
            </DialogHeader>
            <ArtistForm 
              onSubmit={handleCreateArtist}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search artists by name, stage name, or bio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedPerformanceType}
          onChange={(e) => setSelectedPerformanceType(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-md bg-white"
        >
          <option value="">All Performance Types</option>
          {performanceTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Artists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artists.map((artist: Artist) => (
          <Card key={artist.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={artist.profileImageUrl} alt={artist.name} />
                    <AvatarFallback>
                      {artist.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{artist.name}</CardTitle>
                    {artist.knownFor && (
                      <p className="text-sm text-gray-500">Known for: {artist.knownFor}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {showSelectMode && onSelectArtist && (
                    <Button
                      size="sm"
                      onClick={() => onSelectArtist(artist)}
                    >
                      Select
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingArtist(artist)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteArtist(artist.id, artist.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {artist.category && (
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-gray-400" />
                  <Badge variant="secondary">{artist.category}</Badge>
                </div>
              )}

              {artist.bio && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {artist.bio}
                </p>
              )}

              {artist.knownFor && (
                <div className="text-sm text-gray-500">
                  <strong>Known for:</strong> {artist.knownFor}
                </div>
              )}

              {(artist.socialLinks && Object.keys(artist.socialLinks).length > 0) || artist.website && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <ExternalLink className="w-4 h-4" />
                  <span>
                    {artist.socialLinks ? Object.keys(artist.socialLinks).length : 0}
                    {artist.website ? ' + website' : ''} social link(s)
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {artists.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No artists found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedPerformanceType 
              ? 'No artists match your search criteria.' 
              : 'Start building your artist database by adding performers.'}
          </p>
          {!searchQuery && !selectedPerformanceType && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Artist
            </Button>
          )}
        </div>
      )}

      {/* Quick Stats */}
      {artists.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{artists.length}</div>
              <div className="text-sm text-gray-600">Total Artists</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {artists.length}
              </div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {new Set(artists.map((a: Artist) => a.category).filter(Boolean)).size}
              </div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {artists.filter((a: Artist) => a.socialLinks && Object.keys(a.socialLinks).length > 0).length}
              </div>
              <div className="text-sm text-gray-600">With Social Links</div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editingArtist && (
        <Dialog open={!!editingArtist} onOpenChange={() => setEditingArtist(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Artist</DialogTitle>
            </DialogHeader>
            <ArtistForm 
              artist={editingArtist}
              onSubmit={handleUpdateArtist}
              isLoading={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Form component for creating/editing artists
function ArtistForm({ 
  artist, 
  onSubmit, 
  isLoading 
}: { 
  artist?: Artist; 
  onSubmit: (data: any) => void; 
  isLoading: boolean; 
}) {
  const [formData, setFormData] = useState(() => ({
    name: artist?.name || '',
    knownFor: artist?.knownFor || '',
    bio: artist?.bio || '',
    profileImageUrl: artist?.profileImageUrl || '',
    category: artist?.category || '',
    instagram: artist?.socialLinks?.instagram || '',
    twitter: artist?.socialLinks?.twitter || '',
    website: artist?.website || '',
  }));

  const performanceTypes = [
    'DJ', 'Singer', 'Dancer', 'Comedian', 'Drag Performer', 'Band', 'Host', 'Performer', 'Other'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const socialLinks: Record<string, string> = {};
    if (formData.instagram) socialLinks.instagram = formData.instagram;
    if (formData.twitter) socialLinks.twitter = formData.twitter;
    if (formData.website) socialLinks.website = formData.website;

    onSubmit({
      name: formData.name,
      knownFor: formData.knownFor || null,
      bio: formData.bio || null,
      profileImageUrl: formData.profileImageUrl || null,
      category: formData.category || null,
      website: formData.website || null,
      instagram: formData.instagram,
      twitter: formData.twitter,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Full Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., John Smith"
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Known For</label>
          <Input
            value={formData.knownFor}
            onChange={(e) => setFormData({ ...formData, knownFor: e.target.value })}
            placeholder="e.g., Energetic house sets, Broadway vocals"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Bio / Description</label>
        <textarea
          className="w-full p-3 border border-gray-200 rounded-md resize-none"
          rows={3}
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Brief description of the artist's style, experience, and specialties..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Performance Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full p-3 border border-gray-200 rounded-md bg-white"
          >
            <option value="">Select Category</option>
            {performanceTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <ImageUpload
            imageType="talent"
            currentImageUrl={formData.profileImageUrl}
            onImageChange={(imageUrl) => {
              setFormData(prev => ({ ...prev, profileImageUrl: imageUrl || '' }));
            }}
            label="Profile Image"
            disabled={isLoading}
          />
        </div>
      </div>


      <div className="space-y-4">
        <h4 className="font-medium">Social Media Links</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Instagram</label>
            <Input
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              placeholder="@username or full URL"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Twitter</label>
            <Input
              value={formData.twitter}
              onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
              placeholder="@username or full URL"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Website</label>
            <Input
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://artist-website.com"
              type="url"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : artist ? 'Update Artist' : 'Add Artist'}
        </Button>
      </div>
    </form>
  );
}