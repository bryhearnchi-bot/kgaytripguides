import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Mail } from 'lucide-react';

const resetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ResetFormData = z.infer<typeof resetSchema>;

interface PasswordResetFormProps {
  onBack?: () => void;
}

export function PasswordResetForm({ onBack }: PasswordResetFormProps) {
  const { resetPassword } = useSupabaseAuthContext();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormData) => {
    setLoading(true);
    try {
      await resetPassword(data.email);
      setSubmitted(true);
      toast.success('Password reset email sent', {
        description: 'Please check your email for instructions to reset your password.',
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unable to send password reset email';
      toast.error('Password reset failed', {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-green-600" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900">Check your email</h3>
          <p className="mt-2 text-sm text-gray-600">
            We've sent you a password reset link. Please check your email and follow the
            instructions.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Didn't receive the email? Check your spam folder or try again.
          </p>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setSubmitted(false);
            }}
          >
            Try again
          </Button>

          {onBack && (
            <Button variant="ghost" className="w-full" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Reset your password</h3>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            {...register('email')}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>

        {onBack && (
          <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Button>
        )}
      </form>
    </div>
  );
}
