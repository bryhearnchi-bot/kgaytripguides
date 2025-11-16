import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AdminFormModal } from '@/components/admin/AdminFormModal';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Search, PlusSquare, Edit, Building2 } from 'lucide-react';

// Table configuration matching backend
const TABLES = {
  'venue-types': {
    displayName: 'Venue Types',
    nameField: 'name',
    apiField: 'name',
  },
  'trip-types': {
    displayName: 'Trip Types',
    nameField: 'trip_type',
    apiField: 'trip_type',
  },
  'trip-status': {
    displayName: 'Trip Status',
    nameField: 'status',
    apiField: 'status',
  },
  'talent-categories': {
    displayName: 'Talent Categories',
    nameField: 'category',
    apiField: 'category',
  },
  'location-types': {
    displayName: 'Location Types',
    nameField: 'type',
    apiField: 'type',
  },
  'charter-companies': {
    displayName: 'Charter Companies',
    nameField: 'name',
    apiField: 'name',
  },
  'cruise-lines': {
    displayName: 'Cruise Lines',
    nameField: 'name',
    apiField: 'name',
  },
  'resort-companies': {
    displayName: 'Resort Companies',
    nameField: 'name',
    apiField: 'name',
  },
} as const;

type TableKey = keyof typeof TABLES;

interface TableItem {
  id: number;
  [key: string]: any;
}

interface TableFormData {
  [key: string]: string;
}

