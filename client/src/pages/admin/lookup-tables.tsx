import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AdminBottomSheet } from '@/components/admin/AdminBottomSheet';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { EnhancedLookupTablesTable } from '@/components/admin/EnhancedLookupTablesTable';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { api } from '@/lib/api-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Plus, Edit2, ChevronDown, Filter, Building2 } from 'lucide-react';

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
      const response = await api.post(`/api/admin/lookup-tables/${activeTable}`, data);
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
      const response = await api.put(
        `/api/admin/lookup-tables/${activeTable}/${editingItem!.id}`,
        data
      );
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

  // Get icon for current table
  const getTableIcon = (tableKey: TableKey) => {
    switch (tableKey) {
      case 'venue-types':
      case 'location-types':
        return <Building2 className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Section - Sticky with Safari fix */}
      <div className="safari-sticky-header sticky top-16 z-20 pb-[0.85rem] space-y-4">
        <div className="flex items-center justify-between px-1">
          <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold text-white">
            <Search className="h-5 w-5 sm:h-6 sm:w-6" />
            Lookup Tables
          </h1>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors duration-200 border border-white/30 hover:border-white/50">
                  <Filter className="w-3 h-3" />
                  <span>{currentConfig.displayName}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-white/20 min-w-[280px]"
                style={{
                  backgroundColor: 'rgba(0, 33, 71, 1)',
                  backgroundImage:
                    'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
                }}
              >
                {Object.entries(TABLES).map(([key, config]) => {
                  const tableKey = key as TableKey;
                  const isActive = activeTable === tableKey;
                  const count = counts[key] || 0;
                  const Icon = getTableIcon(tableKey);

                  return (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => setActiveTable(tableKey)}
                      className={`cursor-pointer text-white hover:bg-white/10 ${
                        isActive ? 'bg-white/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between w-full gap-3">
                        <div className="flex items-center gap-2">
                          {Icon}
                          <span className="font-medium">{config.displayName}</span>
                        </div>
                        <span className="text-xs text-white/60">{count}</span>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleAdd}
              className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/15"
              aria-label="Add new item"
              title={`Add ${currentConfig.displayName.slice(0, -1)}`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Subheader - Non-sticky, scrolls with content */}
      <div className="sm:hidden px-1">
        <h2 className="text-lg font-semibold text-white">All {currentConfig.displayName}</h2>
      </div>

      <section className="relative sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/5 sm:shadow-2xl sm:shadow-black/40 sm:backdrop-blur">
        <header className="hidden sm:flex flex-col gap-2 border-b border-white/10 px-3 sm:pl-6 sm:pr-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">All {currentConfig.displayName}</h2>
          </div>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-white/60">
            <Search className="h-10 w-10 text-white/30" />
            <p className="text-sm">No {currentConfig.displayName.toLowerCase()} found</p>
            <Button
              onClick={handleAdd}
              className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-4 py-2 text-sm text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First {currentConfig.displayName.slice(0, -1)}
            </Button>
          </div>
        ) : (
          <EnhancedLookupTablesTable
            data={items}
            columns={[
              ...(activeTable === 'charter-companies'
                ? [
                    {
                      key: 'logo',
                      label: '',
                      priority: 'high' as const,
                      sortable: false,
                      resizable: false,
                      width: 80,
                      minWidth: 80,
                      maxWidth: 80,
                      render: (_value, item) => (
                        <div className="flex items-center justify-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-white/10">
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
                      ),
                    },
                  ]
                : []),
              {
                key: currentConfig.nameField,
                label: 'Name',
                priority: 'high' as const,
                sortable: true,
                minWidth: 200,
                render: value => <span className="text-white">{value}</span>,
              },
            ]}
            actions={[
              {
                label: `Edit ${currentConfig.displayName.slice(0, -1)}`,
                icon: <Edit2 className="h-4 w-4" />,
                onClick: handleEdit,
              },
            ]}
            keyField="id"
            isLoading={isLoading}
            emptyMessage={`No ${currentConfig.displayName.toLowerCase()} found`}
            nameField={currentConfig.nameField}
          />
        )}

        {items.length > 0 && (
          <footer className="border-t border-white/10 px-6 py-4">
            <div className="text-xs text-white/50">
              Showing {items.length} of {items.length} {currentConfig.displayName.toLowerCase()}
            </div>
          </footer>
        )}
      </section>

      {/* Add/Edit Bottom Sheet */}
      <AdminBottomSheet
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
      </AdminBottomSheet>
    </div>
  );
}
