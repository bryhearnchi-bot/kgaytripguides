import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

/**
 * Hook to get window dimensions with debounced resize handling.
 * Per CLAUDE.md: "Memoize expensive computations" - debouncing prevents
 * excessive re-renders during window resize.
 *
 * @param debounceMs - Debounce delay in milliseconds (default: 150)
 * @returns Current window dimensions
 */
export function useWindowSize(debounceMs = 150): WindowSize {
  const [size, setSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    let timeoutId: number | undefined;

    const handleResize = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, debounceMs);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [debounceMs]);

  return size;
}

/**
 * Hook to check if viewport is mobile-sized.
 * Uses debounced resize handling for performance.
 *
 * @param breakpoint - Mobile breakpoint in pixels (default: 768)
 * @param debounceMs - Debounce delay in milliseconds (default: 150)
 * @returns true if viewport width is less than breakpoint
 */
export function useIsMobile(breakpoint = 768, debounceMs = 150): boolean {
  const { width } = useWindowSize(debounceMs);
  return width < breakpoint;
}
