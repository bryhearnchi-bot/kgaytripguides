import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, Trash2, Tag, Calendar, MapPin, Shirt } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useToast } from '../../hooks/use-toast';

interface PartyTheme {
  id: number;
  name: string;
  longDescription?: string;
  shortDescription?: string;
  costumeIdeas?: string;
  imageUrl?: string;
  amazonShoppingListUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PartyTemplatesManagerProps {
  onSelectTemplate?: (template: PartyTheme) => void;
  showSelectMode?: boolean;
}

export default function PartyTemplatesManager({ 
  onSelectTemplate, 
  showSelectMode = false 
}: PartyTemplatesManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PartyTheme | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch party themes with search
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['party-themes', searchQuery],
    queryFn: async () => {
      const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const response = await fetch(`/api/party-themes${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch party themes');
      return response.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (templateData: Partial<PartyTheme>) => {
      const response = await fetch('/api/party-themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(templateData),
      });
      if (!response.ok) throw new Error('Failed to create theme');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party-themes'] });
      setShowCreateDialog(false);
      toast({
        title: "Theme Created",
        description: "Party theme has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create party theme.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...templateData }: Partial<PartyTheme> & { id: number }) => {
      const response = await fetch(`/api/party-themes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(templateData),
      });
      if (!response.ok) throw new Error('Failed to update theme');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party-themes'] });
      setEditingTemplate(null);
      toast({
        title: "Theme Updated",
        description: "Party theme has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update party theme.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/party-themes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete theme');
      // Handle 204 No Content response (no JSON body)
      if (response.status === 204) return;
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party-themes'] });
      toast({
        title: "Theme Deleted",
        description: "Party theme has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete party theme.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTemplate = (data: any) => {
    createMutation.mutate(data);
  };

  const handleUpdateTemplate = (data: any) => {
    if (!editingTemplate) return;
    updateMutation.mutate({
      id: editingTemplate.id,
      ...data,
    });
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm('Are you sure you want to delete this party theme?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading party templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Party Themes</h2>
          <p className="text-gray-600">Create and manage reusable party themes</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Theme
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Party Theme</DialogTitle>
            </DialogHeader>
            <PartyTemplateForm 
              onSubmit={handleCreateTemplate}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search themes by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template: PartyTheme) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <div className="flex gap-2">
                  {showSelectMode && onSelectTemplate && (
                    <Button
                      size="sm"
                      onClick={() => onSelectTemplate(template)}
                    >
                      Select
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingTemplate(template)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {template.longDescription && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {template.longDescription}
                </p>
              )}

              {template.costumeIdeas && (
                <div className="flex items-center gap-2 text-sm">
                  <Shirt className="w-4 h-4 text-gray-400" />
                  <span>{template.costumeIdeas}</span>
                </div>
              )}

              {template.shortDescription && (
                <p className="text-xs text-gray-500">
                  {template.shortDescription}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No themes found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery ? 'No themes match your search.' : 'Get started by creating your first party theme.'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Theme
            </Button>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Party Theme</DialogTitle>
            </DialogHeader>
            <PartyTemplateForm 
              template={editingTemplate}
              onSubmit={handleUpdateTemplate}
              isLoading={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Form component for creating/editing themes
function PartyTemplateForm({
  template,
  onSubmit,
  isLoading
}: {
  template?: PartyTheme;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    longDescription: template?.longDescription || '',
    shortDescription: template?.shortDescription || '',
    costumeIdeas: template?.costumeIdeas || '',
    imageUrl: template?.imageUrl || '',
    amazonShoppingListUrl: template?.amazonShoppingListUrl || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Theme Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Tropical Paradise"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Long Description</label>
        <textarea
          className="w-full p-3 border border-gray-200 rounded-md resize-none"
          rows={3}
          value={formData.longDescription}
          onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
          placeholder="Describe the party theme, atmosphere, and suggested activities..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Short Description</label>
        <Input
          value={formData.shortDescription}
          onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
          placeholder="Brief theme description for quick reference"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Costume Ideas</label>
        <Input
          value={formData.costumeIdeas}
          onChange={(e) => setFormData({ ...formData, costumeIdeas: e.target.value })}
          placeholder="Costume and dress code suggestions"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Theme Image URL</label>
        <Input
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="https://example.com/theme-image.jpg"
          type="url"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Amazon Shopping List URL</label>
        <Input
          value={formData.amazonShoppingListUrl}
          onChange={(e) => setFormData({ ...formData, amazonShoppingListUrl: e.target.value })}
          placeholder="https://amazon.com/shop/..."
          type="url"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : template ? 'Update Theme' : 'Create Theme'}
        </Button>
      </div>
    </form>
  );
}