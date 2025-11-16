import { ReactNode } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Consistent field styling that matches Design 1
const modalFieldStyles = `
  .admin-bottom-sheet .form-input,
  .admin-bottom-sheet .form-select,
  .admin-bottom-sheet .form-textarea,
  .admin-bottom-sheet input,
  .admin-bottom-sheet select,
  .admin-bottom-sheet textarea {
    height: 40px;
    padding: 0 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 1.5px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    color: white;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  .admin-bottom-sheet input.h-8,
  .admin-bottom-sheet select.h-8 {
    height: 32px !important;
    padding: 0 10px;
    font-size: 13px;
  }
  .admin-bottom-sheet textarea {
    height: auto;
    padding: 8px 12px;
    resize: vertical;
    font-family: inherit;
    line-height: 1.375;
  }
  .admin-bottom-sheet input::placeholder,
  .admin-bottom-sheet textarea::placeholder,
  .admin-bottom-sheet select::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  .admin-bottom-sheet input:focus,
  .admin-bottom-sheet select:focus,
  .admin-bottom-sheet textarea:focus {
    outline: none !important;
    border-color: rgba(34, 211, 238, 0.6) !important;
    background: rgba(34, 211, 238, 0.03) !important;
    box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.08) !important;
    --tw-ring-offset-width: 0px !important;
    --tw-ring-width: 0px !important;
  }
  .admin-bottom-sheet label {
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 4px;
    display: block;
  }

  /* Hide default Sheet close button since we have our own in the header */
  .admin-bottom-sheet button[class*="absolute"][class*="right-4"][class*="top-4"] {
    display: none !important;
  }

  /* Force visible scrollbars on ALL admin bottom sheet content */
  .admin-bottom-sheet [data-scrollable="true"] {
    overflow-y: scroll !important;
    -webkit-overflow-scrolling: auto !important;
    scrollbar-width: thin !important;
    scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05) !important;
  }

  .admin-bottom-sheet [data-scrollable="true"]::-webkit-scrollbar {
    width: 10px !important;
    display: block !important;
    opacity: 1 !important;
    visibility: visible !important;
  }

  .admin-bottom-sheet [data-scrollable="true"]::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05) !important;
    border-radius: 5px !important;
  }

  .admin-bottom-sheet [data-scrollable="true"]::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2) !important;
    border-radius: 5px !important;
    min-height: 30px !important;
  }

  .admin-bottom-sheet [data-scrollable="true"]::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3) !important;
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

interface AdminBottomSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  primaryAction?: ActionConfig;
  secondaryAction?: ActionConfig;
  contentClassName?: string;
  maxHeight?: string;
  className?: string;
}

export function AdminBottomSheet({
  isOpen,
  onOpenChange,
  title,
  description,
  icon,
  children,
  onSubmit,
  primaryAction,
  secondaryAction,
  contentClassName,
  maxHeight = '70vh',
  className,
}: AdminBottomSheetProps) {
  const renderPrimaryLabel = () => {
    if (!primaryAction) return null;
    if (primaryAction.loading) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    return <Save className="w-4 h-4" />;
  };

  const primaryType = primaryAction?.type ?? (onSubmit ? 'submit' : 'button');

  const handleSave = () => {
    if (primaryAction?.onClick) {
      primaryAction.onClick();
    }
  };

  return (
    <>
      <style>{modalFieldStyles}</style>
      <Sheet open={isOpen} onOpenChange={onOpenChange} modal={true}>
        <SheetContent
          side="bottom"
          className={cn(
            'admin-bottom-sheet',
            'bg-[#002147] border-white/10 text-white rounded-t-2xl',
            'flex flex-col p-0 overflow-hidden',
            className
          )}
          style={{ height: maxHeight }}
          onInteractOutside={e => {
            // Prevent closing when clicking on popover/dropdown content
            const target = e.target as HTMLElement;
            if (
              target.closest('[data-radix-popper-content-wrapper]') ||
              target.closest('[data-radix-popover-content]') ||
              target.closest('[data-radix-select-content]') ||
              target.closest('[role="listbox"]') ||
              target.closest('[role="combobox"]') ||
              target.closest('[cmdk-list]') ||
              target.closest('[cmdk-input]')
            ) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={e => {
            // Allow escape to close, but check if a popover is open first
            const popovers = document.querySelectorAll(
              '[data-radix-popover-content][data-state="open"]'
            );
            if (popovers.length > 0) {
              // Don't close sheet if popover is open, let popover handle escape
              e.preventDefault();
            }
          }}
          onPointerDownOutside={e => {
            // Prevent closing when clicking on popover/dropdown content
            const target = e.target as HTMLElement;
            if (
              target.closest('[data-radix-popper-content-wrapper]') ||
              target.closest('[data-radix-popover-content]') ||
              target.closest('[data-radix-select-content]') ||
              target.closest('[role="listbox"]') ||
              target.closest('[role="combobox"]') ||
              target.closest('[cmdk-list]') ||
              target.closest('[cmdk-input]')
            ) {
              e.preventDefault();
            }
          }}
        >
          {/* Sticky Header */}
          <SheetHeader className="sticky top-0 z-10 bg-[#002147] border-b border-white/10 px-6 py-4 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <SheetTitle className="flex items-center gap-2 text-xl font-bold text-white leading-tight">
                  {icon && <span className="flex-shrink-0">{icon}</span>}
                  {title}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  {description || `${title} form`}
                </SheetDescription>
                {description && <p className="text-[13px] text-white/55 mt-1">{description}</p>}
              </div>

              {/* Action Buttons - matching profile edit screen style */}
              <div className="flex justify-end gap-2 ml-4 flex-shrink-0">
                {primaryAction && (
                  <Button
                    type={primaryType}
                    disabled={primaryAction.disabled || primaryAction.loading}
                    onClick={primaryType === 'button' ? handleSave : undefined}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full border border-white/10 bg-white/10 hover:bg-white/15 text-green-400 hover:text-green-300 transition-colors"
                    aria-label={primaryAction.label}
                    form={
                      primaryType === 'submit' && onSubmit
                        ? 'admin-bottom-sheet-form'
                        : primaryAction.form
                    }
                  >
                    {renderPrimaryLabel()}
                  </Button>
                )}
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full border border-white/10 bg-white/10 hover:bg-white/15 text-white transition-colors"
                  aria-label="Cancel"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          {/* Scrollable Content */}
          {onSubmit ? (
            <form
              id="admin-bottom-sheet-form"
              onSubmit={onSubmit}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              <div
                data-scrollable="true"
                className={cn('px-6 py-6 flex-1 min-h-0 overflow-y-auto', contentClassName)}
              >
                {children}
              </div>
            </form>
          ) : (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div
                data-scrollable="true"
                className={cn('px-6 py-6 flex-1 min-h-0 overflow-y-auto', contentClassName)}
              >
                {children}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
