import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EnhancedUsersTable } from '@/components/admin/EnhancedUsersTable';
import { AdminBottomSheet } from '@/components/admin/AdminBottomSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import SingleSelectWithCreate from '@/components/admin/SingleSelectWithCreate';
import { api } from '@/lib/api-client';
import {
  Users,
  Plus,
  PlusSquare,
  Edit2,
  Trash2,
  Search,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useAdminUsers, useAdminUserMutations } from '@/hooks/use-admin-users-cache';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeleton';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { LocationSearchBar } from '@/components/admin/LocationSearchBar';

interface UserData {
  id: string;
  username?: string;
  email: string;
  name?: {
    first?: string;
    last?: string;
    middle?: string;
    full?: string;
  };
  role: string;
  is_active: boolean;
  account_status: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  avatar_url?: string;
  avatarUrl?: string;
  profile_image_url?: string;
  bio?: string;
  website?: string;
  phone_number?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  // Individual location fields (following locations/resorts pattern)
  locationText?: string;
  city?: string;
  stateProvince?: string;
  country?: string;
  countryCode?: string;
  social_links?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    tiktok?: string;
  };
  communication_preferences?: {
    email?: boolean;
    sms?: boolean;
  };
  trip_updates_opt_in?: boolean;
  marketing_emails?: boolean;
}

interface UserFormData {
  username?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  password?: string;
  is_active: boolean;
  account_status: string;
  bio?: string;
  website?: string;
  avatar_url?: string;
  phone_number?: string;
  // Location fields (following locations/resorts pattern)
  locationText?: string;
  city?: string;
  stateProvince?: string;
  country?: string;
  countryCode?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  tiktok?: string;
  marketing_emails?: boolean;
  trip_updates_opt_in?: boolean;
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

const fieldBaseClasses =
  'h-10 rounded-lg border border-white/15 bg-white/8 text-sm text-white placeholder:text-white/40 focus:border-[#22d3ee] focus:ring-0 focus:ring-offset-0 focus:shadow-[0_0_0_2px_rgba(34,211,238,0.1)] px-3';

const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'content_manager', label: 'Content Manager' },
  { value: 'super_admin', label: 'Super Admin' },
];

