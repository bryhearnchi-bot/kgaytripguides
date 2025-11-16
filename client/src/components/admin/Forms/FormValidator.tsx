import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, UseFormReturn, FieldPath, FieldValues, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Info,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Validation strength levels
export type ValidationLevel = 'error' | 'warning' | 'info' | 'success';

export interface ValidationResult {
  level: ValidationLevel;
  message: string;
  field?: string;
  suggestion?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'number' | 'date' | 'url';
  required?: boolean;
  placeholder?: string;
  description?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => ValidationResult[] | Promise<ValidationResult[]>;
  };
}

interface FormValidatorProps<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  fields: FormField[];
  onSubmit: (data: T) => Promise<void> | void;
  onDraftSave?: (data: Partial<T>) => Promise<void> | void;
  defaultValues?: Partial<T>;
  autoSaveInterval?: number; // milliseconds
  showProgress?: boolean;
  showPreview?: boolean;
  className?: string;
  title?: string;
  description?: string;
}

const ValidationIndicator: React.FC<{
  validations: ValidationResult[];
  isValidating?: boolean;
}> = ({ validations, isValidating }) => {
  const errorCount = validations.filter(v => v.level === 'error').length;
  const warningCount = validations.filter(v => v.level === 'warning').length;
  const successCount = validations.filter(v => v.level === 'success').length;

  if (isValidating) {
    return (
      <div className="flex items-center gap-2 text-blue-600">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm">Validating...</span>
      </div>
    );
  }

  if (errorCount > 0) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">
          {errorCount} error{errorCount !== 1 ? 's' : ''}
        </span>
      </div>
    );
  }

  if (warningCount > 0) {
    return (
      <div className="flex items-center gap-2 text-orange-600">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm">
          {warningCount} warning{warningCount !== 1 ? 's' : ''}
        </span>
      </div>
    );
  }

  if (successCount > 0) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">All checks passed</span>
      </div>
    );
  }

  return null;
};

