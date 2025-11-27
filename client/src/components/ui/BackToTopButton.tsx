import React, { useState, useEffect, useCallback } from 'react';
import { ChevronUp } from 'lucide-react';

interface BackToTopButtonProps {
  /** Scroll threshold in pixels before button appears (default: 300) */
  threshold?: number;
  /** Optional className for positioning adjustments */
  className?: string;
}

/**
 * BackToTopButton - Floating button that appears when scrolling
 *
 * Features:
 * - Appears after scrolling past threshold
 * - Smooth scroll back to top on tap
 * - Auto-hides when at top
 * - Animated entrance/exit
 * - Positioned at bottom of viewport (above safe area)
 */
export function BackToTopButton({ threshold = 300, className = '' }: BackToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Check scroll position
  const checkScroll = useCallback(() => {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    setIsVisible(scrollY > threshold);
  }, [threshold]);

  // Handle scroll to top
  const scrollToTop = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsScrolling(true);

    // Try multiple scroll methods for compatibility
    try {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch {
      // Fallback for older browsers
      window.scrollTo(0, 0);
    }

    // Also try scrolling the document element directly
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Hide button after scroll completes
    const checkIfAtTop = setInterval(() => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (scrollY <= 10) {
        clearInterval(checkIfAtTop);
        setIsScrolling(false);
        setIsVisible(false);
      }
    }, 100);

    // Fallback: clear interval after 2 seconds
    setTimeout(() => {
      clearInterval(checkIfAtTop);
      setIsScrolling(false);
    }, 2000);
  }, []);

  // Set up scroll listener
  useEffect(() => {
    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', checkScroll);
    };
  }, [checkScroll]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-x-0 z-50 flex justify-center pointer-events-none ${className}`}
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)', // Above bottom nav
      }}
    >
      <button
        onClick={scrollToTop}
        disabled={isScrolling}
        className={`
          pointer-events-auto
          flex items-center gap-2 px-4 py-2
          bg-white/10 backdrop-blur-lg
          border border-white/20
          rounded-full shadow-lg
          text-white text-xs font-medium
          transition-all duration-300
          hover:bg-white/20 hover:scale-105
          active:scale-95
          ${isScrolling ? 'opacity-50 cursor-not-allowed' : 'animate-bounce-gentle'}
        `}
        aria-label="Scroll to top"
      >
        <ChevronUp className="w-4 h-4" />
        <span>Tap to jump to top</span>
      </button>
    </div>
  );
}
