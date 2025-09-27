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

  const filteredInvitations = invitations;

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
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
              <Mail className="h-6 w-6" />
              Invitation Management
            </h1>
            <p className="text-sm text-white/60">
              Manage user invitations and track their status
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
        <header className="flex flex-col gap-2 border-b border-white/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">User Invitations ({filteredInvitations.length})</h2>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Access management</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchInvitations}
              disabled={isLoading}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setIsInviteModalOpen(true)}
              className="rounded-full bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors min-w-[80px]"
            >
              <UserPlus className="h-3 w-3 mr-1" />
              Invite User
            </Button>
          </div>
        </header>

        <div className="px-6 py-6">

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-amber-500/20 rounded-lg p-3 border border-amber-500/30">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-sm text-amber-400 font-medium">Pending</p>
                <p className="text-2xl font-bold text-white">
                  {invitations.filter(i => i.status === 'pending' && new Date(i.expiresAt) > new Date()).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/20 rounded-lg p-3 border border-emerald-500/30">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm text-emerald-400 font-medium">Accepted</p>
                <p className="text-2xl font-bold text-white">
                  {invitations.filter(i => i.status === 'accepted').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-500/20 rounded-lg p-3 border border-red-500/30">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-sm text-red-400 font-medium">Expired</p>
                <p className="text-2xl font-bold text-white">
                  {invitations.filter(i => i.status === 'expired' || new Date(i.expiresAt) < new Date()).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="border border-white/10 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/5 border-white/10">
                <TableHead className="text-white/80">Recipient</TableHead>
                <TableHead className="text-white/80">Role</TableHead>
                <TableHead className="text-white/80">Status</TableHead>
                <TableHead className="text-white/80">Invited By</TableHead>
                <TableHead className="text-white/80">Sent Date</TableHead>
                <TableHead className="text-white/80">Expires</TableHead>
                <TableHead className="text-right text-white/80">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-white/10">
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center items-center gap-2 text-white/60">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Loading invitations...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredInvitations.length === 0 ? (
                <TableRow className="border-white/10">
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-white/60">
                      <Mail className="h-12 w-12 mx-auto mb-2 text-white/30" />
                      No invitations sent yet
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvitations.map((invitation) => (
                  <TableRow key={invitation.id} className="hover:bg-white/5 border-white/10">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{invitation.fullName || 'No name provided'}</p>
                        <p className="text-sm text-white/60">{invitation.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                    <TableCell>{getStatusBadge(invitation.status, invitation.expiresAt)}</TableCell>
                    <TableCell>
                      {invitation.invitedBy ? (
                        <div className="text-sm">
                          <p className="font-medium text-white">{invitation.invitedBy.fullName}</p>
                          <p className="text-white/60">{invitation.invitedBy.email}</p>
                        </div>
                      ) : (
                        <span className="text-white/40">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="text-white">{format(new Date(invitation.createdAt), 'MMM d, yyyy')}</span>
                      <br />
                      <span className="text-white/60">
                        {format(new Date(invitation.createdAt), 'h:mm a')}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {invitation.status === 'accepted' && invitation.acceptedAt ? (
                        <div className="text-emerald-400">
                          Accepted
                          <br />
                          <span className="text-xs">
                            {format(new Date(invitation.acceptedAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      ) : new Date(invitation.expiresAt) < new Date() ? (
                        <div className="text-red-400">
                          Expired
                          <br />
                          <span className="text-xs">
                            {format(new Date(invitation.expiresAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-white">{format(new Date(invitation.expiresAt), 'MMM d, yyyy')}</span>
                          <br />
                          <span className="text-white/60 text-xs">
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
                              className="text-white/70 hover:text-white hover:bg-white/10"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResend(invitation.id)}
                              disabled={resendingId === invitation.id}
                              title="Resend invitation"
                              className="text-white/70 hover:text-white hover:bg-white/10"
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
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
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
        <div className="mt-4 p-4 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-white">
              <p className="font-medium mb-1">Invitation Information</p>
              <ul className="space-y-1 text-white/80">
                <li>• Invitations expire after 7 days</li>
                <li>• Each invitation link can only be used once</li>
                <li>• Users must set up their password and accept terms</li>
                <li>• Expired invitations can be resent with a new link</li>
              </ul>
            </div>
          </div>
        </div>
        </div>
      </section>

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
    </div>
  );
}