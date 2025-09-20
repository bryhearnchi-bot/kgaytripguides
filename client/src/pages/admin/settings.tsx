import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  Database,
  Mail,
  Shield,
  Palette,
  Globe,
  Bell,
  Key,
  Server,
  Upload,
  Download
} from 'lucide-react';

interface Setting {
  id: number;
  category: string;
  key: string;
  label: string;
  value?: string;
  metadata?: any;
  isActive: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

interface SettingFormData {
  category: string;
  key: string;
  label: string;
  value: string;
  metadata: any;
  isActive: boolean;
  orderIndex: number;
}

const SETTING_CATEGORIES = [
  { value: 'trip_types', label: 'Trip Types', icon: Database, description: 'Configure available trip types' },
  { value: 'notification_types', label: 'Notifications', icon: Bell, description: 'Email and push notification settings' },
  { value: 'user_roles', label: 'User Roles', icon: Shield, description: 'User role definitions and permissions' },
  { value: 'ui_themes', label: 'UI Themes', icon: Palette, description: 'Application theme and branding' },
  { value: 'integration', label: 'Integrations', icon: Server, description: 'Third-party service configurations' },
  { value: 'content', label: 'Content', icon: Globe, description: 'Default content and templates' },
  { value: 'system', label: 'System', icon: Key, description: 'System-level configurations' },
];

const DEFAULT_SETTINGS = {
  trip_types: [
    { key: 'cruise', label: 'Cruise', value: 'cruise', metadata: { icon: 'ship', color: '#3b82f6' } },
    { key: 'hotel', label: 'Hotel Stay', value: 'hotel', metadata: { icon: 'building', color: '#10b981' } },
    { key: 'tour', label: 'Tour Package', value: 'tour', metadata: { icon: 'map', color: '#f59e0b' } },
    { key: 'flight', label: 'Flight Package', value: 'flight', metadata: { icon: 'plane', color: '#ef4444' } },
  ],
  notification_types: [
    { key: 'booking_confirmation', label: 'Booking Confirmations', value: 'enabled', metadata: { email: true, push: true } },
    { key: 'trip_reminders', label: 'Trip Reminders', value: 'enabled', metadata: { email: true, push: false } },
    { key: 'marketing', label: 'Marketing Emails', value: 'disabled', metadata: { email: true, push: false } },
  ],
  user_roles: [
    { key: 'super_admin', label: 'Super Administrator', value: 'full_access', metadata: { permissions: ['*'] } },
    { key: 'trip_admin', label: 'Trip Administrator', value: 'trip_management', metadata: { permissions: ['trips.*', 'events.*', 'talent.*'] } },
    { key: 'content_editor', label: 'Content Editor', value: 'content_edit', metadata: { permissions: ['trips.edit', 'events.edit', 'content.*'] } },
  ],
  ui_themes: [
    { key: 'primary_color', label: 'Primary Color', value: '#3b82f6', metadata: { type: 'color' } },
    { key: 'secondary_color', label: 'Secondary Color', value: '#1e40af', metadata: { type: 'color' } },
    { key: 'logo_url', label: 'Logo URL', value: '', metadata: { type: 'url' } },
  ],
  system: [
    { key: 'maintenance_mode', label: 'Maintenance Mode', value: 'false', metadata: { type: 'boolean' } },
    { key: 'max_upload_size', label: 'Max Upload Size (MB)', value: '10', metadata: { type: 'number' } },
    { key: 'session_timeout', label: 'Session Timeout (minutes)', value: '60', metadata: { type: 'number' } },
  ]
};

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('trip_types');
  const [settingModalOpen, setSettingModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [formData, setFormData] = useState<SettingFormData>({
    category: 'trip_types',
    key: '',
    label: '',
    value: '',
    metadata: {},
    isActive: true,
    orderIndex: 0,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch settings
  const { data: settings = [], isLoading: settingsLoading, error: settingsError } = useQuery<Setting[]>({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      return response.json();
    },
  });

  // Create/Update setting mutation
  const saveSetting = useMutation({
    mutationFn: async (data: SettingFormData) => {
      const url = editingSetting ? `/api/admin/settings/${editingSetting.id}` : '/api/admin/settings';
      const method = editingSetting ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to save setting');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `Setting ${editingSetting ? 'updated' : 'created'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      closeSettingModal();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${editingSetting ? 'update' : 'create'} setting`,
        variant: 'destructive',
      });
    },
  });