export default function UsersManagement() {
  const queryClient = useQueryClient();
  const { profile, session } = useSupabaseAuthContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'viewer',
    password: '',
    is_active: true,
    account_status: 'active',
    bio: '',
    website: '',
    avatar_url: '',
    phone_number: '',
    city: '',
    stateProvince: '',
    country: '',
    countryCode: '',
    instagram: '',
    twitter: '',
    facebook: '',
    linkedin: '',
    tiktok: '',
    marketing_emails: false,
    trip_updates_opt_in: false,
  });

  const userRole = profile?.role ?? 'viewer';
  const canManageUsers = ['super_admin', 'content_manager'].includes(userRole);
  const canDeleteUsers = userRole === 'super_admin';

  // Use optimized caching hook
  const {
    updateUserOptimistically,
    addUserOptimistically,
    removeUserOptimistically,
    invalidateUsers,
  } = useAdminUserMutations();

  // Fetch users with optimized caching
  const { data, isLoading, error } = useAdminUsers({
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
    onSuccess: result => {
      if (result.user) {
        addUserOptimistically(result.user);
      }
      invalidateUsers();
      setShowAddModal(false);
      resetForm();
      toast.success('Success', {
        description: 'User created successfully',
      });
    },
    onError: error => {
      toast.error('Error', {
        description: 'Failed to create user',
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await api.put(`/api/admin/users/${editingUser!.id}`, data);
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: result => {
      if (result.user && editingUser) {
        updateUserOptimistically(editingUser.id, result.user);
      }
      invalidateUsers();
      setEditingUser(null);
      setShowAddModal(false);
      resetForm();
      toast.success('Success', {
        description: 'User updated successfully',
      });
    },
    onError: error => {
      toast.error('Error', {
        description: 'Failed to update user',
      });
    },
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
    onSuccess: result => {
      removeUserOptimistically(result.userId);
      invalidateUsers();
      toast.success('Success', {
        description: 'User deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast.error('Error', {
        description: 'Failed to delete user',
      });
    },
  });

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await api.patch(`/api/admin/users/${id}/status`, {
        is_active: isActive,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user status');
      }
      return response.json();
    },
    onSuccess: result => {
      if (result.user) {
        updateUserOptimistically(result.user.id, result.user);
      }
      invalidateUsers();
      toast.success('Success', {
        description: result.user.is_active
          ? 'User activated successfully'
          : 'User deactivated successfully',
      });
    },
    onError: (error: Error) => {
      toast.error('Error', {
        description: error.message || 'Failed to update user status',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      role: 'viewer',
      password: '',
      is_active: true,
      account_status: 'active',
      bio: '',
      website: '',
      avatar_url: '',
      phone_number: '',
      city: '',
      stateProvince: '',
      country: '',
      countryCode: '',
      instagram: '',
      twitter: '',
      facebook: '',
      linkedin: '',
      tiktok: '',
      marketing_emails: false,
      trip_updates_opt_in: false,
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

    // Validate password for new users
    if (!editingUser && (!formData.password || formData.password.length < 8)) {
      alert('Password is required and must be at least 8 characters for new users.');
      return;
    }

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
      firstName: user.name?.first || '',
      lastName: user.name?.last || '',
      role: user.role,
      password: '',
      is_active: user.is_active,
      account_status: user.account_status,
      bio: user.bio || '',
      website: user.website || '',
      avatar_url: user.avatar_url || user.avatarUrl || '',
      phone_number: user.phone_number || '',
      city: user.city || user.location?.city || '',
      stateProvince:
        user.stateProvince || (user as any).state_province || user.location?.state || '',
      country: user.country || user.location?.country || '',
      countryCode: user.countryCode || (user as any).country_code || '',
      instagram: user.social_links?.instagram || '',
      twitter: user.social_links?.twitter || '',
      facebook: user.social_links?.facebook || '',
      linkedin: user.social_links?.linkedin || '',
      tiktok: user.social_links?.tiktok || '',
      marketing_emails: user.marketing_emails || false,
      trip_updates_opt_in: user.trip_updates_opt_in || false,
    });
    // Delay opening the modal slightly to ensure dropdown menu has closed
    setTimeout(() => {
      setShowAddModal(true);
    }, 100);
  };

  const handleDelete = (id: string) => {
    if (!canDeleteUsers) {
      toast.error('Not permitted', {
        description: 'You do not have permission to delete users.',
      });
      return;
    }
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleToggleStatus = (user: UserData) => {
    const action = user.is_active ? 'deactivate' : 'activate';
    const confirmMessage = user.is_active
      ? 'Are you sure you want to deactivate this user? They will not be able to log in.'
      : 'Are you sure you want to activate this user?';

    if (confirm(confirmMessage)) {
      toggleStatusMutation.mutate({
        id: user.id,
        isActive: !user.is_active,
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const displayName =
      user.name?.first && user.name?.last ? `${user.name.first} ${user.name.last}` : '';
    return (
      (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getRoleIcon = (role: string) => {
    return <Shield className="h-3.5 w-3.5" />;
  };

  const getRoleLabel = (role: string) => {
    const roleData = ROLE_OPTIONS.find(r => r.value === role);
    return roleData?.label || role;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'content_manager':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'viewer':
      default:
        return 'bg-white/10 text-white/70 border-white/20';
    }
  };

  // Show skeleton while loading initial data
  if (isLoading && users.length === 0) {
    return <AdminTableSkeleton rows={5} />;
  }

  return (
    <div className="space-y-4" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header Section - Matching trips management style */}
      <div className="safari-sticky-header sticky top-16 z-20 pb-[0.85rem] space-y-4">
        <div className="flex items-center justify-between px-1">
          <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold text-white">
            <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            User Management
          </h1>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
              className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/15"
              aria-label="Search users"
            >
              <Search className="h-4 w-4" />
            </Button>
            {canManageUsers && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingUser(null);
                  resetForm();
                  handleModalOpenChange(true);
                }}
                className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/15"
                aria-label="Add new user"
                title="Add New User"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search Bar - shown when search button is clicked */}
        {showSearch && (
          <div className="relative px-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search users by name, email, or role"
              className="h-11 rounded-full border-white/5 bg-white/10 pl-10 text-sm text-white placeholder:text-white/50 focus-visible:border-white/20 focus-visible:ring-1 focus-visible:ring-white/10 focus-visible:ring-offset-0 focus:border-white/20 focus:ring-1 focus:ring-white/10 focus:ring-offset-0 transition-all"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Mobile header */}
      <div className="sm:hidden px-1 mb-4">
        <h2 className="text-lg font-semibold text-white">All Users</h2>
      </div>

      <section className="relative sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/5 sm:shadow-2xl sm:shadow-black/40 sm:backdrop-blur">
        <header className="hidden sm:flex flex-col gap-2 border-b border-white/10 px-3 sm:pl-6 sm:pr-3 py-3 md:flex-row md:items-center md:justify-between">
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
          <div className="flex flex-col items-center justify-center gap-3 px-3 sm:px-6 py-10 sm:py-14 text-white/60 text-center">
            <Users className="h-10 w-10 text-white/30" />
            <p className="text-sm font-medium text-white">Insufficient permissions</p>
            <p className="text-xs text-white/60">
              You need admin access to view or manage user profiles.
            </p>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center gap-4 px-3 sm:px-6 py-10 sm:py-14 text-center text-white/70">
            <Users className="h-10 w-10 text-white/30" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Unable to load users</p>
              <p className="text-xs text-white/60">
                {loadError.message || 'An unexpected error occurred fetching profile data.'}
              </p>
            </div>
            <Button
              onClick={() => invalidateUsers()}
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
            >
              Retry
            </Button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-3 sm:px-6 py-10 sm:py-14 text-white/60">
            <Users className="h-10 w-10 text-white/30" />
            <p className="text-sm">
              {searchTerm
                ? 'No users match your search.'
                : 'Get started by adding your first user.'}
            </p>
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
                render: (_value, user) => {
                  const profileImageUrl =
                    user.avatar_url || user.avatarUrl || user.profile_image_url;
                  // Get display name from first/last name
                  const displayName =
                    user.name?.first && user.name?.last
                      ? `${user.name.first} ${user.name.last}`
                      : user.username || user.email;
                  const initials =
                    displayName.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase();

                  return (
                    <div className="flex items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10">
                        {profileImageUrl ? (
                          <img
                            src={profileImageUrl}
                            alt={displayName || 'User'}
                            className="h-full w-full rounded-xl object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-medium">
                            {initials}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                },
              },
              {
                key: 'first_name',
                label: 'First Name',
                priority: 'high',
                sortable: true,
                minWidth: 120,
                render: (_value, user) => {
                  return <p className="font-bold text-xs text-white">{user.name?.first || '-'}</p>;
                },
              },
              {
                key: 'last_name',
                label: 'Last Name',
                priority: 'high',
                sortable: true,
                minWidth: 120,
                render: (_value, user) => {
                  return <p className="font-bold text-xs text-white">{user.name?.last || '-'}</p>;
                },
              },
              {
                key: 'email',
                label: 'Email',
                priority: 'high',
                sortable: true,
                minWidth: 200,
                render: value => <span className="text-xs text-white/80">{value}</span>,
              },
              {
                key: 'role',
                label: 'Role',
                priority: 'high',
                sortable: true,
                minWidth: 150,
                render: (value: string) => (
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${getRoleBadgeColor(value)}`}
                  >
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
                render: (value: boolean) =>
                  value ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#34d399]/15 px-3 py-1 text-xs font-medium text-[#34d399]">
                      <UserCheck className="h-3.5 w-3.5" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#fbbf24]/15 px-3 py-1 text-xs font-medium text-[#fbbf24]">
                      <UserX className="h-3.5 w-3.5" /> Inactive
                    </span>
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
                label: 'Deactivate User',
                icon: <UserX className="h-4 w-4" />,
                onClick: handleToggleStatus,
                variant: 'warning' as const,
                disabled: () => !canManageUsers,
                hidden: user => !user.is_active,
              },
              {
                label: 'Activate User',
                icon: <UserCheck className="h-4 w-4" />,
                onClick: handleToggleStatus,
                variant: 'success' as const,
                disabled: () => !canManageUsers,
                hidden: user => user.is_active,
              },
              {
                label: 'Delete User',
                icon: <Trash2 className="h-4 w-4" />,
                onClick: user => handleDelete(user.id),
                variant: 'destructive' as const,
                disabled: () => !canDeleteUsers,
              },
            ]}
            keyField="id"
            isLoading={isLoading}
            emptyMessage={
              searchTerm ? 'No users match your search.' : 'Get started by adding your first user.'
            }
          />
        )}

        {filteredUsers.length > 0 && (
          <footer className="flex items-center justify-between sm:border-t sm:border-white/10 px-3 sm:px-6 py-3 sm:py-4">
            <div className="text-xs text-white/50">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </footer>
        )}
      </section>

      {/* Add/Edit Bottom Sheet */}
      <AdminBottomSheet
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
        contentClassName="grid grid-cols-1 lg:grid-cols-2 gap-5"
        maxHeight="85vh"
      >
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white border-b border-white/10 pb-2">
            Basic Information
          </h3>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
              required
              className={fieldBaseClasses}
            />
          </div>

          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoComplete="username"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              placeholder="Optional unique username"
              className={fieldBaseClasses}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                autoComplete="given-name"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
                required
                className={fieldBaseClasses}
              />
            </div>

            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                autoComplete="family-name"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                required
                className={fieldBaseClasses}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              type="tel"
              autoComplete="tel"
              value={formData.phone_number}
              onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="(555) 123-4567"
              className={fieldBaseClasses}
            />
          </div>

          <div>
            <Label htmlFor="password">Password {!editingUser && '*'}</Label>
            <Input
              id="password"
              type="password"
              autoComplete={editingUser ? 'new-password' : 'new-password'}
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
              className={fieldBaseClasses}
            />
          </div>

          <div>
            <Label htmlFor="role">Role *</Label>
            <SingleSelectWithCreate
              options={ROLE_OPTIONS.map(role => ({ id: role.value, name: role.label }))}
              value={formData.role}
              onValueChange={value => setFormData({ ...formData, role: String(value) })}
              placeholder="Select role..."
              showSearch={false}
              showCreateNew={false}
            />
          </div>

          <div>
            <Label htmlFor="account_status">Account Status *</Label>
            <SingleSelectWithCreate
              options={[
                { id: 'active', name: 'Active' },
                { id: 'suspended', name: 'Suspended' },
                { id: 'pending_verification', name: 'Pending Verification' },
              ]}
              value={formData.account_status}
              onValueChange={value => setFormData({ ...formData, account_status: String(value) })}
              placeholder="Select status..."
              showSearch={false}
              showCreateNew={false}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.is_active}
              onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-white/30 bg-white/10 text-[#22d3ee] focus:ring-[#22d3ee] focus:ring-offset-0"
            />
            <Label htmlFor="isActive">Active user account</Label>
          </div>
        </div>

        {/* Profile & Additional Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white border-b border-white/10 pb-2">
            Profile & Additional Information
          </h3>

          <div>
            <Label htmlFor="avatar_url">Profile Avatar</Label>
            <ImageUploadField
              label="Profile Avatar"
              value={formData.avatar_url || ''}
              onChange={url => setFormData({ ...formData, avatar_url: url || '' })}
              imageType="profiles"
              placeholder="No avatar uploaded"
              disabled={editingUser ? updateUserMutation.isPending : createUserMutation.isPending}
            />
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              autoComplete="url"
              value={formData.website}
              onChange={e => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://example.com"
              className={fieldBaseClasses}
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={3}
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about this user..."
              className="min-h-[80px] rounded-lg border border-white/15 bg-white/8 text-sm text-white placeholder:text-white/40 focus:border-[#22d3ee] focus:ring-0 focus:ring-offset-0 focus:shadow-[0_0_0_2px_rgba(34,211,238,0.1)] px-3 py-2"
            />
          </div>

          <div>
            <LocationSearchBar
              label="Location"
              placeholder="Search for city, state, or country..."
              value={{
                city: formData.city || '',
                state: formData.stateProvince || '',
                country: formData.country || '',
                countryCode: formData.countryCode || '',
              }}
              onChange={location => {
                setFormData({
                  ...formData,
                  locationText: location.formatted || '',
                  city: location.city || '',
                  stateProvince: location.state || '',
                  country: location.country || '',
                  countryCode: location.countryCode || '',
                });
              }}
            />
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-medium text-white/70 uppercase tracking-wide">
              Social Links
            </h4>

            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.instagram}
                onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="@username or full URL"
                className={fieldBaseClasses}
              />
            </div>

            <div>
              <Label htmlFor="twitter">Twitter/X</Label>
              <Input
                id="twitter"
                value={formData.twitter}
                onChange={e => setFormData({ ...formData, twitter: e.target.value })}
                placeholder="@username or full URL"
                className={fieldBaseClasses}
              />
            </div>

            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={formData.facebook}
                onChange={e => setFormData({ ...formData, facebook: e.target.value })}
                placeholder="Profile URL or username"
                className={fieldBaseClasses}
              />
            </div>

            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={formData.linkedin}
                onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                placeholder="Profile URL"
                className={fieldBaseClasses}
              />
            </div>

            <div>
              <Label htmlFor="tiktok">TikTok</Label>
              <Input
                id="tiktok"
                value={formData.tiktok}
                onChange={e => setFormData({ ...formData, tiktok: e.target.value })}
                placeholder="@username or full URL"
                className={fieldBaseClasses}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-medium text-white/70 uppercase tracking-wide">
              Preferences
            </h4>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="marketing_emails"
                checked={formData.marketing_emails}
                onChange={e => setFormData({ ...formData, marketing_emails: e.target.checked })}
                className="h-4 w-4 rounded border-white/30 bg-white/10 text-[#22d3ee] focus:ring-[#22d3ee] focus:ring-offset-0"
              />
              <Label htmlFor="marketing_emails">Marketing emails</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="trip_updates_opt_in"
                checked={formData.trip_updates_opt_in}
                onChange={e => setFormData({ ...formData, trip_updates_opt_in: e.target.checked })}
                className="h-4 w-4 rounded border-white/30 bg-white/10 text-[#22d3ee] focus:ring-[#22d3ee] focus:ring-offset-0"
              />
              <Label htmlFor="trip_updates_opt_in">Trip updates opt-in</Label>
            </div>
          </div>

          {editingUser?.communication_preferences && (
            <div className="space-y-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <h4 className="text-xs font-medium text-amber-300 uppercase tracking-wide flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-amber-400"></div>
                User Communication Preferences (Read-only)
              </h4>
              <div className="text-xs text-amber-200/80 space-y-1">
                <div>
                  Email updates:{' '}
                  {editingUser.communication_preferences.email ? 'Enabled' : 'Disabled'}
                </div>
                <div>
                  SMS notifications:{' '}
                  {editingUser.communication_preferences.sms ? 'Enabled' : 'Disabled'}
                </div>
                <div>Trip updates: {editingUser.trip_updates_opt_in ? 'Enabled' : 'Disabled'}</div>
                <div>Marketing: {editingUser.marketing_emails ? 'Enabled' : 'Disabled'}</div>
              </div>
            </div>
          )}
        </div>
      </AdminBottomSheet>
    </div>
  );
}
