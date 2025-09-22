import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Shield,
  Calendar,
  Loader2,
  Mail,
  User,
  UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { dateOnly } from '@/lib/utils';
import { InviteUserModal } from '@/components/admin/InviteUserModal';
import { InvitationManagement } from '@/components/admin/InvitationManagement';
import { supabase } from '@/lib/supabase';

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

const BASE_ROLES = [
  { value: 'viewer', label: 'Viewer', description: 'View-only access' },
  { value: 'content_manager', label: 'Content Manager', description: 'Edit content and manage trips' },
  { value: 'admin', label: 'Admin', description: 'Full system access' },
] as const;

export default function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
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
  const [showPassword, setShowPassword] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Compute role options based on current user role
  const ROLE_OPTIONS = isSuperAdmin
    ? [...BASE_ROLES, { value: 'super_admin', label: 'Super Admin', description: 'Highest privileges for destructive actions' }]
    : [...BASE_ROLES];

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const metaRole = (user?.user_metadata as any)?.role as string | undefined;
        setIsSuperAdmin(metaRole === 'super_admin');
      } catch {
        setIsSuperAdmin(false);
      }
    })();
  }, []);

  // Fetch users
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery<UserData[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      return data.users || [];
    },
  });

  // Create/Update user mutation
  const saveUser = useMutation({
    mutationFn: async (data: UserFormData) => {
      console.log('Starting user save mutation...');
      console.log('Edit mode:', editingUser ? 'UPDATE' : 'CREATE');

      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No authentication token found');
        throw new Error('No authentication token');
      }
      console.log('Got auth token');

      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';

      // Don't send empty password for updates
      const payload = { ...data };
      if (editingUser && !payload.password) {
        delete payload.password;
      }

      console.log(`Making ${method} request to ${url}`);
      console.log('Request payload:', {
        ...payload,
        password: payload.password ? '***' : undefined
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Failed to save user';
        try {
          const errorData = await response.json();
          console.error('Error response data:', errorData);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch {
          const errorText = await response.text();
          console.error('Error response text:', errorText);
          if (errorText) errorMessage = errorText;
        }
        console.error('Throwing error:', errorMessage);
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `User ${editingUser ? 'updated' : 'created'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      closeUserModal();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${editingUser ? 'update' : 'create'} user`,
        variant: 'destructive',
      });
    },
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      // Get CSRF token from cookie
      let csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('_csrf='))
        ?.split('=')[1];

      // If no token in cookie, fetch one first
      if (!csrfToken) {
        const csrfResponse = await fetch('/api/csrf-token', {
          credentials: 'include',
        });

        if (!csrfResponse.ok) {
          throw new Error('Failed to get CSRF token');
        }

        const data = await csrfResponse.json();
        csrfToken = data.csrfToken;
        document.cookie = `_csrf=${encodeURIComponent(csrfToken)}; path=/; max-age=3600; samesite=strict`;
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete user');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    },
  });

  // Toggle user status mutation
  const toggleUserStatus = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
        body: JSON.stringify({ is_active: isActive }),
      });
      if (!response.ok) {
        throw new Error('Failed to update user status');
      }
      return response.json();
    },
    onSuccess: (_, { isActive }) => {
      toast({
        title: 'Success',
        description: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    },
  });

  const openUserModal = (user?: UserData) => {
    if (user) {
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
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        full_name: '',
        role: 'viewer',
        password: '',
        is_active: true,
        account_status: 'active',
      });
    }
    setUserModalOpen(true);
  };

  const closeUserModal = () => {
    setUserModalOpen(false);
    setEditingUser(null);
    setShowPassword(false);
    // Reset form to initial empty state
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

  const handleInputChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e?: React.MouseEvent | React.FormEvent) => {
    e?.preventDefault();

    if (!formData.username || !formData.username.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Username is required',
        variant: 'destructive',
      });
      return;
    }

    if (formData.username.trim().length < 3) {
      toast({
        title: 'Validation Error',
        description: 'Username must be at least 3 characters',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.email || !formData.email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Email is required',
        variant: 'destructive',
      });
      return;
    }

    if (!editingUser && (!formData.password || !formData.password.trim())) {
      toast({
        title: 'Validation Error',
        description: 'Password is required for new users',
        variant: 'destructive',
      });
      return;
    }

    if (!editingUser && formData.password.trim().length < 8) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    // Trim all string fields before sending
    const trimmedData = {
      ...formData,
      username: formData.username?.trim(),
      email: formData.email.trim(),
      full_name: formData.full_name?.trim(),
      password: formData.password?.trim()
    };

    console.log('Sending user data:', {
      ...trimmedData,
      password: '***' // Hide password in logs
    });

    saveUser.mutate(trimmedData);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'destructive';
      case 'content_manager': return 'default';
      case 'viewer': return 'secondary';
      default: return 'secondary';
    }
  };

  const getRoleLabel = (role: string) => {
    const roleData = ROLE_OPTIONS.find(r => r.value === role);
    return roleData?.label || role;
  };

  const filteredUsers = users.filter(user =>
(user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage users and invitations</p>
        </div>
        {activeTab === 'invitations' && (
          <Button
            onClick={() => setInviteModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Send Invitation
          </Button>
        )}
      </div>

      {/* Content */}
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Active Users
            </TabsTrigger>
            <TabsTrigger value="invitations">
              <Mail className="w-4 h-4 mr-2" />
              Invitations
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search users by username, email, name, or role..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    onClick={() => openUserModal()}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>Users ({filteredUsers.length})</CardTitle>
                <CardDescription>
                  Manage user accounts, roles, and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
              {usersLoading ? (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-600" />
                  <p>Loading users...</p>
                </div>
              ) : usersError ? (
                <div className="text-center py-8 text-red-600">
                  <p>Error loading users: {usersError.message}</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first user.'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => openUserModal()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First User
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {user.full_name?.charAt(0) || user.username?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {user.full_name || user.username || user.email}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              {user.is_active ? (
                                <>
                                  <UserCheck className="w-4 h-4 text-green-500" />
                                  <span className="text-green-700 text-sm">Active</span>
                                </>
                              ) : (
                                <>
                                  <UserX className="w-4 h-4 text-red-500" />
                                  <span className="text-red-700 text-sm">Inactive</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.last_sign_in_at ? (
                              <div className="text-sm text-gray-600">
                                {(() => {
                                  try {
                                    // Try to parse the date - it might include time
                                    const date = new Date(user.last_sign_in_at);
                                    if (!isNaN(date.getTime())) {
                                      // Check if it's today
                                      const today = new Date();
                                      const isToday = date.toDateString() === today.toDateString();

                                      if (isToday) {
                                        // Show time for today
                                        return format(date, 'h:mm');
                                      } else {
                                        // Show date for other days
                                        return format(date, 'MMM dd, yyyy');
                                      }
                                    }
                                    return 'Invalid date';
                                  } catch {
                                    return 'Invalid date';
                                  }
                                })()}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {format(dateOnly(user.created_at), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleUserStatus.mutate({
                                  userId: user.id,
                                  isActive: !user.is_active
                                })}
                                disabled={toggleUserStatus.isPending}
                              >
                                {user.is_active ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openUserModal(user)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{user.full_name || user.username || user.email}"?
                                      This action cannot be undone and will remove all associated data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUser.mutate(user.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete User
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations">
            <InvitationManagement />
          </TabsContent>
        </Tabs>
      </div>

      {/* User Modal */}
      <Dialog open={userModalOpen} onOpenChange={(open) => !open && closeUserModal()}>
        <DialogContent className="sm:max-w-md bg-gradient-to-b from-white to-blue-50/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {editingUser ? 'Update user information and permissions' : 'Create a new user account with appropriate permissions'}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(e); }}>
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Enter username"
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={saveUser.isPending}
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="user@example.com"
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={saveUser.isPending}
                />
              </div>
            </div>

            {/* Full Name Field */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                Full Name <span className="text-gray-500">(optional)</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  id="fullName"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="John Doe"
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={saveUser.isPending}
                />
              </div>
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                User Role <span className="text-red-500">*</span>
              </Label>
                  <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
                disabled={saveUser.isPending}
              >
                <SelectTrigger className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                  <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-xs text-gray-500">{role.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role Preview */}
            {formData.role && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">{getRoleLabel(formData.role)} Role</p>
                    <p className="text-sm text-blue-700">{ROLE_OPTIONS.find(r => r.value === formData.role)?.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password {!editingUser && <span className="text-red-500">*</span>}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder={editingUser ? 'Leave blank to keep current password' : 'Enter password'}
                  className="pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={saveUser.isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={saveUser.isPending}
              />
              <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active user account</Label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeUserModal}
                disabled={saveUser.isPending}
                className="border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={(e) => handleSave(e)}
                disabled={saveUser.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saveUser.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingUser ? 'Update User' : 'Create User'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-invitations'] });
        }}
      />
    </div>
  );
}