import { useState, useEffect } from 'react';

interface MobileResponsiveOptions {
  mobileBreakpoint?: number;
  tabletBreakpoint?: number;
}

interface MobileResponsiveResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  orientation: 'portrait' | 'landscape';
  touchDevice: boolean;
}

export function useMobileResponsive({
  mobileBreakpoint = 768,
  tabletBreakpoint = 1024
}: MobileResponsiveOptions = {}): MobileResponsiveResult {
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    typeof window !== 'undefined'
      ? window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      : 'landscape'
  );

  const [touchDevice, setTouchDevice] = useState(
    typeof window !== 'undefined'
      ? 'ontouchstart' in window || navigator.maxTouchPoints > 0
      : false
  );

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    const handleOrientationChange = () => {
      // Wait for orientation change to complete
      setTimeout(() => {
        setScreenWidth(window.innerWidth);
        setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Set initial touch device detection
    setTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  const isMobile = screenWidth < mobileBreakpoint;
  const isTablet = screenWidth >= mobileBreakpoint && screenWidth < tabletBreakpoint;
  const isDesktop = screenWidth >= tabletBreakpoint;

  return {
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
    orientation,
    touchDevice
  };
}

// Utility function to get mobile-appropriate button sizes
export function getMobileButtonSize(isMobile: boolean, touchDevice: boolean) {
  if (isMobile || touchDevice) {
    return 'touch'; // 48px minimum
  }
  return 'default'; // 44px minimum
}

// Utility function to get mobile-appropriate spacing classes
export function getMobileSpacing(isMobile: boolean) {
  return {
    container: isMobile ? 'px-3 py-4' : 'px-4 sm:px-6 lg:px-8 py-6 lg:py-8',
    section: isMobile ? 'space-y-4' : 'space-y-6 lg:space-y-8',
    card: isMobile ? 'p-4' : 'p-4 sm:p-6',
    form: isMobile ? 'gap-4' : 'gap-4 lg:gap-6',
    grid: isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  };
}

// Utility function for mobile-first responsive classes
export function responsiveClasses(
  mobile: string,
  tablet?: string,
  desktop?: string
): string {
  const classes = [mobile];

  if (tablet) {
    classes.push(`sm:${tablet}`);
  }

  if (desktop) {
    classes.push(`lg:${desktop}`);
  }

  return classes.join(' ');
}