const FieldValidation: React.FC<{
  validations: ValidationResult[];
  className?: string;
}> = ({ validations, className }) => {
  if (validations.length === 0) return null;

  return (
    <div className={cn('space-y-1 mt-1', className)}>
      {validations.map((validation, index) => {
        const IconComponent = {
          error: AlertCircle,
          warning: AlertTriangle,
          info: Info,
          success: CheckCircle,
        }[validation.level];

        const colorClass = {
          error: 'text-red-600',
          warning: 'text-orange-600',
          info: 'text-blue-600',
          success: 'text-green-600',
        }[validation.level];

        return (
          <div key={index} className={cn('flex items-start gap-2 text-sm', colorClass)}>
            <IconComponent className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p>{validation.message}</p>
              {validation.suggestion && (
                <p className="text-xs opacity-75 mt-1">💡 {validation.suggestion}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function FormValidator<T extends FieldValues>({
  schema,
  fields,
  onSubmit,
  onDraftSave,
  defaultValues = {},
  autoSaveInterval = 30000, // 30 seconds
  showProgress = true,
  showPreview = false,
  className,
  title,
  description,
}: FormValidatorProps<T>) {
  const [fieldValidations, setFieldValidations] = useState<Record<string, ValidationResult[]>>({});
  const [isValidating, setIsValidating] = useState<Record<string, boolean>>({});
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showPreviewMode, setShowPreviewMode] = useState(false);

  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
    mode: 'onChange',
  });

  const {
    watch,
    formState: { errors, isSubmitting, isValid },
  } = form;
  const watchedValues = watch();

  // Calculate form completion progress
  const completionProgress = useMemo(() => {
    const requiredFields = fields.filter(field => field.required);
    const completedFields = requiredFields.filter(field => {
      const value = watchedValues[field.name as keyof T];
      return value && String(value).trim().length > 0;
    });
    return Math.round((completedFields.length / requiredFields.length) * 100);
  }, [watchedValues, fields]);

  // Real-time field validation
  const validateField = useCallback(
    async (fieldName: string, value: any) => {
      const field = fields.find(f => f.name === fieldName);
      if (!field) return;

      setIsValidating(prev => ({ ...prev, [fieldName]: true }));

      const validations: ValidationResult[] = [];

      // Required field validation
      if (field.required && (!value || String(value).trim().length === 0)) {
        validations.push({
          level: 'error',
          message: `${field.label} is required`,
          suggestion: `Please enter a ${field.label.toLowerCase()}`,
        });
      }

      // Type-specific validations
      if (value && String(value).trim().length > 0) {
        // Length validations
        if (field.validation?.minLength && String(value).length < field.validation.minLength) {
          validations.push({
            level: 'error',
            message: `${field.label} must be at least ${field.validation.minLength} characters`,
            suggestion: `Add ${field.validation.minLength - String(value).length} more characters`,
          });
        }

        if (field.validation?.maxLength && String(value).length > field.validation.maxLength) {
          validations.push({
            level: 'error',
            message: `${field.label} must be no more than ${field.validation.maxLength} characters`,
            suggestion: `Remove ${String(value).length - field.validation.maxLength} characters`,
          });
        }

        // Pattern validation
        if (field.validation?.pattern && !field.validation.pattern.test(String(value))) {
          validations.push({
            level: 'error',
            message: `${field.label} format is invalid`,
            suggestion: `Please check the format and try again`,
          });
        }

        // Email validation
        if (field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(value))) {
            validations.push({
              level: 'error',
              message: 'Please enter a valid email address',
              suggestion: 'Format: user@example.com',
            });
          }
        }

        // URL validation
        if (field.type === 'url') {
          try {
            new URL(String(value));
            validations.push({
              level: 'success',
              message: 'Valid URL format',
            });
          } catch {
            validations.push({
              level: 'error',
              message: 'Please enter a valid URL',
              suggestion: 'Format: https://example.com',
            });
          }
        }

        // Password strength (basic)
        if (field.type === 'password') {
          const password = String(value);
          const hasUpper = /[A-Z]/.test(password);
          const hasLower = /[a-z]/.test(password);
          const hasNumber = /\d/.test(password);
          const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

          if (password.length >= 8 && hasUpper && hasLower && hasNumber && hasSpecial) {
            validations.push({
              level: 'success',
              message: 'Strong password',
            });
          } else if (password.length >= 6) {
            validations.push({
              level: 'warning',
              message: 'Password could be stronger',
              suggestion: 'Use uppercase, lowercase, numbers, and special characters',
            });
          }
        }

        // Custom validation
        if (field.validation?.custom) {
          try {
            const customResults = await field.validation.custom(value);
            validations.push(...customResults);
          } catch (error) {
            validations.push({
              level: 'error',
              message: 'Validation error occurred',
              suggestion: 'Please try again or contact support',
            });
          }
        }
      }

      // Simulate async validation delay
      await new Promise(resolve => setTimeout(resolve, 300));

      setFieldValidations(prev => ({ ...prev, [fieldName]: validations }));
      setIsValidating(prev => ({ ...prev, [fieldName]: false }));
    },
    [fields]
  );

  // Watch for field changes and validate
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name) {
        setIsDirty(true);
        validateField(name, value[name]);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, validateField]);

  // Auto-save functionality
  useEffect(() => {
    if (!onDraftSave || !isDirty) return;

    const autoSaveTimer = setTimeout(async () => {
      try {
        await onDraftSave(watchedValues);
        setLastAutoSave(new Date());
        setIsDirty(false);
        toast('Draft saved', {
          description: 'Your changes have been automatically saved.',
          duration: 2000,
        });
      } catch (error) {}
    }, autoSaveInterval);

    return () => clearTimeout(autoSaveTimer);
  }, [watchedValues, isDirty, autoSaveInterval, onDraftSave, toast]);

  const handleSubmit = async (data: T) => {
    try {
      await onSubmit(data);
      setIsDirty(false);
      toast.success('Form submitted successfully', {
        description: 'Your data has been saved.',
      });
    } catch (error) {
      toast.error('Submission failed', {
        description: 'Please check your inputs and try again.',
      });
    }
  };

  const handleDraftSave = async () => {
    if (!onDraftSave) return;

    try {
      await onDraftSave(watchedValues);
      setLastAutoSave(new Date());
      setIsDirty(false);
      toast.success('Draft saved', {
        description: 'Your changes have been saved as a draft.',
      });
    } catch (error) {
      toast.error('Save failed', {
        description: 'Unable to save draft. Please try again.',
      });
    }
  };

  const allValidations = Object.values(fieldValidations).flat();
  const hasErrors = allValidations.some(v => v.level === 'error') || Object.keys(errors).length > 0;

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && (
            <CardTitle className="flex items-center justify-between">
              <span>{title}</span>
              <ValidationIndicator
                validations={allValidations}
                isValidating={Object.values(isValidating).some(Boolean)}
              />
            </CardTitle>
          )}
          {description && <CardDescription>{description}</CardDescription>}
          {showProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Completion Progress</span>
                <span className="font-medium">{completionProgress}%</span>
              </div>
              <Progress value={completionProgress} className="h-2" />
            </div>
          )}
        </CardHeader>
      )}

      <CardContent className="space-y-6">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map(field => {
              const fieldValidation = fieldValidations[field.name] || [];
              const hasFieldErrors =
                fieldValidation.some(v => v.level === 'error') ||
                errors[field.name as FieldPath<T>];
              const isFieldValidating = isValidating[field.name];

              return (
                <div
                  key={field.name}
                  className={cn(field.type === 'textarea' && 'md:col-span-2', 'space-y-2')}
                >
                  <Label htmlFor={field.name} className="flex items-center gap-2">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                    {isFieldValidating && (
                      <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                    )}
                  </Label>

                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.name}
                      placeholder={field.placeholder}
                      className={cn(
                        hasFieldErrors && 'border-red-500 focus:border-red-500',
                        'min-h-[100px]'
                      )}
                      {...form.register(field.name as FieldPath<T>)}
                    />
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type}
                      placeholder={field.placeholder}
                      className={cn(hasFieldErrors && 'border-red-500 focus:border-red-500')}
                      {...form.register(field.name as FieldPath<T>)}
                    />
                  )}

                  {field.description && (
                    <p className="text-sm text-gray-500">{field.description}</p>
                  )}

                  <FieldValidation validations={fieldValidation} />

                  {errors[field.name as FieldPath<T>] && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors[field.name as FieldPath<T>]?.message as string}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center gap-4">
              {lastAutoSave && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Last saved: {lastAutoSave.toLocaleTimeString()}</span>
                </div>
              )}
              {isDirty && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  <Zap className="w-3 h-3 mr-1" />
                  Unsaved changes
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {showPreview && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreviewMode(!showPreviewMode)}
                >
                  {showPreviewMode ? (
                    <EyeOff className="w-4 h-4 mr-1" />
                  ) : (
                    <Eye className="w-4 h-4 mr-1" />
                  )}
                  {showPreviewMode ? 'Hide Preview' : 'Preview'}
                </Button>
              )}

              {onDraftSave && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDraftSave}
                  disabled={!isDirty}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save Draft
                </Button>
              )}

              <Button
                type="submit"
                disabled={hasErrors || isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Preview Mode */}
        {showPreviewMode && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Form Preview</h4>
            <div className="space-y-2 text-sm">
              {fields.map(field => {
                const value = watchedValues[field.name as keyof T];
                return (
                  <div key={field.name} className="flex">
                    <span className="font-medium text-gray-700 w-1/3">{field.label}:</span>
                    <span className="text-gray-900 w-2/3">
                      {value ? String(value) : <em className="text-gray-500">Not provided</em>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