  // Delete setting mutation
  const deleteSetting = useMutation({
    mutationFn: async (settingId: number) => {
      const response = await fetch(`/api/admin/settings/${settingId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to delete setting');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Setting deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete setting',
        variant: 'destructive',
      });
    },
  });

  // Initialize default settings mutation
  const initializeDefaults = useMutation({
    mutationFn: async (category: string) => {
      const defaultSettings = DEFAULT_SETTINGS[category] || [];

      const response = await fetch('/api/admin/settings/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ category, settings: defaultSettings }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize default settings');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Default settings initialized successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to initialize default settings',
        variant: 'destructive',
      });
    },
  });

  // Export settings mutation
  const exportSettings = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/settings/export', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to export settings');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settings-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Settings exported successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to export settings',
        variant: 'destructive',
      });
    },
  });

  const openSettingModal = (setting?: Setting) => {
    if (setting) {
      setEditingSetting(setting);
      setFormData({
        category: setting.category,
        key: setting.key,
        label: setting.label,
        value: setting.value || '',
        metadata: setting.metadata || {},
        isActive: setting.isActive,
        orderIndex: setting.orderIndex,
      });
    } else {
      setEditingSetting(null);
      setFormData({
        category: activeTab,
        key: '',
        label: '',
        value: '',
        metadata: {},
        isActive: true,
        orderIndex: 0,
      });
    }
    setSettingModalOpen(true);
  };

  const closeSettingModal = () => {
    setSettingModalOpen(false);
    setEditingSetting(null);
  };

  const handleInputChange = (field: keyof SettingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.key.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Key is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.label.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Label is required',
        variant: 'destructive',
      });
      return;
    }

    saveSetting.mutate(formData);
  };

  const getCategoryData = (category: string) => {
    return SETTING_CATEGORIES.find(cat => cat.value === category) || SETTING_CATEGORIES[0];
  };

  const getSettingsByCategory = (category: string) => {
    return settings
      .filter(setting => setting.category === category)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  };

  const renderSettingValue = (setting: Setting) => {
    if (!setting.value) return <span className="text-gray-400">Not set</span>;

    if (setting.metadata?.type === 'boolean') {
      return (
        <Switch
          checked={setting.value === 'true'}
          onCheckedChange={(checked) => {
            saveSetting.mutate({
              ...setting,
              value: checked.toString(),
            });
          }}
        />
      );
    }

    if (setting.metadata?.type === 'color') {
      return (
        <div className="flex items-center space-x-2">
          <div
            className="w-6 h-6 rounded border"
            style={{ backgroundColor: setting.value }}
          />
          <span className="text-sm font-mono">{setting.value}</span>
        </div>
      );
    }

    if (setting.value.length > 50) {
      return (
        <span className="text-sm text-gray-600">
          {setting.value.substring(0, 50)}...
        </span>
      );
    }

    return <span className="text-sm">{setting.value}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Configure system settings and preferences</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportSettings.mutate()}
            disabled={exportSettings.isPending}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => openSettingModal()}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Setting
          </Button>
        </div>
      </div>

      {/* Content */}
      <div>
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
              {SETTING_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const count = settings.filter(s => s.category === category.value).length;
                return (
                  <TabsTrigger key={category.value} value={category.value} className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{category.label} ({count})</span>
                    <span className="sm:hidden">({count})</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {SETTING_CATEGORIES.map((category) => (
              <TabsContent key={category.value} value={category.value} className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <category.icon className="w-5 h-5" />
                          <span>{category.label}</span>
                          <Badge variant="secondary">
                            {getSettingsByCategory(category.value).length}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                      {DEFAULT_SETTINGS[category.value] && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => initializeDefaults.mutate(category.value)}
                          disabled={initializeDefaults.isPending}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Load Defaults
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {settingsLoading ? (
                      <div className="text-center py-8">
                        <Settings className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-600" />
                        <p>Loading settings...</p>
                      </div>
                    ) : settingsError ? (
                      <div className="text-center py-8 text-red-600">
                        <p>Error loading settings: {settingsError.message}</p>
                      </div>
                    ) : getSettingsByCategory(category.value).length === 0 ? (
                      <div className="text-center py-12">
                        <category.icon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No settings configured</h3>
                        <p className="text-gray-500 mb-4">
                          Configure your first {category.label.toLowerCase()} setting.
                        </p>
                        <div className="flex justify-center space-x-2">
                          <Button onClick={() => openSettingModal()}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Setting
                          </Button>
                          {DEFAULT_SETTINGS[category.value] && (
                            <Button
                              variant="outline"
                              onClick={() => initializeDefaults.mutate(category.value)}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Load Defaults
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getSettingsByCategory(category.value).map((setting) => (
                          <Card key={setting.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h3 className="font-semibold text-gray-900">{setting.label}</h3>
                                    <Badge variant="outline" className="text-xs">
                                      {setting.key}
                                    </Badge>
                                    {!setting.isActive && (
                                      <Badge variant="secondary" className="text-xs">
                                        Inactive
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="mt-2">
                                    {renderSettingValue(setting)}
                                  </div>
                                  {setting.metadata && Object.keys(setting.metadata).length > 0 && (
                                    <div className="mt-2">
                                      <details className="text-xs text-gray-500">
                                        <summary className="cursor-pointer">Metadata</summary>
                                        <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                                          {JSON.stringify(setting.metadata, null, 2)}
                                        </pre>
                                      </details>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openSettingModal(setting)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-red-600">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Setting</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete the setting "{setting.label}"?
                                          This action cannot be undone and may affect application functionality.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteSetting.mutate(setting.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete Setting
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Setting Modal */}
      <Dialog open={settingModalOpen} onOpenChange={(open) => !open && closeSettingModal()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSetting ? 'Edit Setting' : 'Add New Setting'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SETTING_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center space-x-2">
                          <category.icon className="w-4 h-4" />
                          <span>{category.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="key">Key *</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => handleInputChange('key', e.target.value)}
                  placeholder="setting_key"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Label *</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => handleInputChange('label', e.target.value)}
                placeholder="Human-readable label"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Textarea
                id="value"
                value={formData.value}
                onChange={(e) => handleInputChange('value', e.target.value)}
                placeholder="Setting value"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metadata">Metadata (JSON)</Label>
              <Textarea
                id="metadata"
                value={JSON.stringify(formData.metadata, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleInputChange('metadata', parsed);
                  } catch {
                    // Invalid JSON, keep the string value for now
                  }
                }}
                placeholder='{"type": "string", "required": true}'
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderIndex">Order Index</Label>
                <Input
                  id="orderIndex"
                  type="number"
                  value={formData.orderIndex}
                  onChange={(e) => handleInputChange('orderIndex', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Active setting</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={closeSettingModal}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveSetting.isPending}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveSetting.isPending ? 'Saving...' : (editingSetting ? 'Update Setting' : 'Create Setting')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}