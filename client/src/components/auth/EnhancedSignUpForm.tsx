import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { SocialAuthButtons } from './SocialAuthButtons';
import { Eye, EyeOff } from 'lucide-react';

const signUpSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number'
      ),
    confirmPassword: z.string(),
    name: z.string().min(2, 'Full name is required'),
    phoneNumber: z
      .string()
      .regex(
        /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
        'Please enter a valid phone number'
      ),
    communicationPreference: z.enum(['email', 'sms', 'both']),
    cruiseUpdates: z.boolean().default(true),
    marketingEmails: z.boolean().default(false),
    privacyPolicy: z.boolean().refine(val => val === true, {
      message: 'You must accept the privacy policy to continue',
    }),
    termsOfService: z.boolean().refine(val => val === true, {
      message: 'You must accept the terms of service to continue',
    }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

interface EnhancedSignUpFormProps {
  onSuccess?: () => void;
  onSwitchToSignIn?: () => void;
}

export function EnhancedSignUpForm({ onSuccess, onSwitchToSignIn }: EnhancedSignUpFormProps) {
  const { signUp } = useSupabaseAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      communicationPreference: 'email',
      cruiseUpdates: true,
      marketingEmails: false,
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setLoading(true);
    try {
      // Sign up the user with Supabase Auth
      const fullName = {
        first: data.name.split(' ')[0] || '',
        last: data.name.split(' ').slice(1).join(' ') || '',
      };
      const result = await signUp(data.email, data.password, fullName);

      // Store additional user data in the database
      // This will be handled by a database trigger or separate API call
      const additionalData = {
        phone_number: data.phoneNumber,
        communication_preferences: {
          email:
            data.communicationPreference === 'email' || data.communicationPreference === 'both',
          sms: data.communicationPreference === 'sms' || data.communicationPreference === 'both',
        },
        trip_updates_opt_in: data.cruiseUpdates,
        marketing_emails: data.marketingEmails,
      };

      // Store consent records
      const consentData = {
        privacy_policy_accepted: data.privacyPolicy,
        terms_accepted: data.termsOfService,
        timestamp: new Date().toISOString(),
      };

      toast.success('Account created successfully!', {
        description: 'Please check your email to verify your account.',
      });

      onSuccess?.();
    } catch (error: any) {
      toast.error('Sign up failed', {
        description: error.message || 'An error occurred during sign up',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Social Auth Buttons */}
      <div>
        <SocialAuthButtons mode="sign_up" onSuccess={onSuccess} />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>
      </div>

      {/* Sign Up Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            {...register('name')}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            {...register('email')}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
        </div>

        {/* Phone Number */}
        <div>
          <Label htmlFor="phoneNumber">Phone Number *</Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="+1 (555) 123-4567"
            {...register('phoneNumber')}
            className={errors.phoneNumber ? 'border-red-500' : ''}
          />
          {errors.phoneNumber && (
            <p className="text-sm text-red-600 mt-1">{errors.phoneNumber.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <Label htmlFor="password">Password *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              className={errors.password ? 'border-red-500' : ''}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
          )}
          <div className="mt-2 text-xs text-gray-600">
            Password must contain at least 8 characters, including uppercase, lowercase, and
            numbers.
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('confirmPassword')}
            className={errors.confirmPassword ? 'border-red-500' : ''}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Communication Preferences */}
        <div>
          <Label>Communication Preferences *</Label>
          <RadioGroup
            defaultValue="email"
            onValueChange={value => setValue('communicationPreference', value as any)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="email" id="email-pref" />
              <Label htmlFor="email-pref" className="font-normal">
                Email only
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sms" id="sms-pref" />
              <Label htmlFor="sms-pref" className="font-normal">
                Text messages only
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="both" id="both-pref" />
              <Label htmlFor="both-pref" className="font-normal">
                Both email and text
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Opt-ins */}
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="cruiseUpdates"
              defaultChecked
              onCheckedChange={checked => setValue('cruiseUpdates', checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="cruiseUpdates" className="text-sm font-normal">
                Yes, I want to receive updates about cruises I'm following
              </Label>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="marketingEmails"
              onCheckedChange={checked => setValue('marketingEmails', checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="marketingEmails" className="text-sm font-normal">
                Send me promotional offers and newsletters (optional)
              </Label>
            </div>
          </div>
        </div>

        {/* Legal Agreements */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="privacyPolicy"
              onCheckedChange={checked => setValue('privacyPolicy', checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="privacyPolicy" className="text-sm font-normal">
                I have read and agree to the{' '}
                <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>{' '}
                *
              </Label>
            </div>
          </div>
          {errors.privacyPolicy && (
            <p className="text-sm text-red-600 ml-6">{errors.privacyPolicy.message}</p>
          )}

          <div className="flex items-start space-x-2">
            <Checkbox
              id="termsOfService"
              onCheckedChange={checked => setValue('termsOfService', checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="termsOfService" className="text-sm font-normal">
                I accept the{' '}
                <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                  Terms of Service
                </a>{' '}
                *
              </Label>
            </div>
          </div>
          {errors.termsOfService && (
            <p className="text-sm text-red-600 ml-6">{errors.termsOfService.message}</p>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-xs text-blue-800">
            We respect your privacy. Your data will never be sold to third parties or used for
            marketing without your explicit consent.
          </p>
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>

        {/* Switch to Sign In */}
        <div className="text-center text-sm">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="text-blue-600 hover:underline"
          >
            Sign in
          </button>
        </div>
      </form>
    </div>
  );
}
