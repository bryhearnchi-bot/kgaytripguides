import React, { useEffect, useRef } from 'react';

interface MobileKeyboardOptimizerProps {
  children: React.ReactNode;
  adjustForKeyboard?: boolean;
  scrollToActiveInput?: boolean;
}

export function MobileKeyboardOptimizer({
  children,
  adjustForKeyboard = true,
  scrollToActiveInput = true
}: MobileKeyboardOptimizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const originalViewportHeight = useRef<number>(0);

  useEffect(() => {
    if (!adjustForKeyboard) return;

    // Store original viewport height
    originalViewportHeight.current = window.visualViewport?.height || window.innerHeight;

    const handleViewportChange = () => {
      if (!window.visualViewport) return;

      const currentHeight = window.visualViewport.height;
      const heightDifference = originalViewportHeight.current - currentHeight;

      // Keyboard is likely open if height decreased significantly
      const keyboardOpen = heightDifference > 150;

      if (containerRef.current) {
        if (keyboardOpen) {
          // Adjust layout for keyboard
          containerRef.current.style.paddingBottom = `${heightDifference}px`;
          containerRef.current.classList.add('keyboard-open');
        } else {
          // Reset layout
          containerRef.current.style.paddingBottom = '';
          containerRef.current.classList.remove('keyboard-open');
        }
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      if (!scrollToActiveInput) return;

      const target = e.target as HTMLElement;

      // Only handle form inputs
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      setTimeout(() => {
        // Scroll the focused element into view
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });

        // Prevent zoom on iOS by ensuring font-size is at least 16px
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
          const computedStyle = window.getComputedStyle(target);
          const fontSize = parseFloat(computedStyle.fontSize);

          if (fontSize < 16) {
            target.style.fontSize = '16px';
            target.setAttribute('data-original-font-size', computedStyle.fontSize);
          }
        }
      }, 300); // Delay to allow keyboard animation
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;

      // Restore original font size if it was changed
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        const originalSize = target.getAttribute('data-original-font-size');
        if (originalSize) {
          target.style.fontSize = originalSize;
          target.removeAttribute('data-original-font-size');
        }
      }
    };

    // Visual viewport API for modern browsers
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', handleViewportChange);
    }

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleViewportChange);
      }

      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [adjustForKeyboard, scrollToActiveInput]);

  return (
    <div
      ref={containerRef}
      className="mobile-keyboard-container transition-all duration-300"
    >
      {children}

      <style jsx>{`
        .mobile-keyboard-container.keyboard-open {
          transform: translateY(0);
        }

        /* Ensure inputs don't get hidden behind keyboard */
        .mobile-keyboard-container input:focus,
        .mobile-keyboard-container textarea:focus,
        .mobile-keyboard-container select:focus {
          transform: translateY(0);
          z-index: 1000;
        }

        /* Prevent iOS zoom on input focus */
        @supports (-webkit-touch-callout: none) {
          .mobile-keyboard-container input,
          .mobile-keyboard-container textarea,
          .mobile-keyboard-container select {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}