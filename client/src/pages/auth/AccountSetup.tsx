import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import {
  Mail,
  Lock,
  Phone,
  User,
  Shield,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

// Validation schemas for each step
const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const profileSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  phoneNumber: z.string().optional(),
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
});

const termsSchema = z.object({
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Terms and Conditions' }),
  }),
  acceptPrivacy: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Privacy Policy' }),
  }),
  confirmAge: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm you are 18 or older' }),
  }),
});

interface InvitationData {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export default function AccountSetup() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const { signUp } = useSupabaseAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  // Form instances for each step
  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      emailNotifications: true,
      smsNotifications: false,
    },
  });

  const termsForm = useForm({
    resolver: zodResolver(termsSchema),
    defaultValues: {
      acceptTerms: false,
      acceptPrivacy: false,
      confirmAge: false,
    },
  });

  // Verify invitation token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerificationError('Invalid invitation link');
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/invitations/validate/${token}`);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Invalid or expired invitation');
        }

        const data = await response.json();
        setInvitationData(data);

        // Pre-fill profile form with invitation data
        if (data.name) {
          profileForm.setValue('name', data.name);
        }
      } catch (error) {
        setVerificationError(
          error instanceof Error ? error.message : 'Failed to verify invitation'
        );
        toast.error('Verification Failed', {
          description: 'This invitation link is invalid or has expired.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token, toast, profileForm]);

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ];

    return checks.filter(Boolean).length;
  };

  const passwordStrength = getPasswordStrength(passwordForm.watch('password') || '');

  // Handle final form submission
  const handleComplete = async () => {
    if (!invitationData || !token) return;

    setIsLoading(true);

    try {
      const passwordData = passwordForm.getValues();
      const profileData = profileForm.getValues();

      // Create account via Supabase
      const result = await signUp(invitationData.email, passwordData.password, {
        name: profileData.name,
        phone_number: profileData.phoneNumber,
        role: invitationData.role,
        email_notifications: profileData.emailNotifications,
        sms_notifications: profileData.smsNotifications,
      });

      if (!result || 'error' in result) {
        throw new Error((result as any)?.error?.message || 'Failed to create account');
      }

      // Consume invitation
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          invitationId: invitationData.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete account setup');
      }

      toast.success('Account Created!', {
        description: 'Your account has been successfully created. Welcome aboard!',
      });

      // Redirect to trips or login
      setLocation('/admin/trips');
    } catch (error) {
      toast.error('Setup Failed', {
        description: error instanceof Error ? error.message : 'Failed to create account',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation handlers
  const handleNext = async () => {
    let isValid = false;

    switch (currentStep) {
      case 2:
        isValid = await passwordForm.trigger();
        break;
      case 3:
        isValid = await profileForm.trigger();
        break;
      case 4:
        isValid = await termsForm.trigger();
        if (isValid) {
          await handleComplete();
          return;
        }
        break;
      default:
        isValid = true;
    }

    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Show error state if verification failed
  if (verificationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
              <p className="text-gray-600">{verificationError}</p>
              <Button
                onClick={() => setLocation('/login')}
                className="mt-6 bg-blue-600 hover:bg-blue-700"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (isLoading && currentStep === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Account Setup</h1>
            <span className="text-sm text-gray-600">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && 'Verify Your Email'}
              {currentStep === 2 && 'Create Your Password'}
              {currentStep === 3 && 'Complete Your Profile'}
              {currentStep === 4 && 'Terms & Conditions'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Confirming your invitation details'}
              {currentStep === 2 && 'Set a strong password for your account'}
              {currentStep === 3 && 'Tell us a bit about yourself'}
              {currentStep === 4 && 'Review and accept our terms'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Email Verification */}
            {currentStep === 1 && invitationData && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">Email Verified</span>
                  </div>
                  <p className="text-green-800">Your invitation has been successfully verified.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email Address</p>
                      <p className="font-medium">{invitationData.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Account Role</p>
                      <p className="font-medium capitalize">{invitationData.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Password Creation */}
            {currentStep === 2 && (
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="pl-10 pr-10"
                      {...passwordForm.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordForm.formState.errors.password && (
                    <p className="text-sm text-red-600">
                      {String(passwordForm.formState.errors.password.message || 'Invalid password')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="pl-10 pr-10"
                      {...passwordForm.register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-600">
                      {String(
                        passwordForm.formState.errors.confirmPassword.message ||
                          'Passwords must match'
                      )}
                    </p>
                  )}
                </div>

                {/* Password Strength Indicator */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Password Strength</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div
                        key={level}
                        className={`flex-1 h-2 rounded ${
                          level <= passwordStrength
                            ? passwordStrength <= 2
                              ? 'bg-red-500'
                              : passwordStrength <= 3
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center gap-1">
                      {passwordForm.watch('password')?.length >= 8 ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-gray-400" />
                      )}
                      <span>At least 8 characters</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {/[A-Z]/.test(passwordForm.watch('password') || '') ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-gray-400" />
                      )}
                      <span>One uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {/[a-z]/.test(passwordForm.watch('password') || '') ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-gray-400" />
                      )}
                      <span>One lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {/[0-9]/.test(passwordForm.watch('password') || '') ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-gray-400" />
                      )}
                      <span>One number</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {/[^A-Za-z0-9]/.test(passwordForm.watch('password') || '') ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-gray-400" />
                      )}
                      <span>One special character</span>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Step 3: Profile Setup */}
            {currentStep === 3 && (
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      className="pl-10"
                      {...profileForm.register('name')}
                    />
                  </div>
                  {profileForm.formState.errors.name && (
                    <p className="text-sm text-red-600">
                      {profileForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input
                      id="phoneNumber"
                      type="tel"
                      className="pl-10"
                      placeholder="+1 (555) 123-4567"
                      {...profileForm.register('phoneNumber')}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Communication Preferences</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="emailNotifications"
                        {...profileForm.register('emailNotifications')}
                      />
                      <Label
                        htmlFor="emailNotifications"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Receive email notifications about cruises and updates
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="smsNotifications"
                        {...profileForm.register('smsNotifications')}
                      />
                      <Label
                        htmlFor="smsNotifications"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Receive SMS notifications for important updates
                      </Label>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Step 4: Terms & Privacy */}
            {currentStep === 4 && (
              <form className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptTerms"
                      className="mt-1"
                      {...termsForm.register('acceptTerms')}
                    />
                    <Label htmlFor="acceptTerms" className="text-sm font-normal cursor-pointer">
                      I accept the{' '}
                      <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                        Terms and Conditions
                      </a>
                    </Label>
                  </div>
                  {termsForm.formState.errors.acceptTerms && (
                    <p className="text-sm text-red-600 ml-6">
                      {termsForm.formState.errors.acceptTerms.message}
                    </p>
                  )}

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptPrivacy"
                      className="mt-1"
                      {...termsForm.register('acceptPrivacy')}
                    />
                    <Label htmlFor="acceptPrivacy" className="text-sm font-normal cursor-pointer">
                      I accept the{' '}
                      <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </a>
                    </Label>
                  </div>
                  {termsForm.formState.errors.acceptPrivacy && (
                    <p className="text-sm text-red-600 ml-6">
                      {termsForm.formState.errors.acceptPrivacy.message}
                    </p>
                  )}

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="confirmAge"
                      className="mt-1"
                      {...termsForm.register('confirmAge')}
                    />
                    <Label htmlFor="confirmAge" className="text-sm font-normal cursor-pointer">
                      I confirm that I am 18 years or older
                    </Label>
                  </div>
                  {termsForm.formState.errors.confirmAge && (
                    <p className="text-sm text-red-600 ml-6">
                      {termsForm.formState.errors.confirmAge.message}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-blue-800">
                    <strong>Privacy Notice:</strong> We will never sell your data to third parties
                    and will only send marketing communications with your explicit consent.
                  </p>
                </div>
              </form>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || isLoading}
                className={currentStep === 1 ? 'invisible' : ''}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>

              <Button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Processing...
                  </>
                ) : currentStep === totalSteps ? (
                  <>
                    Complete Setup
                    <Check className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
