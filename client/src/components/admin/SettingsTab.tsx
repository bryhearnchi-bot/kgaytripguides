import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Settings,
  Save,
  X,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Tag,
  AlertCircle,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const settingSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  label: z.string().min(1, 'Label is required'),
  value: z.string().optional(),
  metadata: z.string().optional(),
});

type SettingFormData = z.infer<typeof settingSchema>;

interface Setting {
  id: number;
  category: string;
  key: string;
  label: string;
  value?: string;
  metadata?: any;
  isActive: boolean;
  orderIndex: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { 
    id: 'trip_types', 
    name: 'Trip Types', 
    description: 'Define different types of trips (cruise, hotel, flight, etc.)' 
  },
  { 
    id: 'event_types', 
    name: 'Event Types', 
    description: 'Define categories for events and entertainment' 
  },
  { 
    id: 'venue_types', 
    name: 'Venue Types', 
    description: 'Define different venue categories and locations' 
  },
];

export default function SettingsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('trip_types');
  const [editingDialogOpen, setEditingDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSetting, setDeletingSetting] = useState<Setting | null>(null);

  const canEdit = user?.role && ['super_admin', 'trip_admin', 'content_editor'].includes(user.role);
  const canDelete = user?.role && ['super_admin'].includes(user.role);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    reset,
    watch,
  } = useForm<SettingFormData>({
    resolver: zodResolver(settingSchema),
  });

  // Fetch settings for active category
  const { data: settings, isLoading: settingsLoading, error: settingsError } = useQuery<Setting[]>({
    queryKey: ['settings', activeCategory],
    queryFn: async () => {
      const response = await fetch(`/api/settings/${activeCategory}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      return response.json();
    },
  });

  // Create setting mutation
  const createSetting = useMutation({
    mutationFn: async (data: SettingFormData) => {
      let parsedMetadata = null;
      if (data.metadata) {
        try {
          parsedMetadata = JSON.parse(data.metadata);
        } catch (e) {
          // If not valid JSON, store as string
          parsedMetadata = data.metadata;
        }
      }

      const response = await fetch(`/api/settings/${activeCategory}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          metadata: parsedMetadata,
          orderIndex: (settings?.length || 0),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create setting');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', activeCategory] });
      toast({
        title: "Setting created",
        description: "The setting has been created successfully.",
      });
      setEditingDialogOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create setting. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update setting mutation
  const updateSetting = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<SettingFormData> }) => {
      const setting = settings?.find(s => s.id === id);
      if (!setting) throw new Error('Setting not found');

      let parsedMetadata = setting.metadata;
      if (data.metadata !== undefined) {
        if (data.metadata) {
          try {
            parsedMetadata = JSON.parse(data.metadata);
          } catch (e) {
            parsedMetadata = data.metadata;
          }
        } else {
          parsedMetadata = null;
        }
      }

      const response = await fetch(`/api/settings/${activeCategory}/${setting.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          metadata: parsedMetadata,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update setting');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', activeCategory] });
      toast({
        title: "Setting updated",
        description: "The setting has been updated successfully.",
      });
      setEditingDialogOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update setting. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete setting mutation
  const deleteSetting = useMutation({
    mutationFn: async (setting: Setting) => {
      const response = await fetch(`/api/settings/${activeCategory}/${setting.key}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete setting');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', activeCategory] });
      toast({
        title: "Setting deleted",
        description: "The setting has been deleted successfully.",
      });
      setDeleteDialogOpen(false);
      setDeletingSetting(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete setting. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Toggle active status mutation
  const toggleActiveSetting = useMutation({
    mutationFn: async ({ setting, isActive }: { setting: Setting, isActive: boolean }) => {
      const response = await fetch(`/api/settings/${activeCategory}/${setting.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update setting');
      }
      return response.json();
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['settings', activeCategory] });
      toast({
        title: `Setting ${isActive ? 'activated' : 'deactivated'}`,
        description: `The setting has been ${isActive ? 'activated' : 'deactivated'} successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update setting status.",
        variant: "destructive",
      });
    }
  });

  // Reorder settings mutation
  const reorderSettings = useMutation({
    mutationFn: async (orderedKeys: string[]) => {
      const response = await fetch(`/api/settings/${activeCategory}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderedKeys }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reorder settings');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', activeCategory] });
      toast({
        title: "Settings reordered",
        description: "The settings have been reordered successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reorder settings.",
        variant: "destructive",
      });
    }
  });

  const openEditDialog = (setting?: Setting) => {
    setEditingSetting(setting || null);
    if (setting) {
      reset({
        key: setting.key,
        label: setting.label,
        value: setting.value || '',
        metadata: setting.metadata ? JSON.stringify(setting.metadata, null, 2) : '',
      });
    } else {
      reset({
        key: '',
        label: '',
        value: '',
        metadata: '',
      });
    }
    setEditingDialogOpen(true);
  };

  const openDeleteDialog = (setting: Setting) => {
    setDeletingSetting(setting);
    setDeleteDialogOpen(true);
  };

  const onSubmit = (data: SettingFormData) => {
    if (editingSetting) {
      updateSetting.mutate({ id: editingSetting.id, data });
    } else {
      createSetting.mutate(data);
    }
  };

  const handleDelete = () => {
    if (deletingSetting) {
      deleteSetting.mutate(deletingSetting);
    }
  };

  const moveSettingUp = (index: number) => {
    if (!settings || index === 0) return;
    const newOrder = [...settings];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    const orderedKeys = newOrder.map(s => s.key);
    reorderSettings.mutate(orderedKeys);
  };

  const moveSettingDown = (index: number) => {
    if (!settings || index === settings.length - 1) return;
    const newOrder = [...settings];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    const orderedKeys = newOrder.map(s => s.key);
    reorderSettings.mutate(orderedKeys);
  };

  const sortedSettings = settings?.slice().sort((a, b) => a.orderIndex - b.orderIndex) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings Management</h2>
          <p className="text-gray-600">Configure system settings, trip types, and other options</p>
        </div>
        {canEdit && (
          <Button onClick={() => openEditDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Setting
          </Button>
        )}
      </div>

      {/* Category Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Settings Categories</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
              >
                <Tag className="w-4 h-4 mr-2" />
                {category.name}
              </Button>
            ))}
          </div>
          
          <div className="text-sm text-gray-600">
            {CATEGORIES.find(c => c.id === activeCategory)?.description}
          </div>
        </CardContent>
      </Card>

      {/* Settings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{CATEGORIES.find(c => c.id === activeCategory)?.name || 'Settings'}</span>
            {sortedSettings.length > 0 && (
              <Badge variant="secondary">
                {sortedSettings.length} {sortedSettings.length === 1 ? 'setting' : 'settings'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {settingsLoading && (
            <div className="text-center py-8">
              <Settings className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-600" />
              <p>Loading settings...</p>
            </div>
          )}

          {settingsError && (
            <div className="text-center py-8 text-red-600">
              <AlertCircle className="w-8 h-8 mx-auto mb-4" />
              <p>Error loading settings: {settingsError.message}</p>
            </div>
          )}

          {sortedSettings.length === 0 && !settingsLoading && !settingsError && (
            <div className="text-center py-12">
              <Tag className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No settings found</h3>
              <p className="text-gray-500 mb-4">
                Get started by adding your first setting for this category.
              </p>
              {canEdit && (
                <Button onClick={() => openEditDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Setting
                </Button>
              )}
            </div>
          )}

          {sortedSettings.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Order</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSettings.map((setting, index) => (
                    <TableRow key={setting.id} className={!setting.isActive ? 'opacity-50' : ''}>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={index === 0 || !canEdit}
                            onClick={() => moveSettingUp(index)}
                            className="h-6 w-6 p-0"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={index === sortedSettings.length - 1 || !canEdit}
                            onClick={() => moveSettingDown(index)}
                            className="h-6 w-6 p-0"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{setting.key}</TableCell>
                      <TableCell className="font-medium">{setting.label}</TableCell>
                      <TableCell className="max-w-[200px]">
                        {setting.value && (
                          <div className="truncate" title={setting.value}>
                            {setting.value}
                          </div>
                        )}
                        {setting.metadata && (
                          <div className="text-xs text-gray-500 mt-1">
                            Has metadata
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Switch
                            checked={setting.isActive}
                            onCheckedChange={(checked) => 
                              toggleActiveSetting.mutate({ setting, isActive: checked })
                            }
                          />
                        ) : (
                          <Badge variant={setting.isActive ? "default" : "outline"}>
                            {setting.isActive ? (
                              <>
                                <Eye className="w-3 h-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit && (
                              <>
                                <DropdownMenuItem onClick={() => openEditDialog(setting)}>
                                  <Edit3 className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {canDelete && (
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => openDeleteDialog(setting)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Setting Dialog */}
      <Dialog open={editingDialogOpen} onOpenChange={setEditingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSetting ? 'Edit Setting' : 'Add New Setting'}
            </DialogTitle>
            <DialogDescription>
              {editingSetting 
                ? 'Update the setting details below.' 
                : `Add a new setting to the ${CATEGORIES.find(c => c.id === activeCategory)?.name} category.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key">Key *</Label>
              <Input
                id="key"
                {...register('key')}
                placeholder="e.g., cruise"
                disabled={!!editingSetting} // Don't allow key changes when editing
              />
              {errors.key && (
                <p className="text-sm text-red-600">{errors.key.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Label *</Label>
              <Input
                id="label"
                {...register('label')}
                placeholder="e.g., Cruise"
              />
              {errors.label && (
                <p className="text-sm text-red-600">{errors.label.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                {...register('value')}
                placeholder="Optional value"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metadata">Metadata (JSON)</Label>
              <Textarea
                id="metadata"
                {...register('metadata')}
                placeholder='{"color": "#blue", "icon": "ship"}'
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Optional JSON metadata for additional properties like colors, icons, etc.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createSetting.isPending || updateSetting.isPending || !isDirty}
              >
                <Save className="w-4 h-4 mr-2" />
                {createSetting.isPending || updateSetting.isPending 
                  ? 'Saving...' 
                  : editingSetting 
                    ? 'Update Setting' 
                    : 'Add Setting'
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Setting</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the setting "{deletingSetting?.label}" ({deletingSetting?.key})?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteSetting.isPending}
            >
              {deleteSetting.isPending ? 'Deleting...' : 'Delete Setting'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}