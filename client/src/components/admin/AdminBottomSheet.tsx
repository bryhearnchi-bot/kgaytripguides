import { ReactNode, useEffect, useRef } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMobileResponsive } from '@/hooks/use-mobile-responsive';

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

  /* Force ImageUploadField to respect container width */
  .admin-bottom-sheet [data-image-upload="true"] {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }

  .admin-bottom-sheet [data-image-upload="true"] > div {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
  }

  .admin-bottom-sheet [data-image-upload="true"] > div > div:last-child {
    flex: 1 1 0% !important;
    min-width: 0 !important;
    width: 0 !important;
    max-width: 100% !important;
    overflow: hidden !important;
  }

  .admin-bottom-sheet [data-image-upload="true"] h4,
  .admin-bottom-sheet [data-image-upload="true"] p {
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    max-width: 100% !important;
    width: 100% !important;
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
  customHeader?: ReactNode; // Custom header content (replaces default header)
  fullScreen?: boolean; // Make modal take up full screen
  maxWidthClassName?: string; // Custom max width class for desktop
  sidePanel?: boolean; // Override default: true = side panel, false = centered dialog. If undefined, auto-detects: side panel on desktop/tablet (unless fullScreen), bottom sheet on mobile
  sidePanelWidth?: string; // Width for side panel (default: 500px)
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
  customHeader,
  fullScreen = false,
  maxWidthClassName = 'max-w-3xl lg:max-w-4xl xl:max-w-3xl', // 768px default, 896px on lg, 768px on xl
  sidePanel, // If undefined, auto-detect: side panel on desktop/tablet (unless fullScreen), bottom sheet on mobile
  sidePanelWidth = '500px',
}: AdminBottomSheetProps) {
  const { isMobile } = useMobileResponsive();
  const sheetContentRef = useRef<HTMLDivElement>(null);
  const dialogContentRef = useRef<HTMLDivElement>(null);

  // Auto-determine sidePanel: use side panel on desktop/tablet unless fullScreen is true
  // On mobile, always use bottom sheet regardless of sidePanel setting
  const shouldUseSidePanel = sidePanel !== undefined ? sidePanel : !isMobile && !fullScreen;

  // Wrap onOpenChange to prevent unexpected closes
  const handleOpenChange = (open: boolean) => {
    // Only allow closing if explicitly requested (not from outside interactions that should be prevented)
    if (!open) {
      // Check if a dropdown/popover is open - if so, don't close
      const hasOpenDropdowns =
        document.querySelector('[data-radix-popover-content][data-state="open"]') ||
        document.querySelector('[data-radix-dropdown-menu-content][data-state="open"]') ||
        document.querySelector('[data-radix-select-content][data-state="open"]');

      if (hasOpenDropdowns) {
        // Don't close if dropdowns are open - let handleInteractOutside handle it
        return;
      }
    }
    onOpenChange(open);
  };

  // Responsive max-height: larger on mobile, smaller on desktop
  // For fullScreen on mobile, use almost full screen like FlyUpSheet (leaves 64px at top)
  const responsiveMaxHeight = fullScreen
    ? isMobile
      ? 'calc(100vh - 64px)'
      : '100vh'
    : isMobile
      ? maxHeight
      : '75vh';
  const responsiveMaxWidth = fullScreen
    ? 'w-full h-full max-w-none'
    : isMobile
      ? undefined
      : maxWidthClassName;

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

  const handleInteractOutside = (e: Event) => {
    // Prevent closing Sheet when clicking on popover/dropdown content
    // These elements are rendered in portals outside the sheet DOM tree,
    // so Radix UI treats them as "outside" clicks even though they're part of the UI
    const target = e.target as HTMLElement;

    // Check if the click target is inside any portal component FIRST
    // This catches clicks on dropdown content, menu items, triggers, etc.
    // We need to check this before checking if dropdowns are open because
    // the click might happen before the dropdown state is updated
    if (
      target.closest('[data-radix-dropdown-menu-content]') ||
      target.closest('[data-radix-popper-content-wrapper]') ||
      target.closest('[data-radix-popover-content]') ||
      target.closest('[data-radix-select-content]') ||
      target.closest('[role="listbox"]') ||
      target.closest('[role="combobox"]') ||
      target.closest('[role="menu"]') ||
      target.closest('[data-radix-dropdown-menu-item]') ||
      target.closest('[cmdk-list]') ||
      target.closest('[cmdk-input]')
    ) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Also check if any dropdown/popover/select is currently open
    // This is a backup check in case the target check above doesn't catch it
    const hasOpenDropdown = document.querySelector(
      '[data-radix-dropdown-menu-content][data-state="open"]'
    );
    const hasOpenPopover = document.querySelector(
      '[data-radix-popover-content][data-state="open"]'
    );
    const hasOpenSelect = document.querySelector('[data-radix-select-content][data-state="open"]');

    if (hasOpenDropdown || hasOpenPopover || hasOpenSelect) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleEscapeKeyDown = (e: KeyboardEvent) => {
    // Allow escape to close, but check if a popover or dropdown is open first
    const popovers = document.querySelectorAll('[data-radix-popover-content][data-state="open"]');
    const dropdowns = document.querySelectorAll(
      '[data-radix-dropdown-menu-content][data-state="open"]'
    );
    if (popovers.length > 0 || dropdowns.length > 0) {
      // Don't close modal if popover/dropdown is open, let them handle escape
      e.preventDefault();
    }
  };

  const scrollableContent = (
    <>
      {onSubmit ? (
        <form
          id="admin-bottom-sheet-form"
          onSubmit={onSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          <div
            data-scrollable="true"
            className={cn(
              'px-6 py-6 flex-1 min-h-0 overflow-y-auto overflow-x-hidden w-full max-w-full',
              contentClassName
            )}
            style={{
              backgroundColor: 'rgba(0, 33, 71, 1)',
              backgroundImage:
                'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
            }}
          >
            {children}
          </div>
        </form>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div
            data-scrollable="true"
            className={cn(
              'px-6 py-6 flex-1 min-h-0 overflow-y-auto overflow-x-hidden w-full max-w-full',
              contentClassName
            )}
            style={{
              backgroundColor: 'rgba(0, 33, 71, 1)',
              backgroundImage:
                'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
            }}
          >
            {children}
          </div>
        </div>
      )}
    </>
  );

  // Mobile: Always use bottom sheet
  if (isMobile) {
    return (
      <>
        <style>{modalFieldStyles}</style>
        <Sheet open={isOpen} onOpenChange={handleOpenChange} modal={true}>
          <SheetContent
            ref={sheetContentRef}
            side="bottom"
            className={cn(
              'admin-bottom-sheet',
              'border-white/10 text-white',
              fullScreen ? 'rounded-t-3xl' : 'rounded-t-2xl',
              fullScreen && isMobile ? 'h-[calc(100vh-64px)] max-h-[calc(100vh-64px)]' : '',
              'flex flex-col p-0 overflow-hidden w-full max-w-full',
              className
            )}
            style={{
              height: fullScreen && isMobile ? 'calc(100vh - 64px)' : responsiveMaxHeight,
              backgroundColor: 'rgba(0, 33, 71, 1)',
              backgroundImage:
                'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
              maxWidth: '100%',
            }}
            onInteractOutside={handleInteractOutside}
            onEscapeKeyDown={handleEscapeKeyDown}
            onPointerDownOutside={handleInteractOutside}
          >
            {/* Sticky Header */}
            <SheetHeader
              className="sticky top-0 z-10 border-b border-white/10 px-6 py-4 backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(0, 33, 71, 1)',
                backgroundImage:
                  'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
              }}
            >
              {/* Always include SheetTitle and SheetDescription for accessibility */}
              <SheetTitle className="sr-only">{title}</SheetTitle>
              <SheetDescription className="sr-only">
                {description || `${title} form`}
              </SheetDescription>
              {customHeader ? (
                customHeader
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xl font-bold text-white leading-tight">
                    {icon && <span className="flex-shrink-0">{icon}</span>}
                    {title}
                  </div>
                  <div className="flex justify-end gap-2 flex-shrink-0">
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
              )}
            </SheetHeader>

            {/* Scrollable Content */}
            {scrollableContent}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop/Tablet with sidePanel: Use right-side slide-in sheet
  if (shouldUseSidePanel) {
    return (
      <>
        <style>{modalFieldStyles}</style>
        <Sheet open={isOpen} onOpenChange={handleOpenChange} modal={true}>
          <SheetContent
            side="right"
            className={cn(
              'admin-bottom-sheet',
              'border-white/10 text-white',
              'flex flex-col p-0 overflow-hidden',
              'w-full sm:w-[500px] lg:w-[600px]',
              className
            )}
            style={{
              backgroundColor: 'rgba(0, 33, 71, 1)',
              backgroundImage:
                'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
              maxWidth: sidePanelWidth,
            }}
            onInteractOutside={handleInteractOutside}
            onEscapeKeyDown={handleEscapeKeyDown}
            onPointerDownOutside={handleInteractOutside}
          >
            {/* Header */}
            <SheetHeader
              className="sticky top-0 z-10 border-b border-white/10 px-6 py-4"
              style={{
                backgroundColor: 'rgba(0, 33, 71, 1)',
                backgroundImage:
                  'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
              }}
            >
              <SheetTitle className="sr-only">{title}</SheetTitle>
              <SheetDescription className="sr-only">
                {description || `${title} form`}
              </SheetDescription>
              {customHeader ? (
                customHeader
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xl font-bold text-white leading-tight">
                    {icon && <span className="flex-shrink-0">{icon}</span>}
                    {title}
                  </div>
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
              )}
            </SheetHeader>

            {/* Scrollable Content */}
            {scrollableContent}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop/Tablet: Use centered dialog (for fullScreen mode or when sidePanel is explicitly false)
  return (
    <>
      <style>{modalFieldStyles}</style>
      <Dialog open={isOpen} onOpenChange={handleOpenChange} modal={true}>
        <DialogContent
          ref={dialogContentRef}
          className={cn(
            'admin-bottom-sheet',
            'bg-[#002147] border-white/10 text-white',
            'flex flex-col p-0 overflow-hidden',
            fullScreen ? 'w-full h-full max-w-none max-h-none rounded-none' : responsiveMaxWidth,
            fullScreen ? '' : 'max-h-[75vh]',
            'max-w-full',
            className
          )}
          style={
            fullScreen
              ? {
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  transform: 'none',
                  width: '100%',
                  height: '100vh',
                  maxHeight: '100vh',
                  maxWidth: '100%',
                }
              : {
                  maxWidth: '100%',
                }
          }
          onInteractOutside={handleInteractOutside}
          onEscapeKeyDown={handleEscapeKeyDown}
          onPointerDownOutside={handleInteractOutside}
        >
          {/* Header */}
          <DialogHeader
            className="px-6 py-4 border-b border-white/10 sticky top-0 z-10 backdrop-blur-sm"
            style={{
              backgroundColor: 'rgba(0, 33, 71, 1)',
              backgroundImage:
                'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
            }}
          >
            {/* Always include DialogTitle and DialogDescription for accessibility */}
            <DialogTitle className="sr-only">{title}</DialogTitle>
            <DialogDescription className="sr-only">
              {description || `${title} form`}
            </DialogDescription>
            {customHeader ? (
              customHeader
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xl font-bold text-white leading-tight">
                  {icon && <span className="flex-shrink-0">{icon}</span>}
                  {title}
                </div>
                {/* Action Buttons */}
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
            )}
          </DialogHeader>

          {/* Scrollable Content */}
          {scrollableContent}
        </DialogContent>
      </Dialog>
    </>
  );
}
