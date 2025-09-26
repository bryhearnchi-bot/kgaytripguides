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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'w-[calc(100%-1rem)] sm:w-full',
          maxWidthClassName,
          'max-h-[90vh] overflow-y-auto border border-white/10 bg-[#0f172a] text-white shadow-2xl backdrop-blur-xl',
        )}
      >
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-semibold text-white">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-white/60">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {onSubmit ? (
          <form onSubmit={onSubmit} className={cn('space-y-6', contentClassName)}>
            {children}
            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {secondaryAction && (
                <Button
                  type="button"
                  variant={secondaryAction.variant ?? 'outline'}
                  onClick={secondaryAction.onClick}
                  disabled={secondaryAction.disabled}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  {secondaryAction.label}
                </Button>
              )}
              {primaryAction && (
                <Button
                  type={primaryType}
                  disabled={primaryAction.disabled || primaryAction.loading}
                  onClick={primaryType === 'button' ? primaryAction.onClick : undefined}
                  className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-6 text-white hover:from-[#38e0f6] hover:to-[#3b82f6]"
                  form={primaryAction.form}
                >
                  {renderPrimaryLabel()}
                </Button>
              )}
            </DialogFooter>
          </form>
        ) : (
          <div className={cn('space-y-6', contentClassName)}>
            {children}
            {(footer || primaryAction || secondaryAction) && (
              <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {secondaryAction && (
                  <Button
                    type="button"
                    variant={secondaryAction.variant ?? 'outline'}
                    onClick={secondaryAction.onClick}
                    disabled={secondaryAction.disabled}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    {secondaryAction.label}
                  </Button>
                )}
                {primaryAction && (
                  <Button
                    type={primaryType}
                    disabled={primaryAction.disabled || primaryAction.loading}
                    onClick={primaryType === 'button' ? primaryAction.onClick : undefined}
                    className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-6 text-white hover:from-[#38e0f6] hover:to-[#3b82f6]"
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
  );
}
