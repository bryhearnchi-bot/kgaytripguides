import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, Trash2, Tag, Calendar, MapPin, Shirt } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useToast } from '../../hooks/use-toast';

interface PartyTemplate {
  id: number;
  name: string;
  themeDescription?: string;
  dressCode?: string;
  defaultImageUrl?: string;
  tags?: string[];
  defaults?: Record<string, any>;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PartyTemplatesManagerProps {
  onSelectTemplate?: (template: PartyTemplate) => void;
  showSelectMode?: boolean;
}

export default function PartyTemplatesManager({ 
  onSelectTemplate, 
  showSelectMode = false 
}: PartyTemplatesManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PartyTemplate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch party templates with search
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['party-templates', searchQuery],
    queryFn: async () => {
      const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const response = await fetch(`/api/party-templates${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch party templates');
      return response.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (templateData: Partial<PartyTemplate>) => {
      const response = await fetch('/api/party-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(templateData),
      });
      if (!response.ok) throw new Error('Failed to create template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party-templates'] });
      setShowCreateDialog(false);
      toast({
        title: "Template Created",
        description: "Party template has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create party template.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...templateData }: Partial<PartyTemplate> & { id: number }) => {
      const response = await fetch(`/api/party-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(templateData),
      });
      if (!response.ok) throw new Error('Failed to update template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party-templates'] });
      setEditingTemplate(null);
      toast({
        title: "Template Updated",
        description: "Party template has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update party template.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/party-templates/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete template');
      // Handle 204 No Content response (no JSON body)
      if (response.status === 204) return;
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party-templates'] });
      toast({
        title: "Template Deleted",
        description: "Party template has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete party template.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTemplate = (data: any) => {
    createMutation.mutate({
      ...data,
      tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : [],
    });
  };

  const handleUpdateTemplate = (data: any) => {
    if (!editingTemplate) return;
    updateMutation.mutate({
      id: editingTemplate.id,
      ...data,
      tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : [],
    });
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm('Are you sure you want to delete this party template?')) {
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
          <h2 className="text-2xl font-bold">Party Templates</h2>
          <p className="text-gray-600">Create and manage reusable party themes</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Party Template</DialogTitle>
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
          placeholder="Search templates by name, theme, or dress code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template: PartyTemplate) => (
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
              {template.themeDescription && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {template.themeDescription}
                </p>
              )}
              
              {template.dressCode && (
                <div className="flex items-center gap-2 text-sm">
                  <Shirt className="w-4 h-4 text-gray-400" />
                  <span>{template.dressCode}</span>
                </div>
              )}

              {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery ? 'No templates match your search.' : 'Get started by creating your first party template.'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Party Template</DialogTitle>
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

// Form component for creating/editing templates
function PartyTemplateForm({ 
  template, 
  onSubmit, 
  isLoading 
}: { 
  template?: PartyTemplate; 
  onSubmit: (data: any) => void; 
  isLoading: boolean; 
}) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    themeDescription: template?.themeDescription || '',
    dressCode: template?.dressCode || '',
    defaultImageUrl: template?.defaultImageUrl || '',
    tags: template?.tags?.join(', ') || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Template Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Tropical Paradise"
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Dress Code</label>
          <Input
            value={formData.dressCode}
            onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })}
            placeholder="e.g., Tropical attire, bright colors"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Theme Description</label>
        <textarea
          className="w-full p-3 border border-gray-200 rounded-md resize-none"
          rows={3}
          value={formData.themeDescription}
          onChange={(e) => setFormData({ ...formData, themeDescription: e.target.value })}
          placeholder="Describe the party theme, atmosphere, and suggested activities..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tags</label>
        <Input
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="e.g., tropical, beach, summer, cocktails (separated by commas)"
        />
        <p className="text-xs text-gray-500">Enter tags separated by commas for easier searching</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Default Image URL</label>
        <Input
          value={formData.defaultImageUrl}
          onChange={(e) => setFormData({ ...formData, defaultImageUrl: e.target.value })}
          placeholder="https://example.com/theme-image.jpg"
          type="url"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
}