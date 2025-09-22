import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
// CSRF token not needed with Bearer authentication
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Mail,
  Clock,
  UserPlus,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Send,
} from 'lucide-react';
import { InviteUserModal } from './InviteUserModal';

interface Invitation {
  id: string;
  email: string;
  fullName?: string;
  role: 'admin' | 'editor' | 'user';
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
  expiresAt: string;
  invitedBy?: {
    fullName: string;
    email: string;
  };
  acceptedAt?: string;
}

export function InvitationManagement() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInvitations = async () => {
    setIsLoading(true);
    try {
      // Import supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/admin/invitations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invitations');
      }

      const data = await response.json();
      // The API returns { success: true, invitations: [...] } format
      setInvitations(data.invitations || data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invitations',
        variant: 'destructive',
      });
      setInvitations([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      // Import supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/admin/invitations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete invitation');
      }

      toast({
        title: 'Success',
        description: 'Invitation deleted successfully',
      });

      await fetchInvitations();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete invitation',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleResend = async (id: string) => {
    setResendingId(id);
    try {
      // Import supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/admin/invitations/${id}/resend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to resend invitation');
      }

      toast({
        title: 'Success',
        description: 'Invitation resent successfully',
      });

      await fetchInvitations();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend invitation',
        variant: 'destructive',
      });
    } finally {
      setResendingId(null);
    }
  };

  const copyInvitationLink = async (invitation: Invitation) => {
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/setup-account/[token]`;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast({
        title: 'Copied',
        description: 'Invitation link template copied (token not included for security)',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const filteredInvitations = invitations.filter((invitation) => {
    const search = searchTerm.toLowerCase();
    return (
      invitation.email.toLowerCase().includes(search) ||
      invitation.fullName?.toLowerCase().includes(search) ||
      invitation.role.toLowerCase().includes(search) ||
      invitation.status.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();

    if (status === 'accepted') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Accepted
        </Badge>
      );
    }

    if (isExpired || status === 'expired') {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }

    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      admin: 'bg-purple-100 text-purple-800 border-purple-200',
      editor: 'bg-blue-100 text-blue-800 border-blue-200',
      user: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <Badge className={roleColors[role as keyof typeof roleColors] || roleColors.user}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Invitation Management</CardTitle>
            <CardDescription>
              Manage user invitations and track their status
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Search Bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by email, name, role, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={fetchInvitations}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {invitations.filter(i => i.status === 'pending' && new Date(i.expiresAt) > new Date()).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Accepted</p>
                <p className="text-2xl font-bold text-green-900">
                  {invitations.filter(i => i.status === 'accepted').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-red-600 font-medium">Expired</p>
                <p className="text-2xl font-bold text-red-900">
                  {invitations.filter(i => i.status === 'expired' || new Date(i.expiresAt) < new Date()).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Recipient</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invited By</TableHead>
                <TableHead>Sent Date</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center items-center gap-2 text-gray-500">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Loading invitations...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredInvitations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-gray-500">
                      <Mail className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      {searchTerm ? 'No invitations found matching your search' : 'No invitations sent yet'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvitations.map((invitation) => (
                  <TableRow key={invitation.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{invitation.fullName || 'No name provided'}</p>
                        <p className="text-sm text-gray-500">{invitation.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                    <TableCell>{getStatusBadge(invitation.status, invitation.expiresAt)}</TableCell>
                    <TableCell>
                      {invitation.invitedBy ? (
                        <div className="text-sm">
                          <p className="font-medium">{invitation.invitedBy.fullName}</p>
                          <p className="text-gray-500">{invitation.invitedBy.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(invitation.createdAt), 'MMM d, yyyy')}
                      <br />
                      <span className="text-gray-500">
                        {format(new Date(invitation.createdAt), 'h:mm a')}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {invitation.status === 'accepted' && invitation.acceptedAt ? (
                        <div className="text-green-600">
                          Accepted
                          <br />
                          <span className="text-xs">
                            {format(new Date(invitation.acceptedAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      ) : new Date(invitation.expiresAt) < new Date() ? (
                        <div className="text-red-600">
                          Expired
                          <br />
                          <span className="text-xs">
                            {format(new Date(invitation.expiresAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      ) : (
                        <div>
                          {format(new Date(invitation.expiresAt), 'MMM d, yyyy')}
                          <br />
                          <span className="text-gray-500 text-xs">
                            {format(new Date(invitation.expiresAt), 'h:mm a')}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {invitation.status === 'pending' && new Date(invitation.expiresAt) > new Date() && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyInvitationLink(invitation)}
                              title="Copy invitation link"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResend(invitation.id)}
                              disabled={resendingId === invitation.id}
                              title="Resend invitation"
                            >
                              {resendingId === invitation.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(invitation.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete invitation"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Invitation Information</p>
              <ul className="space-y-1 text-blue-800">
                <li>• Invitations expire after 7 days</li>
                <li>• Each invitation link can only be used once</li>
                <li>• Users must set up their password and accept terms</li>
                <li>• Expired invitations can be resent with a new link</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={fetchInvitations}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invitation? This action cannot be undone.
              The user will no longer be able to use this invitation link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}