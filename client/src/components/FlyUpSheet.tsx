import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { LucideIcon, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetPortal,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useMobileResponsive } from '@/hooks/use-mobile-responsive';

interface FlyUpSheetProps {
  /** Whether the sheet is open */
  open: boolean;
  /** Callback when sheet open state changes */
  onOpenChange: (open: boolean) => void;
  /** Icon to display next to title */
  icon?: LucideIcon;
  /** Icon color (Tailwind class) */
  iconColor?: string;
  /** Title text */
  title: string;
  /** Accessible title for screen readers */
  accessibleTitle?: string;
  /** Accessible description for screen readers */
  accessibleDescription?: string;
  /** Content to display in the sheet */
  children: ReactNode;
  /** Additional callback when sheet closes (for cleanup, etc.) */
  onClose?: () => void;
}

/**
 * FlyUpSheet - Responsive sheet component
 *
 * Adapts to screen size:
 * - Mobile: Bottom sheet (fly-up from bottom)
 * - Tablet/Desktop: Right-side slide-in panel
 *
 * Features:
 * - Consistent header layout (icon + title)
 * - Proper spacing and close button
 * - Swipe-to-close on mobile
 * - Oxford Blue background with frosted glass aesthetic
 *
 * @example
 * <FlyUpSheet
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   icon={Bell}
 *   iconColor="text-amber-400"
 *   title="Alerts (This Trip)"
 *   accessibleTitle="Trip Alerts"
 *   accessibleDescription="View trip updates and notifications"
 * >
 *   <YourContent />
 * </FlyUpSheet>
 */
export function FlyUpSheet({
  open,
  onOpenChange,
  icon: Icon,
  iconColor = 'text-blue-400',
  title,
  accessibleTitle,
  accessibleDescription,
  children,
  onClose,
}: FlyUpSheetProps) {
  const { isMobile } = useMobileResponsive();

  // Sheet swipe state (mobile only)
  const [sheetTouchStart, setSheetTouchStart] = useState<number | null>(null);
  const [sheetTouchEnd, setSheetTouchEnd] = useState<number | null>(null);

  // Preserve scroll position
  const scrollPositionRef = useRef<number>(0);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Preserve scroll position when sheet opens/closes
  useEffect(() => {
    if (open) {
      // Save current scroll position before sheet opens
      scrollPositionRef.current = window.scrollY;
    } else {
      // Restore scroll position after sheet closes
      // Use setTimeout to ensure it happens after Radix cleans up
      const savedPosition = scrollPositionRef.current;
      setTimeout(() => {
        window.scrollTo(0, savedPosition);
      }, 0);
    }
  }, [open]);

  // Handle sheet close with optional callback
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen && onClose) {
      onClose();
    }
  };

  // Sheet swipe handlers for bottom sheet (mobile only)
  const onSheetTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;

    const target = e.target as HTMLElement;
    const scrollableParent = target.closest('.overflow-y-auto');

    // Only allow swipe-to-close if we're at the top of scrolled content or on non-scrollable area
    if (scrollableParent && scrollableParent.scrollTop > 0) {
      setSheetTouchStart(null);
      return;
    }

    setSheetTouchEnd(null);
    const touch = e.targetTouches[0];
    if (touch) setSheetTouchStart(touch.clientY);
  };

  const onSheetTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || sheetTouchStart === null) return;
    const touch = e.targetTouches[0];
    if (touch) setSheetTouchEnd(touch.clientY);
  };

  const onSheetTouchEnd = () => {
    if (!isMobile || !sheetTouchStart || !sheetTouchEnd) return;

    const distance = sheetTouchStart - sheetTouchEnd;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isDownSwipe) {
      handleOpenChange(false);
    }

    // Reset state
    setSheetTouchStart(null);
    setSheetTouchEnd(null);
  };

  const sheetBackground = {
    backgroundColor: 'rgba(0, 33, 71, 1)',
    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
  };

  // Mobile: Bottom sheet (fly-up)
  if (isMobile) {
    return (
      <Sheet open={open} modal={true} onOpenChange={handleOpenChange}>
        <SheetPortal>
          <SheetContent
            side="bottom"
            className="h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] border-white/10 text-white p-0 rounded-t-3xl overflow-hidden [&>button]:hidden"
            style={sheetBackground}
            onTouchStart={onSheetTouchStart}
            onTouchMove={onSheetTouchMove}
            onTouchEnd={onSheetTouchEnd}
          >
            <VisuallyHidden>
              <SheetTitle>{accessibleTitle || title}</SheetTitle>
              <SheetDescription>
                {accessibleDescription || `View ${title.toLowerCase()}`}
              </SheetDescription>
            </VisuallyHidden>
            <div className="h-full overflow-y-auto pt-4">
              <div className="[&>div]:pt-0 [&>div]:min-h-0">
                <div className="min-h-screen text-white">
                  <div className="max-w-4xl mx-auto px-4">
                    {/* Header */}
                    <div className="pt-2 pb-6">
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
                        <h3 className="text-xl font-semibold text-white">{title}</h3>
                      </div>
                    </div>

                    {/* Content */}
                    {children}
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </SheetPortal>
      </Sheet>
    );
  }

  // Tablet/Desktop: Right-side slide-in panel
  return (
    <Sheet open={open} modal={true} onOpenChange={handleOpenChange}>
      <SheetPortal>
        <SheetContent
          side="right"
          className="w-[400px] max-w-[90vw] border-white/10 text-white p-0 overflow-hidden [&>button]:hidden"
          style={sheetBackground}
        >
          <VisuallyHidden>
            <SheetTitle>{accessibleTitle || title}</SheetTitle>
            <SheetDescription>
              {accessibleDescription || `View ${title.toLowerCase()}`}
            </SheetDescription>
          </VisuallyHidden>

          {/* Custom header with close button */}
          <div
            className="sticky top-0 z-10 border-b border-white/10 px-6 py-4"
            style={sheetBackground}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
                <h3 className="text-xl font-semibold text-white">{title}</h3>
              </div>
              <button
                onClick={() => handleOpenChange(false)}
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="h-[calc(100%-73px)] overflow-y-auto">
            <div className="px-6 py-6">{children}</div>
          </div>
        </SheetContent>
      </SheetPortal>
    </Sheet>
  );
}
