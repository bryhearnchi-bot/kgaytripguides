import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EnhancedSettingsTable } from '@/components/admin/EnhancedSettingsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AdminFormModal } from '@/components/admin/AdminFormModal';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Settings,
  Plus,
  PlusSquare,
  Edit2,
  Trash2,
  Search,
  Database,
  Shield,
  Globe,
  Key
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
  { value: 'trip_types', label: 'Trip Types' },
  { value: 'notification_types', label: 'Notifications' },
  { value: 'user_roles', label: 'User Roles' },
  { value: 'system', label: 'System' },
];

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
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

  // Fetch settings
  const { data: settings = [], isLoading } = useQuery<Setting[]>({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    }
  });

  // Create setting mutation
  const createSettingMutation = useMutation({
    mutationFn: async (data: SettingFormData) => {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create setting');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      setShowAddModal(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Setting created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create setting',
        variant: 'destructive',
      });
    }
  });

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async (data: SettingFormData) => {
      const response = await fetch(`/api/admin/settings/${editingSetting!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update setting');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      setEditingSetting(null);
      resetForm();
      toast({
        title: 'Success',
        description: 'Setting updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update setting',
        variant: 'destructive',
      });
    }
  });

  // Delete setting mutation
  const deleteSettingMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/settings/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete setting');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({
        title: 'Success',
        description: 'Setting deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete setting',
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setFormData({
      category: 'trip_types',
      key: '',
      label: '',
      value: '',
      metadata: {},
      isActive: true,
      orderIndex: 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSetting) {
      updateSettingMutation.mutate({ ...formData });
    } else {
      createSettingMutation.mutate(formData);
    }
  };

  const handleModalOpenChange = (open: boolean) => {
    setShowAddModal(open);
    if (!open) {
      setEditingSetting(null);
      resetForm();
    }
  };

  const handleEdit = (setting: Setting) => {
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
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this setting?')) {
      deleteSettingMutation.mutate(id);
    }
  };

  const filteredSettings = settings.filter(setting =>
    setting.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    setting.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    setting.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'trip_types': return <Globe className="h-3.5 w-3.5" />;
      case 'user_roles': return <Shield className="h-3.5 w-3.5" />;
      case 'system': return <Key className="h-3.5 w-3.5" />;
      default: return <Database className="h-3.5 w-3.5" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = SETTING_CATEGORIES.find(c => c.value === category);
    return cat?.label || category;
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
              <Settings className="h-6 w-6" />
              System Settings
            </h1>
            <p className="text-sm text-white/60">Configure system settings across Atlantis sailings.</p>
          </div>
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search settings by name, key, or category"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 rounded-full border-white/10 bg-white/10 pl-10 text-sm text-white placeholder:text-white/50 focus:border-[#22d3ee]/70"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
        <header className="flex flex-col gap-2 border-b border-white/10 pl-6 pr-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">All Settings</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingSetting(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="h-4 w-4 rounded-xl border border-white/15 bg-blue-500/10 text-white/80 hover:bg-blue-500/15"
            title="Add New Setting"
          >
            <PlusSquare className="h-5 w-5 text-blue-400/80" />
          </Button>
        </header>

        {filteredSettings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-white/60">
            <Settings className="h-10 w-10 text-white/30" />
            <p className="text-sm">{searchTerm ? 'No settings match your search.' : 'Get started by adding your first setting.'}</p>
            {!searchTerm && (
              <Button
                onClick={() => {
                  setEditingSetting(null);
                  resetForm();
                  setShowAddModal(true);
                }}
                className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-4 py-2 text-sm text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Setting
              </Button>
            )}
          </div>
        ) : (
          <EnhancedSettingsTable
            data={filteredSettings}
            columns={[
              {
                key: 'image',
                label: '',
                priority: 'high',
                sortable: false,
                resizable: false,
                width: 80,
                minWidth: 80,
                maxWidth: 80,
                render: (_value, setting) => (
                  <div className="flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10">
                      {getCategoryIcon(setting.category)}
                    </div>
                  </div>
                ),
              },
              {
                key: 'label',
                label: 'Setting',
                priority: 'high',
                sortable: true,
                minWidth: 200,
                render: (value) => (
                  <p className="font-bold text-xs text-white">{value}</p>
                ),
              },
              {
                key: 'key',
                label: 'Key',
                priority: 'high',
                sortable: true,
                minWidth: 150,
                render: (value) => (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-white/70 font-mono">
                    {value}
                  </span>
                ),
              },
              {
                key: 'category',
                label: 'Category',
                priority: 'medium',
                sortable: true,
                minWidth: 150,
                render: (value) => (
                  <span className="text-xs text-white/60">{getCategoryLabel(value)}</span>
                ),
              },
              {
                key: 'value',
                label: 'Value',
                priority: 'low',
                sortable: false,
                minWidth: 200,
                render: (value) => (
                  <span className="text-xs text-white/60 font-mono">
                    {value ? (value.length > 40 ? `${value.slice(0, 40)}...` : value) : 'Not set'}
                  </span>
                ),
              },
            ]}
            actions={[
              {
                label: 'Edit Setting',
                icon: <Edit2 className="h-4 w-4" />,
                onClick: handleEdit,
              },
              {
                label: 'Delete Setting',
                icon: <Trash2 className="h-4 w-4" />,
                onClick: (setting) => handleDelete(setting.id),
                variant: 'destructive',
              },
            ]}
            keyField="id"
            isLoading={isLoading}
            emptyMessage={searchTerm ? 'No settings match your search.' : 'Get started by adding your first setting.'}
          />
        )}

        {filteredSettings.length > 0 && (
          <footer className="flex items-center justify-between border-t border-white/10 px-6 py-4">
            <div className="text-xs text-white/50">
              Showing {filteredSettings.length} of {settings.length} settings
            </div>
          </footer>
        )}
      </section>

      {/* Add/Edit Modal */}
      <AdminFormModal
        isOpen={showAddModal}
        onOpenChange={handleModalOpenChange}
        title={editingSetting ? 'Edit Setting' : 'Add New Setting'}
        icon={<Settings className="h-5 w-5" />}
        description="Enter the setting information below"
        onSubmit={handleSubmit}
        primaryAction={{
          label: editingSetting ? 'Save Changes' : 'Create Setting',
          loading: editingSetting ? updateSettingMutation.isPending : createSettingMutation.isPending,
          loadingLabel: editingSetting ? 'Saving...' : 'Creating...'
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => handleModalOpenChange(false)
        }}
        contentClassName="grid grid-cols-2 gap-4"
      >
        <div>
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {SETTING_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="key">Key *</Label>
          <Input
            id="key"
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            placeholder="setting_key"
            required
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="label">Label *</Label>
          <Input
            id="label"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            placeholder="Human-readable label"
            required
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="value">Value</Label>
          <Textarea
            id="value"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            placeholder="Setting value"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="orderIndex">Order Index</Label>
          <Input
            id="orderIndex"
            type="number"
            value={formData.orderIndex}
            onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>

        <div className="flex items-center space-x-2 mt-6">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <Label htmlFor="isActive">Active setting</Label>
        </div>
      </AdminFormModal>
    </div>
  );
}