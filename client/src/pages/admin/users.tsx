import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EnhancedUsersTable } from '@/components/admin/EnhancedUsersTable';
import { AdminFormModal } from '@/components/admin/AdminFormModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api-client';
import { Users, Plus, PlusSquare, Edit2, Trash2, Search, Save, Shield, User, UserCheck, UserX } from 'lucide-react';
import { useAdminUsers, useAdminUserMutations } from '@/hooks/use-admin-users-cache';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';

interface UserData {
  id: string;
  username?: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  account_status: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
}

interface UserFormData {
  username?: string;
  email: string;
  full_name?: string;
  role: string;
  password?: string;
  is_active: boolean;
  account_status: string;
}

interface UsersResponse {
  users: UserData[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const fieldBaseClasses = "h-10 rounded-lg border border-white/15 bg-white/8 text-sm text-white placeholder:text-white/40 focus:border-[#22d3ee] focus:ring-0 focus:ring-offset-0 focus:shadow-[0_0_0_2px_rgba(34,211,238,0.1)] px-3";

const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'content_manager', label: 'Content Manager' },
  { value: 'admin', label: 'Admin' },
  { value: 'trip_admin', label: 'Trip Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

export default function UsersManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile, session } = useSupabaseAuthContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    full_name: '',
    role: 'viewer',
    password: '',
    is_active: true,
    account_status: 'active',
  });

  const userRole = profile?.role ?? 'viewer';
  const canManageUsers = ['super_admin', 'content_manager'].includes(userRole);
  const canDeleteUsers = userRole === 'super_admin';

  // Use optimized caching hook
  const { updateUserOptimistically, addUserOptimistically, removeUserOptimistically, invalidateUsers } = useAdminUserMutations();

  // Fetch users with optimized caching
  const {
    data,
    isLoading,
    error,
  } = useAdminUsers({
    search: searchTerm || undefined,
    page: 1,
    limit: 20,
  });

  const users = data?.users ?? [];
  const loadError = error as Error | null;

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await api.post('/api/admin/users', data);
      if (!response.ok) throw new Error('Failed to create user');
      return response.json();
    },
    onSuccess: (result) => {
      if (result.user) {
        addUserOptimistically(result.user);
      }
      invalidateUsers();
      setShowAddModal(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create user',
        variant: 'destructive',
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await api.put(`/api/admin/users/${editingUser!.id}`, data);
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: (result) => {
      if (result.user && editingUser) {
        updateUserOptimistically(editingUser.id, result.user);
      }
      invalidateUsers();
      setEditingUser(null);
      resetForm();
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive',
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/admin/users/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }
      return { userId: id };
    },
    onSuccess: (result) => {
      removeUserOptimistically(result.userId);
      invalidateUsers();
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      full_name: '',
      role: 'viewer',
      password: '',
      is_active: true,
      account_status: 'active',
    });
  };

  const handleModalOpenChange = (open: boolean) => {
    setShowAddModal(open);
    if (!open) {
      setEditingUser(null);
      resetForm();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUserMutation.mutate({ ...formData });
    } else {
      createUserMutation.mutate(formData);
    }
  };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      email: user.email,
      full_name: user.full_name || '',
      role: user.role,
      password: '',
      is_active: user.is_active,
      account_status: user.account_status,
    });
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (!canDeleteUsers) {
      toast({
        title: 'Not permitted',
        description: 'You do not have permission to delete users.',
        variant: 'destructive',
      });
      return;
    }
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(id);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    return <Shield className="h-3.5 w-3.5" />;
  };

  const getRoleLabel = (role: string) => {
    const roleData = ROLE_OPTIONS.find(r => r.value === role);
    return roleData?.label || role;
  };

  // Show skeleton while loading initial data
  if (isLoading && users.length === 0) {
    return <AdminTableSkeleton rows={5} />;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
              <Users className="h-6 w-6" />
              User Management
            </h1>
            <p className="text-sm text-white/60">Manage user accounts across Atlantis sailings.</p>
          </div>
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search users by name, email, or role"
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
            <h2 className="text-lg font-semibold text-white">All Users</h2>
          </div>
          {canManageUsers && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingUser(null);
                resetForm();
                handleModalOpenChange(true);
              }}
              className="h-4 w-4 rounded-xl border border-white/15 bg-blue-500/10 text-white/80 hover:bg-blue-500/15"
              title="Add New User"
            >
              <PlusSquare className="h-5 w-5 text-blue-400/80" />
            </Button>
          )}
        </header>

        {!canManageUsers ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-white/60 text-center">
            <Users className="h-10 w-10 text-white/30" />
            <p className="text-sm font-medium text-white">Insufficient permissions</p>
            <p className="text-xs text-white/60">You need admin access to view or manage user profiles.</p>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center text-white/70">
            <Users className="h-10 w-10 text-white/30" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Unable to load users</p>
              <p className="text-xs text-white/60">{loadError.message || 'An unexpected error occurred fetching profile data.'}</p>
            </div>
            <Button
              onClick={() => invalidateUsers()}
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
            >
              Retry
            </Button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-white/60">
            <Users className="h-10 w-10 text-white/30" />
            <p className="text-sm">{searchTerm ? 'No users match your search.' : 'Get started by adding your first user.'}</p>
            {!searchTerm && (
              <Button
                onClick={() => {
                  setEditingUser(null);
                  resetForm();
                  setShowAddModal(true);
                }}
                className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-4 py-2 text-sm text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First User
              </Button>
            )}
          </div>
        ) : (
          <EnhancedUsersTable
            data={filteredUsers}
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
                render: (_value, user) => (
                  <div className="flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-medium">
                        {user.full_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'full_name',
                label: 'Name',
                priority: 'high',
                sortable: true,
                minWidth: 200,
                render: (_value, user) => (
                  <p className="font-bold text-xs text-white">{user.full_name || user.username || 'No name'}</p>
                ),
              },
              {
                key: 'email',
                label: 'Email',
                priority: 'high',
                sortable: true,
                minWidth: 200,
                render: (value) => (
                  <span className="text-xs text-white/80">{value}</span>
                ),
              },
              {
                key: 'role',
                label: 'Role',
                priority: 'high',
                sortable: true,
                minWidth: 150,
                render: (value: string) => (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                    {getRoleIcon(value)}
                    <span>{getRoleLabel(value)}</span>
                  </span>
                ),
              },
              {
                key: 'is_active',
                label: 'Status',
                priority: 'medium',
                sortable: true,
                minWidth: 120,
                render: (value: boolean) => (
                  value ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#34d399]/15 px-3 py-1 text-xs font-medium text-[#34d399]">
                      <UserCheck className="h-3.5 w-3.5" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#fb7185]/15 px-3 py-1 text-xs font-medium text-[#fb7185]">
                      <UserX className="h-3.5 w-3.5" /> Inactive
                    </span>
                  )
                ),
              },
            ]}
            actions={[
              {
                label: 'Edit User',
                icon: <Edit2 className="h-4 w-4" />,
                onClick: handleEdit,
                disabled: () => !canManageUsers,
              },
              {
                label: 'Delete User',
                icon: <Trash2 className="h-4 w-4" />,
                onClick: (user) => handleDelete(user.id),
                variant: 'destructive',
                disabled: () => !canDeleteUsers,
              },
            ]}
            keyField="id"
            isLoading={isLoading}
            emptyMessage={searchTerm ? 'No users match your search.' : 'Get started by adding your first user.'}
          />
        )}

        {filteredUsers.length > 0 && (
          <footer className="flex items-center justify-between border-t border-white/10 px-6 py-4">
            <div className="text-xs text-white/50">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </footer>
        )}
      </section>

      {/* Add/Edit Modal */}
      <AdminFormModal
        isOpen={showAddModal}
        onOpenChange={handleModalOpenChange}
        title={editingUser ? 'Edit User' : 'Add New User'}
        icon={<Users className="h-5 w-5" />}
        description="Enter the user information below"
        onSubmit={handleSubmit}
        primaryAction={{
          label: editingUser ? 'Save Changes' : 'Create User',
          loading: editingUser ? updateUserMutation.isPending : createUserMutation.isPending,
          loadingLabel: editingUser ? 'Saving...' : 'Creating...',
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => handleModalOpenChange(false),
        }}
        contentClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <div className="col-span-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="Enter username"
            className={fieldBaseClasses}
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="user@example.com"
            required
            className={fieldBaseClasses}
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="John Doe"
            className={fieldBaseClasses}
          />
        </div>

        <div>
          <Label htmlFor="role">Role *</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value })}
          >
            <SelectTrigger className={`${fieldBaseClasses} text-left`}>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="password">Password {!editingUser && '*'}</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
            className={fieldBaseClasses}
          />
        </div>

        <div className="col-span-2 flex items-center space-x-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="h-4 w-4 rounded border-white/30 bg-white/10 text-[#22d3ee] focus:ring-[#22d3ee] focus:ring-offset-0"
          />
          <Label htmlFor="isActive">Active user account</Label>
        </div>
      </AdminFormModal>
    </div>
  );
}