export default function AdminLookupTables() {
  const queryClient = useQueryClient();
  const { session } = useSupabaseAuth();
  const [activeTable, setActiveTable] = useState<TableKey>('venue-types');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TableItem | null>(null);
  const [formData, setFormData] = useState<TableFormData>({});

  // Fetch counts for all tables
  const { data: counts = {} } = useQuery({
    queryKey: ['lookup-tables-counts'],
    queryFn: async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const response = await fetch('/api/admin/lookup-tables/counts', {
        headers,
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch counts');
      return response.json();
    },
    enabled: !!session?.access_token,
  });

  // Fetch items for active table
  const { data: tableData, isLoading } = useQuery({
    queryKey: ['lookup-tables', activeTable],
    queryFn: async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const response = await fetch(`/api/admin/lookup-tables/${activeTable}`, {
        headers,
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch items');
      return response.json();
    },
    enabled: !!session?.access_token,
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (data: TableFormData) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const response = await fetch(`/api/admin/lookup-tables/${activeTable}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create item');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookup-tables', activeTable] });
      queryClient.invalidateQueries({ queryKey: ['lookup-tables-counts'] });
      setShowAddModal(false);
      resetForm();
      toast.success('Success', {
        description: `${TABLES[activeTable].displayName.slice(0, -1)} created successfully`,
      });
    },
    onError: (error: Error) => {
      toast.error('Error', {
        description: error.message,
      });
    },
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async (data: TableFormData) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const response = await fetch(`/api/admin/lookup-tables/${activeTable}/${editingItem!.id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update item');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookup-tables', activeTable] });
      setEditingItem(null);
      setShowAddModal(false);
      resetForm();
      toast.success('Success', {
        description: `${TABLES[activeTable].displayName.slice(0, -1)} updated successfully`,
      });
    },
    onError: (error: Error) => {
      toast.error('Error', {
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setFormData({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateItemMutation.mutate(formData);
    } else {
      createItemMutation.mutate(formData);
    }
  };

  const handleModalOpenChange = (open: boolean) => {
    setShowAddModal(open);
    if (!open) {
      setEditingItem(null);
      resetForm();
    }
  };

  const handleEdit = (item: TableItem) => {
    setEditingItem(item);
    const config = TABLES[activeTable];
    const data: TableFormData = {
      [config.apiField]: item[config.nameField],
    };

    // Include logo_url for charter companies
    if (activeTable === 'charter-companies' && item.logo_url) {
      data.logo_url = item.logo_url;
    }

    setFormData(data);
    setShowAddModal(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    resetForm();
    setShowAddModal(true);
  };

  const items = tableData?.items || [];
  const currentConfig = TABLES[activeTable];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
              <Search className="h-6 w-6" />
              Lookup Tables
            </h1>
            <p className="text-sm text-white/60">
              Manage dropdown options and lookup data used throughout the application.
            </p>
          </div>
        </div>
      </section>

      {/* Filter/Table Selection Section */}
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-lg backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          {Object.entries(TABLES).map(([key, config]) => {
            const tableKey = key as TableKey;
            const isActive = activeTable === tableKey;
            const count = counts[key] || 0;

            return (
              <button
                key={key}
                onClick={() => setActiveTable(tableKey)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-600/50'
                }`}
              >
                {config.displayName}
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    isActive ? 'bg-white/20' : 'bg-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Table Section */}
      <section className="rounded-2xl border border-white/10 bg-white/5 shadow-lg backdrop-blur">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">All {currentConfig.displayName}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAdd}
            className="h-4 w-4 rounded-xl border border-white/15 bg-blue-500/10 text-white/80 hover:bg-blue-500/15"
            title={`Add ${currentConfig.displayName.slice(0, -1)}`}
          >
            <PlusSquare className="h-5 w-5 text-blue-400/80" />
          </Button>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {activeTable === 'charter-companies' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider w-24">
                    Logo
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white/40 uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={activeTable === 'charter-companies' ? 3 : 2}
                    className="px-6 py-8 text-center text-white/60"
                  >
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeTable === 'charter-companies' ? 3 : 2}
                    className="px-6 py-8 text-center text-white/60"
                  >
                    No {currentConfig.displayName.toLowerCase()} found
                  </td>
                </tr>
              ) : (
                items.map((item: TableItem) => (
                  <tr key={item.id} className="hover:bg-white/5">
                    {activeTable === 'charter-companies' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-start">
                          <div className="h-12 w-12 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-white/10 flex items-center justify-center">
                            {item.logo_url ? (
                              <img
                                src={item.logo_url}
                                alt={item[currentConfig.nameField]}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Building2 className="h-5 w-5 text-white/30" />
                            )}
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {item[currentConfig.nameField]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                        className="h-4 w-4 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4 text-white/80" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {items.length > 0 && (
          <footer className="border-t border-white/10 px-6 py-3">
            <p className="text-xs text-white/50">
              Showing {items.length} of {items.length} {currentConfig.displayName.toLowerCase()}
            </p>
          </footer>
        )}
      </section>

      {/* Add/Edit Modal */}
      <AdminFormModal
        isOpen={showAddModal}
        onOpenChange={handleModalOpenChange}
        title={
          editingItem
            ? `Edit ${currentConfig.displayName.slice(0, -1)}`
            : `Add New ${currentConfig.displayName.slice(0, -1)}`
        }
        icon={<Search className="h-5 w-5" />}
        description={`Enter the ${currentConfig.displayName.slice(0, -1).toLowerCase()} information below`}
        onSubmit={handleSubmit}
        primaryAction={{
          label: editingItem ? 'Save Changes' : `Create ${currentConfig.displayName.slice(0, -1)}`,
          loading: editingItem ? updateItemMutation.isPending : createItemMutation.isPending,
          loadingLabel: editingItem ? 'Saving...' : 'Creating...',
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => handleModalOpenChange(false),
        }}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData[currentConfig.apiField] || ''}
              onChange={e => setFormData({ ...formData, [currentConfig.apiField]: e.target.value })}
              placeholder={`Enter ${currentConfig.displayName.slice(0, -1).toLowerCase()} name`}
              required
            />
          </div>

          {/* Logo Upload for Charter Companies */}
          {activeTable === 'charter-companies' && (
            <div>
              <Label htmlFor="logo">Company Logo</Label>
              <ImageUploadField
                label="Company Logo"
                value={formData.logo_url || ''}
                onChange={url => setFormData({ ...formData, logo_url: url || '' })}
                imageType="charters"
                placeholder="No logo uploaded"
                disabled={editingItem ? updateItemMutation.isPending : createItemMutation.isPending}
                className="mt-2"
              />
            </div>
          )}
        </div>
      </AdminFormModal>
    </div>
  );
}
