import React, { ReactNode } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'custom';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: (value: any) => string | null;
  customComponent?: ReactNode;
  description?: string;
  icon?: ReactNode;
}

interface FormSection {
  title?: string;
  description?: string;
  fields: FormField[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

interface TouchOptimizedFormProps {
  title?: string;
  description?: string;
  sections: FormSection[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  errors?: Record<string, string>;
  className?: string;
}

export function TouchOptimizedForm({
  title,
  description,
  sections,
  values,
  onChange,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  errors = {},
  className = ''
}: TouchOptimizedFormProps) {
  const [expandedSections, setExpandedSections] = React.useState<Set<number>>(
    new Set(sections.map((section, index) =>
      section?.collapsible ? (section.defaultExpanded ? index : -1) : index
    ).filter(i => i >= 0))
  );

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const renderField = (field: FormField) => {
    const value = values[field.name] || '';
    const error = errors[field.name];

    const commonProps = {
      id: field.name,
      value,
      onChange: (e: any) => onChange(field.name, e.target?.value || e),
      className: `mobile-input ${error ? 'border-red-300' : ''}`,
      placeholder: field.placeholder,
      required: field.required
    };

    const renderInput = () => {
      switch (field.type) {
        case 'textarea':
          return (
            <Textarea
              {...commonProps}
              rows={4}
              className="mobile-textarea"
            />
          );

        case 'select':
          return (
            <Select value={value} onValueChange={(val) => onChange(field.name, val)}>
              <SelectTrigger className="mobile-select">
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );

        case 'custom':
          return field.customComponent;

        default:
          return (
            <Input
              {...commonProps}
              type={field.type}
              autoComplete={field.type === 'email' ? 'email' :
                           field.type === 'password' ? 'current-password' : 'off'}
            />
          );
      }
    };

    return (
      <div key={field.name} className="space-y-2">
        <div className="flex items-center gap-2">
          {field.icon && <div className="text-gray-500">{field.icon}</div>}
          <Label htmlFor={field.name} className="text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        </div>

        {field.description && (
          <p className="text-xs text-gray-500 -mt-1">{field.description}</p>
        )}

        {renderInput()}

        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <span>⚠</span>
            {error}
          </p>
        )}
      </div>
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.required && !values[field.name]) {
          newErrors[field.name] = `${field.label} is required`;
        } else if (field.validation && values[field.name]) {
          const validationError = field.validation(values[field.name]);
          if (validationError) {
            newErrors[field.name] = validationError;
          }
        }
      });
    });

    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length === 0) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Form Header */}
      {(title || description) && (
        <div className="text-center space-y-2 pb-4">
          {title && (
            <h2 className="mobile-heading-2">{title}</h2>
          )}
          {description && (
            <p className="mobile-body text-gray-600">{description}</p>
          )}
        </div>
      )}

      {/* Form Sections */}
      {sections.map((section, sectionIndex) => {
        const isExpanded = expandedSections.has(sectionIndex);

        return (
          <Card key={sectionIndex} className="mobile-card">
            {/* Section Header */}
            {(section.title || section.description) && (
              <CardHeader
                className={`mobile-card-content ${section.collapsible ? 'cursor-pointer' : ''}`}
                onClick={section.collapsible ? () => toggleSection(sectionIndex) : undefined}
              >
                <div className="flex items-center justify-between">
                  <div>
                    {section.title && (
                      <CardTitle className="mobile-heading-3">{section.title}</CardTitle>
                    )}
                    {section.description && (
                      <p className="mobile-caption mt-1">{section.description}</p>
                    )}
                  </div>
                  {section.collapsible && (
                    <div className="text-gray-400">
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  )}
                </div>
              </CardHeader>
            )}

            {/* Section Content */}
            {isExpanded && (
              <CardContent className="mobile-card-content space-y-4">
                {section.fields.map(renderField)}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Form Actions */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 safe-area-inset-bottom">
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="mobile-button-primary flex-1"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              submitLabel
            )}
          </Button>

          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="mobile-button-secondary"
            >
              {cancelLabel}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}