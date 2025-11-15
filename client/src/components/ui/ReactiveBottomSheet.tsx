import React, { ReactNode, useState, useEffect } from 'react';
import { X, LucideIcon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetPortal,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface ReactiveBottomSheetProps {
  /** Whether the sheet is open */
  open: boolean;
  /** Callback when sheet open state changes */
  onOpenChange: (open: boolean) => void;
  /** Title text for the header */
  title: string;
  /** Optional subtitle text or element (e.g., "Day 3 • Oct 15" or a badge component) */
  subtitle?: ReactNode;
  /** Optional icon to display next to title */
  icon?: LucideIcon;
  /** Content to display in the sheet */
  children: ReactNode;
  /** Z-index level for stacking (default: 100) - now ignored, uses Sheet portal */
  zIndex?: number;
  /** Optional className for the content container */
  className?: string;
}

/**
 * ReactiveBottomSheet - Auto-sizing bottom sheet component
 *
 * Features:
 * - Auto-sizes to content height (max 80vh)
 * - Uses Shadcn Sheet portal for proper z-index stacking
 * - Swipe-to-close functionality
 * - Rounded top corners with Oxford Blue background + 5% white overlay
 * - Header with title and close button
 *
 * @example
 * <ReactiveBottomSheet
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="San Juan"
 * >
 *   <YourContent />
 * </ReactiveBottomSheet>
 */
export function ReactiveBottomSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  icon: Icon,
  children,
  zIndex = 100,
  className = '',
}: ReactiveBottomSheetProps) {
  // Sheet swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Scroll indicator state
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Lock body scroll when sheet is open to prevent background scrolling
  useEffect(() => {
    if (open) {
      // Store current scroll position
      const scrollY = window.scrollY;

      // Lock scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        // Restore scroll
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
    return undefined;
  }, [open]);

  // Check if content is scrollable and update indicator
  useEffect(() => {
    if (!open) return;

    const checkScrollable = () => {
      const el = contentRef.current;
      if (el) {
        const hasMoreContent = el.scrollHeight > el.clientHeight;
        const notAtBottom = el.scrollTop < el.scrollHeight - el.clientHeight - 10;
        setShowScrollIndicator(hasMoreContent && notAtBottom);
      }
    };

    // Check after a small delay to allow content to render
    const timer = setTimeout(checkScrollable, 100);

    const el = contentRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollable);
    }

    return () => {
      clearTimeout(timer);
      if (el) {
        el.removeEventListener('scroll', checkScrollable);
      }
    };
  }, [open, children]);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Sheet swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const scrollableParent = target.closest('.overflow-y-auto');

    // Only allow swipe-to-close if we're at the top of scrolled content
    if (scrollableParent && scrollableParent.scrollTop > 0) {
      setTouchStart(null);
      return;
    }

    setTouchEnd(null);
    const touch = e.targetTouches[0];
    if (touch) {
      setTouchStart(touch.clientY);
    }

    // Stop propagation to prevent parent sheets from receiving the event
    e.stopPropagation();
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touch = e.targetTouches[0];
    if (touch) {
      setTouchEnd(touch.clientY);
    }

    // Stop propagation to prevent parent sheets from receiving the event
    e.stopPropagation();
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !touchEnd) {
      // Reset state even if we didn't track the swipe
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }

    const distance = touchStart - touchEnd;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isDownSwipe) {
      onOpenChange(false);
    }

    // Reset state
    setTouchStart(null);
    setTouchEnd(null);

    // Stop propagation to prevent parent sheets from receiving the event
    e.stopPropagation();
  };

  return (
    <Sheet open={open} modal={true} onOpenChange={onOpenChange}>
      <SheetPortal>
        <SheetContent
          side="bottom"
          className={`max-h-[calc(100vh-env(safe-area-inset-top)-20px)] min-h-[33vh] border-white/10 text-white p-0 rounded-t-3xl overflow-hidden [&>button]:hidden flex flex-col ${className}`}
          style={{
            backgroundColor: 'rgba(0, 33, 71, 1)',
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <VisuallyHidden>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>View {title.toLowerCase()}</SheetDescription>
          </VisuallyHidden>

          {/* Header - Fixed */}
          <div className="flex items-center justify-between px-6 pt-8 pb-4 flex-shrink-0">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {Icon && <Icon className="w-5 h-5 text-ocean-300" />}
                <h3 className="text-xl font-bold text-white">{title}</h3>
              </div>
              {subtitle && <p className="text-sm text-white/70 mt-1 ml-7">{subtitle}</p>}
            </div>
            <button
              onClick={e => {
                e.stopPropagation();
                onOpenChange(false);
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:scale-110"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div ref={contentRef} className="px-6 pb-10 overflow-y-auto flex-1 min-h-0">
            {children}
          </div>

          {/* Scroll indicator */}
          {showScrollIndicator && (
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none flex flex-col items-center pb-2">
              <div className="bg-gradient-to-t from-[#002147] via-[#002147]/80 to-transparent h-16 w-full absolute bottom-0" />
              <div className="relative animate-bounce text-white/60 text-xs flex flex-col items-center gap-1">
                <span>Scroll for more</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
            </div>
          )}
        </SheetContent>
      </SheetPortal>
    </Sheet>
  );
}
