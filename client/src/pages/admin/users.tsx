import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
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
  Mail,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { dateOnly } from '@/lib/utils';

interface UserData {
  id: string;
  username: string;
  email?: string;
  fullName?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

interface UserFormData {
  username: string;
  email: string;
  fullName: string;
  role: string;
  password?: string;
  isActive: boolean;
}

const ROLES = [
  { value: 'super_admin', label: 'Super Admin', description: 'Full system access' },
  { value: 'trip_admin', label: 'Trip Admin', description: 'Manage trips and content' },
  { value: 'content_editor', label: 'Content Editor', description: 'Edit content and media' },
  { value: 'media_manager', label: 'Media Manager', description: 'Manage images and media' },
  { value: 'viewer', label: 'Viewer', description: 'View-only access' },
];

export default function UsersManagement() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    fullName: '',
    role: 'viewer',
    password: '',
    isActive: true,
  });
  const [showPassword, setShowPassword] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch users
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery<UserData[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    },
  });

  // Create/Update user mutation
  const saveUser = useMutation({
    mutationFn: async (data: UserFormData) => {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';

      // Don't send empty password for updates
      const payload = { ...data };
      if (editingUser && !payload.password) {
        delete payload.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to save user');
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
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to delete user');
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
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    },
  });

  // Toggle user status mutation
  const toggleUserStatus = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
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
        username: user.username,
        email: user.email || '',
        fullName: user.fullName || '',
        role: user.role,
        password: '',
        isActive: user.isActive,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        fullName: '',
        role: 'viewer',
        password: '',
        isActive: true,
      });
    }
    setUserModalOpen(true);
  };

  const closeUserModal = () => {
    setUserModalOpen(false);
    setEditingUser(null);
    setShowPassword(false);
  };

  const handleInputChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.username.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Username is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Email is required',
        variant: 'destructive',
      });
      return;
    }

    if (!editingUser && !formData.password) {
      toast({
        title: 'Validation Error',
        description: 'Password is required for new users',
        variant: 'destructive',
      });
      return;
    }

    saveUser.mutate(formData);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'trip_admin': return 'default';
      case 'content_editor': return 'secondary';
      case 'media_manager': return 'outline';
      default: return 'secondary';
    }
  };

  const getRoleLabel = (role: string) => {
    const roleData = ROLES.find(r => r.value === role);
    return roleData?.label || role;
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/admin/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <Users className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">User Management</h1>
              </div>
            </div>
            <Button
              onClick={() => openUserModal()}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users by username, email, name, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
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
                                {user.fullName?.charAt(0) || user.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {user.fullName || user.username}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.email || user.username}
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
                              {user.isActive ? (
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
                            {user.lastLogin ? (
                              <div className="text-sm text-gray-600">
                                {format(dateOnly(user.lastLogin), 'MMM dd, yyyy')}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {format(dateOnly(user.createdAt), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleUserStatus.mutate({
                                  userId: user.id,
                                  isActive: !user.isActive
                                })}
                                disabled={toggleUserStatus.isPending}
                              >
                                {user.isActive ? (
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
                                      Are you sure you want to delete "{user.fullName || user.username}"?
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
        </div>
      </main>

      {/* User Modal */}
      <Dialog open={userModalOpen} onOpenChange={(open) => !open && closeUserModal()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Enter username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-sm text-gray-500">{role.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {!editingUser && '*'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder={editingUser ? 'Leave blank to keep current password' : 'Enter password'}
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="isActive">Active user account</Label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={closeUserModal}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveUser.isPending}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {saveUser.isPending ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}