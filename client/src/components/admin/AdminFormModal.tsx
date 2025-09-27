import { ReactNode } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Consistent field styling that matches Design 1
const modalFieldStyles = `
  .admin-form-modal .form-input,
  .admin-form-modal .form-select,
  .admin-form-modal .form-textarea,
  .admin-form-modal input,
  .admin-form-modal select,
  .admin-form-modal textarea {
    height: 44px;
    padding: 0 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1.5px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    color: white;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  .admin-form-modal input.h-8,
  .admin-form-modal select.h-8 {
    height: 32px !important;
    padding: 0 10px;
    font-size: 13px;
  }
  .admin-form-modal button[class*="absolute"][class*="right"] {
    display: none !important;
  }
  .admin-form-modal textarea {
    height: 90px;
    padding: 12px 14px;
    resize: vertical;
    font-family: inherit;
  }
  .admin-form-modal input::placeholder,
  .admin-form-modal textarea::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }
  .admin-form-modal input:focus,
  .admin-form-modal select:focus,
  .admin-form-modal textarea:focus {
    outline: none;
    border-color: rgba(34, 211, 238, 0.6);
    background: rgba(34, 211, 238, 0.03);
    box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.08);
  }
  .admin-form-modal label {
    font-size: 14px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 8px;
    display: block;
  }
`;

interface ActionConfig {
  label: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  form?: string;
}

interface SecondaryActionConfig {
  label: string;
  onClick: () => void;
  variant?: 'outline' | 'ghost';
  disabled?: boolean;
}

interface AdminFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  primaryAction?: ActionConfig;
  secondaryAction?: SecondaryActionConfig;
  footer?: ReactNode;
  contentClassName?: string;
  maxWidthClassName?: string;
}

export function AdminFormModal({
  isOpen,
  onOpenChange,
  title,
  description,
  icon,
  children,
  onSubmit,
  primaryAction,
  secondaryAction,
  footer,
  contentClassName,
  maxWidthClassName = 'max-w-2xl',
}: AdminFormModalProps) {
  const renderPrimaryLabel = () => {
    if (!primaryAction) return null;
    if (primaryAction.loading) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {primaryAction.loadingLabel ?? primaryAction.label}
        </>
      );
    }
    return primaryAction.label;
  };

  const primaryType = primaryAction?.type ?? (onSubmit ? 'submit' : 'button');

  return (
    <>
      <style>{modalFieldStyles}</style>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            'admin-form-modal',
            'w-[calc(100%-1rem)] sm:w-full',
            maxWidthClassName,
            'max-h-[85vh] overflow-hidden',
            // Clean design without gradients
            'bg-gradient-to-b from-[#10192f] to-[#0f1629]',
            'border border-white/8',
            'rounded-[20px]',
            'text-white shadow-[0_32px_64px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)]'
          )}
        >
          <DialogHeader className="px-7 py-4 border-b border-white/8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-white leading-tight tracking-[-0.3px]">
                  {icon && <span className="flex-shrink-0">{icon}</span>}
                  {title}
                </DialogTitle>
                {description && (
                  <DialogDescription className="text-[13px] text-white/55 mt-1">
                    {description}
                  </DialogDescription>
                )}
              </div>

              <div className="flex gap-2 ml-4 flex-shrink-0">
                {primaryAction && (
                  <Button
                    type={primaryType}
                    disabled={primaryAction.disabled || primaryAction.loading}
                    onClick={primaryType === 'button' ? primaryAction.onClick : undefined}
                    className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] min-w-[70px] font-semibold text-[12px] transition-colors duration-200"
                    form={primaryAction.form}
                  >
                    {renderPrimaryLabel()}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8 p-0 bg-white/4 border-[1.5px] border-white/10 text-white/75 hover:bg-white/8 hover:text-white/90 hover:border-white/20 rounded-[8px] transition-all duration-200 flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </DialogHeader>

        {onSubmit ? (
          <form onSubmit={onSubmit} className="flex flex-col h-full">
            <div className={cn('px-7 py-6 overflow-y-auto flex-1', contentClassName)}>
              {children}
            </div>
          </form>
        ) : (
          <div className="flex flex-col h-full">
            <div className={cn('px-7 py-6 overflow-y-auto flex-1', contentClassName)}>
              {children}
            </div>
            {footer && (
              <div className="px-7 py-4">
                {footer}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
