import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  Search,
  Filter,
  MoreVertical,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Download,
  Trash2,
  Activity,
  ChevronLeft,
  ChevronRight,
  Users,
  AlertCircle,
  UserPlus,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { UserEditorModal } from './UserEditorModal';
import { UserProfileModal } from './UserProfileModal';
import { InviteUserModal } from '../InviteUserModal';

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  phone_number: string | null;
  phone_verified: boolean;
  account_status: string;
  cruise_updates_opt_in: boolean;
  created_at: string;
  last_active: string | null;
  communication_preferences: any;
}

export function EnhancedUserList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | undefined>(undefined);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<UserData | undefined>(undefined);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Fetch users with filters
  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users', searchTerm, roleFilter, statusFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
      }

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('account_status', statusFilter);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      return { users: data as UserData[], total: count || 0 };
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Role updated',
        description: 'User role has been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update user role',
        variant: 'destructive',
      });
    },
  });

  // Update account status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: status, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Status updated',
        description: 'Account status has been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update account status',
        variant: 'destructive',
      });
    },
  });

  // Bulk operations
  const handleBulkOperation = async (operation: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select users to perform this operation.',
        variant: 'destructive',
      });
      return;
    }

    try {
      switch (operation) {
        case 'activate':
          await supabase
            .from('profiles')
            .update({ account_status: 'active' })
            .in('id', selectedUsers);
          break;
        case 'deactivate':
          await supabase
            .from('profiles')
            .update({ account_status: 'suspended' })
            .in('id', selectedUsers);
          break;
        case 'delete':
          // Implement soft delete
          await supabase
            .from('profiles')
            .update({ account_status: 'deleted' })
            .in('id', selectedUsers);
          break;
      }

      setSelectedUsers([]);
      refetch();
      toast({
        title: 'Operation completed',
        description: `Successfully ${operation}d ${selectedUsers.length} user(s).`,
      });
    } catch (error: any) {
      toast({
        title: 'Operation failed',
        description: error.message || 'Failed to complete operation',
        variant: 'destructive',
      });
    }
  };

  // Export users to CSV
  const exportUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .csv();

      if (error) throw error;

      const blob = new Blob([data as string], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: 'User data has been exported.',
      });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message || 'Failed to export users',
        variant: 'destructive',
      });
    }
  };

  const totalPages = users ? Math.ceil(users.total / pageSize) : 0;

  const openUserEditor = (user: UserData) => {
    setEditingUser(user);
    setEditorModalOpen(true);
  };

  const openInviteModal = () => {
    setInviteModalOpen(true);
  };

  const closeUserEditor = () => {
    setEditorModalOpen(false);
    setEditingUser(undefined);
    refetch();
  };

  const closeInviteModal = () => {
    setInviteModalOpen(false);
  };

  const handleInviteSuccess = () => {
    refetch();
  };

  const openUserProfile = (user: UserData) => {
    setViewingUser(user);
    setProfileModalOpen(true);
  };

  const closeUserProfile = () => {
    setProfileModalOpen(false);
    setViewingUser(undefined);
  };

  const handleEditFromProfile = () => {
    const userToEdit = viewingUser;
    closeUserProfile();
    if (userToEdit) {
      openUserEditor(userToEdit);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {users?.total || 0} total users
            </Badge>
            <Button
              onClick={openInviteModal}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportUsers}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="pending_verification">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Operations */}
        {selectedUsers.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedUsers.length} user(s) selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkOperation('activate')}
              >
                <UserCheck className="h-4 w-4 mr-1" />
                Activate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkOperation('deactivate')}
              >
                <UserX className="h-4 w-4 mr-1" />
                Deactivate
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBulkOperation('delete')}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users?.users.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(users?.users.map(u => u.id) || []);
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="h-4 w-4"
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-8 w-8 text-red-500" />
                      <p className="text-red-600">Failed to load users</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users?.users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users?.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                        className="h-4 w-4"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name || 'No name'}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {user.phone_number && (
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{user.phone_number}</span>
                            {user.phone_verified && (
                              <Badge variant="outline" className="text-xs">Verified</Badge>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          {user.communication_preferences?.email && (
                            <Badge variant="secondary" className="text-xs">Email</Badge>
                          )}
                          {user.communication_preferences?.sms && (
                            <Badge variant="secondary" className="text-xs">SMS</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) =>
                          updateRoleMutation.mutate({ userId: user.id, role: value })
                        }
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              Admin
                            </div>
                          </SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.account_status === 'active' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {user.account_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {user.last_active
                        ? format(new Date(user.last_active), 'MMM d, h:mm a')
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openUserProfile(user)}>
                            <Activity className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openUserEditor(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              updateStatusMutation.mutate({
                                userId: user.id,
                                status: user.account_status === 'active' ? 'suspended' : 'active'
                              })
                            }
                          >
                            {user.account_status === 'active' ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Suspend
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-700">
              Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, users?.total || 0)} of {users?.total || 0} users
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={inviteModalOpen}
        onClose={closeInviteModal}
        onSuccess={handleInviteSuccess}
      />

      {/* User Editor Modal */}
      <UserEditorModal
        isOpen={editorModalOpen}
        onClose={closeUserEditor}
        user={editingUser}
        mode="edit"
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={closeUserProfile}
        user={viewingUser}
        onEdit={handleEditFromProfile}
      />
    </Card>
  );
}