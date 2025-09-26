import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
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
            // Design 1 styling - exact match
            'bg-gradient-to-b from-[#10192f] to-[#0f1629]',
            'border border-white/8',
            'rounded-[20px]',
            'text-white shadow-[0_32px_64px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)]'
          )}
        >
          <DialogHeader className="px-7 py-6 pb-5 border-b border-white/8 relative">
            {/* Design 1 gradient top accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#22d3ee] to-[#2563eb]" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#22d3ee]/3 to-[#2563eb]/3" />
            <DialogTitle className="text-[20px] font-bold text-white leading-tight tracking-[-0.3px] relative z-10">{title}</DialogTitle>
            {description && (
              <DialogDescription className="text-[14px] text-white/55 mt-1.5 relative z-10">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>

        {onSubmit ? (
          <form onSubmit={onSubmit} className="flex flex-col h-full">
            <div className={cn('px-7 py-6 overflow-y-auto flex-1', contentClassName)}>
              {children}
            </div>
            <DialogFooter className="px-7 py-5 pt-5 border-t border-white/6 bg-black/5 flex-row gap-3 justify-end">
              {secondaryAction && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={secondaryAction.onClick}
                  disabled={secondaryAction.disabled}
                  className="h-10 px-5 bg-white/4 border-[1.5px] border-white/10 text-white/75 hover:bg-white/8 hover:text-white/90 hover:border-white/20 hover:-translate-y-[1px] rounded-[10px] min-w-[90px] font-semibold text-[14px] transition-all duration-200"
                >
                  {secondaryAction.label}
                </Button>
              )}
              {primaryAction && (
                <Button
                  type={primaryType}
                  disabled={primaryAction.disabled || primaryAction.loading}
                  onClick={primaryType === 'button' ? primaryAction.onClick : undefined}
                  className="h-10 px-5 bg-gradient-to-br from-[#22d3ee] to-[#2563eb] text-white hover:from-[#06b6d4] hover:to-[#1d4ed8] hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(34,211,238,0.35)] rounded-[10px] min-w-[90px] font-semibold text-[14px] border-[1.5px] border-transparent shadow-[0_4px_12px_rgba(34,211,238,0.25)] transition-all duration-200"
                  form={primaryAction.form}
                >
                  {renderPrimaryLabel()}
                </Button>
              )}
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col h-full">
            <div className={cn('px-7 py-6 overflow-y-auto flex-1', contentClassName)}>
              {children}
            </div>
            {(footer || primaryAction || secondaryAction) && (
              <DialogFooter className="px-7 py-5 pt-5 border-t border-white/6 bg-black/5 flex-row gap-3 justify-end">
                {secondaryAction && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={secondaryAction.onClick}
                    disabled={secondaryAction.disabled}
                    className="h-10 px-5 bg-white/4 border-[1.5px] border-white/10 text-white/75 hover:bg-white/8 hover:text-white/90 hover:border-white/20 hover:-translate-y-[1px] rounded-[10px] min-w-[90px] font-semibold text-[14px] transition-all duration-200"
                  >
                    {secondaryAction.label}
                  </Button>
                )}
                {primaryAction && (
                  <Button
                    type={primaryType}
                    disabled={primaryAction.disabled || primaryAction.loading}
                    onClick={primaryType === 'button' ? primaryAction.onClick : undefined}
                    className="h-10 px-5 bg-gradient-to-br from-[#22d3ee] to-[#2563eb] text-white hover:from-[#06b6d4] hover:to-[#1d4ed8] hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(34,211,238,0.35)] rounded-[10px] min-w-[90px] font-semibold text-[14px] border-[1.5px] border-transparent shadow-[0_4px_12px_rgba(34,211,238,0.25)] transition-all duration-200"
                    form={primaryAction.form}
                  >
                    {renderPrimaryLabel()}
                  </Button>
                )}
                {footer}
              </DialogFooter>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
