import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Mail, User, Shield, Edit, Eye, Loader2 } from 'lucide-react';
import { addCsrfToken } from '@/utils/csrf';
import { supabase } from '@/lib/supabase';

// Validation schema
const inviteUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'content_manager', 'viewer'], {
    required_error: 'Please select a role',
  }),
});

type InviteUserFormData = z.infer<typeof inviteUserSchema>;

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const roleOptions = [
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'View trips and content only',
    icon: Eye,
  },
  {
    value: 'content_manager',
    label: 'Content Manager',
    description: 'Edit content and manage trips',
    icon: Edit,
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full system access',
    icon: Shield,
  },
] as const;

export function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      role: 'viewer',
    },
    mode: 'onChange',
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: InviteUserFormData) => {
    setIsLoading(true);

    try {
      // Get authentication token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      // Add both authentication and CSRF headers
      const headers = await addCsrfToken({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      });

      // Send the invitation with proper authentication and CSRF protection
      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          email: data.email,
          name: data.name || '',
          role: data.role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send invitation');
      }

      toast.success('Invitation sent!', {
        description: `An invitation has been sent to ${data.email}`,
      });

      reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to send invitation',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-b from-white to-blue-50/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Invite New User</DialogTitle>
          <DialogDescription className="text-gray-600">
            Send an invitation email for a new user to join your organization
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Field (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Full Name <span className="text-gray-500">(optional)</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                {...register('name')}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Email Field (Required) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                className={`pl-10 ${
                  errors.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                {...register('email')}
                disabled={isLoading}
              />
            </div>
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
          </div>

          {/* Role Field (Required) */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium text-gray-700">
              User Role <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedRole}
              onValueChange={value => setValue('role', value as InviteUserFormData['role'])}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-red-600 mt-1">{errors.role.message}</p>}
          </div>

          {/* Role Preview */}
          {selectedRole && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <div className="flex items-center gap-2">
                {(() => {
                  const role = roleOptions.find(r => r.value === selectedRole);
                  const Icon = role?.icon || Eye;
                  return (
                    <>
                      <Icon className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">{role?.label} Role</p>
                        <p className="text-sm text-blue-700">{role?.description}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
